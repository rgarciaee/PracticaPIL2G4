from abc import ABC, abstractmethod


class InterfaceDAOFactory(ABC):
    @abstractmethod
    def getUserDao(self):
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
