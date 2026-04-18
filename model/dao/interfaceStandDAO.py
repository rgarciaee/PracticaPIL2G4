from abc import ABC, abstractmethod

class InterfaceStandDAO(ABC):

    @abstractmethod
    def get_stands_by_event(self, event_id):
        """Obtiene todos los puestos de un evento"""
        pass

    @abstractmethod
    def get_stands_available(self, event_id):
        """Obtiene puestos disponibles para alquiler"""
        pass

    @abstractmethod
    def request_stand_rental(self, stand_id, user_id, request_data):
        """Solicita alquiler de un puesto"""
        pass