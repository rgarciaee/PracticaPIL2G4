# API WEB FASTAPI

from fastapi import APIRouter, Request, Response
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse
from firebase_admin import auth
from datetime import datetime
from view.view import View
from model.model import Model
from datetime import timezone

import json
import os
import uuid

app = APIRouter()

TOKEN_CLOCK_SKEW_SECONDS = 60

# Sesiones en memoria
sessions = {}

myviewcomponent = View()
mymodelcomponent = Model()


# ============================================================
# CREACIÓN DE USUARIO
# ============================================================

def create_user_in_firestore(user_id, email, role="user", avatar_url="", profile_data=None):
    try:
        db = mymodelcomponent.factory.connector.get_db()
        profile_data = profile_data or {}
        full_name = str(
            profile_data.get("nombre_apellidos")
            or profile_data.get("display_name")
            or ""
        ).strip()
        dni = str(profile_data.get("dni", "")).strip()
        telefono = str(profile_data.get("telefono", "")).strip()

        users_ref = db.collection("users")
        users_ext_ref = db.collection("users_extended")

        user_doc = users_ref.document(user_id).get()
        user_ext_doc = users_ext_ref.document(user_id).get()

        effective_role = role
        if user_doc.exists:
            existing_user_role = str((user_doc.to_dict() or {}).get("role", "")).strip().lower()
            if existing_user_role:
                effective_role = existing_user_role
        elif user_ext_doc.exists:
            existing_ext_role = str((user_ext_doc.to_dict() or {}).get("rol_asignado", "")).strip().lower()
            if existing_ext_role:
                effective_role = existing_ext_role

        user_payload = {
            "user_id": user_id,
            "email": email,
            "role": effective_role,
        }
        if not user_doc.exists:
            user_payload["created_at"] = datetime.now().isoformat()
        users_ref.document(user_id).set(user_payload, merge=True)

        ext_payload = {
            "email": email,
            "rol_asignado": effective_role,
        }
        if not user_ext_doc.exists:
            ext_payload.update({
                "dni": "",
                "nombre_apellidos": "",
                "fecha_nacimiento": "",
                "num_tarjeta": "",
                "direccion": "",
                "telefono": "",
                "avatar_url": "",
                "preferencias": {
                    "notificaciones_email": True,
                    "notificaciones_sms": False,
                    "idioma": "es"
                }
            })
        if dni:
            ext_payload["dni"] = dni
        if full_name:
            ext_payload["nombre_apellidos"] = full_name
        if telefono:
            ext_payload["telefono"] = telefono
        if avatar_url:
            ext_payload["avatar_url"] = avatar_url

        users_ext_ref.document(user_id).set(ext_payload, merge=True)

        print(f"Usuario creado correctamente: {user_id}")
        return True

    except Exception as e:
        print("Error creando usuario:", e)
        return False


