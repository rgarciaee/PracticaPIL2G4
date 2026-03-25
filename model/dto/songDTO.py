import json

class SongsDTO():
    def __init__(self):
        self.songlist = []

    def insertSong(self, elem):
        self.songlist.append(elem)

    def songlist_to_json(self):
        return json.dumps(self.songlist)


class SongDTO():
    def __init__(self):
        self.album = None
        self.author = None
        self.id = None
        self.duration = None  # Corregido (antes length)
        self.musicgenre = None
        self.price = None
        self.rating = None
        self.release = None
        self.title = None

    def is_Empty(self):
        return (self.album is None and self.author is None and self.id is None and
                self.duration is None and self.musicgenre is None and self.price is None and
                self.rating is None and self.release is None and self.title is None)

    def get_album(self):
        return self.album

    def set_album(self, album):
        self.album = album

    def get_author(self):
        return self.author

    def set_author(self, author):
        self.author = author

    def get_id(self):
        return self.id

    def set_id(self, id):
        self.id = id

    def get_duration(self):
        return self.duration

    def set_duration(self, duration):
        self.duration = duration

    def get_musicgenre(self):
        return self.musicgenre

    def set_musicgenre(self, musicgenre):
        self.musicgenre = musicgenre

    def get_price(self):
        return self.price

    def set_price(self, price):
        self.price = price

    def get_rating(self):
        return self.rating

    def set_rating(self, rating):
        self.rating = rating

    def get_release(self):
        return self.release

    def set_release(self, release):
        self.release = release

    def get_title(self):
        return self.title

    def set_title(self, title):
        self.title = title

    def songdto_to_dict(self):
        return {
            "album": self.album,
            "author": self.author,
            "id": self.id,
            "duration": self.duration,
            "musicgenre": self.musicgenre,
            "price": self.price,
            "rating": self.rating,
            "release": str(self.release),
            "title": self.title
        }
    
