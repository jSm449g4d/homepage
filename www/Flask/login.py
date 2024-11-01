import sqlite3
import json
import hashlib
import jwt
from contextlib import closing
import time


with open('keys/keys.json') as f:
    keys = json.load(f)
dbname = keys["db"]
pyJWT_pass = keys["pyJWT_pass"]

with closing(sqlite3.connect(dbname)) as conn:
    cur = conn.cursor()
    cur.execute(
        "CREATE TABLE IF NOT EXISTS account(id INTEGER PRIMARY KEY AUTOINCREMENT, user STRING UNIQUE NOT NULL"
        ",passhash INTEGER,timestamp INTEGER)"
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
                    return json.dumps({"message": "notexist"})
                if _data["passhash"] == passhash:
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
                        },
                        ensure_ascii=False,
                    )
            return json.dumps({"message": "rejected"})

        if "signin" in request.form:
            _dataDict = json.loads(request.form["signin"])
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
                {
                    "message": "processed",
                    "user": _data["user"],
                    "token": token,
                    "id": _data["id"],
                },
                ensure_ascii=False,
            )

        if "signout" in request.form:
            return json.dumps({"message": "processed"}, ensure_ascii=False)

        if "account_delete" in request.form:
            _dataDict = json.loads(request.form["account_delete"])
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
