from ....dao.interfaceSongDAO import InterfaceSongDAO
from ....dto.songDTO import SongDTO, SongsDTO


class FirebaseSongDAO(InterfaceSongDAO):

    def __init__(self, collection):
        self.collection = collection
    
    def get_songs(self):
        songs = SongsDTO()
        try:
            query = self.collection.stream()
            for doc in query:
                song_data = doc.to_dict()  # Convierte el documento a un diccionario
                
                # Crear un objeto SongDTO con los datos de la canción
                song_dto = SongDTO()
                song_dto.id = doc.id  # ID del documento en Firestore
                song_dto.title = song_data.get("title", "")
                song_dto.author = song_data.get("author", "")
                song_dto.album = song_data.get("album", "")
                song_dto.musicgenre = song_data.get("musicgenre", "")
                song_dto.duration = song_data.get("duration", 0)
                song_dto.price = song_data.get("price", 0.0)
                song_dto.rating = song_data.get("rating", 0)
                song_dto.release = song_data.get("release", "")
                # Transformar a JSON previo a append
                songs.insertSong(song_dto.songdto_to_dict())  # Agregar la canción a la lista
        except Exception as e:
            print(e)

        return songs.songlist_to_json()