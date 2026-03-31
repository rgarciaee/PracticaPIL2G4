from abc import ABC, abstractmethod

class InterfaceArtistDAO(ABC):

    @abstractmethod
    def get_artists_by_event(self, event_id):
        """Obtiene todos los artistas de un evento"""
        pass

    @abstractmethod
    def add_artist(self, artist_data):
        """Añade un nuevo artista"""
        pass