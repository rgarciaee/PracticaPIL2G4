from fastapi import Request
from fastapi.templating import Jinja2Templates

from model.dao.firebase.firebase_settings import get_firebase_web_config

templates = Jinja2Templates(directory="view/templates")


class View:
    def get_login_view(self, request: Request):
        return templates.TemplateResponse(
            "login.html",
            {
                "request": request,
                "firebase_config": self._safe_web_config(),
            },
        )

    def get_app_view(self, request: Request):
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "firebase_config": self._safe_web_config(),
            },
        )

    @staticmethod
    def _safe_web_config():
        try:
            return get_firebase_web_config()
        except Exception:
            return {}
