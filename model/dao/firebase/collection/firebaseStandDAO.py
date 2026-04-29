from ....dao.interfaceStandDAO import InterfaceStandDAO
from ....dto.standDTO import StandDTO, StandsDTO

class FirebaseStandDAO(InterfaceStandDAO):

    def __init__(self, collection):
        self.collection = collection

    def get_stands_by_event(self, event_id):
        stands = StandsDTO()
        try:
            query = self.collection.where("evento_id", "==", event_id).stream()
            for doc in query:
                stand_data = doc.to_dict()
                stand_dto = StandDTO()
                stand_dto.set_id(doc.id)
                stand_dto.set_evento_id(stand_data.get("evento_id", ""))
                stand_dto.set_zona_id(stand_data.get("zona_id", ""))
                stand_dto.set_precio_alquiler(stand_data.get("precio_alquiler", 0))
                stand_dto.set_dimension_m2(stand_data.get("dimension_m2", 0))
                stand_dto.set_horario(stand_data.get("horario", ""))
                stand_dto.set_tipo(stand_data.get("tipo", ""))
                stand_dto.set_nombre(stand_data.get("nombre", ""))
                stands.insertStand(stand_dto.standdto_to_dict())
        except Exception as e:
            print(f"Error en get_stands_by_event: {e}")
        return stands.standlist_to_json()

    def get_stands_available(self, event_id):
        stands = StandsDTO()
        try:
            query = self.collection.where("evento_id", "==", event_id).stream()
            for doc in query:
                stand_data = doc.to_dict()
                stand_dto = StandDTO()
                stand_dto.set_id(doc.id)
                stand_dto.set_evento_id(stand_data.get("evento_id", ""))
                stand_dto.set_zona_id(stand_data.get("zona_id", ""))
                stand_dto.set_precio_alquiler(stand_data.get("precio_alquiler", 0))
                stand_dto.set_dimension_m2(stand_data.get("dimension_m2", 0))
                stand_dto.set_horario(stand_data.get("horario", ""))
                stand_dto.set_tipo(stand_data.get("tipo", ""))
                stand_dto.set_nombre(stand_data.get("nombre", ""))
                stands.insertStand(stand_dto.standdto_to_dict())
        except Exception as e:
            print(f"Error en get_stands_available: {e}")
        return stands.standlist_to_json()

    def request_stand_rental(self, stand_id, user_id, request_data):
        try:
            return {"success": True, "message": "Solicitud enviada correctamente"}
        except Exception as e:
            return {"success": False, "error": str(e)}
