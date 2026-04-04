from ....dao.interfaceEventDAO import InterfaceEventDAO
from ....dto.eventDTO import EventDTO, EventsDTO

class FirebaseEventDAO(InterfaceEventDAO):

    def __init__(self, collection):
        self.collection = collection

    def get_events(self):
        events = EventsDTO()
        try:
            query = self.collection.stream()
            for doc in query:
                event_data = doc.to_dict()
                event_dto = EventDTO()
                event_dto.set_id(doc.id)
                event_dto.set_nombre(event_data.get("nombre", ""))
                event_dto.set_imagen(event_data.get("imagen", ""))
                event_dto.set_descripcion(event_data.get("descripcion", ""))
                event_dto.set_fecha_ini(event_data.get("fecha_inicio", ""))
                event_dto.set_fecha_fin(event_data.get("fecha_fin", ""))
                event_dto.set_ubicacion(event_data.get("ubicacion", {}))  # NUEVO CAMPO
                events.insertEvent(event_dto.eventdto_to_dict())
        except Exception as e:
            print(f"Error en get_events: {e}")
        return events.eventlist_to_json()

    def get_event_by_id(self, event_id):
        try:
            doc = self.collection.document(event_id).get()
            if doc.exists:
                event_data = doc.to_dict()
                event_dto = EventDTO()
                event_dto.set_id(doc.id)
                event_dto.set_nombre(event_data.get("nombre", ""))
                event_dto.set_imagen(event_data.get("imagen", ""))
                event_dto.set_descripcion(event_data.get("descripcion", ""))
                event_dto.set_fecha_ini(event_data.get("fecha_inicio", ""))
                event_dto.set_fecha_fin(event_data.get("fecha_fin", ""))
                event_dto.set_ubicacion(event_data.get("ubicacion", {}))  # NUEVO CAMPO
                return event_dto.eventdto_to_dict()
            return None
        except Exception as e:
            print(f"Error en get_event_by_id: {e}")
            return None

    def add_event(self, event_data):
        try:
            doc_ref = self.collection.document()
            event_data["id"] = doc_ref.id
            doc_ref.set(event_data)
            return {"id": doc_ref.id, "success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def update_event(self, event_id, event_data):
        try:
            self.collection.document(event_id).update(event_data)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_event(self, event_id):
        try:
            self.collection.document(event_id).delete()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}