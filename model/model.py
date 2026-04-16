from datetime import datetime, timedelta
import json
import random
import string

from firebase_admin import auth, firestore

from .dao.firebase.firebaseDAOFactory import FirebaseDAOFactory


class Model:
    PROFILE_REQUIRED_FIELDS = {
        "dni": "DNI",
        "nombre_apellidos": "Nombre y apellidos",
        "fecha_nacimiento": "Fecha de nacimiento",
        "email": "Correo electronico",
        "telefono": "Telefono",
        "direccion": "Direccion",
        "num_tarjeta": "Numero de tarjeta",
    }

    def __init__(self):
        self.factory = FirebaseDAOFactory()
        self.db = self.factory.connector.get_db()
        self.userDAO = self.factory.getUserDao()
        self.eventDAO = self.factory.getEventDAO()
        self.artistDAO = self.factory.getArtistDAO()
        self.zoneDAO = self.factory.getZoneDAO()
        self.ticketDAO = self.factory.getTicketDAO()
        self.standDAO = self.factory.getStandDAO()
        self.userExtDAO = self.factory.getUserExtDAO()
        self.cartDAO = self.factory.getCartDAO()

    def checking_user_token(self, token):
        user = self.userDAO.checking_user(token)

        if hasattr(user, "userdto_to_json"):
            return user.userdto_to_json()

        return user

    def get_user_role(self, user_id):
        try:
            user_doc = self.db.collection("users").document(user_id).get()
            if user_doc.exists:
                role = str(user_doc.to_dict().get("role", "")).strip().lower()
                if role:
                    return role

            user_ext_doc = self.db.collection("users_extended").document(user_id).get()
            if user_ext_doc.exists:
                role = str(user_ext_doc.to_dict().get("rol_asignado", "")).strip().lower()
                if role:
                    return role
        except Exception as e:
            print("Error get_user_role:", e)

        return "user"

    def get_all_events(self):
        try:
            events = json.loads(self.eventDAO.get_events())
            enriched_events = []

            for event in events:
                event_id = event.get("id")

                try:
                    event["artistas"] = json.loads(
                        self.artistDAO.get_artists_by_event(event_id)
                    )
                except Exception:
                    event["artistas"] = []

                event["horario"] = self._ensure_event_schedule(event_id, event)

                try:
                    event["zonas"] = json.loads(self.zoneDAO.get_zones_by_event(event_id))
                    for zone in event["zonas"]:
                        if not zone.get("fecha_evento"):
                            zone["fecha_evento"] = event.get("fecha_ini", "")
                except Exception:
                    event["zonas"] = []

                try:
                    event["puestos"] = json.loads(
                        self.standDAO.get_stands_by_event(event_id)
                    )
                except Exception:
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

            try:
                event["artistas"] = json.loads(
                    self.artistDAO.get_artists_by_event(event_id)
                )
            except Exception:
                event["artistas"] = []

            event["horario"] = self._ensure_event_schedule(event_id, event)

            try:
                event["zonas"] = json.loads(self.zoneDAO.get_zones_by_event(event_id))
                for zone in event["zonas"]:
                    if not zone.get("fecha_evento"):
                        zone["fecha_evento"] = event.get("fecha_ini", "")
            except Exception:
                event["zonas"] = []

            try:
                event["puestos"] = json.loads(
                    self.standDAO.get_stands_by_event(event_id)
                )
            except Exception:
                event["puestos"] = []

            return json.dumps(event)

        except Exception as e:
            print("Error get_event_by_id:", e)
            return json.dumps(None)

    def process_purchase(self, user_id, items, total):
        print(f"=== PROCESANDO COMPRA para usuario: {user_id} ===")
        print(f"Items: {items}")
        print(f"Total: {total}")

        try:
            user_role = self.get_user_role(user_id)
            purchased_tickets = []

            for item in items:
                item_type = item.get("item_category", "ticket")

                if item_type == "provider_rental":
                    if user_role != "provider":
                        return {
                            "success": False,
                            "error": "Solo los proveedores pueden completar alquileres de zonas",
                            "code": "PROVIDER_ONLY",
                        }

                    rental_entry = self._build_provider_rental_entry(user_id, item)
                    result = self.ticketDAO.add_ticket(rental_entry)

                    purchased_tickets.append(
                        {
                            "ticket_id": result.get("id"),
                            "qr": rental_entry["localizador_qr"],
                            "evento_nombre": item.get("evento_nombre"),
                            "zona_nombre": item.get("zona_nombre"),
                            "fecha_evento": item.get("fecha_evento", ""),
                            "detalle_tipo": rental_entry["detalle_tipo"],
                        }
                    )
                    continue

                cantidad = item.get("cantidad", 1)
                fecha_evento = item.get("fecha_evento", "")

                if not fecha_evento and item.get("evento_id"):
                    try:
                        evento = self.get_event_by_id(item.get("evento_id"))
                        if evento:
                            evento_data = json.loads(evento)
                            fecha_evento = evento_data.get("fecha_ini", "")
                    except Exception:
                        pass

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
                        "fecha_evento": fecha_evento,
                        "estado": "Activa",
                        "detalle_tipo": "Entrada",
                    }

                    print(f"Guardando ticket individual: {ticket_data}")

                    result = self.ticketDAO.add_ticket(ticket_data)

                    purchased_tickets.append(
                        {
                            "ticket_id": result.get("id"),
                            "qr": qr_code,
                            "evento_nombre": item.get("evento_nombre"),
                            "zona_nombre": item.get("zona_nombre"),
                            "fecha_evento": fecha_evento,
                            "detalle_tipo": "Entrada",
                        }
                    )

            return {
                "success": True,
                "tickets": purchased_tickets,
                "total": total,
            }

        except Exception as e:
            print(f"Error process_purchase: {e}")
            import traceback

            traceback.print_exc()
            return {"success": False, "error": str(e)}

    def get_user_history(self, user_id):
        try:
            tickets_history = self.ticketDAO.get_tickets_by_user(user_id)
            if isinstance(tickets_history, str):
                tickets_history = json.loads(tickets_history)

            tickets_history.sort(
                key=lambda item: str(item.get("fecha_compra", "")),
                reverse=True,
            )

            return json.dumps(tickets_history)

        except Exception as e:
            print("Error get_user_history:", e)
            return json.dumps([])

    def _generate_qr_code(self):
        prefix = "SUB"
        random_part = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=8)
        )
        return f"{prefix}-{random_part}"

    def get_user_profile(self, user_id):
        try:
            profile = self.userExtDAO.get_user_extended(user_id)

            if isinstance(profile, str):
                profile = json.loads(profile)

            if profile and "avatar_url" not in profile:
                profile["avatar_url"] = ""

            return profile

        except Exception as e:
            print("Error get_user_profile:", e)
            return {}

    def update_user_profile(self, user_id, profile_data):
        try:
            result = self.userExtDAO.update_user_extended(user_id, profile_data)
            if not result.get("success"):
                return result

            users_payload = {}
            if "email" in profile_data:
                users_payload["email"] = profile_data.get("email", "")

            if users_payload:
                self.db.collection("users").document(user_id).set(users_payload, merge=True)

            return result
        except Exception as e:
            print("Error update_user_profile:", e)
            return {"success": False, "error": str(e)}

    def get_profile_completion_status(self, user_id):
        profile = self.get_user_profile(user_id) or {}
        missing_fields = []

        for field_name, label in self.PROFILE_REQUIRED_FIELDS.items():
            value = profile.get(field_name)
            if value is None or str(value).strip() == "":
                missing_fields.append({"field": field_name, "label": label})

        return {
            "complete": len(missing_fields) == 0,
            "missing_fields": missing_fields,
        }

    def get_all_zones(self):
        try:
            events = json.loads(self.get_all_events())
            all_zones = []

            for event in events:
                zones = event.get("zonas", [])

                for zone in zones:
                    zone["evento_nombre"] = event.get("nombre")
                    if not zone.get("fecha_evento"):
                        zone["fecha_evento"] = event.get("fecha_ini", "")
                    all_zones.append(zone)

            return json.dumps(all_zones)

        except Exception as e:
            print("Error get_all_zones:", e)
            return json.dumps([])

    def _build_provider_rental_entry(self, user_id, item, request_data=None):
        qr_code = self._generate_custom_locator("PRV")
        return {
            "usuario_id": user_id,
            "evento_id": item.get("evento_id"),
            "evento_nombre": item.get("evento_nombre"),
            "zona_id": item.get("zona_id"),
            "zona_nombre": item.get("zona_nombre"),
            "precio": item.get("precio", 0),
            "localizador_qr": qr_code,
            "fecha_compra": datetime.now().strftime("%Y-%m-%d"),
            "fecha_evento": item.get("fecha_evento", ""),
            "estado": "Solicitud enviada",
            "detalle_tipo": "Alquiler de zona",
        }

    def _generate_custom_locator(self, prefix):
        random_part = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=8)
        )
        return f"{prefix}-{random_part}"

    def _get_zone_summary(self, zone_id):
        zone = self._get_doc("zones", zone_id)
        if not zone:
            return None

        event = self._get_doc("events", zone.get("evento_id", ""))
        return {
            "id": zone.get("id"),
            "nombre": zone.get("nombre", ""),
            "precio": zone.get("precio", 0),
            "aforo_maximo": zone.get("aforo_maximo", 0),
            "evento_id": zone.get("evento_id", ""),
            "evento_nombre": (event or {}).get("nombre", ""),
            "fecha_evento": zone.get("fecha_evento") or (event or {}).get("fecha_ini", ""),
        }

    def request_zone_rental(self, zone_id, user_id, request_data):
        try:
            if self.get_user_role(user_id) != "provider":
                return {
                    "success": False,
                    "error": "Solo los proveedores pueden solicitar alquileres",
                    "code": "PROVIDER_ONLY",
                }

            zone = self._get_zone_summary(zone_id)
            if not zone:
                return {"success": False, "error": "Zona no encontrada"}

            rental_entry = self._build_provider_rental_entry(
                user_id,
                {
                    "zona_id": zone["id"],
                    "zona_nombre": zone["nombre"],
                    "precio": zone["precio"],
                    "evento_id": zone["evento_id"],
                    "evento_nombre": zone["evento_nombre"],
                    "fecha_evento": zone["fecha_evento"],
                },
                request_data,
            )

            result = self.ticketDAO.add_ticket(rental_entry)
            return {
                "success": result.get("success", False),
                "id": result.get("id"),
                "message": "Solicitud enviada correctamente",
            }
        except Exception as e:
            print("Error request_zone_rental:", e)
            return {"success": False, "error": str(e)}

    def seed_sample_data(self):
        import os

        yaml_path = os.path.join(
            os.path.dirname(__file__),
            "../view/templates/static/yaml/data.yaml",
        )

        try:
            import yaml

            with open(yaml_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
        except Exception:
            print("No se pudo cargar el YAML")
            return

        for event in data.get("events", []):
            event_data = {
                "nombre": event.get("nombre"),
                "fecha_inicio": event.get("fecha_inicio"),
                "fecha_fin": event.get("fecha_fin"),
                "descripcion": event.get("descripcion"),
                "imagen": event.get("imagen", ""),
                "ubicacion": event.get("ubicacion", {}),
            }

            self.eventDAO.add_event(event_data)

    def get_cart(self, user_id):
        return self.cartDAO.get_cart(user_id)

    def add_to_cart(self, user_id, item):
        item_type = item.get("item_category", "ticket")
        user_role = self.get_user_role(user_id)

        if item_type == "provider_rental":
            if user_role != "provider":
                return {
                    "success": False,
                    "error": "Solo los proveedores pueden anadir alquileres de zona al carrito",
                    "code": "PROVIDER_ONLY",
                }

            zone = self._get_zone_summary(item.get("zona_id", ""))
            if not zone:
                return {"success": False, "error": "La zona seleccionada no existe"}

            item = {
                "id": f"provider_rental_{zone['id']}",
                "nombre": f"Alquiler - {zone['nombre']}",
                "precio": zone["precio"],
                "cantidad": 1,
                "tipo": "Alquiler proveedor",
                "item_category": "provider_rental",
                "zona_id": zone["id"],
                "zona_nombre": zone["nombre"],
                "evento_id": zone["evento_id"],
                "evento_nombre": zone["evento_nombre"],
                "fecha_evento": zone["fecha_evento"],
            }

        return self.cartDAO.add_item(user_id, item)

    def remove_from_cart(self, user_id, item_id):
        return self.cartDAO.remove_item(user_id, item_id)

    def update_cart_item(self, user_id, item_id, quantity):
        cart = self.cartDAO.get_cart(user_id)
        current_item = next((item for item in cart.items if item.get("id") == item_id), None)
        if current_item and current_item.get("item_category") == "provider_rental":
            quantity = 1 if quantity > 0 else 0
        return self.cartDAO.update_quantity(user_id, item_id, quantity)

    def clear_cart(self, user_id):
        return self.cartDAO.clear_cart(user_id)

    def _collection_docs(self, collection_name):
        docs = []
        for doc in self.db.collection(collection_name).stream():
            data = doc.to_dict() or {}
            if "id" not in data:
                data["id"] = doc.id
            docs.append(data)
        return docs

    def _get_doc(self, collection_name, doc_id):
        doc = self.db.collection(collection_name).document(doc_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict() or {}
        if "id" not in data:
            data["id"] = doc.id
        return data

    def _doc_exists(self, collection_name, doc_id):
        return self.db.collection(collection_name).document(doc_id).get().exists

    def _delete_where(self, collection_name, field_name, value):
        for doc in self.db.collection(collection_name).where(field_name, "==", value).stream():
            doc.reference.delete()

    def _sanitize_event_data(self, event_data):
        ubicacion = event_data.get("ubicacion") or {}
        return {
            "nombre": event_data.get("nombre", "").strip(),
            "imagen": event_data.get("imagen", "").strip(),
            "descripcion": event_data.get("descripcion", "").strip(),
            "fecha_inicio": event_data.get("fecha_ini", event_data.get("fecha_inicio", "")),
            "fecha_fin": event_data.get("fecha_fin", ""),
            "horario": self._sanitize_event_schedule(event_data.get("horario", []), event_data),
            "ubicacion": {
                "nombre": ubicacion.get("nombre", "").strip(),
                "ciudad": ubicacion.get("ciudad", "").strip(),
                "direccion": ubicacion.get("direccion", "").strip(),
                "lat": ubicacion.get("lat"),
                "lng": ubicacion.get("lng"),
            },
        }

    def _validate_event_data(self, event_data):
        if not event_data.get("nombre"):
            return "El nombre del evento es obligatorio"
        if not event_data.get("fecha_inicio"):
            return "La fecha de inicio es obligatoria"
        if not event_data.get("fecha_fin"):
            return "La fecha de fin es obligatoria"
        return None

    def _sanitize_artist_data(self, artist_data):
        return {
            "nombre": artist_data.get("nombre", "").strip(),
            "descripcion": artist_data.get("descripcion", "").strip(),
            "genero": artist_data.get("genero", "").strip(),
            "imagen": artist_data.get("imagen", "").strip(),
            "evento_id": artist_data.get("evento_id", "").strip(),
        }

    def _sanitize_zone_data(self, zone_data):
        event_id = zone_data.get("evento_id", "").strip()
        event = self._get_doc("events", event_id) if event_id else None
        return {
            "evento_id": event_id,
            "nombre": zone_data.get("nombre", "").strip(),
            "aforo_maximo": int(zone_data.get("aforo_maximo", 0) or 0),
            "precio": float(zone_data.get("precio", 0) or 0),
            "fecha_evento": zone_data.get("fecha_evento", "") or (event or {}).get("fecha_ini", ""),
        }

    def _sanitize_stand_data(self, stand_data):
        return {
            "evento_id": stand_data.get("evento_id", "").strip(),
            "zona_id": stand_data.get("zona_id", "").strip(),
            "nombre": stand_data.get("nombre", "").strip(),
            "tipo": stand_data.get("tipo", "").strip(),
            "precio_alquiler": float(stand_data.get("precio_alquiler", 0) or 0),
            "dimension_m2": float(stand_data.get("dimension_m2", 0) or 0),
            "horario": stand_data.get("horario", "").strip(),
        }

    def get_admin_dashboard_data(self):
        try:
            users = self.get_all_users_admin()
            events = json.loads(self.get_all_events())
            artists = self.get_all_artists_admin()
            zones = self.get_all_zones_admin()
            stands = self.get_all_stands_admin()

            return {
                "success": True,
                "data": {
                    "users": users,
                    "events": events,
                    "artists": artists,
                    "zones": zones,
                    "stands": stands,
                },
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_all_users_admin(self):
        users_docs = self._collection_docs("users")
        extended_docs = {
            doc["id"]: doc for doc in self._collection_docs("users_extended")
        }

        users = []
        for user in users_docs:
            ext = extended_docs.get(user.get("user_id") or user.get("id"), {})
            users.append(
                {
                    "id": user.get("user_id") or user.get("id"),
                    "email": user.get("email", ext.get("email", "")),
                    "role": user.get("role", ext.get("rol_asignado", "user")),
                    "created_at": user.get("created_at", ""),
                    "nombre_apellidos": ext.get("nombre_apellidos", ""),
                    "telefono": ext.get("telefono", ""),
                    "direccion": ext.get("direccion", ""),
                    "dni": ext.get("dni", ""),
                    "fecha_nacimiento": ext.get("fecha_nacimiento", ""),
                    "avatar_url": ext.get("avatar_url", ""),
                }
            )

        users.sort(key=lambda item: (item.get("nombre_apellidos") or item.get("email") or "").lower())
        return users

    def create_user_admin(self, user_data):
        try:
            email = str(user_data.get("email", "")).strip()
            password = str(user_data.get("password", "")).strip()
            role = str(user_data.get("role", "user")).strip().lower() or "user"
            full_name = str(user_data.get("nombre_apellidos", "")).strip()

            if not email:
                return {"success": False, "error": "El email es obligatorio"}
            if not password or len(password) < 6:
                return {"success": False, "error": "La contrasena debe tener al menos 6 caracteres"}

            auth_user = auth.create_user(
                email=email,
                password=password,
                display_name=full_name or None,
            )

            create_data = {
                "user_id": auth_user.uid,
                "email": email,
                "role": role,
                "created_at": datetime.now().isoformat(),
            }
            self.db.collection("users").document(auth_user.uid).set(create_data)

            ext_data = {
                "dni": user_data.get("dni", ""),
                "nombre_apellidos": full_name,
                "fecha_nacimiento": user_data.get("fecha_nacimiento", ""),
                "num_tarjeta": user_data.get("num_tarjeta", ""),
                "direccion": user_data.get("direccion", ""),
                "email": email,
                "telefono": user_data.get("telefono", ""),
                "rol_asignado": role,
                "avatar_url": user_data.get("avatar_url", ""),
                "preferencias": user_data.get(
                    "preferencias",
                    {
                        "notificaciones_email": True,
                        "notificaciones_sms": False,
                        "idioma": "es",
                    },
                ),
            }
            self.db.collection("users_extended").document(auth_user.uid).set(ext_data)

            return {"success": True, "id": auth_user.uid}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def update_user_admin(self, user_id, user_data):
        try:
            if not self._doc_exists("users", user_id):
                return {"success": False, "error": "Usuario no encontrado"}

            email = str(user_data.get("email", "")).strip()
            role = str(user_data.get("role", "user")).strip().lower() or "user"
            password = str(user_data.get("password", "") or "").strip()

            auth_payload = {}
            if email:
                auth_payload["email"] = email
            display_name = str(user_data.get("nombre_apellidos", "")).strip()
            if display_name:
                auth_payload["display_name"] = display_name
            if password:
                if len(password) < 6:
                    return {"success": False, "error": "La contrasena debe tener al menos 6 caracteres"}
                auth_payload["password"] = password

            if auth_payload:
                auth.update_user(user_id, **auth_payload)

            users_payload = {
                "email": email,
                "role": role,
            }
            self.db.collection("users").document(user_id).set(users_payload, merge=True)

            ext_payload = {
                "email": email,
                "rol_asignado": role,
                "dni": user_data.get("dni", ""),
                "nombre_apellidos": display_name,
                "fecha_nacimiento": user_data.get("fecha_nacimiento", ""),
                "num_tarjeta": user_data.get("num_tarjeta", ""),
                "direccion": user_data.get("direccion", ""),
                "telefono": user_data.get("telefono", ""),
                "avatar_url": user_data.get("avatar_url", ""),
            }

            if "preferencias" in user_data:
                ext_payload["preferencias"] = user_data.get("preferencias", {})

            self.db.collection("users_extended").document(user_id).set(ext_payload, merge=True)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_user_admin(self, user_id):
        try:
            if not self._doc_exists("users", user_id):
                return {"success": False, "error": "Usuario no encontrado"}

            self.db.collection("users").document(user_id).delete()
            self.db.collection("users_extended").document(user_id).delete()
            self.db.collection("carts").document(user_id).delete()
            auth.delete_user(user_id)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def create_event_admin(self, event_data):
        try:
            payload = self._sanitize_event_data(event_data)
            error = self._validate_event_data(payload)
            if error:
                return {"success": False, "error": error}
            return self.eventDAO.add_event(payload)
        except Exception as e:
            return {"success": False, "error": str(e)}

    def update_event_admin(self, event_id, event_data):
        try:
            if not self._doc_exists("events", event_id):
                return {"success": False, "error": "Evento no encontrado"}
            payload = self._sanitize_event_data(event_data)
            error = self._validate_event_data(payload)
            if error:
                return {"success": False, "error": error}
            result = self.eventDAO.update_event(event_id, payload)
            if result.get("success"):
                for zone_doc in self.db.collection("zones").where("evento_id", "==", event_id).stream():
                    zone_doc.reference.set({"fecha_evento": payload.get("fecha_inicio", "")}, merge=True)
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_event_admin(self, event_id):
        try:
            if not self._doc_exists("events", event_id):
                return {"success": False, "error": "Evento no encontrado"}

            self._delete_where("artists", "evento_id", event_id)

            zone_ids = []
            for zone_doc in self.db.collection("zones").where("evento_id", "==", event_id).stream():
                zone_ids.append(zone_doc.id)
                zone_doc.reference.delete()

            for zone_id in zone_ids:
                self._delete_where("stands", "zona_id", zone_id)

            self._delete_where("stands", "evento_id", event_id)
            return self.eventDAO.delete_event(event_id)
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_all_artists_admin(self):
        artists = self._collection_docs("artists")
        events = {event["id"]: event for event in json.loads(self.get_all_events())}

        for artist in artists:
            artist.pop("horario", None)
            event = events.get(artist.get("evento_id"), {})
            artist["evento_nombre"] = event.get("nombre", "")

        artists.sort(key=lambda item: (item.get("nombre") or "").lower())
        return artists

    def create_artist_admin(self, artist_data):
        try:
            payload = self._sanitize_artist_data(artist_data)
            if not payload.get("nombre"):
                return {"success": False, "error": "El nombre del artista es obligatorio"}
            if not payload.get("evento_id"):
                return {"success": False, "error": "El evento es obligatorio"}
            if not self._doc_exists("events", payload["evento_id"]):
                return {"success": False, "error": "El evento seleccionado no existe"}
            return self.artistDAO.add_artist(payload)
        except Exception as e:
            return {"success": False, "error": str(e)}

    def update_artist_admin(self, artist_id, artist_data):
        try:
            if not self._doc_exists("artists", artist_id):
                return {"success": False, "error": "Artista no encontrado"}
            payload = self._sanitize_artist_data(artist_data)
            if not payload.get("nombre"):
                return {"success": False, "error": "El nombre del artista es obligatorio"}
            if not payload.get("evento_id"):
                return {"success": False, "error": "El evento es obligatorio"}
            if not self._doc_exists("events", payload["evento_id"]):
                return {"success": False, "error": "El evento seleccionado no existe"}
            payload["horario"] = firestore.DELETE_FIELD
            self.db.collection("artists").document(artist_id).set(payload, merge=True)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_artist_admin(self, artist_id):
        try:
            if not self._doc_exists("artists", artist_id):
                return {"success": False, "error": "Artista no encontrado"}
            self.db.collection("artists").document(artist_id).delete()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_all_zones_admin(self):
        zones = self._collection_docs("zones")
        events = {event["id"]: event for event in json.loads(self.get_all_events())}

        for zone in zones:
            event = events.get(zone.get("evento_id"), {})
            zone["evento_nombre"] = event.get("nombre", "")
            if not zone.get("fecha_evento"):
                zone["fecha_evento"] = event.get("fecha_ini", "")

        zones.sort(key=lambda item: ((item.get("evento_nombre") or "") + (item.get("nombre") or "")).lower())
        return zones

    def create_zone_admin(self, zone_data):
        try:
            payload = self._sanitize_zone_data(zone_data)
            if not payload.get("nombre"):
                return {"success": False, "error": "El nombre de la zona es obligatorio"}
            if not payload.get("evento_id"):
                return {"success": False, "error": "El evento es obligatorio"}
            if not self._doc_exists("events", payload["evento_id"]):
                return {"success": False, "error": "El evento seleccionado no existe"}
            return self.zoneDAO.add_zone(payload)
        except Exception as e:
            return {"success": False, "error": str(e)}

    def update_zone_admin(self, zone_id, zone_data):
        try:
            if not self._doc_exists("zones", zone_id):
                return {"success": False, "error": "Zona no encontrada"}
            payload = self._sanitize_zone_data(zone_data)
            if not payload.get("nombre"):
                return {"success": False, "error": "El nombre de la zona es obligatorio"}
            if not payload.get("evento_id"):
                return {"success": False, "error": "El evento es obligatorio"}
            if not self._doc_exists("events", payload["evento_id"]):
                return {"success": False, "error": "El evento seleccionado no existe"}

            self.db.collection("zones").document(zone_id).set(payload, merge=True)

            for stand_doc in self.db.collection("stands").where("zona_id", "==", zone_id).stream():
                stand_doc.reference.set({"evento_id": payload["evento_id"]}, merge=True)

            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_zone_admin(self, zone_id):
        try:
            if not self._doc_exists("zones", zone_id):
                return {"success": False, "error": "Zona no encontrada"}

            self._delete_where("stands", "zona_id", zone_id)
            self.db.collection("zones").document(zone_id).delete()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_all_stands_admin(self):
        stands = self._collection_docs("stands")
        events = {event["id"]: event for event in json.loads(self.get_all_events())}
        zones = {zone["id"]: zone for zone in self.get_all_zones_admin()}

        for stand in stands:
            event = events.get(stand.get("evento_id"), {})
            zone = zones.get(stand.get("zona_id"), {})
            stand["evento_nombre"] = event.get("nombre", "")
            stand["zona_nombre"] = zone.get("nombre", "")

        stands.sort(key=lambda item: ((item.get("evento_nombre") or "") + (item.get("nombre") or "")).lower())
        return stands

    def create_stand_admin(self, stand_data):
        try:
            payload = self._sanitize_stand_data(stand_data)
            if not payload.get("nombre"):
                return {"success": False, "error": "El nombre del stand es obligatorio"}
            if not payload.get("evento_id"):
                return {"success": False, "error": "El evento es obligatorio"}
            if not payload.get("zona_id"):
                return {"success": False, "error": "La zona es obligatoria"}
            if not self._doc_exists("events", payload["evento_id"]):
                return {"success": False, "error": "El evento seleccionado no existe"}
            zone = self._get_doc("zones", payload["zona_id"])
            if not zone:
                return {"success": False, "error": "La zona seleccionada no existe"}
            if zone.get("evento_id") != payload["evento_id"]:
                return {"success": False, "error": "La zona no pertenece al evento seleccionado"}

            doc_ref = self.db.collection("stands").document()
            payload["id"] = doc_ref.id
            doc_ref.set(payload)
            return {"success": True, "id": doc_ref.id}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def update_stand_admin(self, stand_id, stand_data):
        try:
            if not self._doc_exists("stands", stand_id):
                return {"success": False, "error": "Stand no encontrado"}
            payload = self._sanitize_stand_data(stand_data)
            if not payload.get("nombre"):
                return {"success": False, "error": "El nombre del stand es obligatorio"}
            if not payload.get("evento_id"):
                return {"success": False, "error": "El evento es obligatorio"}
            if not payload.get("zona_id"):
                return {"success": False, "error": "La zona es obligatoria"}
            if not self._doc_exists("events", payload["evento_id"]):
                return {"success": False, "error": "El evento seleccionado no existe"}
            zone = self._get_doc("zones", payload["zona_id"])
            if not zone:
                return {"success": False, "error": "La zona seleccionada no existe"}
            if zone.get("evento_id") != payload["evento_id"]:
                return {"success": False, "error": "La zona no pertenece al evento seleccionado"}

            self.db.collection("stands").document(stand_id).set(payload, merge=True)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_stand_admin(self, stand_id):
        try:
            if not self._doc_exists("stands", stand_id):
                return {"success": False, "error": "Stand no encontrado"}
            self.db.collection("stands").document(stand_id).delete()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _sanitize_event_schedule(self, schedule_data, event_data=None):
        if isinstance(schedule_data, list):
            return self._normalize_event_schedule_list(schedule_data)

        if isinstance(schedule_data, str):
            parsed = self._parse_event_schedule_text(schedule_data)
            if parsed:
                return parsed

        return self._generate_default_event_schedule(event_data or {})

    def _normalize_event_schedule_list(self, schedule_list):
        normalized = []
        for day in schedule_list or []:
            if not isinstance(day, dict):
                continue

            day_label = str(day.get("dia", "")).strip()
            slots = []
            for index, slot in enumerate(day.get("slots", []) or []):
                if not isinstance(slot, dict):
                    continue

                slot_time = str(slot.get("hora", "")).strip() or self._default_schedule_time(index)
                slot_artist = str(
                    slot.get("artista")
                    or slot.get("titulo")
                    or slot.get("nombre")
                    or ""
                ).strip() or "Actividad por confirmar"
                slots.append({"hora": slot_time, "artista": slot_artist})

            if day_label and slots:
                normalized.append({"dia": day_label, "slots": slots})

        return normalized

    def _parse_event_schedule_text(self, schedule_text):
        grouped = {}

        for raw_line in str(schedule_text or "").splitlines():
            line = raw_line.strip()
            if not line:
                continue

            parts = [part.strip() for part in line.split("|")]
            if len(parts) < 3:
                continue

            day_label, slot_time, slot_artist = parts[0], parts[1], "|".join(parts[2:]).strip()
            if not day_label or not slot_time or not slot_artist:
                continue

            grouped.setdefault(day_label, []).append(
                {"hora": slot_time, "artista": slot_artist}
            )

        return [
            {"dia": day_label, "slots": slots}
            for day_label, slots in grouped.items()
            if slots
        ]

    def _generate_default_event_schedule(self, event_data):
        if not isinstance(event_data, dict):
            return []

        event_name = str(event_data.get("nombre", "Evento")).strip() or "Evento"
        artists = [
            str(artist.get("nombre", "")).strip()
            for artist in event_data.get("artistas", []) or []
            if isinstance(artist, dict) and str(artist.get("nombre", "")).strip()
        ]

        fallback_artists = artists or [
            f"Apertura de {event_name}",
            "Sesion principal",
            f"Cierre de {event_name}",
        ]

        dates = self._expand_event_dates(
            event_data.get("fecha_ini") or event_data.get("fecha_inicio"),
            event_data.get("fecha_fin"),
        )
        if not dates:
            dates = [self._format_schedule_day_label(event_data.get("fecha_ini") or event_data.get("fecha_inicio") or "Por confirmar")]

        schedule = []
        artist_index = 0

        for day_index, day_label in enumerate(dates):
            slots = []
            slots_per_day = 2 if day_index < len(dates) - 1 else 1

            for slot_index in range(slots_per_day):
                artist_name = fallback_artists[artist_index % len(fallback_artists)]
                slots.append(
                    {
                        "hora": self._default_schedule_time(slot_index),
                        "artista": artist_name,
                    }
                )
                artist_index += 1

            schedule.append({"dia": day_label, "slots": slots})

        return schedule

    def _expand_event_dates(self, start_value, end_value):
        start_date = self._parse_event_date(start_value)
        end_date = self._parse_event_date(end_value)

        if not start_date:
            return []

        if not end_date or end_date < start_date:
            end_date = start_date

        day_labels = []
        current = start_date
        while current <= end_date:
            day_labels.append(self._format_schedule_day_label(current))
            current += timedelta(days=1)

        return day_labels

    def _parse_event_date(self, value):
        if not value:
            return None

        text = str(value).strip()
        if not text:
            return None

        for candidate in (text, text.split("T")[0]):
            try:
                return datetime.fromisoformat(candidate)
            except ValueError:
                continue

        return None

    def _format_schedule_day_label(self, value):
        if isinstance(value, datetime):
            return value.strftime("%d-%m-%Y")

        parsed = self._parse_event_date(value)
        if parsed:
            return parsed.strftime("%d-%m-%Y")

        return str(value or "Por confirmar")

    def _default_schedule_time(self, index):
        defaults = ["18:00", "20:00", "22:00"]
        if index < len(defaults):
            return defaults[index]
        return f"{18 + (index * 2):02d}:00"

    def _ensure_event_schedule(self, event_id, event_data):
        normalized = self._normalize_event_schedule_list(event_data.get("horario", []))
        if normalized:
            return normalized

        generated = self._generate_default_event_schedule(event_data)
        if event_id and generated:
            try:
                self.db.collection("events").document(event_id).set(
                    {"horario": generated},
                    merge=True,
                )
            except Exception as e:
                print("Error guardando horario por defecto:", e)

        return generated
