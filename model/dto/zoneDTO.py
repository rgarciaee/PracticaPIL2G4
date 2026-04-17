import json

class ZonesDTO():
    def __init__(self):
        self.zonelist = []

    def insertZone(self, elem):
        self.zonelist.append(elem)

    def zonelist_to_json(self):
        return json.dumps(self.zonelist)


class ZoneDTO():
    def __init__(self):
        self.id = None
        self.evento_id = None
        self.nombre = None
        self.aforo_maximo = None
        self.precio = None
        self.fecha_evento = None
        self.tipo = None

    def is_Empty(self):
        return (self.id is None and self.evento_id is None and 
                self.nombre is None and self.aforo_maximo is None and 
                self.precio is None)

    # Getters y Setters
    def get_id(self): return self.id
    def set_id(self, id): self.id = id

    def get_evento_id(self): return self.evento_id
    def set_evento_id(self, evento_id): self.evento_id = evento_id

    def get_nombre(self): return self.nombre
    def set_nombre(self, nombre): self.nombre = nombre

    def get_aforo_maximo(self): return self.aforo_maximo
    def set_aforo_maximo(self, aforo_maximo): self.aforo_maximo = aforo_maximo

    def get_precio(self): return self.precio
    def set_precio(self, precio): self.precio = precio

    def get_fecha_evento(self): return self.fecha_evento
    def set_fecha_evento(self, fecha_evento): self.fecha_evento = fecha_evento

    def get_tipo(self): return self.tipo
    def set_tipo(self, tipo): self.tipo = tipo

    def zonedto_to_dict(self):
        return {
            "id": self.id,
            "evento_id": self.evento_id,
            "nombre": self.nombre,
            "aforo_maximo": self.aforo_maximo,
            "precio": self.precio,
            "fecha_evento": self.fecha_evento,
            "tipo": self.tipo
        }
