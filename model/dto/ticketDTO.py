import json
from datetime import datetime

class TicketsDTO():
    def __init__(self):
        self.ticketlist = []

    def insertTicket(self, elem):
        self.ticketlist.append(elem)

    def ticketlist_to_json(self):
        return json.dumps(self.ticketlist, default=str)


class TicketDTO():
    def __init__(self):
        self.id = None
        self.usuario_id = None
        self.zona_id = None
        self.localizador_qr = None
        self.fecha_compra = None
        self.fecha_evento = None
        self.estado = None
        self.evento_nombre = None
        self.zona_nombre = None
        self.precio = None

    def is_Empty(self):
        return (self.id is None and self.usuario_id is None and 
                self.zona_id is None and self.localizador_qr is None and 
                self.fecha_compra is None and self.estado is None)

    # Getters y Setters
    def get_id(self): return self.id
    def set_id(self, id): self.id = id

    def get_usuario_id(self): return self.usuario_id
    def set_usuario_id(self, usuario_id): self.usuario_id = usuario_id

    def get_zona_id(self): return self.zona_id
    def set_zona_id(self, zona_id): self.zona_id = zona_id

    def get_localizador_qr(self): return self.localizador_qr
    def set_localizador_qr(self, localizador_qr): self.localizador_qr = localizador_qr

    def get_fecha_compra(self): return self.fecha_compra
    def set_fecha_compra(self, fecha_compra): self.fecha_compra = fecha_compra

    def get_fecha_evento(self): return self.fecha_evento
    def set_fecha_evento(self, fecha_evento): self.fecha_evento = fecha_evento
    
    def get_estado(self): return self.estado
    def set_estado(self, estado): self.estado = estado

    def get_evento_nombre(self): return self.evento_nombre
    def set_evento_nombre(self, evento_nombre): self.evento_nombre = evento_nombre

    def get_zona_nombre(self): return self.zona_nombre
    def set_zona_nombre(self, zona_nombre): self.zona_nombre = zona_nombre

    def get_precio(self): return self.precio
    def set_precio(self, precio): self.precio = precio

    def ticketdto_to_dict(self):
        # Si fecha_compra es datetime, convertirlo a string
        fecha = self.fecha_compra
        if hasattr(fecha, 'isoformat'):
            fecha = fecha.isoformat()
        
        fecha_evento = self.fecha_evento
        if hasattr(fecha_evento, 'isoformat'):
            fecha_evento = fecha_evento.isoformat()
        
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "zona_id": self.zona_id,
            "localizador_qr": self.localizador_qr,
            "fecha_compra": fecha,
            "fecha_evento": fecha_evento,
            "estado": self.estado,
            "evento_nombre": self.evento_nombre,
            "zona_nombre": self.zona_nombre,
            "precio": self.precio
        }