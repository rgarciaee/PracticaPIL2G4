import json

class ArtistsDTO():
    def __init__(self):
        self.artistlist = []

    def insertArtist(self, elem):
        self.artistlist.append(elem)

    def artistlist_to_json(self):
        return json.dumps(self.artistlist)

class ArtistDTO():
    def __init__(self):
        self.id = None
        self.nombre = None
        self.descripcion = None
        self.genero = None
        self.imagen = None
        self.evento_id = None

    def is_Empty(self):
        return (self.id is None and self.nombre is None and
                self.descripcion is None and self.genero is None and
                self.imagen is None and self.evento_id is None)

    def get_id(self): return self.id
    def set_id(self, id): self.id = id

    def get_nombre(self): return self.nombre
    def set_nombre(self, nombre): self.nombre = nombre

    def get_descripcion(self): return self.descripcion
    def set_descripcion(self, descripcion): self.descripcion = descripcion

    def get_genero(self): return self.genero
    def set_genero(self, genero): self.genero = genero

    def get_imagen(self): return self.imagen
    def set_imagen(self, imagen): self.imagen = imagen

    def get_evento_id(self): return self.evento_id
    def set_evento_id(self, evento_id): self.evento_id = evento_id

    def artistdto_to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "genero": self.genero,
            "imagen": self.imagen,
            "evento_id": self.evento_id
        }
