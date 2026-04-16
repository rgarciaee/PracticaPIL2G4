from fastapi import Request
from fastapi.responses import FileResponse
from fastapi.templating import Jinja2Templates
import os

templates = Jinja2Templates(directory="view/templates")


class View:
    def __init__(self):
        pass

    def get_login_view(self, request: Request):
        return templates.TemplateResponse("login.html", {"request": request})

    def get_app_view(self, request: Request):
        return templates.TemplateResponse("index.html", {"request": request})

    def get_index_view(self, request: Request):
        return templates.TemplateResponse("index.html", {"request": request})

    def serve_static(self, path: str):
        file_path = os.path.join("view/templates/static", path)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return None

    def serve_partial(self, page: str):
        file_path = os.path.join("view/templates/partials", f"{page}.html")
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return None

    def get_404_view(self, request: Request):
        return templates.TemplateResponse("404.html", {"request": request})

    def get_error_view(self, request: Request, error_message: str):
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": error_message},
        )
