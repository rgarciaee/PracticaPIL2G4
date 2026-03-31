import json

class ZonaDTO:
    def __init__(self):
        self.id = None
        self.evento_id = None
        self.nombre = None
        self.aforo_maximo = 0
        self.precio = 0.0
        self.entradas_vendidas = 0
    
    def is_Empty(self):
        return self.id is None
    
    def get_id(self):
        return self.id
    def set_id(self, id):
        self.id = id
    
    def get_evento_id(self):
        return self.evento_id
    def set_evento_id(self, evento_id):
        self.evento_id = evento_id
    
    def get_nombre(self):
        return self.nombre
    def set_nombre(self, nombre):
        self.nombre = nombre
    
    def get_aforo_maximo(self):
        return self.aforo_maximo
    def set_aforo_maximo(self, aforo_maximo):
        self.aforo_maximo = aforo_maximo
    
    def get_precio(self):
        return self.precio
    def set_precio(self, precio):
        self.precio = precio
    
    def get_entradas_vendidas(self):
        return self.entradas_vendidas
    def set_entradas_vendidas(self, entradas_vendidas):
        self.entradas_vendidas = entradas_vendidas
    
    def get_disponibilidad(self):
        return self.aforo_maximo - self.entradas_vendidas
    
    def zonadto_to_dict(self):
        return {
            "id": self.get_id(),
            "evento_id": self.get_evento_id(),
            "nombre": self.get_nombre(),
            "aforo_maximo": self.get_aforo_maximo(),
            "precio": self.get_precio(),
            "entradas_vendidas": self.get_entradas_vendidas(),
            "disponibilidad": self.get_disponibilidad()
        }
    
    def zonadto_to_json(self):
        return json.dumps(self.zonadto_to_dict())