from abc import ABC, abstractmethod

class InterfaceTicketDAO(ABC):

    @abstractmethod
    def get_tickets_by_user(self, user_id):
        """Obtiene todas las entradas de un usuario (historial)"""
        pass

    @abstractmethod
    def add_ticket(self, ticket_data):
        """Añade una nueva entrada (compra)"""
        pass

    @abstractmethod
    def update_ticket_status(self, ticket_id, status):
        """Actualiza el estado de una entrada"""
        pass

    @abstractmethod
    def get_ticket_by_qr(self, qr_code):
        """Obtiene una entrada por su código QR"""
        pass