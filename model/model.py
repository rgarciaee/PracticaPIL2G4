from .dao.firebase.firebaseDAOFactory import FirebaseDAOFactory
import json
from datetime import datetime
import random
import string


class Model():
    def __init__(self):
        self.factory = FirebaseDAOFactory()

        # DAOs existentes
        self.userDAO = self.factory.getUserDao()
        self.musicgenreDAO = self.factory.getMusicgenreDAO()
        self.songDAO = self.factory.getSongsDAO()

        # DAOs del festival
        self.eventDAO = self.factory.getEventDAO()
        self.artistDAO = self.factory.getArtistDAO()
        self.zoneDAO = self.factory.getZoneDAO()
        self.ticketDAO = self.factory.getTicketDAO()
        self.standDAO = self.factory.getStandDAO()
        self.userExtDAO = self.factory.getUserExtDAO()
        self.cartDAO = self.factory.getCartDAO()

    # ============================================================
    # MÉTODOS EXISTENTES
    # ============================================================

    def checking_user_token(self, token):
        user = self.userDAO.checking_user(token)

        if hasattr(user, 'userdto_to_json'):
            return user.userdto_to_json()

        return user

    def get_songs(self):
        return self.songDAO.get_songs()

    def get_musicgenres(self):
        return self.musicgenreDAO.get_musicgenres()

    # ============================================================
    # EVENTOS (CORREGIDO Y ROBUSTO)
    # ============================================================

    def get_all_events(self):
        try:
            events = json.loads(self.eventDAO.get_events())
            enriched_events = []

            for event in events:
                event_id = event.get("id")

                # Añadir artistas
                try:
                    event["artistas"] = json.loads(self.artistDAO.get_artists_by_event(event_id))
                except:
                    event["artistas"] = []

                # Añadir zonas
                try:
                    event["zonas"] = json.loads(self.zoneDAO.get_zones_by_event(event_id))
                except:
                    event["zonas"] = []

                # Añadir puestos
                try:
                    event["puestos"] = json.loads(self.standDAO.get_stands_by_event(event_id))
                except:
                    event["puestos"] = []

                enriched_events.append(event)

            return json.dumps(enriched_events)

        except Exception as e:
            print("Error get_all_events:", e)
            return json.dumps([])

    def get_event_by_id(self, event_id):
        try:
            event = self.eventDAO.get_event_by_id(event_id)

            if not event:
                return json.dumps(None)

            # Enriquecer igual que arriba
            try:
                event["artistas"] = json.loads(self.artistDAO.get_artists_by_event(event_id))
            except:
                event["artistas"] = []

            try:
                event["zonas"] = json.loads(self.zoneDAO.get_zones_by_event(event_id))
            except:
                event["zonas"] = []

            try:
                event["puestos"] = json.loads(self.standDAO.get_stands_by_event(event_id))
            except:
                event["puestos"] = []

            return json.dumps(event)

        except Exception as e:
            print("Error get_event_by_id:", e)
            return json.dumps(None)

    # ============================================================
    # COMPRA / CHECKOUT (CORREGIDO)
    # ============================================================

    def process_purchase(self, user_id, items, total):
        print(f"=== PROCESANDO COMPRA para usuario: {user_id} ===")
        print(f"Items: {items}")
        print(f"Total: {total}")
        
        try:
            purchased_tickets = []

            for item in items:
                cantidad = item.get("cantidad", 1)

                for _ in range(cantidad):
                    qr_code = self._generate_qr_code()

                    ticket_data = {
                        "usuario_id": user_id,
                        "evento_id": item.get("evento_id"),
                        "evento_nombre": item.get("evento_nombre"),
                        "zona_id": item.get("zona_id"),
                        "zona_nombre": item.get("zona_nombre"),
                        "precio": item.get("precio"),
                        "localizador_qr": qr_code,
                        "fecha_compra": datetime.now().strftime("%Y-%m-%d"),
                        "estado": "Activa"
                    }

                    print(f"Guardando ticket individual: {ticket_data}")

                    result = self.ticketDAO.add_ticket(ticket_data)

                    purchased_tickets.append({
                        "ticket_id": result.get("id"),
                        "qr": qr_code,
                        "evento_nombre": item.get("evento_nombre"),
                        "zona_nombre": item.get("zona_nombre")
                    })

            return {
                "success": True,
                "tickets": purchased_tickets,
                "total": total
            }

        except Exception as e:
            print(f"Error process_purchase: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}

    def get_user_history(self, user_id):
        try:
            history = self.ticketDAO.get_tickets_by_user(user_id)

            # Asegurar JSON correcto
            if isinstance(history, str):
                return history

            return json.dumps(history)

        except Exception as e:
            print("Error get_user_history:", e)
            return json.dumps([])

    def _generate_qr_code(self):
        prefix = "SUB"
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        return f"{prefix}-{random_part}"

    # ============================================================
    # PERFIL
    # ============================================================

    def get_user_profile(self, user_id):
        try:
            profile = self.userExtDAO.get_user_extended(user_id)

            if isinstance(profile, str):
                return json.loads(profile)

            return profile

        except Exception as e:
            print("Error get_user_profile:", e)
            return {}

    def update_user_profile(self, user_id, profile_data):
        try:
            return self.userExtDAO.update_user_extended(user_id, profile_data)
        except Exception as e:
            print("Error update_user_profile:", e)
            return {"success": False, "error": str(e)}

    # ============================================================
    # ZONAS / PROVEEDORES
    # ============================================================

    def get_all_zones(self):
        try:
            events = json.loads(self.get_all_events())
            all_zones = []

            for event in events:
                zones = event.get("zonas", [])

                for zone in zones:
                    zone["evento_nombre"] = event.get("nombre")
                    all_zones.append(zone)

            return json.dumps(all_zones)

        except Exception as e:
            print("Error get_all_zones:", e)
            return json.dumps([])

    def request_zone_rental(self, stand_id, user_id, request_data):
        try:
            return self.standDAO.request_stand_rental(stand_id, user_id, request_data)
        except Exception as e:
            print("Error request_zone_rental:", e)
            return {"success": False, "error": str(e)}

    # ============================================================
    # SEED (OPCIONAL)
    # ============================================================

    def seed_sample_data(self):
        import os

        yaml_path = os.path.join(
            os.path.dirname(__file__),
            "../view/templates/static/yaml/data.yaml"
        )

        try:
            import yaml
            with open(yaml_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
        except:
            print("No se pudo cargar el YAML")
            return

        for event in data.get("events", []):
            event_data = {
                "nombre": event.get("nombre"),
                "fecha_ini": event.get("fecha_inicio"),
                "fecha_fin": event.get("fecha_fin"),
                "descripcion": event.get("descripcion"),
                "imagen": event.get("imagen", "")
            }

            self.eventDAO.add_event(event_data)

    # ============================================================
    # MÉTODOS PARA CARRITO
    # ============================================================

    def get_cart(self, user_id):
        """Obtener carrito del usuario"""
        return self.cartDAO.get_cart(user_id)

    def add_to_cart(self, user_id, item):
        """Añadir item al carrito"""
        return self.cartDAO.add_item(user_id, item)

    def remove_from_cart(self, user_id, item_id):
        """Eliminar item del carrito"""
        return self.cartDAO.remove_item(user_id, item_id)

    def update_cart_item(self, user_id, item_id, quantity):
        """Actualizar cantidad de un item"""
        return self.cartDAO.update_quantity(user_id, item_id, quantity)

    def clear_cart(self, user_id):
        """Vaciar carrito"""
        return self.cartDAO.clear_cart(user_id)