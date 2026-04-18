# main.py - versión corregida

from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from controller.controller import app, sessions
import os

# Crear la aplicación principal
main_app = FastAPI(
    title="Subsonic Festival API",
    description="API para la plataforma del Subsonic Festival",
    version="1.0.0"
)

# ============================================================
# SERVIR ARCHIVOS ESTÁTICOS
# ============================================================

static_path = os.path.join(os.path.dirname(__file__), "view", "templates", "static")
if os.path.exists(static_path):
    main_app.mount("/static", StaticFiles(directory=static_path), name="static")


# ============================================================
# SERVIR PARTIALS
# ============================================================

@main_app.get("/partials/{page}")
async def serve_partial(request: Request, page: str):
    if page == "admin":
        session_id = request.cookies.get("session_id")
        session = sessions.get(session_id) if session_id else None
        role = str((session or {}).get("role", "")).strip().lower()
        if role != "admin":
            return JSONResponse(status_code=403, content={"error": "Admin only"})

    file_path = os.path.join("view/templates/partials", f"{page}.html")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return JSONResponse(status_code=404, content={"error": "Page not found"})


# ============================================================
# FAVICON
# ============================================================

@main_app.get("/favicon.ico")
async def favicon():
    favicon_path = os.path.join("view/templates/static", "favicon.ico")
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path)
    return Response(status_code=204)


# ============================================================
# INCLUIR TODAS LAS RUTAS DEL CONTROLLER
# ============================================================

main_app.include_router(app)


# ============================================================
# EJECUTAR
# ============================================================

if __name__ == "__main__":
    import uvicorn
    # CAMBIO IMPORTANTE: Usar la aplicación como string y quitar reload
    # o usar reload pero con la app como string
    uvicorn.run(main_app, host="localhost", port=8000, reload=False, log_level="info")
