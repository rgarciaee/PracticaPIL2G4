# API WEB FASTAPI

from fastapi import APIRouter, Request, Response
from fastapi.responses import FileResponse, RedirectResponse
from firebase_admin import auth
from datetime import datetime
from view.view import View
from model.model import Model
from datetime import timezone

import json
import os
import uuid

app = APIRouter()

# Sesiones en memoria
sessions = {}

myviewcomponent = View()
mymodelcomponent = Model()


# ============================================================
# CREACIÓN DE USUARIO (ARREGLADO)
# ============================================================

def create_user_in_firestore(user_id, email, role="user", avatar_url=""):
    try:
        db = mymodelcomponent.factory.connector.get_db()

        users_ref = db.collection("users")
        users_ext_ref = db.collection("users_extended")

        # Crear en users
        if not users_ref.document(user_id).get().exists:
            users_ref.document(user_id).set({
                "user_id": user_id,
                "email": email,
                "role": role,
                "created_at": datetime.now().isoformat()
            })

        # Crear perfil extendido
        if not users_ext_ref.document(user_id).get().exists:
            users_ext_ref.document(user_id).set({
                "dni": "",
                "nombre_apellidos": "",
                "fecha_nacimiento": "",
                "num_tarjeta": "",
                "direccion": "",
                "email": email,
                "telefono": "",
                "rol_asignado": role,
                "avatar_url": avatar_url,  # NUEVO CAMPO
                "preferencias": {
                    "notificaciones_email": True,
                    "notificaciones_sms": False,
                    "idioma": "es"
                }
            })

        print(f"Usuario creado correctamente: {user_id}")
        return True

    except Exception as e:
        print("Error creando usuario:", e)
        return False

# ============================================================
# RUTAS BASE
# ============================================================

@app.get("/")
async def root():
    return RedirectResponse(url="/login")


@app.get("/login")
async def login_page(request: Request):
    return myviewcomponent.get_login_view(request)


@app.get("/app")
async def main_app_page(request: Request):
    session_id = request.cookies.get("session_id")

    if not session_id or session_id not in sessions:
        return RedirectResponse(url="/login")

    user_session = sessions.get(session_id)
    current_time = int(datetime.now(timezone.utc).timestamp())

    if int(user_session.get("exp", 0)) < current_time:
        return RedirectResponse(url="/login")

    return myviewcomponent.get_app_view(request)


# ============================================================
# STATIC Y PARTIALS
# ============================================================

@app.get("/static/{path:path}")
async def serve_static(path: str):
    file_path = os.path.join("view/templates/static", path)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "File not found"}


@app.get("/partials/{page}")
async def serve_partial(page: str):
    file_path = os.path.join("view/templates/partials", f"{page}.html")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "Page not found"}


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
async def login(data: dict, response: Response, provider: str):
    token = data.get("token")

    try:
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=10)

        user_id = decoded_token.get("uid")
        email = decoded_token.get("email")
        exp = decoded_token.get("exp")
        
        # Obtener avatar_url si es login con Google
        avatar_url = ""
        if provider == "google":
            # El avatar de Google viene en el token
            avatar_url = decoded_token.get("picture", "")
            print(f"Avatar de Google obtenido: {avatar_url}")

        if not user_id:
            return {"success": False, "error": "Token inválido"}

        # Crear usuario si no existe (con avatar si es Google)
        create_user_in_firestore(user_id, email, "user", avatar_url)

        # Crear sesión
        sessions[user_id] = {
            "id_user": user_id,
            "email_user": email,
            "role": "user",
            "exp": exp,
            "avatar_url": avatar_url  # Guardar avatar en sesión
        }

        response.set_cookie(
            key="session_id",
            value=user_id,
            httponly=True
        )

        return {"success": True, "avatar_url": avatar_url}  # Devolver avatar al frontend

    except Exception as e:
        print("Error login:", e)
        return {"success": False, "error": str(e)}


@app.post("/login-credentials")
async def login_credentials(data: dict, response: Response):
    return await login(data, response, "credentials")


@app.post("/login-google")
async def login_google(data: dict, response: Response):
    return await login(data, response, "google")


@app.post("/logout")
async def logout(request: Request, response: Response):
    session_id = request.cookies.get("session_id")

    if session_id in sessions:
        del sessions[session_id]

    response.delete_cookie("session_id")
    return {"success": True}


# ============================================================
# API EVENTOS
# ============================================================

@app.get("/api/events")
async def get_events():
    try:
        events = json.loads(mymodelcomponent.get_all_events())
        return {"success": True, "data": events}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/events/{event_id}")
async def get_event(event_id: str):
    try:
        event = json.loads(mymodelcomponent.get_event_by_id(event_id))
        return {"success": True, "data": event}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================================
# PERFIL
# ============================================================

