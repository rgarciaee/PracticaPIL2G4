from ....dao.interfaceArtistDAO import InterfaceArtistDAO
from ....dto.artistDTO import ArtistDTO, ArtistsDTO

class FirebaseArtistDAO(InterfaceArtistDAO):

    def __init__(self, collection):
        self.collection = collection

    def get_artists_by_event(self, event_id):
        artists = ArtistsDTO()
        try:
            query = self.collection.where("evento_id", "==", event_id).stream()
            for doc in query:
                artist_data = doc.to_dict()
                artist_dto = ArtistDTO()
                artist_dto.set_id(doc.id)
                artist_dto.set_nombre(artist_data.get("nombre", ""))
                artist_dto.set_descripcion(artist_data.get("descripcion", ""))
                artist_dto.set_genero(artist_data.get("genero", ""))
                artist_dto.set_imagen(artist_data.get("imagen", ""))
                artist_dto.set_evento_id(artist_data.get("evento_id", ""))
                artists.insertArtist(artist_dto.artistdto_to_dict())
        except Exception as e:
            print(f"Error en get_artists_by_event: {e}")
        return artists.artistlist_to_json()

    def add_artist(self, artist_data):
        try:
            doc_ref = self.collection.document()
            artist_data["id"] = doc_ref.id
            doc_ref.set(artist_data)
            return {"id": doc_ref.id, "success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}