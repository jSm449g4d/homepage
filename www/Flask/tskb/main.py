import sqlite3
import json
import os
import jwt
import hashlib
import flask
import sys
from contextlib import closing
import time

FUNC_NAME = "tskb"


# Processing when accessing directly with GET
def get_response(_statusDict={"STATUS": "VALUE"}):
    _statusLines: str = " <table border='1'>"
    for key, value in _statusDict.items():
        _statusLines += "<tr><th>" + key + "</th><th>" + value + "</th></tr>"
    _statusLines += " </table>"
    with open(
        os.path.join(os.path.dirname(__file__), "main.html"), "r", encoding="utf-8"
    ) as f:
        html = f.read()
        html = html.replace("{{FUNC_NAME}}", FUNC_NAME)
        html = html.replace("{{STATUS_TABLE}}", _statusLines)
        return flask.render_template_string(html)
    return "404: nof found → main.html", 404


# load setting
tmp_dir = "./tmp/" + FUNC_NAME
os.makedirs(tmp_dir, exist_ok=True)
key_dir = "./keys/keys.json"
db_dir = "./tmp/sqlite.db"
pyJWT_pass = "test"
pyJWT_timeout = 3600
keys = {}
if os.path.exists(key_dir):
    with open(key_dir) as f:
        keys = json.load(f)
        if "db" in keys:
            db_dir = keys["db"]
        if "pyJWT_pass" in keys:
            pyJWT_pass = keys["pyJWT_pass"]
        if "pyJWT_timeout" in keys:
            pyJWT_timeout = keys["pyJWT_timeout"]

with closing(sqlite3.connect(db_dir)) as conn:
    cur = conn.cursor()
    cur.execute(
        "CREATE TABLE IF NOT EXISTS tptef_chat(id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "user TEXT NOT NULL,userid INTEGER NOT NULL,roomid INTEGER NOT NULL,"
        "text TEXT NOT NULL,mode TEXT NOT NULL,timestamp INTEGER NOT NULL)"
    )
    cur.execute(
        "CREATE TABLE IF NOT EXISTS tptef_room(id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "user TEXT NOT NULL,userid INTEGER NOT NULL,room TEXT UNIQUE NOT NULL,"
        "passhash TEXT DEFAULT '',timestamp INTEGER NOT NULL)"
    )
    "(id,name,tag,description,userid,user,passhash,timestamp,contents)"
    # contents={material_id:amount}
    cur.execute(
        "CREATE TABLE IF NOT EXISTS tskb_combination(id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "name TEXT UNIQUE NOT NULL,tag TEXT NOT NULL,description TEXT DEFAULT '',"
        "userid INTEGER NOT NULL,user TEXT NOT NULL,passhash TEXT DEFAULT '',timestamp INTEGER NOT NULL,"
        "contents TEXT NOT NULL)"
    )
    # passhash="": public ,"0": private
    "(id,name,tag,description,userid,user,passhash,timestamp,"
    "g,cost,carbo,fiber,protein,fat,saturated_fat,n3,DHA_EPA,n6,"
    "ca,cl,cr,cu,i,fe,mg,mn,mo,p,k,se,na,zn,va,vb1,vb2,vb3,vb5,vb6,vb7,vb9,vb12,vc,vd,ve,vk,colin,kcal)"
    cur.execute(
        "CREATE TABLE IF NOT EXISTS tskb_material(id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "name TEXT UNIQUE NOT NULL,tag TEXT NOT NULL,description TEXT DEFAULT '',"
        "userid INTEGER NOT NULL,user TEXT NOT NULL,passhash TEXT DEFAULT '',timestamp INTEGER NOT NULL,"
        "unit TEXT DEFAULT 'g',cost REAL DEFAULT 0,"
        "carbo REAL DEFAULT 0,fiber REAL DEFAULT 0,"
        "protein REAL DEFAULT 0,fat REAL DEFAULT 0,saturated_fat REAL DEFAULT 0,"
        "n3 REAL DEFAULT 0,DHA_EPA REAL DEFAULT 0,"
        "n6 REAL DEFAULT 0,ca REAL DEFAULT 0,cl REAL DEFAULT 0,cr REAL DEFAULT 0,"
        "cu REAL DEFAULT 0,i REAL DEFAULT 0,fe REAL DEFAULT 0,"
        "mg REAL DEFAULT 0,mn REAL DEFAULT 0,mo REAL DEFAULT 0,"
        "p REAL DEFAULT 0,k REAL DEFAULT 0,se REAL DEFAULT 0,"
        "na REAL DEFAULT 0,zn REAL DEFAULT 0,va REAL DEFAULT 0,"
        "vb1 REAL DEFAULT 0,vb2 REAL DEFAULT 0,vb3 REAL DEFAULT 0,"
        "vb5 REAL DEFAULT 0,vb6 REAL DEFAULT 0,vb7 REAL DEFAULT 0,"
        "vb9 REAL DEFAULT 0,vb12 REAL DEFAULT 0,vc REAL DEFAULT 0,"
        "vd REAL DEFAULT 0,ve REAL DEFAULT 0,vk REAL DEFAULT 0,"
        "colin REAL DEFAULT 0,kcal REAL DEFAULT 0)"
    )
    conn.commit()


