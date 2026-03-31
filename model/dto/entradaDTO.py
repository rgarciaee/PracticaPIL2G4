import json
from datetime import datetime

class EntradaDTO:
    def __init__(self):
        self.id = None
        self.usuario_id = None
        self.evento_id = None
        self.zona_id = None
        self.localizador_qr = None
        self.fecha_compra = None
        self.estado = "activa"
        self.precio_pagado = 0.0
    
    def is_Empty(self):
        return self.id is None
    
    def get_id(self):
        return self.id
    def set_id(self, id):
        self.id = id
    
    def get_usuario_id(self):
        return self.usuario_id
    def set_usuario_id(self, usuario_id):
        self.usuario_id = usuario_id
    
    def get_evento_id(self):
        return self.evento_id
    def set_evento_id(self, evento_id):
        self.evento_id = evento_id
    
    def get_zona_id(self):
        return self.zona_id
    def set_zona_id(self, zona_id):
        self.zona_id = zona_id
    
    def get_localizador_qr(self):
        return self.localizador_qr
    def set_localizador_qr(self, localizador_qr):
        self.localizador_qr = localizador_qr
    
    def get_fecha_compra(self):
        return self.fecha_compra
    def set_fecha_compra(self, fecha_compra):
        self.fecha_compra = fecha_compra
    
    def get_estado(self):
        return self.estado
    def set_estado(self, estado):
        self.estado = estado
    
    def get_precio_pagado(self):
        return self.precio_pagado
    def set_precio_pagado(self, precio_pagado):
        self.precio_pagado = precio_pagado
    
    def entradadto_to_dict(self):
        return {
            "id": self.get_id(),
            "usuario_id": self.get_usuario_id(),
            "evento_id": self.get_evento_id(),
            "zona_id": self.get_zona_id(),
            "localizador_qr": self.get_localizador_qr(),
            "fecha_compra": self.get_fecha_compra().isoformat() if self.get_fecha_compra() else None,
            "estado": self.get_estado(),
            "precio_pagado": self.get_precio_pagado()
        }
    
    def entradadto_to_json(self):
        return json.dumps(self.entradadto_to_dict())