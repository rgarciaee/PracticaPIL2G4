# model/dto/userDTO.py
import json
class UserDTO:
    def __init__(self):
        self.id = None
        self.email = None
        self.role = None
        self.exp = None
        self.session = None
    
    def is_Empty(self):
        return self.id == None and self.email == None and self.role == None and self.exp == None and self.session == None

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
    
    def userdto_to_json(self):
        dict = {
            "id" : self.get_id(),
            "email": self.get_email(),
            "role": self.get_role(),
            "exp" : self.get_exp(),
            "session" : self.get_session()
        }
        user_json = json.dumps(dict)
        return user_json
