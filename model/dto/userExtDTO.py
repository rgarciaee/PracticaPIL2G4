import json
from datetime import datetime

class UserExtDTO():
    def __init__(self):
        self.id = None
        self.dni = None
        self.nombre_apellidos = None
        self.fecha_nacimiento = None
        self.num_tarjeta = None
        self.direccion = None
        self.email = None
        self.rol_asignado = None
        self.telefono = None
        self.avatar_url = None

    def is_Empty(self):
        return (self.id is None and self.dni is None and
                self.nombre_apellidos is None and self.fecha_nacimiento is None and
                self.num_tarjeta is None and self.direccion is None and
                self.email is None and self.rol_asignado is None)

    def get_id(self): return self.id
    def set_id(self, id): self.id = id

    def get_dni(self): return self.dni
    def set_dni(self, dni): self.dni = dni

    def get_nombre_apellidos(self): return self.nombre_apellidos
    def set_nombre_apellidos(self, nombre_apellidos): self.nombre_apellidos = nombre_apellidos

    def get_fecha_nacimiento(self): return self.fecha_nacimiento
    def set_fecha_nacimiento(self, fecha_nacimiento): self.fecha_nacimiento = fecha_nacimiento

    def get_num_tarjeta(self): return self.num_tarjeta
    def set_num_tarjeta(self, num_tarjeta): self.num_tarjeta = num_tarjeta

    def get_direccion(self): return self.direccion
    def set_direccion(self, direccion): self.direccion = direccion

    def get_email(self): return self.email
    def set_email(self, email): self.email = email

    def get_rol_asignado(self): return self.rol_asignado
    def set_rol_asignado(self, rol_asignado): self.rol_asignado = rol_asignado

    def get_telefono(self): return self.telefono
    def set_telefono(self, telefono): self.telefono = telefono

    def get_avatar_url(self): return self.avatar_url
    def set_avatar_url(self, avatar_url): self.avatar_url = avatar_url

    def userextdto_to_dict(self):
        fecha = self.fecha_nacimiento
        if isinstance(fecha, datetime):
            fecha = fecha.isoformat()
        elif hasattr(fecha, "isoformat"):
            fecha = fecha.isoformat()

        return {
            "id": self.id,
            "dni": self.dni,
            "nombre_apellidos": self.nombre_apellidos,
            "fecha_nacimiento": fecha,
            "num_tarjeta": self.num_tarjeta,
            "direccion": self.direccion,
            "email": self.email,
            "rol_asignado": self.rol_asignado,
            "telefono": self.telefono,
            "avatar_url": self.avatar_url
        }
