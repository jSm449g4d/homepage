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
        "CREATE TABLE IF NOT EXISTS chat(id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "user STRING,userid INTEGER,roomid INTEGER,"
        "text STRING,file STRING,timestamp INTEGER)"
    )
    cur.execute(
        "CREATE TABLE IF NOT EXISTS room(id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "user STRING,userid INTEGER,room STRING UNIQUE NOT NULL,timestamp INTEGER)"
    )
    conn.commit()


def show(request):
    if request.method == "POST":
        _dataDict = json.loads(request.get_data())

        if _dataDict["order"] == "fetch":
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                print(_dataDict["roomid"])
                cur.execute("SELECT * FROM room WHERE id = ?;", [_dataDict["roomid"]])
                _room = cur.fetchone()
                if _room == None:
                    return json.dumps({"message": "notExist"}, ensure_ascii=False)
                _userid = _room["userid"]
                _roomid = _room["id"]
                cur.execute("SELECT * FROM chat WHERE roomid = ?;", [_roomid])
                _chats = [
                    {key: value for key, value in dict(result).items()}
                    for result in cur.fetchall()
                ]
                return json.dumps(
                    {
                        "message": "processed",
                        "chats": _chats,
                        "room": dict(_room),
                        "userid": _userid,
                    },
                    ensure_ascii=False,
                )
            return json.dumps({"message": "rejected"})

        if _dataDict["order"] == "remark":
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute("SELECT * FROM room WHERE room = ?;", [_dataDict["room"]])
                _room = cur.fetchone()
                if _room == None:
                    return json.dumps({"message": "notExist"}, ensure_ascii=False)
                cur.execute(
                    "INSERT INTO chat(user,userid,roomid,text,file,timestamp) values(?,?,?,?,?,?)",
                    [
                        _dataDict["user"],
                        token["id"],
                        _room["id"],
                        _dataDict["text"],
                        "",
                        int(time.time()),
                    ],
                )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

        if _dataDict["order"] == "delete":
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(
                    "DELETE FROM chat WHERE id = ? AND userId = ? ;",
                    [_dataDict["chatid"], token["id"]],
                )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

        if _dataDict["order"] == "search":
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute("SELECT * FROM room")
                _rooms = [
                    {key: value for key, value in dict(result).items()}
                    for result in cur.fetchall()
                ]
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
                _room = cur.fetchone()
                if _room != None:
                    return json.dumps({"message": "alreadyExisted"}, ensure_ascii=False)
                cur.execute(
                    "INSERT INTO room(user,userid,room,timestamp) values(?,?,?,?)",
                    [user, token["id"], room, int(time.time())],
                )
                conn.commit()
                cur.execute("SELECT * FROM room WHERE room = ?;", [room])
                _room = cur.fetchone()
                if _room != None:
                    return json.dumps({"message": "processed","room": dict(_room)}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

        if _dataDict["order"] == "destroy":
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute("SELECT * FROM room WHERE id = ?;", [_dataDict["roomid"]])
                _room = cur.fetchone()
                if _room == None:
                    return json.dumps({"message": "notExist"}, ensure_ascii=False)
                if _room["userid"] != token["id"]:
                    return json.dumps({"message": "youerntOwner"}, ensure_ascii=False)
                cur.execute(
                    "DELETE FROM room WHERE userid = ? AND id = ? ;",
                    [token["id"], _dataDict["roomid"]],
                )
                cur.execute(
                    "DELETE FROM chat WHERE roomid = ? ;",
                    [_room["id"]],
                )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

    return "404: nof found → main.html", 404
