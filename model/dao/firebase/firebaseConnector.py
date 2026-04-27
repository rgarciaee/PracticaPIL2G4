from firebase_admin import auth, credentials, firestore, initialize_app

from .firebase_settings import get_firebase_certificate_source

TOKEN_CLOCK_SKEW_SECONDS = 60


class FirebaseConnector:
    firebase_app_initializated = False

    def __init__(self):
        self.db = None
        try:
            if not FirebaseConnector.firebase_app_initializated:
                self.credentials = credentials.Certificate(
                    get_firebase_certificate_source()
                )
                initialize_app(self.credentials)
            self.db = firestore.client()
            print("Connection to Firebase Firestore initialized successfully.")
            FirebaseConnector.firebase_app_initializated = True
        except Exception as e:
            print("Error in connecting with db")
            print(e)

    def get_db(self):
        if self.db is None:
            print("Database connection is not initialized.")
        return self.db

    def get_user_collection(self):
        print("GET USER COLLECTION")
        if self.db is None:
            print("Database connection is not initialized.")
        return self.db.collection("users")

    def verify_token(self, token):
        return auth.verify_id_token(
            token,
            clock_skew_seconds=TOKEN_CLOCK_SKEW_SECONDS,
        )
