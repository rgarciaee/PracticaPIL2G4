import json
from datetime import datetime

class CartDTO():
    def __init__(self):
        self.user_id = None
        self.items = []
        self.total_items = 0
        self.total_price = 0.0
        self.updated_at = None

    def is_Empty(self):
        return len(self.items) == 0

    def get_user_id(self):
        return self.user_id

    def set_user_id(self, user_id):
        self.user_id = user_id

    def get_items(self):
        return self.items

    def set_items(self, items):
        self.items = items
        self._calculate_totals()

    def add_item(self, item):
        # Buscar si el item ya existe (mismo evento y zona)
        existing = next((i for i in self.items if i.get("id") == item.get("id")), None)
        if existing:
            if item.get("item_category") == "provider_rental":
                existing["cantidad"] = 1
            else:
                existing["cantidad"] += item.get("cantidad", 1)
        else:
            self.items.append(item)
        self._calculate_totals()

    def remove_item(self, item_id):
        self.items = [i for i in self.items if i.get("id") != item_id]
        self._calculate_totals()

    def update_quantity(self, item_id, quantity):
        for item in self.items:
            if item.get("id") == item_id:
                if quantity <= 0:
                    self.remove_item(item_id)
                else:
                    item["cantidad"] = quantity
                break
        self._calculate_totals()

    def clear(self):
        self.items = []
        self.total_items = 0
        self.total_price = 0.0

    def _calculate_totals(self):
        self.total_items = sum(item.get("cantidad", 1) for item in self.items)
        self.total_price = sum(item.get("precio", 0) * item.get("cantidad", 1) for item in self.items)

    def set_updated_at(self, updated_at=None):
        if updated_at:
            self.updated_at = updated_at
        else:
            self.updated_at = datetime.now().isoformat()

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "items": self.items,
            "total_items": self.total_items,
            "total_price": self.total_price,
            "updated_at": self.updated_at
        }

    def from_dict(self, data):
        self.user_id = data.get("user_id")
        self.items = data.get("items", [])
        self.total_items = data.get("total_items", 0)
        self.total_price = data.get("total_price", 0.0)
        self.updated_at = data.get("updated_at")
        return self

    def to_json(self):
        return json.dumps(self.to_dict())

    @staticmethod
    def from_json(json_str):
        data = json.loads(json_str)
        return CartDTO().from_dict(data)


class CartItemDTO():
    def __init__(self):
        self.id = None
        self.nombre = None
        self.precio = 0.0
        self.cantidad = 1
        self.tipo = None
        self.zona_id = None
        self.zona_nombre = None
        self.evento_id = None
        self.evento_nombre = None
        self.imagen = None
        self.added_at = None

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "precio": self.precio,
            "cantidad": self.cantidad,
            "tipo": self.tipo,
            "zona_id": self.zona_id,
            "zona_nombre": self.zona_nombre,
            "evento_id": self.evento_id,
            "evento_nombre": self.evento_nombre,
            "imagen": self.imagen,
            "added_at": self.added_at or datetime.now().isoformat()
        }

    def from_dict(self, data):
        self.id = data.get("id")
        self.nombre = data.get("nombre")
        self.precio = data.get("precio", 0.0)
        self.cantidad = data.get("cantidad", 1)
        self.tipo = data.get("tipo")
        self.zona_id = data.get("zona_id")
        self.zona_nombre = data.get("zona_nombre")
        self.evento_id = data.get("evento_id")
        self.evento_nombre = data.get("evento_nombre")
        self.imagen = data.get("imagen")
        self.added_at = data.get("added_at")
        return self
