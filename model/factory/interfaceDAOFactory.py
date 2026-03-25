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