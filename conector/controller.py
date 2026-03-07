#API WEB FASTAPI
from fastapi import FastAPI, Request, Response
from firebase_admin import auth
from datetime import datetime
from view.view import View
from model.model import Model
import json
#Inicializamos FastAPI
app = FastAPI()

#Gestion de sesiones de usuario
sessions = {}

myviewcomponent = View()
mymodelcomponent = Model()

@app.get("/")
def index(request: Request):
    return myviewcomponent.get_index_view(request)


@app.post("/login")
async def login(data: dict, response: Response, provider: str):
    print("LLEGO LOGIN")
    token = data.get("token")
    try:
        userDTO_dict = json.loads(mymodelcomponent.checking_user_token(token))
        print("USER JSON")
        print(userDTO_dict)
        if userDTO_dict['id'] == "":
            print("dto EMPTY")
            return {"success": False, "error": "Invalid token"}
        else:
            user_id = userDTO_dict["id"]
            print("CONTROLER - LOGIN - USER_ID:",user_id)
            sessions[user_id] = userDTO_dict["session"]
            response.set_cookie(key="session_id", value=user_id, httponly=True)
            return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/login-credentials")
async def login_google(data: dict, response: Response):
    return await login(data, response, "credentials")

@app.post("/login-google")
async def login_google(data: dict, response: Response):
    return await login(data, response, "google")


@app.get("/dashboard")
def dashboard(request: Request):
    # Comprobamos si el usuario tiene una sesión activa
    request_session_id = request.cookies.get("session_id")
    print("CONTROLLER DASH:",request_session_id)
    if not request_session_id:
        myviewcomponent.get_index_view(request)
    else:
        user_session = sessions[request_session_id]
        if user_session["role"] == "admin":
            current_time = int(datetime.now().timestamp())
            if int(user_session["exp"]) < current_time:
                # Sesion Expirada
                return myviewcomponent.get_index_view(request)
            else:
                # Sesion activa y soy admin, hago llamada a modelo
                print("SESION NO EXPIRADA")
                songs = json.loads(mymodelcomponent.get_songs())
                print(songs)
                music_genres = json.loads(mymodelcomponent.get_musicgenres())
                print(music_genres)
                data = {
                    "songs" : songs,
                    "categories" : music_genres
                }
                return myviewcomponent.get_dasboard_view(request,data)
        else:
            return {"success": False, "error":  "Method not allowed for your role"}

    return myviewcomponent.get_dasboard_view(request, {})


@app.post("/logout")
async def logout(request: Request, response: Response):
    session_id = request.cookies.get("session_id")
    print("CERRANDO SESSION:", session_id)
    if session_id in sessions:
        del sessions[session_id]
    response.delete_cookie("session_id")
    return {"success": True}

