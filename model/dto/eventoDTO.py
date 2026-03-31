import json
from datetime import datetime

class EventoDTO:
    def __init__(self):
        self.id = None
        self.nombre = None
        self.imagen = None
        self.fecha_ini = None
        self.fecha_fin = None
        self.descripcion = None
        self.estado = "activo"
        self.artistas = []  # Lista de IDs de artistas
        self.zonas = []     # Lista de zonas
    
    def is_Empty(self):
        return self.id is None and self.nombre is None
    
    # Getters y Setters
    def get_id(self):
        return self.id
    def set_id(self, id):
        self.id = id
    
    def get_nombre(self):
        return self.nombre
    def set_nombre(self, nombre):
        self.nombre = nombre
    
    def get_imagen(self):
        return self.imagen
    def set_imagen(self, imagen):
        self.imagen = imagen
    
    def get_fecha_ini(self):
        return self.fecha_ini
    def set_fecha_ini(self, fecha_ini):
        self.fecha_ini = fecha_ini
    
    def get_fecha_fin(self):
        return self.fecha_fin
    def set_fecha_fin(self, fecha_fin):
        self.fecha_fin = fecha_fin
    
    def get_descripcion(self):
        return self.descripcion
    def set_descripcion(self, descripcion):
        self.descripcion = descripcion
    
    def get_estado(self):
        return self.estado
    def set_estado(self, estado):
        self.estado = estado
    
    def get_artistas(self):
        return self.artistas
    def set_artistas(self, artistas):
        self.artistas = artistas
    
    def get_zonas(self):
        return self.zonas
    def set_zonas(self, zonas):
        self.zonas = zonas
    
    def eventodto_to_dict(self):
        return {
            "id": self.get_id(),
            "nombre": self.get_nombre(),
            "imagen": self.get_imagen(),
            "fecha_ini": self.get_fecha_ini().isoformat() if self.get_fecha_ini() else None,
            "fecha_fin": self.get_fecha_fin().isoformat() if self.get_fecha_fin() else None,
            "descripcion": self.get_descripcion(),
            "estado": self.get_estado(),
            "artistas": self.get_artistas(),
            "zonas": self.get_zonas()
        }
    
    def eventodto_to_json(self):
        return json.dumps(self.eventodto_to_dict())