from ....dao.interfaceTicketDAO import InterfaceTicketDAO
from ....dto.ticketDTO import TicketDTO, TicketsDTO
from datetime import datetime

class FirebaseTicketDAO(InterfaceTicketDAO):

    def __init__(self, collection):
        self.collection = collection

    def get_tickets_by_user(self, user_id):
        tickets = TicketsDTO()
        try:
            query = self.collection.where("usuario_id", "==", user_id).stream()
            for doc in query:
                ticket_data = doc.to_dict()
                ticket_dto = TicketDTO()
                ticket_dto.set_id(doc.id)
                ticket_dto.set_usuario_id(ticket_data.get("usuario_id", ""))
                ticket_dto.set_zona_id(ticket_data.get("zona_id", ""))
                ticket_dto.set_localizador_qr(ticket_data.get("localizador_qr", ""))

                fecha_compra = ticket_data.get("fecha_compra", "")
                ticket_dto.set_fecha_compra(fecha_compra)
                
                fecha_evento = ticket_data.get("fecha_evento", "")
                ticket_dto.set_fecha_evento(fecha_evento)
                
                ticket_dto.set_estado(ticket_data.get("estado", "Activa"))
                ticket_dto.set_evento_nombre(ticket_data.get("evento_nombre", ""))
                ticket_dto.set_zona_nombre(ticket_data.get("zona_nombre", ""))
                ticket_dto.set_precio(ticket_data.get("precio", 0))
                tickets.insertTicket(ticket_dto.ticketdto_to_dict())
        except Exception as e:
            print(f"Error en get_tickets_by_user: {e}")
        return tickets.ticketlist_to_json()

    def add_ticket(self, ticket_data):
        try:
            doc_ref = self.collection.document()
            ticket_data["id"] = doc_ref.id
            doc_ref.set(ticket_data)
            print(f"Ticket guardado con ID: {doc_ref.id}")
            return {"id": doc_ref.id, "success": True}
        except Exception as e:
            print(f"Error en add_ticket: {e}")
            return {"success": False, "error": str(e)}

    def update_ticket_status(self, ticket_id, status):
        try:
            self.collection.document(ticket_id).update({"estado": status})
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_ticket_by_qr(self, qr_code):
        try:
            query = self.collection.where("localizador_qr", "==", qr_code).limit(1).stream()
            for doc in query:
                ticket_data = doc.to_dict()
                ticket_dto = TicketDTO()
                ticket_dto.set_id(doc.id)
                ticket_dto.set_usuario_id(ticket_data.get("usuario_id", ""))
                ticket_dto.set_zona_id(ticket_data.get("zona_id", ""))
                ticket_dto.set_localizador_qr(ticket_data.get("localizador_qr", ""))
                
                # CORRECCIÓN: fecha_compra ya es string
                fecha_compra = ticket_data.get("fecha_compra", "")
                ticket_dto.set_fecha_compra(fecha_compra)
                
                ticket_dto.set_estado(ticket_data.get("estado", "Activa"))
                ticket_dto.set_evento_nombre(ticket_data.get("evento_nombre", ""))
                ticket_dto.set_zona_nombre(ticket_data.get("zona_nombre", ""))
                ticket_dto.set_precio(ticket_data.get("precio", 0))
                return ticket_dto.ticketdto_to_dict()
            return None
        except Exception as e:
            print(f"Error en get_ticket_by_qr: {e}")
            return None