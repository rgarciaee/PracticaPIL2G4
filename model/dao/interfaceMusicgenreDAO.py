from abc import ABC, abstractmethod
from typing import List, Optional

class InterfaceMusicgenreDAO(ABC):

    @abstractmethod
    def get_musicgenres(self):
        pass