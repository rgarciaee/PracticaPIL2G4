from ....dao.interfaceUserDAO import InterfaceUserDAO
from ....dto.userDTO import UserDTO

class FirebaseUserDAO(InterfaceUserDAO):
    def __init__(self, collection, connector):
        self.collection = collection
        self.firebaseConnector = connector
 
    def checking_user(self, token):
        user_token = self.firebaseConnector.verify_token(token)
        print("USER DAO TOKEN:", user_token)
        user_id = user_token.get("uid")
        print("USER DAO UID",user_id )
        user_dto = UserDTO()
        if user_id:
            try:
                query = self.collection.where("user_id", "==", user_id).limit(1).stream()
                user_res= next(query, None)
                if not user_res or not user_res.exists:
                    print("USER DAO: Usuario no encontrado en Firestore")
                    return user_dto
                else:
                    user_data = user_res.to_dict()
                    print("USER FOUND")
                    try:
                        user_dto.set_id(user_data.get("user_id", ""))
                        user_dto.set_email(user_data.get("email", ""))
                        user_dto.set_role(user_data.get("role", "user"))
                        user_dto.set_exp(user_token.get("exp"))
                        session = {}
                        session["id_user"] = user_dto.get_id()
                        session["email_user"] = user_dto.get_email()
                        session["role"] = user_dto.get_role()
                        session["exp"] = user_dto.get_exp()
                        user_dto.set_session(session)
                    except Exception as e:
                        print(e)
                    return user_dto.userdto_to_json()
            except Exception as e:
                print(e)
        else:
            print("USER DAO: INCORRECTO")
            return user_dto.userdto_to_json()