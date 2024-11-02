import sqlite3
import json
import hashlib
import jwt
from contextlib import closing
import time


with open("keys/keys.json") as f:
    keys = json.load(f)
dbname = keys["db"]
pyJWT_pass = keys["pyJWT_pass"]

with closing(sqlite3.connect(dbname)) as conn:
    cur = conn.cursor()
    cur.execute(
        "CREATE TABLE IF NOT EXISTS account(id INTEGER PRIMARY KEY AUTOINCREMENT, user STRING UNIQUE NOT NULL"
        ",passhash STRING NOT NULL,mail STRING NOT NULL,timestamp INTEGER NOT NULL)"
    )
    conn.commit()


def show(request):
    if request.method == "POST":

        if "login" in request.form:
            _dataDict = json.loads(request.form["login"])
            user = _dataDict["user"]
            passhash = hashlib.sha256(_dataDict["pass"].encode()).hexdigest()
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute("SELECT * FROM account WHERE user = ?;", [user])
                _data = cur.fetchone()
                if _data == None:
                    return json.dumps({"message": "notExist"})
                if _data["passhash"] != passhash:
                    return json.dumps({"message": "wrongPass"})
                token = jwt.encode(
                    {"id": _data["id"], "timestamp": _data["timestamp"]},
                    pyJWT_pass,
                    algorithm="HS256",
                )
                return json.dumps(
                    {
                        "message": "processed",
                        "user": _data["user"],
                        "token": token,
                        "id": _data["id"],
                        "mail": _data["mail"],
                    },
                    ensure_ascii=False,
                )
            return json.dumps({"message": "rejected"})

        if "signin" in request.form:
            _dataDict = json.loads(request.form["signin"])
            passhash = hashlib.sha256(_dataDict["pass"].encode()).hexdigest()
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute(
                    "SELECT * FROM account WHERE user = ?;", [_dataDict["user"]]
                )
                if cur.fetchone() != None:
                    return json.dumps({"message": "alreadyExist"}, ensure_ascii=False)
                # process
                cur.execute(
                    "INSERT INTO account(user,passhash,timestamp,mail) values(?,?,?,?)",
                    [_dataDict["user"], passhash, int(time.time()), ""],
                )
                conn.commit()
                # create token
                cur.execute(
                    "SELECT * FROM account WHERE user = ?;", [_dataDict["user"]]
                )
                _data = cur.fetchone()
                token = jwt.encode(
                    {"id": _data["id"], "timestamp": _data["timestamp"]},
                    pyJWT_pass,
                    algorithm="HS256",
                )
            return json.dumps(
                {
                    "message": "processed",
                    "user": _data["user"],
                    "token": token,
                    "id": _data["id"],
                    "mail": _data["mail"],
                },
                ensure_ascii=False,
            )

        if "signout" in request.form:
            return json.dumps({"message": "processed"}, ensure_ascii=False)

        if "account_change" in request.form:
            _dataDict = json.loads(request.form["account_change"])
            if _dataDict["token"] == "":
                return json.dumps({"message": "tokenNothing"}, ensure_ascii=False)
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            _passhash = hashlib.sha256(_dataDict["pass"].encode()).hexdigest()
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute(
                    "SELECT * FROM account WHERE user = ?;", [_dataDict["user"]]
                )
                if cur.fetchone() != None:
                    return json.dumps({"message": "alreadyExist"}, ensure_ascii=False)
                cur.execute("SELECT * FROM account WHERE id = ?;", [token["id"]])
                _data = cur.fetchone()
                if _data == None:
                    return json.dumps({"message": "notExist"})
                # process
                _user = _data["user"] if _dataDict["user"] == "" else _dataDict["user"]
                _passhash = _data["passhash"] if _dataDict["pass"] == "" else _passhash
                _mail = _data["mail"] if _dataDict["mail"] == "" else _dataDict["mail"]
                print(_user)
                cur.execute(
                    "UPDATE account SET user = ?, passhash = ?, mail = ? WHERE id = ?;",
                    [_user, _passhash, _mail, token["id"]],
                )
                conn.commit()
                return json.dumps(
                    {
                        "message": "processed",
                        "user": _user,
                        "mail": _mail,
                    },
                    ensure_ascii=False,
                )
            return json.dumps({"message": "rejected"})

        if "account_delete" in request.form:
            _dataDict = json.loads(request.form["account_delete"])
            if _dataDict["token"] == "":
                return json.dumps({"message": "tokenNothing"}, ensure_ascii=False)
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(dbname)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # process
                cur.execute(
                    "DELETE FROM account WHERE id = ? AND timestamp = ? ;",
                    [token["id"], token["timestamp"]],
                )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

    return "404: nof found → main.html", 404
