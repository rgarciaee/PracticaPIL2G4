import json

class UserDTO:
    def __init__(self):
        self.id = None
        self.email = None
        self.role = None
        self.exp = None
        self.session = None
        self.nombre_apellidos = None
        self.dni = None
        self.fecha_nacimiento = None
        self.direccion = None
    
    def is_Empty(self):
        return self.id is None and self.email is None and self.role is None
    
    # Getters y Setters
    def get_id(self):
        return self.id
    def set_id(self, id):
        self.id = id
    
    def get_email(self):
        return self.email
    def set_email(self, email):
        self.email = email
    
    def get_role(self):
        return self.role
    def set_role(self, role):
        self.role = role
    
    def get_exp(self):
        return self.exp
    def set_exp(self, exp):
        self.exp = exp
    
    def get_session(self):
        return self.session
    def set_session(self, session):
        self.session = session
    
    def get_nombre_apellidos(self):
        return self.nombre_apellidos
    def set_nombre_apellidos(self, nombre_apellidos):
        self.nombre_apellidos = nombre_apellidos
    
    def get_dni(self):
        return self.dni
    def set_dni(self, dni):
        self.dni = dni
    
    def get_fecha_nacimiento(self):
        return self.fecha_nacimiento
    def set_fecha_nacimiento(self, fecha_nacimiento):
        self.fecha_nacimiento = fecha_nacimiento
    
    def get_direccion(self):
        return self.direccion
    def set_direccion(self, direccion):
        self.direccion = direccion
    
    def userdto_to_dict(self):
        return {
            "id": self.get_id(),
            "email": self.get_email(),
            "role": self.get_role(),
            "exp": self.get_exp(),
            "session": self.get_session(),
            "nombre_apellidos": self.get_nombre_apellidos(),
            "dni": self.get_dni(),
            "fecha_nacimiento": self.get_fecha_nacimiento().isoformat() if self.get_fecha_nacimiento() else None,
            "direccion": self.get_direccion()
        }
    
    def userdto_to_json(self):
        return json.dumps(self.userdto_to_dict())