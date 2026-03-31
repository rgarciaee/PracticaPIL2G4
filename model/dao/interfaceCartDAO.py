from abc import ABC, abstractmethod

class InterfaceCartDAO(ABC):

    @abstractmethod
    def get_cart(self, user_id):
        """Obtener carrito del usuario"""
        pass

    @abstractmethod
    def save_cart(self, user_id, items):
        """Guardar carrito completo"""
        pass

    @abstractmethod
    def add_item(self, user_id, item):
        """Añadir item al carrito"""
        pass

    @abstractmethod
    def remove_item(self, user_id, item_id):
        """Eliminar item del carrito"""
        pass

    @abstractmethod
    def update_quantity(self, user_id, item_id, quantity):
        """Actualizar cantidad de un item"""
        pass

    @abstractmethod
    def clear_cart(self, user_id):
        """Vaciar carrito"""
        pass