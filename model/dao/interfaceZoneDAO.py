from abc import ABC, abstractmethod

class InterfaceZoneDAO(ABC):

    @abstractmethod
    def get_zones_by_event(self, event_id):
        """Obtiene todas las zonas de un evento"""
        pass

    @abstractmethod
    def get_zone_by_id(self, zone_id):
        """Obtiene una zona por su ID"""
        pass

    @abstractmethod
    def add_zone(self, zone_data):
        """Añade una nueva zona"""
        pass