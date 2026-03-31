import json

class ArtistaDTO:
    def __init__(self):
        self.id = None
        self.nombre = None
        self.descripcion = None
        self.genero = None
        self.imagen = None
        self.spotify_id = None
        self.preview_url = None
    
    def is_Empty(self):
        return self.id is None and self.nombre is None
    
    def get_id(self):
        return self.id
    def set_id(self, id):
        self.id = id
    
    def get_nombre(self):
        return self.nombre
    def set_nombre(self, nombre):
        self.nombre = nombre
    
    def get_descripcion(self):
        return self.descripcion
    def set_descripcion(self, descripcion):
        self.descripcion = descripcion
    
    def get_genero(self):
        return self.genero
    def set_genero(self, genero):
        self.genero = genero
    
    def get_imagen(self):
        return self.imagen
    def set_imagen(self, imagen):
        self.imagen = imagen
    
    def get_spotify_id(self):
        return self.spotify_id
    def set_spotify_id(self, spotify_id):
        self.spotify_id = spotify_id
    
    def get_preview_url(self):
        return self.preview_url
    def set_preview_url(self, preview_url):
        self.preview_url = preview_url
    
    def artistadto_to_dict(self):
        return {
            "id": self.get_id(),
            "nombre": self.get_nombre(),
            "descripcion": self.get_descripcion(),
            "genero": self.get_genero(),
            "imagen": self.get_imagen(),
            "spotify_id": self.get_spotify_id(),
            "preview_url": self.get_preview_url()
        }
    
    def artistadto_to_json(self):
        return json.dumps(self.artistadto_to_dict())