def get_current_session(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id:
        return None, None
    return session_id, sessions.get(session_id)


def auth_error_response(message="No autenticado", status_code=401):
    return JSONResponse(status_code=status_code, content={"success": False, "error": message})


def require_auth(request: Request):
    session_id, session_data = get_current_session(request)
    if not session_id or not session_data:
        return None, None, auth_error_response()
    return session_id, session_data, None


def require_admin(request: Request):
    session_id, session_data, error = require_auth(request)
    if error:
        return None, None, error

    if str(session_data.get("role", "")).strip().lower() != "admin":
        return None, None, auth_error_response("Acceso restringido a administradores", 403)

    return session_id, session_data, None


# ============================================================
# RUTAS BASE (PÚBLICAS)
# ============================================================

@app.get("/")
async def root():
    """Redirigir a la aplicación pública"""
    return RedirectResponse(url="/app")

@app.get("/app")
async def main_app_page(request: Request):
    """Aplicación principal (pública - sin autenticación requerida)"""
    return myviewcomponent.get_app_view(request)

@app.get("/login")
async def login_page(request: Request):
    """Página de login/registro"""
    return myviewcomponent.get_login_view(request)

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
    remember_me = bool(data.get("remember_me"))

    try:
        decoded_token = auth.verify_id_token(
            token,
            clock_skew_seconds=TOKEN_CLOCK_SKEW_SECONDS,
        )

        user_id = decoded_token.get("uid")
        email = decoded_token.get("email")
        exp = decoded_token.get("exp")
        profile_data = data.get("profile", {}) or {}
        
        avatar_url = ""
        if provider == "google":
            avatar_url = decoded_token.get("picture", "")
            print(f"Avatar de Google obtenido: {avatar_url}")

        if not profile_data.get("nombre_apellidos"):
            profile_data["nombre_apellidos"] = (
                decoded_token.get("name")
                or decoded_token.get("display_name")
                or ""
            )
        if not profile_data.get("avatar_url"):
            profile_data["avatar_url"] = avatar_url

        if not user_id:
            return {"success": False, "error": "Token inválido"}

        create_user_in_firestore(user_id, email, "user", avatar_url, profile_data)
        actual_role = mymodelcomponent.get_user_role(user_id)

        sessions[user_id] = {
            "id_user": user_id,
            "email_user": email,
            "role": actual_role,
            "exp": exp,
            "avatar_url": avatar_url
        }

        response.set_cookie(
            key="session_id",
            value=user_id,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 30 if remember_me else None,
        )

        return {"success": True, "avatar_url": avatar_url, "role": actual_role}

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
# API EVENTOS (PÚBLICOS - SIN AUTENTICACIÓN)
# ============================================================

@app.get("/api/events")
async def get_events():
    """Público - Cualquiera puede ver los eventos"""
    try:
        events = json.loads(mymodelcomponent.get_all_events())
        return {"success": True, "data": events}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/events/{event_id}")
async def get_event(event_id: str):
    """Público - Cualquiera puede ver los detalles de un evento"""
    try:
        event = json.loads(mymodelcomponent.get_event_by_id(event_id))
        return {"success": True, "data": event}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================================
# ESTADÍSTICAS GLOBALES (PÚBLICO)
# ============================================================

@app.get("/api/stats")
async def get_stats():
    """Público - Calcula y devuelve las estadísticas totales del festival"""
    try:
        # Obtenemos todos los eventos de la base de datos
        events = json.loads(mymodelcomponent.get_all_events())
        
        total_eventos = len(events)
        total_artistas = 0
        total_asistentes = 0
        
        # Calculamos los totales recorriendo todos los eventos
        for event in events:
            # Sumar artistas si existen
            if "artistas" in event and isinstance(event["artistas"], list):
                total_artistas += len(event["artistas"])
                
            # Sumar aforo de todas las zonas si existen
            if "zonas" in event and isinstance(event["zonas"], list):
                for zona in event["zonas"]:
                    # Usamos .get() con un valor por defecto 0 por si alguna zona no tiene aforo definido
                    total_asistentes += int(zona.get("aforo_maximo", 0))
                    
        return {
            "success": True, 
            "data": {
                "totalEventos": total_eventos,
                "totalArtistas": total_artistas,
                "totalAsistentes": total_asistentes
            }
        }
        
    except Exception as e:
        print("Error calculando estadísticas:", e)
        return {"success": False, "error": str(e)}

# ============================================================
# PERFIL (REQUIERE AUTENTICACIÓN)
# ============================================================

@app.get("/api/profile")
async def get_profile(request: Request):
    session_id, session_data, error = require_auth(request)
    if error:
        return error

    try:
        profile = mymodelcomponent.get_user_profile(session_id)
        if profile and "avatar_url" not in profile:
            profile["avatar_url"] = ""
        completion = mymodelcomponent.get_profile_completion_status(session_id)
        if profile is None:
            profile = {}
        profile["user_id"] = session_id
        profile["role"] = session_data.get("role", "user")
        profile["rol_asignado"] = profile.get("rol_asignado") or session_data.get("role", "user")
        profile["email"] = profile.get("email") or session_data.get("email_user", "")
        profile["profile_complete"] = completion["complete"]
        profile["missing_fields"] = completion["missing_fields"]
        return {"success": True, "data": profile}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/profile/completion")
async def get_profile_completion(request: Request):
    session_id, _, error = require_auth(request)
    if error:
        return error

    try:
        completion = mymodelcomponent.get_profile_completion_status(session_id)
        return {"success": True, "data": completion}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.put("/api/profile")
async def update_profile(request: Request, profile_data: dict):
    session_id, _, error = require_auth(request)
    if error:
        return error

    try:
        result = mymodelcomponent.update_user_profile(session_id, profile_data)
        
        if result.get("success") and "avatar_url" in profile_data:
            sessions[session_id]["avatar_url"] = profile_data["avatar_url"]
        
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================================
# CHECKOUT (REQUIERE AUTENTICACIÓN)
# ============================================================

@app.post("/api/checkout")
async def checkout(request: Request, purchase_data: dict):
    session_id, _, error = require_auth(request)
    if error:
        return error

    items = purchase_data.get("items", [])
    total = purchase_data.get("total", 0)

    print(f"=== CHECKOUT ===")
    print(f"Usuario: {session_id}")
    print(f"Items recibidos: {items}")
    print(f"Total: {total}")

    try:
        completion = mymodelcomponent.get_profile_completion_status(session_id)
        if not completion["complete"]:
            return {
                "success": False,
                "error": "Debes completar tu perfil antes de finalizar la compra",
                "code": "PROFILE_INCOMPLETE",
                "missing_fields": completion["missing_fields"],
            }

        result = mymodelcomponent.process_purchase(session_id, items, total)
        print(f"Resultado checkout: {result}")
        return result

    except Exception as e:
        print(f"Error en checkout: {e}")
        return {"success": False, "error": str(e)}


# ============================================================
# HISTORIAL (REQUIERE AUTENTICACIÓN)
# ============================================================

@app.get("/api/history")
async def get_history(request: Request):
    session_id, _, error = require_auth(request)
    if error:
        return error

    try:
        history = json.loads(mymodelcomponent.get_user_history(session_id))
        return {"success": True, "data": history}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================================
# ZONAS (PÚBLICAS - CUALQUIERA PUEDE VER LAS ZONAS)
# ============================================================

@app.get("/api/zones")
async def get_zones():
    """Público - Cualquiera puede ver las zonas disponibles"""
    try:
        zones = json.loads(mymodelcomponent.get_all_zones())
        return {"success": True, "data": zones}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/zones/request")
async def request_zone(request: Request, zone_data: dict):
    """Solicitar alquiler de zona (requiere autenticación)"""
    session_id, _, error = require_auth(request)
    if error:
        return error

    try:
        result = mymodelcomponent.request_zone_rental(
            zone_data.get("zone_id") or zone_data.get("stand_id"),
            session_id,
            zone_data.get("details", {})
        )
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================================
# ENDPOINTS PARA CARRITO (REQUIEREN AUTENTICACIÓN)
# ============================================================

@app.get("/api/cart")
async def get_cart(request: Request):
    """Obtener carrito del usuario actual"""
    session_id, _, error = require_auth(request)
    if error:
        return error
    
    try:
        cart = mymodelcomponent.get_cart(session_id)
        return {"success": True, "data": cart.to_dict()}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/cart/add")
async def add_to_cart(request: Request, item_data: dict):
    """Añadir item al carrito"""
    session_id, _, error = require_auth(request)
    if error:
        return error
    
    try:
        result = mymodelcomponent.add_to_cart(session_id, item_data)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/cart/remove")
async def remove_from_cart(request: Request, remove_data: dict):
    """Eliminar item del carrito"""
    session_id, _, error = require_auth(request)
    if error:
        return error
    
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
    session_id, _, error = require_auth(request)
    if error:
        return error
    
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
    session_id, _, error = require_auth(request)
    if error:
        return error
    
    try:
        result = mymodelcomponent.clear_cart(session_id)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================================
# ADMIN
# ============================================================

@app.get("/api/admin/bootstrap")
async def get_admin_bootstrap(request: Request):
    session_id, _, error = require_admin(request)
    if error:
        return error

    try:
        result = mymodelcomponent.get_admin_dashboard_data()
        if result.get("success"):
            result["data"]["session_user_id"] = session_id
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/admin/users")
async def create_admin_user(request: Request, user_data: dict):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.create_user_admin(user_data)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.put("/api/admin/users/{user_id}")
async def update_admin_user(request: Request, user_id: str, user_data: dict):
    session_id, _, error = require_admin(request)
    if error:
        return error

    try:
        result = mymodelcomponent.update_user_admin(user_id, user_data)
        if result.get("success") and user_id in sessions:
            sessions[user_id]["email_user"] = user_data.get(
                "email", sessions[user_id].get("email_user", "")
            )
            sessions[user_id]["role"] = user_data.get(
                "role", sessions[user_id].get("role", "user")
            )
        if result.get("success") and user_id == session_id:
            sessions[session_id]["role"] = user_data.get(
                "role", sessions[session_id].get("role", "user")
            )
            sessions[session_id]["email_user"] = user_data.get(
                "email", sessions[session_id].get("email_user", "")
            )
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/admin/users/{user_id}")
async def delete_admin_user(request: Request, user_id: str):
    session_id, _, error = require_admin(request)
    if error:
        return error

    if user_id == session_id:
        return {"success": False, "error": "No puedes eliminar tu propio usuario mientras estas autenticado"}

    try:
        result = mymodelcomponent.delete_user_admin(user_id)
        if result.get("success") and user_id in sessions:
            del sessions[user_id]
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/admin/events")
async def create_admin_event(request: Request, event_data: dict):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.create_event_admin(event_data)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.put("/api/admin/events/{event_id}")
async def update_admin_event(request: Request, event_id: str, event_data: dict):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.update_event_admin(event_id, event_data)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/admin/events/{event_id}")
async def delete_admin_event(request: Request, event_id: str):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.delete_event_admin(event_id)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/admin/artists")
async def create_admin_artist(request: Request, artist_data: dict):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.create_artist_admin(artist_data)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.put("/api/admin/artists/{artist_id}")
async def update_admin_artist(request: Request, artist_id: str, artist_data: dict):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.update_artist_admin(artist_id, artist_data)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/admin/artists/{artist_id}")
async def delete_admin_artist(request: Request, artist_id: str):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.delete_artist_admin(artist_id)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/admin/zones")
async def create_admin_zone(request: Request, zone_data: dict):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.create_zone_admin(zone_data)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.put("/api/admin/zones/{zone_id}")
async def update_admin_zone(request: Request, zone_id: str, zone_data: dict):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.update_zone_admin(zone_id, zone_data)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/admin/zones/{zone_id}")
async def delete_admin_zone(request: Request, zone_id: str):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.delete_zone_admin(zone_id)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/admin/stands")
async def create_admin_stand(request: Request, stand_data: dict):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.create_stand_admin(stand_data)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.put("/api/admin/stands/{stand_id}")
async def update_admin_stand(request: Request, stand_id: str, stand_data: dict):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.update_stand_admin(stand_id, stand_data)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/admin/stands/{stand_id}")
async def delete_admin_stand(request: Request, stand_id: str):
    _, _, error = require_admin(request)
    if error:
        return error

    try:
        return mymodelcomponent.delete_stand_admin(stand_id)
    except Exception as e:
        return {"success": False, "error": str(e)}