def show(request):

    if request.method == "GET":
        return get_response()
    if request.method == "POST":
        if "info" not in request.form:
            return json.dumps(
                {"message": "notEnoughForm(info)", "text": "INFOフォーム無し"},
                ensure_ascii=False,
            )
        _dataDict = json.loads(request.form["info"])
        token = ""
        encoded_new_token = token
        if _dataDict["token"] != "":
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            if token["timestamp"] + pyJWT_timeout < int(time.time()):
                return json.dumps(
                    {"message": "tokenTimeout", "text": "JWT期限切れ"},
                    ensure_ascii=False,
                )
            encoded_new_token = jwt.encode(
                {"id": token["id"], "timestamp": int(time.time())},
                pyJWT_pass,
                algorithm="HS256",
            )

        if "explore" in request.form:
            _dataDict.update(json.loads(request.form["explore"]))
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                _userid = -1
                if token != "":
                    _userid = token["id"]
                # process start
                # search opend material
                if _dataDict["privateFlag"] == False:
                    cur.execute(
                        "SELECT * FROM tskb_material WHERE name LIKE ? "
                        "AND passhash = '' LIMIT 100;",
                        ["%" + _dataDict["keyword"] + "%"],
                    )
                    _materials = [
                        {key: value for key, value in dict(result).items()}
                        for result in cur.fetchall()
                    ]
                    return json.dumps(
                        {
                            "message": "processed",
                            "materials": _materials,
                        },
                        ensure_ascii=False,
                    )
                if _dataDict["privateFlag"] == True:
                    cur.execute(
                        "SELECT * FROM tskb_material WHERE userid = ? "
                        "AND passhash = '0'",
                        [token["id"]],
                    )
                    _materials = [
                        {key: value for key, value in dict(result).items()}
                        for result in cur.fetchall()
                    ]
                    return json.dumps(
                        {
                            "message": "processed",
                            "materials": _materials,
                        },
                        ensure_ascii=False,
                    )
                # search closed material
            return json.dumps({"message": "rejected", "text": "不明なエラー"})

        if "fetch" in request.form:
            _dataDict.update(json.loads(request.form["fetch"]))
            _roompasshash = _dataDict["roomKey"]
            if _dataDict["roomKey"] not in ["", "0"]:
                _roompasshash = hashlib.sha256(
                    _dataDict["roomKey"].encode()
                ).hexdigest()
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # process start
                # select combination
                _userid = -1
                if "id" in token:
                    _userid = token["id"]
                cur.execute(
                    "SELECT * FROM tskb_combination WHERE id = ?;",
                    [_dataDict["combinationid"]],
                )
                _combination = cur.fetchone()
                if _combination == None:
                    return json.dumps(
                        {"message": "notExist", "text": "レシピが不明"},
                        ensure_ascii=False,
                    )
                elif _combination["passhash"] not in ["", _roompasshash]:
                    return json.dumps({"message": "wrongPass", "text": "アクセス拒否"})
                elif _combination["passhash"] == "0" and _combination["id"] != _userid:
                    return json.dumps({"message": "wrongPass", "text": "アクセス拒否"})
                # select material
                _contents = json.loads(_combination["contents"])
                _materials = []
                for _key, _val in _contents.items():
                    cur.execute("SELECT * FROM tskb_material WHERE id = ?;", [_key])
                    _material = cur.fetchone()
                    if _material == None:
                        continue
                    if _material["passhash"] == "0":
                        if _material["userid"] != token["id"]:
                            continue
                    _materials.append(dict(_material))
                return json.dumps(
                    {
                        "message": "processed",
                        "materials": _materials,
                        "combination": dict(_combination),
                        "token": encoded_new_token,
                    },
                    ensure_ascii=False,
                )
            return json.dumps({"message": "rejected", "text": "不明なエラー"})

        if "register" in request.form:
            _dataDict.update(json.loads(request.form["register"]))
            if token == "":
                return json.dumps(
                    {"message": "tokenNothing", "text": "JWT未提出"}, ensure_ascii=False
                )
            _material=_dataDict["material"]
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                _roompasshash = "" if _material["passhash"] == "" else "0"
                # process start
                # register material
                if _material["id"] == -1:
                    cur.execute(
                        "SELECT * FROM tskb_material WHERE name = ?;",
                        [_material["name"]],
                    )
                    _Cmaterial = cur.fetchone()
                    if _Cmaterial != None:
                        return json.dumps(
                            {"message": "alreadyExisted", "text": "既存の名前"}
                        )
                    cur.execute(
                        "INSERT INTO tskb_material "
                        "(name,tag,description,userid,user,passhash,timestamp) "
                        "values(?,?,?,?,?,?,?)",
                        [
                            _material["name"],
                            ",".join([]),
                            _material["description"],
                            token["id"],
                            _dataDict["user"],
                            _roompasshash,
                            int(time.time()),
                        ],
                    )
                    conn.commit()
                    return json.dumps({"message": "processed"}, ensure_ascii=False)
                # update material
                cur.execute(
                    "SELECT * FROM tskb_material WHERE id = ?;",
                    [_material["id"]],
                )
                _Cmaterial = cur.fetchone()
                if _Cmaterial == None:
                    return json.dumps(
                        {"message": "notExist", "text": "素材不明"}, ensure_ascii=False
                    )
                elif _Cmaterial["passhash"] not in ["", _roompasshash]:
                    return json.dumps(
                        {"message": "wrongPass", "text": "アクセス拒否"},
                        ensure_ascii=False,
                    )
                elif _Cmaterial["passhash"] == "0" and _Cmaterial["id"] != token["id"]:
                    return json.dumps(
                        {"message": "wrongPass", "text": "アクセス拒否"},
                        ensure_ascii=False,
                    )
                for key, value in _material.item():
                    cur.execute(
                        "UPDATE tskb_material SET ? = ? WHERE id = ?;",
                        [key, value, _Cmaterial["id"]],
                    )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected", "text": "不明なエラー"})

        if "upload" in request.files:
            _roompasshash = _dataDict["roomKey"]
            if _dataDict["roomKey"] not in ["", "0"]:
                _roompasshash = hashlib.sha256(
                    _dataDict["roomKey"].encode()
                ).hexdigest()
            if _dataDict["token"] == "":
                return json.dumps(
                    {"message": "tokenNothing", "text": "トークン未提出"},
                    ensure_ascii=False,
                )
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            _roompasshash = ""
            if _dataDict["roomKey"] != "":
                _roompasshash = hashlib.sha256(
                    _dataDict["roomKey"].encode()
                ).hexdigest()
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # duplication and roomKey check
                cur.execute(
                    "SELECT * FROM tptef_room WHERE id = ?;", [_dataDict["roomid"]]
                )
                _room = cur.fetchone()
                if _room == None:
                    return json.dumps({"message": "notExist"}, ensure_ascii=False)
                if _room["passhash"] != "" and _room["passhash"] != _roompasshash:
                    return json.dumps({"message": "wrongPass"})
                # process start
                _timestamp = int(time.time())
                cur.execute(
                    "INSERT INTO tptef_chat(user,userid,roomid,text,mode,timestamp) values(?,?,?,?,?,?)",
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
                    "SELECT * FROM tptef_chat WHERE userid = ? AND timestamp = ? AND mode = ?;",
                    [token["id"], _timestamp, "attachment"],
                )
                _chat = cur.fetchone()
                if _chat == None:
                    return json.dumps({"message": "unknownError"}, ensure_ascii=False)
                request.files["upload"].save(
                    os.path.normpath(os.path.join(tmp_dir, str(_chat["id"])))
                )
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected"})

        if "download" in request.form:
            _dataDict.update(json.loads(request.form["download"]))
            _roompasshash = _dataDict["roomKey"]
            if _dataDict["roomKey"] not in ["", "0"]:
                _roompasshash = hashlib.sha256(
                    _dataDict["roomKey"].encode()
                ).hexdigest()
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # duplication and roomKey check
                cur.execute(
                    "SELECT * FROM tptef_room WHERE id = ?;", [_dataDict["roomid"]]
                )
                _room = cur.fetchone()
                if _room == None:
                    return json.dumps({"message": "notExist"}, ensure_ascii=False)
                if _room["passhash"] != "" and _room["passhash"] != _roompasshash:
                    return json.dumps({"message": "wrongPass"})
                # process start
                cur.execute(
                    "SELECT * FROM tptef_chat WHERE id = ? ;",
                    [_dataDict["chatid"]],
                )
                _chat = cur.fetchone()
                if _chat == None:
                    return json.dumps({"message": "rejected"}, ensure_ascii=False)
                _target_file = os.path.normpath(os.path.join(tmp_dir, str(_chat["id"])))
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
            if _dataDict["token"] == "":
                return json.dumps(
                    {"message": "tokenNothing", "text": "JWT未提出"}, ensure_ascii=False
                )
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # duplication and roomKey check
                cur.execute(
                    "DELETE FROM tskb_material WHERE id = ? AND userid = ?;",
                    [_dataDict["materialid"], token["id"]],
                )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected", "text": "不明なエラー"})

        if "search" in request.form:
            _roompasshash = _dataDict["roomKey"]
            if _dataDict["roomKey"] not in ["", "0"]:
                _roompasshash = hashlib.sha256(
                    _dataDict["roomKey"].encode()
                ).hexdigest()
            _dataDict.update(json.loads(request.form["search"]))
            _userid = -1
            if token != "":
                _userid = token["id"]
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(
                    "SELECT * FROM tskb_combination where passhash != '0' OR "
                    "userid = ?;",
                    [_userid],
                )
                _tskb_combinations = [
                    {key: value for key, value in dict(result).items()}
                    for result in cur.fetchall()
                ]
                return json.dumps(
                    {
                        "message": "processed",
                        "combinations": _tskb_combinations,
                        "token": encoded_new_token,
                    },
                    ensure_ascii=False,
                )
            return json.dumps({"message": "rejected", "text": "不明なエラー"})

        if "create" in request.form:
            _dataDict.update(json.loads(request.form["create"]))
            _roompasshash = _dataDict["roomKey"]
            if _dataDict["roomKey"] not in ["", "0"]:
                _roompasshash = hashlib.sha256(
                    _dataDict["roomKey"].encode()
                ).hexdigest()
            if _dataDict["token"] == "":
                return json.dumps(
                    {"message": "tokenNothing", "text": "JWT未提出"}, ensure_ascii=False
                )
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            if _dataDict["privateFlag"] == True:
                _roompasshash = "0"
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute(
                    "SELECT * FROM tskb_combination WHERE name = ?;",
                    [_dataDict["name"]],
                )
                _room = cur.fetchone()
                if _room != None:
                    return json.dumps(
                        {"message": "alreadyExisted", "text": "既存の名前"},
                        ensure_ascii=False,
                    )
                cur.execute(
                    "INSERT INTO tskb_combination "
                    "(name,tag,description,userid,user,passhash,timestamp,contents) "
                    "values(?,?,?,?,?,?,?,?)",
                    [
                        _dataDict["name"],
                        ",".join([]),
                        _dataDict["description"],
                        token["id"],
                        _dataDict["user"],
                        _roompasshash,
                        int(time.time()),
                        json.dumps({}, ensure_ascii=False),
                    ],
                )
                conn.commit()
                return json.dumps(
                    {"message": "processed"},
                    ensure_ascii=False,
                )
            return json.dumps({"message": "rejected"})

        if "destroy" in request.form:
            _roompasshash = _dataDict["roomKey"]
            if _dataDict["roomKey"] not in ["", "0"]:
                _roompasshash = hashlib.sha256(
                    _dataDict["roomKey"].encode()
                ).hexdigest()
            _dataDict.update(json.loads(request.form["destroy"]))
            if _dataDict["token"] == "":
                return json.dumps(
                    {"message": "tokenNothing", "text": "JWT未提出"}, ensure_ascii=False
                )
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute(
                    "SELECT * FROM tskb_combination WHERE id = ?;",
                    [_dataDict["combination_id"]],
                )
                _combination = cur.fetchone()
                if _combination == None:
                    return json.dumps(
                        {"message": "notExist", "text": "レシピ不明"},
                        ensure_ascii=False,
                    )
                if _combination["userid"] != token["id"]:
                    return json.dumps(
                        {"message": "youerntOwner", "text": "所有権無"},
                        ensure_ascii=False,
                    )
                cur.execute(
                    "DELETE FROM tskb_combination WHERE userid = ? AND id = ? ;",
                    [token["id"], _dataDict["combination_id"]],
                )
                conn.commit()
                return json.dumps({"message": "processed"}, ensure_ascii=False)
            return json.dumps({"message": "rejected", "text": "不明なエラー"})

    return "404: nof found → main.html", 404


# isolation
if __name__ == "__main__":
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(os.path.dirname(os.path.join("./", __file__)))
    app = flask.Flask(__name__, template_folder="./", static_folder="./static/")
    app.config["MAX_CONTENT_LENGTH"] = 100000000
    os.makedirs("./tmp", exist_ok=True)

    # FaaS: root this
    @app.route("/", methods=["GET", "POST"])
    def py_show():
        try:
            return show(flask.request)
        except Exception as e:
            return "500 error⇒" + str(e), 500

    # run
    app.run()
