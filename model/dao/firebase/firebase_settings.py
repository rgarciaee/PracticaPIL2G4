import json
import os
from pathlib import Path


DEFAULT_CREDENTIALS_PATH = Path("model/dao/firebase/credentials.json")
ENV_CREDENTIALS_JSON = "FIREBASE_CREDENTIALS_JSON"
ENV_CREDENTIALS_PATH = "FIREBASE_CREDENTIALS_PATH"


def load_firebase_credentials_data():
    credentials_json = os.getenv(ENV_CREDENTIALS_JSON, "").strip()
    if credentials_json:
        return json.loads(credentials_json)

    credentials_path = os.getenv(ENV_CREDENTIALS_PATH, "").strip()
    if credentials_path:
        with Path(credentials_path).open("r", encoding="utf-8") as credentials_file:
            return json.load(credentials_file)

    with DEFAULT_CREDENTIALS_PATH.open("r", encoding="utf-8") as credentials_file:
        return json.load(credentials_file)


def get_firebase_certificate_source():
    return load_firebase_credentials_data()


def get_firebase_web_config():
    return load_firebase_credentials_data().get("web_config", {})
