from .dao.firebase.firebaseDAOFactory import FirebaseDAOFactory

class Model ():
    # Tiene que crear el factory de firebase
    # Tiene que obtener lo DAO
    def __init__(self):
        self.factory = FirebaseDAOFactory()
        self.userDAO = self.factory.getUserDao()
        self.musicgenreDAO = self.factory.getMusicgenreDAO()
        self.songDAO = self.factory.getSongsDAO()
        self.rolesDAO = None
        pass

    def checking_user_token(self, token):
        print("Checking user")
        user = self.userDAO.checking_user(token)
        return user
    
    def get_songs(self):
        return self.songDAO.get_songs()
    
    def get_musicgenres(self):
        return self.musicgenreDAO.get_musicgenres()