from abc import abstractmethod, ABC

class InterfaceDAOFactory(ABC):

    @abstractmethod
    def getUserDao(self):
        pass
    
    @abstractmethod
    def getSongsDAO(self):
        pass
    
    @abstractmethod
    def getMusicgenreDAO(self):
        pass

    @abstractmethod
    def getEventDAO(self):
        pass
    
    @abstractmethod
    def getArtistDAO(self):
        pass
    
    @abstractmethod
    def getZoneDAO(self):
        pass
    
    @abstractmethod
    def getTicketDAO(self):
        pass
    
    @abstractmethod
    def getStandDAO(self):
        pass
    
    @abstractmethod
    def getUserExtDAO(self):
        pass
    
    @abstractmethod
    def getCartDAO(self):
        pass