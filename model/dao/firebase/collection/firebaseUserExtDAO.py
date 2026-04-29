from ....dto.userExtDTO import UserExtDTO

class FirebaseUserExtDAO():
    def __init__(self, collection):
        self.collection = collection

    def get_user_extended(self, user_id):
        try:
            doc = self.collection.document(user_id).get()
            if doc.exists:
                user_data = doc.to_dict()
                user_dto = UserExtDTO()
                user_dto.set_id(doc.id)
                user_dto.set_dni(user_data.get("dni", ""))
                user_dto.set_nombre_apellidos(user_data.get("nombre_apellidos", ""))
                fecha_nacimiento = user_data.get("fecha_nacimiento", "")
                user_dto.set_fecha_nacimiento(fecha_nacimiento)
                user_dto.set_num_tarjeta(user_data.get("num_tarjeta", ""))
                user_dto.set_direccion(user_data.get("direccion", ""))
                user_dto.set_email(user_data.get("email", ""))
                user_dto.set_rol_asignado(user_data.get("rol_asignado", "cliente"))
                user_dto.set_telefono(user_data.get("telefono", ""))
                user_dto.set_avatar_url(user_data.get("avatar_url", ""))
                return user_dto.userextdto_to_dict()
            return None
        except Exception as e:
            print(f"Error en get_user_extended: {e}")
            return None

    def update_user_extended(self, user_id, user_data):
        try:
            self.collection.document(user_id).set(user_data, merge=True)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
