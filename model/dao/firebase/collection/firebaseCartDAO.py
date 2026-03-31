from ....dao.interfaceCartDAO import InterfaceCartDAO
from ....dto.cartDTO import CartDTO
from datetime import datetime

class FirebaseCartDAO(InterfaceCartDAO):

    def __init__(self, collection):
        self.collection = collection

    def get_cart(self, user_id):
        """Obtener carrito del usuario"""
        try:
            doc = self.collection.document(user_id).get()
            if doc.exists:
                data = doc.to_dict()
                cart = CartDTO().from_dict(data)
                return cart
            return CartDTO()
        except Exception as e:
            print(f"Error en get_cart: {e}")
            return CartDTO()

    def save_cart(self, user_id, items):
        """Guardar carrito completo"""
        try:
            cart = CartDTO()
            cart.set_user_id(user_id)
            cart.set_items(items)
            cart.set_updated_at()
            
            self.collection.document(user_id).set(cart.to_dict())
            return {"success": True, "cart": cart.to_dict()}
        except Exception as e:
            print(f"Error en save_cart: {e}")
            return {"success": False, "error": str(e)}

    def add_item(self, user_id, item):
        """Añadir item al carrito"""
        try:
            cart = self.get_cart(user_id)
            cart.set_user_id(user_id)
            
            # Asegurar que el item tiene added_at
            if "added_at" not in item:
                item["added_at"] = datetime.now().isoformat()
            
            cart.add_item(item)
            cart.set_updated_at()
            
            self.collection.document(user_id).set(cart.to_dict())
            return {"success": True, "cart": cart.to_dict()}
        except Exception as e:
            print(f"Error en add_item: {e}")
            return {"success": False, "error": str(e)}

    def remove_item(self, user_id, item_id):
        """Eliminar item del carrito"""
        try:
            cart = self.get_cart(user_id)
            cart.set_user_id(user_id)
            cart.remove_item(item_id)
            cart.set_updated_at()
            
            self.collection.document(user_id).set(cart.to_dict())
            return {"success": True, "cart": cart.to_dict()}
        except Exception as e:
            print(f"Error en remove_item: {e}")
            return {"success": False, "error": str(e)}

    def update_quantity(self, user_id, item_id, quantity):
        """Actualizar cantidad de un item"""
        try:
            cart = self.get_cart(user_id)
            cart.set_user_id(user_id)
            cart.update_quantity(item_id, quantity)
            cart.set_updated_at()
            
            self.collection.document(user_id).set(cart.to_dict())
            return {"success": True, "cart": cart.to_dict()}
        except Exception as e:
            print(f"Error en update_quantity: {e}")
            return {"success": False, "error": str(e)}

    def clear_cart(self, user_id):
        """Vaciar carrito"""
        try:
            cart = CartDTO()
            cart.set_user_id(user_id)
            cart.clear()
            cart.set_updated_at()
            
            self.collection.document(user_id).set(cart.to_dict())
            return {"success": True, "cart": cart.to_dict()}
        except Exception as e:
            print(f"Error en clear_cart: {e}")
            return {"success": False, "error": str(e)}