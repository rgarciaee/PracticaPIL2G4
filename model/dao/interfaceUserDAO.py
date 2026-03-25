from abc import ABC, abstractmethod
from typing import List, Optional

class InterfaceUserDAO(ABC):

    @abstractmethod
    def checking_user(self, token):
        pass