@app.get("/api/profile")
async def get_profile(request: Request):
    session_id = request.cookies.get("session_id")

    if not session_id or session_id not in sessions:
        return {"success": False, "error": "No autenticado"}

    try:
        profile = mymodelcomponent.get_user_profile(session_id)
        # Asegurar que avatar_url existe
        if profile and "avatar_url" not in profile:
            profile["avatar_url"] = ""
        return {"success": True, "data": profile}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.put("/api/profile")
async def update_profile(request: Request, profile_data: dict):
    session_id = request.cookies.get("session_id")

    if not session_id or session_id not in sessions:
        return {"success": False, "error": "No autenticado"}

    try:
        result = mymodelcomponent.update_user_profile(session_id, profile_data)
        
        # Si se actualizó el avatar, actualizar también en la sesión
        if result.get("success") and "avatar_url" in profile_data:
            sessions[session_id]["avatar_url"] = profile_data["avatar_url"]
        
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================
# CHECKOUT
# ============================================================

@app.post("/api/checkout")
async def checkout(request: Request, purchase_data: dict):
    session_id = request.cookies.get("session_id")

    if not session_id or session_id not in sessions:
        return {"success": False, "error": "No autenticado"}

    items = purchase_data.get("items", [])
    total = purchase_data.get("total", 0)

    print(f"=== CHECKOUT ===")
    print(f"Usuario: {session_id}")
    print(f"Items recibidos: {items}")
    print(f"Total: {total}")

    try:
        # NO modificar los items aquí, pasar directamente al modelo
        result = mymodelcomponent.process_purchase(session_id, items, total)
        print(f"Resultado checkout: {result}")
        return result

    except Exception as e:
        print(f"Error en checkout: {e}")
        return {"success": False, "error": str(e)}

# ============================================================
# HISTORIAL
# ============================================================

@app.get("/api/history")
async def get_history(request: Request):
    session_id = request.cookies.get("session_id")

    if not session_id or session_id not in sessions:
        return {"success": False, "error": "No autenticado"}

    try:
        history = json.loads(mymodelcomponent.get_user_history(session_id))
        return {"success": True, "data": history}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================================
# ZONAS
# ============================================================

@app.get("/api/zones")
async def get_zones():
    try:
        zones = json.loads(mymodelcomponent.get_all_zones())
        return {"success": True, "data": zones}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/zones/request")
async def request_zone(request: Request, zone_data: dict):
    session_id = request.cookies.get("session_id")

    if not session_id or session_id not in sessions:
        return {"success": False, "error": "No autenticado"}

    try:
        result = mymodelcomponent.request_zone_rental(
            zone_data.get("stand_id"),
            session_id,
            zone_data.get("details", {})
        )
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================
# ENDPOINTS PARA CARRITO
# ============================================================

@app.get("/api/cart")
async def get_cart(request: Request):
    """Obtener carrito del usuario actual"""
    session_id = request.cookies.get("session_id")
    if not session_id or session_id not in sessions:
        return {"success": False, "error": "No autenticado"}
    
    try:
        cart = mymodelcomponent.get_cart(session_id)
        return {"success": True, "data": cart.to_dict()}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/cart/add")
async def add_to_cart(request: Request, item_data: dict):
    """Añadir item al carrito"""
    session_id = request.cookies.get("session_id")
    if not session_id or session_id not in sessions:
        return {"success": False, "error": "No autenticado"}
    
    try:
        result = mymodelcomponent.add_to_cart(session_id, item_data)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/cart/remove")
async def remove_from_cart(request: Request, remove_data: dict):
    """Eliminar item del carrito"""
    session_id = request.cookies.get("session_id")
    if not session_id or session_id not in sessions:
        return {"success": False, "error": "No autenticado"}
    
    item_id = remove_data.get("item_id")
    if not item_id:
        return {"success": False, "error": "item_id requerido"}
    
    try:
        result = mymodelcomponent.remove_from_cart(session_id, item_id)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/cart/update")
async def update_cart_item(request: Request, update_data: dict):
    """Actualizar cantidad de un item"""
    session_id = request.cookies.get("session_id")
    if not session_id or session_id not in sessions:
        return {"success": False, "error": "No autenticado"}
    
    item_id = update_data.get("item_id")
    quantity = update_data.get("quantity", 1)
    
    if not item_id:
        return {"success": False, "error": "item_id requerido"}
    
    try:
        result = mymodelcomponent.update_cart_item(session_id, item_id, quantity)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/cart/clear")
async def clear_cart(request: Request):
    """Vaciar carrito"""
    session_id = request.cookies.get("session_id")
    if not session_id or session_id not in sessions:
        return {"success": False, "error": "No autenticado"}
    
    try:
        result = mymodelcomponent.clear_cart(session_id)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}