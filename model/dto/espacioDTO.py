import json

class EspacioDTO:
    def __init__(self):
        self.id = None
        self.evento_id = None
        self.zona_id = None
        self.precio_alquiler = 0.0
        self.dimension_m2 = 0.0
        self.horario = None
        self.estado = "disponible"
        self.proveedor_id = None  # Para reservas
    
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
    
    def get_zona_id(self):
        return self.zona_id
    def set_zona_id(self, zona_id):
        self.zona_id = zona_id
    
    def get_precio_alquiler(self):
        return self.precio_alquiler
    def set_precio_alquiler(self, precio_alquiler):
        self.precio_alquiler = precio_alquiler
    
    def get_dimension_m2(self):
        return self.dimension_m2
    def set_dimension_m2(self, dimension_m2):
        self.dimension_m2 = dimension_m2
    
    def get_horario(self):
        return self.horario
    def set_horario(self, horario):
        self.horario = horario
    
    def get_estado(self):
        return self.estado
    def set_estado(self, estado):
        self.estado = estado
    
    def get_proveedor_id(self):
        return self.proveedor_id
    def set_proveedor_id(self, proveedor_id):
        self.proveedor_id = proveedor_id
    
    def espaciodto_to_dict(self):
        return {
            "id": self.get_id(),
            "evento_id": self.get_evento_id(),
            "zona_id": self.get_zona_id(),
            "precio_alquiler": self.get_precio_alquiler(),
            "dimension_m2": self.get_dimension_m2(),
            "horario": self.get_horario(),
            "estado": self.get_estado(),
            "proveedor_id": self.get_proveedor_id()
        }
    
    def espaciodto_to_json(self):
        return json.dumps(self.espaciodto_to_dict())