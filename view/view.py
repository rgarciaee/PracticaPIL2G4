from fastapi.templating import Jinja2Templates
from fastapi import Request
from fastapi.responses import FileResponse
import os

templates = Jinja2Templates(directory="view/templates")

class View():
    def __init__(self):
        pass

    # ============================================================
    # VISTAS PRINCIPALES
    # ============================================================

    def get_login_view(self, request: Request):
        """Vista de login/registro"""
        return templates.TemplateResponse("login.html", {"request": request})

    def get_app_view(self, request: Request):
        """Vista principal de la aplicación (SPA)"""
        return templates.TemplateResponse("index.html", {"request": request})

    def get_index_view(self, request: Request):
        """Vista antigua (redirige lógicamente a login o app según corresponda)"""
        # Esta vista se mantiene por compatibilidad
        return templates.TemplateResponse("index.html", {"request": request})

    # ============================================================
    # VISTA DE ADMINISTRACIÓN (DASHBOARD)
    # ============================================================

    def get_dasboard_view(self, request: Request, data: dict):
        """Vista del dashboard de administración"""
        print(data)
        return templates.TemplateResponse("dashboard.html", {"request": request, "data": data})

    # ============================================================
    # SERVIR ARCHIVOS ESTÁTICOS Y PARTIALS
    # ============================================================

    def serve_static(self, path: str):
        """Sirve archivos estáticos desde templates/static/"""
        file_path = os.path.join("view/templates/static", path)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return None

    def serve_partial(self, page: str):
        """Sirve los HTML parciales desde templates/partials/"""
        file_path = os.path.join("view/templates/partials", f"{page}.html")
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return None

    # ============================================================
    # MÉTODOS PARA ERRORES
    # ============================================================

    def get_404_view(self, request: Request):
        """Vista de error 404"""
        return templates.TemplateResponse("404.html", {"request": request})

    def get_error_view(self, request: Request, error_message: str):
        """Vista de error genérico"""
        return templates.TemplateResponse("error.html", {"request": request, "error": error_message})