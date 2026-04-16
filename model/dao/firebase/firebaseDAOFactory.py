from ...factory.interfaceDAOFactory import InterfaceDAOFactory
from .collection.firebaseArtistDAO import FirebaseArtistDAO
from .collection.firebaseCartDAO import FirebaseCartDAO
from .collection.firebaseEventDAO import FirebaseEventDAO
from .collection.firebaseStandDAO import FirebaseStandDAO
from .collection.firebaseTicketDAO import FirebaseTicketDAO
from .collection.firebaseUserDAO import FirebaseUserDAO
from .collection.firebaseUserExtDAO import FirebaseUserExtDAO
from .collection.firebaseZoneDAO import FirebaseZoneDAO
from .firebaseConnector import FirebaseConnector


class FirebaseDAOFactory(InterfaceDAOFactory):
    def __init__(self):
        self.connector = FirebaseConnector()

    def getUserDao(self):
        return FirebaseUserDAO(self.connector.get_user_collection(), self.connector)

    def getEventDAO(self):
        return FirebaseEventDAO(self.connector.get_db().collection("events"))

    def getArtistDAO(self):
        return FirebaseArtistDAO(self.connector.get_db().collection("artists"))

    def getZoneDAO(self):
        return FirebaseZoneDAO(self.connector.get_db().collection("zones"))

    def getTicketDAO(self):
        return FirebaseTicketDAO(self.connector.get_db().collection("tickets"))

    def getStandDAO(self):
        return FirebaseStandDAO(self.connector.get_db().collection("stands"))

    def getUserExtDAO(self):
        return FirebaseUserExtDAO(self.connector.get_db().collection("users_extended"))

    def getCartDAO(self):
        return FirebaseCartDAO(self.connector.get_db().collection("carts"))
