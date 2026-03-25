# model/dao/firebase/firebaseDAOFactory.py
from ...factory.interfaceDAOFactory import InterfaceDAOFactory
from .collection.firebaseUserDAO import FirebaseUserDAO
from .collection.firebaseSongsDAO import FirebaseSongDAO
from .collection.firebaseMusicgenreDAO import FirebaseMusicgenreDAO
from .firebaseConnector import FirebaseConnector

class FirebaseDAOFactory (InterfaceDAOFactory):
    def __init__(self):
        self.connector = FirebaseConnector()
    
    def getUserDao(self):
        return FirebaseUserDAO(self.connector.get_user_collection(), self.connector)
    
    def getSongsDAO(self):
        return FirebaseSongDAO(self.connector.get_songs_collection())
    
    def getMusicgenreDAO(self):
        return FirebaseMusicgenreDAO(self.connector.get_musicgenre_collection())