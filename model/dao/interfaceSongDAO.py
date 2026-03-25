from abc import ABC, abstractmethod
from typing import List, Optional

class InterfaceSongDAO(ABC):

    @abstractmethod
    def get_songs(self):
        pass