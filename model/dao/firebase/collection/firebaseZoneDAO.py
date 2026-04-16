from ....dao.interfaceZoneDAO import InterfaceZoneDAO
from ....dto.zoneDTO import ZoneDTO, ZonesDTO

class FirebaseZoneDAO(InterfaceZoneDAO):

    def __init__(self, collection):
        self.collection = collection

    def get_zones_by_event(self, event_id):
        zones = ZonesDTO()
        try:
            query = self.collection.where("evento_id", "==", event_id).stream()
            for doc in query:
                zone_data = doc.to_dict()
                zone_dto = ZoneDTO()
                zone_dto.set_id(doc.id)
                zone_dto.set_evento_id(zone_data.get("evento_id", ""))
                zone_dto.set_nombre(zone_data.get("nombre", ""))
                zone_dto.set_aforo_maximo(zone_data.get("aforo_maximo", 0))
                zone_dto.set_precio(zone_data.get("precio", 0))
                zone_dto.set_fecha_evento(zone_data.get("fecha_evento", ""))
                zones.insertZone(zone_dto.zonedto_to_dict())
        except Exception as e:
            print(f"Error en get_zones_by_event: {e}")
        return zones.zonelist_to_json()

    def get_zone_by_id(self, zone_id):
        try:
            doc = self.collection.document(zone_id).get()
            if doc.exists:
                zone_data = doc.to_dict()
                zone_dto = ZoneDTO()
                zone_dto.set_id(doc.id)
                zone_dto.set_evento_id(zone_data.get("evento_id", ""))
                zone_dto.set_nombre(zone_data.get("nombre", ""))
                zone_dto.set_aforo_maximo(zone_data.get("aforo_maximo", 0))
                zone_dto.set_precio(zone_data.get("precio", 0))
                zone_dto.set_fecha_evento(zone_data.get("fecha_evento", ""))
                return zone_dto.zonedto_to_dict()
            return None
        except Exception as e:
            print(f"Error en get_zone_by_id: {e}")
            return None

    def add_zone(self, zone_data):
        try:
            doc_ref = self.collection.document()
            zone_data["id"] = doc_ref.id
            doc_ref.set(zone_data)
            return {"id": doc_ref.id, "success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
