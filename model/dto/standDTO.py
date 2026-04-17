import json

class StandsDTO():
    def __init__(self):
        self.standlist = []

    def insertStand(self, elem):
        self.standlist.append(elem)

    def standlist_to_json(self):
        return json.dumps(self.standlist)


class StandDTO():
    def __init__(self):
        self.id = None
        self.evento_id = None
        self.zona_id = None
        self.precio_alquiler = None
        self.dimension_m2 = None
        self.horario = None
        self.tipo = None
        self.nombre = None  # Nombre del puesto

    def is_Empty(self):
        return (self.id is None and self.evento_id is None and 
                self.zona_id is None and self.precio_alquiler is None and 
                self.dimension_m2 is None and self.horario is None)

    # Getters y Setters
    def get_id(self): return self.id
    def set_id(self, id): self.id = id

    def get_evento_id(self): return self.evento_id
    def set_evento_id(self, evento_id): self.evento_id = evento_id

    def get_zona_id(self): return self.zona_id
    def set_zona_id(self, zona_id): self.zona_id = zona_id

    def get_precio_alquiler(self): return self.precio_alquiler
    def set_precio_alquiler(self, precio_alquiler): self.precio_alquiler = precio_alquiler

    def get_dimension_m2(self): return self.dimension_m2
    def set_dimension_m2(self, dimension_m2): self.dimension_m2 = dimension_m2

    def get_horario(self): return self.horario
    def set_horario(self, horario): self.horario = horario

    def get_tipo(self): return self.tipo
    def set_tipo(self, tipo): self.tipo = tipo

    def get_nombre(self): return self.nombre
    def set_nombre(self, nombre): self.nombre = nombre

    def standdto_to_dict(self):
        return {
            "id": self.id,
            "evento_id": self.evento_id,
            "zona_id": self.zona_id,
            "precio_alquiler": self.precio_alquiler,
            "dimension_m2": self.dimension_m2,
            "horario": self.horario,
            "tipo": self.tipo,
            "nombre": self.nombre
        }
