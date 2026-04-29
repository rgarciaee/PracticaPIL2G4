import json
from datetime import datetime

class EventsDTO():
    def __init__(self):
        self.eventlist = []

    def insertEvent(self, elem):
        self.eventlist.append(elem)

    def eventlist_to_json(self):
        def convert_dates(obj):
            if isinstance(obj, dict):
                return {k: convert_dates(v) for k, v in obj.items()}
            elif isinstance(obj, datetime):
                return obj.isoformat()
            return obj

        converted = [convert_dates(event) for event in self.eventlist]
        return json.dumps(converted, default=str)

class EventDTO():
    def __init__(self):
        self.id = None
        self.nombre = None
        self.imagen = None
        self.fecha_ini = None
        self.fecha_fin = None
        self.descripcion = None
        self.ubicacion = None
        self.horario = None

    def is_Empty(self):
        return (self.id is None and self.nombre is None and
                self.imagen is None and self.fecha_ini is None and
                self.fecha_fin is None and self.descripcion is None and
                self.ubicacion is None and self.horario is None)

    def get_id(self): return self.id
    def set_id(self, id): self.id = id

    def get_nombre(self): return self.nombre
    def set_nombre(self, nombre): self.nombre = nombre

    def get_imagen(self): return self.imagen
    def set_imagen(self, imagen): self.imagen = imagen

    def get_fecha_ini(self): return self.fecha_ini
    def set_fecha_ini(self, fecha_ini): self.fecha_ini = fecha_ini

    def get_fecha_fin(self): return self.fecha_fin
    def set_fecha_fin(self, fecha_fin): self.fecha_fin = fecha_fin

    def get_descripcion(self): return self.descripcion
    def set_descripcion(self, descripcion): self.descripcion = descripcion

    def get_ubicacion(self): return self.ubicacion
    def set_ubicacion(self, ubicacion): self.ubicacion = ubicacion

    def get_horario(self): return self.horario
    def set_horario(self, horario): self.horario = horario

    def eventdto_to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "imagen": self.imagen,
            "fecha_ini": self.fecha_ini,
            "fecha_fin": self.fecha_fin,
            "descripcion": self.descripcion,
            "ubicacion": self.ubicacion,
            "horario": self.horario or [],
        }

    def dict_to_eventdto(self, data):
        self.id = data.get("id")
        self.nombre = data.get("nombre")
        self.imagen = data.get("imagen")
        self.fecha_ini = data.get("fecha_ini")
        self.fecha_fin = data.get("fecha_fin")
        self.descripcion = data.get("descripcion")
        self.ubicacion = data.get("ubicacion")
        self.horario = data.get("horario", [])
        return self
