import sqlite3
import json
import hashlib
import jwt
from contextlib import closing
import time


dbname = "tmp/login.db"
pyJWT_pass = "test73pass"
with closing(sqlite3.connect(dbname)) as conn:
    cur = conn.cursor()
    cur.execute(
        "CREATE TABLE IF NOT EXISTS chat(user STRING,userid INTEGER"
        ",room STRING,text STRING,file STRING,timestamp INTEGER)"
    )
    cur.execute(
        "CREATE TABLE IF NOT EXISTS room(user STRING,userid INTEGER"
        ",room STRING UNIQUE NOT NULL,timestamp INTEGER)"
    )
    conn.commit()


def show(request):
    if request.method == "POST":
        _dataDict = json.loads(request.get_data())
        
        if _dataDict["order"] == "fetch":
            room = _dataDict["room"]
            _roomownerflag = ""
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute("SELECT * FROM room WHERE room = ?;", [room])
                _data = cur.fetchone()
                if _data == None:
                    return json.dumps({"message": "notExist"}, ensure_ascii=False)
                if(_dataDict["token"]!=""):
                    token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
                    if token["id"] == _data["userid"]:
                        _roomownerflag = "youreOwner"
                cur.execute("SELECT * FROM chat WHERE room = ?;", [room])
                _chats = cur.fetchall()
                print(_chats)
                return json.dumps(
                    {
                        "message": "processed",
                        "chats": _chats,
                        "room": _data["room"],
                        "roomownerflag": _roomownerflag,
                    },
                    ensure_ascii=False,
                )
            return json.dumps({"message": "rejected"})

        if _dataDict["order"] == "remark":
            user = _dataDict["user"]
            file = ""
            room = _dataDict["room"]
            text = _dataDict["text"]
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute("SELECT * FROM chat WHERE room = ?;", [room])
                if cur.fetchone() == None:
                    return json.dumps({"message": "notExist"}, ensure_ascii=False)
                cur.execute(
                    "INSERT INTO chat(user,userid,room,text,file,timestamp) values(?,?,?,?)",
                    [user, token["id"], room, text, file, int(time.time())],
                )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})
        if _dataDict["order"] == "delete":
            return
        # room manage

        if _dataDict["order"] == "search":
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute("SELECT * FROM room")
                _rooms = [
                    {key: value for key, value in dict(result).items()}
                    for result in cur.fetchall()
                ]
                print(_rooms)
                return json.dumps(
                    {"message": "processed", "rooms": _rooms}, ensure_ascii=False
                )
            return json.dumps({"message": "rejected"})

        if _dataDict["order"] == "create":
            user = _dataDict["user"]
            room = _dataDict["room"]
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute("SELECT * FROM room WHERE room = ?;", [room])
                if cur.fetchone() != None:
                    return json.dumps({"message": "alreadyExisted"}, ensure_ascii=False)
                cur.execute(
                    "INSERT INTO room(user,userid,room,timestamp) values(?,?,?,?)",
                    [user, token["id"], room, int(time.time())],
                )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

        if _dataDict["order"] == "destroy":
            room = _dataDict["room"]
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(
                    "DELETE FROM room WHERE userid = ? AND room = ? ;",
                    [token["id"], room],
                )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

            ## regacy

        if _dataDict["order"] == "login":
            user = _dataDict["user"]
            passhash = hashlib.sha256(_dataDict["pass"].encode()).hexdigest()
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute("SELECT * FROM account WHERE user = ?;", [user])
                _data = [
                    {key: value for key, value in dict(result).items()}
                    for result in cur.fetchall()
                ]
                if _data == None:
                    return json.dumps({"message": "notexist"})
                if _data["passhash"] == passhash:
                    token = jwt.encode(
                        {"id": _data["id"], "timestamp": _data["timestamp"]},
                        pyJWT_pass,
                        algorithm="HS256",
                    )
                    return json.dumps(
                        {"message": "processed", "user": _data["user"], "token": token},
                        ensure_ascii=False,
                    )
            return json.dumps({"message": "rejected"})

        if _dataDict["order"] == "signin":
            user = _dataDict["user"]
            passhash = hashlib.sha256(_dataDict["pass"].encode()).hexdigest()
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute("SELECT * FROM account WHERE user = ?;", [user])
                if cur.fetchone() != None:
                    return json.dumps({"message": "alreadyExisted"}, ensure_ascii=False)
                # create account
                cur.execute(
                    "INSERT INTO account(user,passhash,timestamp) values(?,?,?)",
                    [user, passhash, int(time.time())],
                )
                conn.commit()
                # create token
                cur.execute("SELECT * FROM account WHERE user = ?;", [user])
                _data = cur.fetchone()
                token = jwt.encode(
                    {"id": _data["id"], "timestamp": _data["timestamp"]},
                    pyJWT_pass,
                    algorithm="HS256",
                )
            return json.dumps(
                {"message": "processed", "user": _data["user"], "token": token},
                ensure_ascii=False,
            )

        if _dataDict["order"] == "signout":
            return json.dumps({"message": "processed"}, ensure_ascii=False)

        if _dataDict["order"] == "account_delete":
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(
                    "DELETE FROM account WHERE id = ? AND timestamp = ? ;",
                    [token["id"], token["timestamp"]],
                )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

    return "404: nof found → main.html", 404
