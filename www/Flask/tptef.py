import sqlite3
import json
import os
import jwt
import hashlib
import flask
from contextlib import closing
import time


with open('keys/keys.json') as f:
    keys = json.load(f)
dbname = keys["db"]
pyJWT_pass = keys["pyJWT_pass"]
filedir = "tmp/tptef"

os.makedirs(filedir, exist_ok=True)
with closing(sqlite3.connect(dbname)) as conn:
    cur = conn.cursor()
    cur.execute(
        "CREATE TABLE IF NOT EXISTS chat(id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "user STRING,userid INTEGER,roomid INTEGER,"
        "text STRING,mode STRING NOT NULL,timestamp INTEGER)"
    )
    cur.execute(
        "CREATE TABLE IF NOT EXISTS room(id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "user STRING,userid INTEGER,room STRING UNIQUE NOT NULL,pass STRING,timestamp INTEGER)"
    )
    conn.commit()


def show(request):
    if request.method == "POST":
        if "info" not in request.form:
            return json.dumps({"message": "notEnoughForm(info)"}, ensure_ascii=False)
        _dataDict = json.loads(request.form["info"])

        if "fetch" in request.form:
            _dataDict.update(json.loads(request.form["fetch"]))
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
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

        if "remark" in request.form:
            _dataDict.update(json.loads(request.form["remark"]))
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
                    "INSERT INTO chat(user,userid,roomid,text,mode,timestamp) values(?,?,?,?,?,?)",
                    [
                        _dataDict["user"],
                        token["id"],
                        _room["id"],
                        _dataDict["text"],
                        "text",
                        int(time.time()),
                    ],
                )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

        if "upload" in request.files:
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute("SELECT * FROM room WHERE room = ?;", [_dataDict["room"]])
                _room = cur.fetchone()
                if _room == None:
                    return json.dumps({"message": "notExist"}, ensure_ascii=False)
                _timestamp = int(time.time())
                cur.execute(
                    "INSERT INTO chat(user,userid,roomid,text,mode,timestamp) values(?,?,?,?,?,?)",
                    [
                        _dataDict["user"],
                        token["id"],
                        _room["id"],
                        request.files["upload"].filename,
                        "attachment",
                        _timestamp,
                    ],
                )
                conn.commit()
                cur.execute(
                    "SELECT * FROM chat WHERE userid = ? AND timestamp = ? AND mode = ?;",
                    [token["id"], _timestamp, "attachment"],
                )
                _chat = cur.fetchone()
                if _chat == None:
                    return json.dumps({"message": "unknownError"}, ensure_ascii=False)
                request.files["upload"].save(
                    os.path.normpath(os.path.join(filedir, str(_chat["id"])))
                )
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

        if "download" in request.form:
            print(_dataDict)
            _dataDict.update(json.loads(request.form["download"]))
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute(
                    "SELECT * FROM chat WHERE id = ? ;",
                    [_dataDict["chatid"]],
                )
                _chat = cur.fetchone()
                if _chat == None:
                    return json.dumps({"message": "rejected"}, ensure_ascii=False)
                _target_file = os.path.normpath(os.path.join(filedir, str(_chat["id"])))
                if os.path.exists(_target_file):
                    return flask.send_file(
                        _target_file,
                        as_attachment=True,
                        download_name=_chat["text"],
                    )
                return json.dumps({"message": "notExist"})
            return json.dumps({"message": "rejected"})

        if "delete" in request.form:
            _dataDict.update(json.loads(request.form["delete"]))
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(
                    "SELECT * FROM chat WHERE id = ? AND userId = ? ;",
                    [_dataDict["chatid"], token["id"]],
                )
                _chat = cur.fetchone()
                if _chat == None:
                    return json.dumps({"message": "rejected"}, ensure_ascii=False)
                cur.execute(
                    "DELETE FROM chat WHERE id = ? AND userId = ? ;",
                    [_dataDict["chatid"], token["id"]],
                )
                conn.commit()
                _remove_file = os.path.normpath(os.path.join(filedir, str(_chat["id"])))
                if os.path.exists(_remove_file):
                    os.remove(_remove_file)
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

        if "search" in request.form:
            _dataDict.update(json.loads(request.form["search"]))
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

        if "create" in request.form:
            _dataDict.update(json.loads(request.form["create"]))
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute("SELECT * FROM room WHERE room = ?;", [_dataDict["room"]])
                _room = cur.fetchone()
                if _room != None:
                    return json.dumps({"message": "alreadyExisted"}, ensure_ascii=False)
                cur.execute(
                    "INSERT INTO room(user,userid,room,timestamp) values(?,?,?,?)",
                    [
                        _dataDict["user"],
                        token["id"],
                        _dataDict["room"],
                        int(time.time()),
                    ],
                )
                conn.commit()
                cur.execute("SELECT * FROM room WHERE room = ?;", [_dataDict["room"]])
                _room = cur.fetchone()
                if _room != None:
                    return json.dumps(
                        {"message": "processed", "room": dict(_room)},
                        ensure_ascii=False,
                    )
            return json.dumps({"message": "rejected"})

        if "destroy" in request.form:
            _dataDict.update(json.loads(request.form["destroy"]))
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
