import json
from pathlib import Path

from fastapi import Request
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="view/templates")
_CREDENTIALS_PATH = Path("model/dao/firebase/credentials.json")


def get_firebase_web_config():
    try:
        with _CREDENTIALS_PATH.open("r", encoding="utf-8") as credentials_file:
            credentials_data = json.load(credentials_file)
        return credentials_data.get("web_config", {})
    except Exception:
        return {}


class View:
    def get_login_view(self, request: Request):
        return templates.TemplateResponse(
            "login.html",
            {
                "request": request,
                "firebase_config": get_firebase_web_config(),
            },
        )

    def get_app_view(self, request: Request):
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "firebase_config": get_firebase_web_config(),
            },
        )
