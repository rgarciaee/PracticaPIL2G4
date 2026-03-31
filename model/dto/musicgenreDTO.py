import json

class MusicGenresDTO ():
    def __init__(self):
        self.musicgenrelist = []

    def insertMusicGenre(self, elem):
        self.musicgenrelist.append(elem)

    def musicgenreslist_to_json(self):
        return json.dumps(self.musicgenrelist)



class MusicgenreDTO():
    def __init__(self):
        self.id = None
        self.description = None

    def is_Empty(self):
        return self.id is None and self.description is None

    def get_id(self):
        return self.id

    def set_id(self, id):
        self.id = id

    def get_description(self):
        return self.description  # Corregido

    def set_description(self, description):  # Corregido
        self.description = description

    def musicgenre_dto_to_dictionary(self):
        dict = {
            "id": self.id,
            "description": self.description
        }
        return dict
