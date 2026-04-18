from abc import ABC, abstractmethod

class InterfaceEventDAO(ABC):

    @abstractmethod
    def get_events(self):
        """Obtiene todos los eventos"""
        pass

    @abstractmethod
    def get_event_by_id(self, event_id):
        """Obtiene un evento por su ID"""
        pass

    @abstractmethod
    def add_event(self, event_data):
        """Añade un nuevo evento"""
        pass

    @abstractmethod
    def update_event(self, event_id, event_data):
        """Actualiza un evento existente"""
        pass

    @abstractmethod
    def delete_event(self, event_id):
        """Elimina un evento"""
        pass