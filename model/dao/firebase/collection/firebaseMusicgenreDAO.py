from ....dao.interfaceMusicgenreDAO import InterfaceMusicgenreDAO
from ....dto.musicgenreDTO import MusicgenreDTO, MusicGenresDTO
import json

class FirebaseMusicgenreDAO(InterfaceMusicgenreDAO):

    def __init__(self, collection):
        self.collection = collection
    
    def get_musicgenres(self):
        musicgenres = MusicGenresDTO()
        try:
            query = self.collection.stream()  # Obtiene todos los documentos

            for doc in query:
                musicgenre_data = doc.to_dict()  # Convierte el documento a un diccionario
                # Crear un objeto SongDTO con los datos de la canción
                musicgenre_dto = MusicgenreDTO()
                musicgenre_dto.set_id(musicgenre_data.get("id",""))  # ID del documento en Firestore
                musicgenre_dto.set_description(musicgenre_data.get("description",""))
                musicgenres.insertMusicGenre(musicgenre_dto.musicgenre_dto_to_dictionary())
        except Exception as e:
            print(e)


        return musicgenres.musicgenreslist_to_json()