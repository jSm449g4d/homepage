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
    "(id,name,tag,description,userid,user,passhash,timestamp,contents)"
    # contents={material_id:amount}
    # passhash="": public ,"0": private
    cur.execute(
        "CREATE TABLE IF NOT EXISTS tskb_combination(id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "name TEXT UNIQUE NOT NULL,tag TEXT NOT NULL,description TEXT DEFAULT '',"
        "userid INTEGER NOT NULL,user TEXT NOT NULL,passhash TEXT DEFAULT '',timestamp INTEGER NOT NULL,"
        "contents TEXT NOT NULL)"
    )
    # passhash="": public ,"0": private
    "(id,name,tag,description,userid,user,passhash,timestamp,"
    "unit,cost,carbo,fiber,protein,fat,saturated_fat,n3,DHA_EPA,n6,"
    "ca,cl,cr,cu,i,fe,mg,mn,mo,p,k,se,na,zn,va,vb1,vb2,vb3,vb5,vb6,vb7,vb9,vb12,vc,vd,ve,vk,colin,kcal)"
    cur.execute(
        "CREATE TABLE IF NOT EXISTS tskb_material(id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "name TEXT UNIQUE NOT NULL,tag TEXT NOT NULL,description TEXT DEFAULT '',"
        "userid INTEGER NOT NULL,user TEXT NOT NULL,passhash TEXT DEFAULT '',timestamp INTEGER NOT NULL,"
        "unit REAL DEFAULT 100,cost REAL DEFAULT 0,"
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


def isfloat(_s):
    try:
        _f = float(_s)
    except ValueError:
        return 0
    else:
        return _f


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
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # process start
                # select combination
                _userid = -1
                if token != "":
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
                if _combination["passhash"] != "":
                    if _combination["userid"] != _userid:
                        return json.dumps(
                            {"message": "wrongPass", "text": "アクセス拒否"},
                            ensure_ascii=False,
                        )
                # select material
                _contents = json.loads(_combination["contents"])
                _materials = []
                for _key, _val in _contents.items():
                    cur.execute("SELECT * FROM tskb_material WHERE id = ?;", [_key])
                    _material = cur.fetchone()
                    if _material == None:
                        continue
                    if _material["passhash"] != "":
                        if _material["userid"] != _userid:
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
            _material = _dataDict["material"]
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                _materialid = _material["id"]
                _timestamp = _material["timestamp"]
                # process start
                # register material
                if _materialid == -1:
                    _timestamp = int(time.time())
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
                            _material["passhash"],
                            _timestamp,
                        ],
                    )
                    conn.commit()
                    cur.execute(
                        "SELECT * FROM tskb_material WHERE userid = ? AND timestamp = ?;",
                        [token["id"], _timestamp],
                    )
                    _Cmaterial = cur.fetchone()
                    _materialid = _Cmaterial["id"]
                # update material
                cur.execute(
                    "SELECT * FROM tskb_material WHERE id = ?;",
                    [_materialid],
                )
                _Cmaterial = cur.fetchone()
                if _Cmaterial == None:
                    return json.dumps(
                        {"message": "notExist", "text": "素材不明"}, ensure_ascii=False
                    )
                if _Cmaterial["userid"] != token["id"]:
                    return json.dumps(
                        {"message": "wrongPass", "text": "アクセス拒否"},
                        ensure_ascii=False,
                    )
                if isfloat(_material["unit"]) < 1:
                    _material["unit"] = 1
                cur.execute(
                    "UPDATE tskb_material SET name = ?,description = ?,"
                    "userid = ?,user = ?,passhash = ?,timestamp = ?,"
                    "unit = ?,cost = ?,carbo = ?,fiber= ? ,protein = ?,"
                    "fat = ?,saturated_fat = ?,n3 = ?,DHA_EPA = ?,n6 = ?,"
                    "ca = ?,cl = ?,cr = ?,cu = ?,i = ?,fe = ?,mg = ?,mn = ?,"
                    "mo = ?,p = ?,k = ?,se = ?,na = ?,zn = ?,va = ?,vb1 = ?,"
                    "vb2 = ?,vb3 = ?,vb5 = ?,vb6 = ?,vb7 = ?,"
                    "vb9 = ?,vb12 = ?,vc = ?,vd = ?,ve = ?,vk = ?,"
                    "colin = ?,kcal = ? WHERE id = ?;",
                    [
                        _material["name"],
                        _material["description"],
                        token["id"],
                        _dataDict["user"],
                        _material["passhash"],
                        _timestamp,
                        isfloat(_material["unit"]),
                        isfloat(_material["cost"]),
                        isfloat(_material["carbo"]),
                        isfloat(_material["fiber"]),
                        isfloat(_material["protein"]),
                        isfloat(_material["fat"]),
                        isfloat(_material["saturated_fat"]),
                        isfloat(_material["n3"]),
                        isfloat(_material["DHA_EPA"]),
                        isfloat(_material["n6"]),
                        isfloat(_material["ca"]),
                        isfloat(_material["cl"]),
                        isfloat(_material["cr"]),
                        isfloat(_material["cu"]),
                        isfloat(_material["i"]),
                        isfloat(_material["fe"]),
                        isfloat(_material["mg"]),
                        isfloat(_material["mn"]),
                        isfloat(_material["mo"]),
                        isfloat(_material["p"]),
                        isfloat(_material["k"]),
                        isfloat(_material["se"]),
                        isfloat(_material["na"]),
                        isfloat(_material["zn"]),
                        isfloat(_material["va"]),
                        isfloat(_material["vb1"]),
                        isfloat(_material["vb2"]),
                        isfloat(_material["vb3"]),
                        isfloat(_material["vb5"]),
                        isfloat(_material["vb6"]),
                        isfloat(_material["vb7"]),
                        isfloat(_material["vb9"]),
                        isfloat(_material["vb12"]),
                        isfloat(_material["vc"]),
                        isfloat(_material["vd"]),
                        isfloat(_material["ve"]),
                        isfloat(_material["vk"]),
                        isfloat(_material["colin"]),
                        isfloat(_material["kcal"]),
                        _Cmaterial["id"],
                    ],
                )
                conn.commit()
                cur.execute(
                    "SELECT * FROM tskb_material WHERE id = ?;",
                    [_materialid],
                )
                _Cmaterial = cur.fetchone()
                return json.dumps(
                    {"message": "processed", "material": dict(_Cmaterial)},
                    ensure_ascii=False,
                )
            return json.dumps({"message": "rejected", "text": "不明なエラー"})

        if "delete" in request.form:
            _dataDict.update(json.loads(request.form["delete"]))
            if token == "":
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
            _dataDict.update(json.loads(request.form["search"]))
            _userid = -1
            if token != "":
                _userid = token["id"]
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(
                    "SELECT * FROM tskb_combination where passhash == '' OR "
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
            if token == "":
                return json.dumps(
                    {"message": "tokenNothing", "text": "JWT未提出"}, ensure_ascii=False
                )
            _passhash = ""
            token = jwt.decode(_dataDict["token"], pyJWT_pass, algorithms=["HS256"])
            if _dataDict["privateFlag"] == True:
                _passhash = "0"
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
                        _passhash,
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

        if "combine" in request.form:
            _dataDict.update(json.loads(request.form["combine"]))
            if token == "":
                return json.dumps(
                    {"message": "tokenNothing", "text": "JWT未提出"}, ensure_ascii=False
                )
            _combination = _dataDict["combination"]
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute(
                    "SELECT * FROM tskb_combination WHERE id = ?;",
                    [_combination["id"]],
                )
                _Ccombination = cur.fetchone()
                if _Ccombination == None:
                    return json.dumps(
                        {"message": "notExist", "text": "存在しません"},
                        ensure_ascii=False,
                    )
                if _Ccombination["userid"] != token["id"]:
                    return json.dumps(
                        {"message": "wrongPass", "text": "アクセス拒否"},
                        ensure_ascii=False,
                    )
                _contents = json.loads(_Ccombination["contents"])
                if "add_material" in _dataDict:
                    if _dataDict["add_material"] in _contents:
                        return json.dumps(
                            {"message": "alreadyExisted", "text": "既存です"},
                            ensure_ascii=False,
                        )

                    _contents.update({_dataDict["add_material"]: 0})
                if "del_material" in _dataDict:
                    _contents.pop(_dataDict["del_material"])
                cur.execute(
                    "UPDATE tskb_combination SET userid = ?, user = ?,"
                    "contents = ? WHERE id = ?;",
                    [
                        token["id"],
                        _dataDict["user"],
                        json.dumps(
                            _contents,
                            ensure_ascii=False,
                        ),
                        _combination["id"],
                    ],
                )
                conn.commit()
                cur.execute(
                    "SELECT * FROM tskb_combination WHERE id = ?;",
                    [_combination["id"]],
                )
                _Ccombination = cur.fetchone()
                return json.dumps(
                    {"message": "processed", "combination": dict(_Ccombination)},
                    ensure_ascii=False,
                )
            return json.dumps({"message": "rejected"})

        if "update" in request.form:
            _dataDict.update(json.loads(request.form["update"]))
            if token == "":
                return json.dumps(
                    {"message": "tokenNothing", "text": "JWT未提出"}, ensure_ascii=False
                )
            _combination = _dataDict["combination"]
            with closing(sqlite3.connect(db_dir)) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                # check duplication
                cur.execute(
                    "SELECT * FROM tskb_combination WHERE id = ?;",
                    [_combination["id"]],
                )
                _Ccombination = cur.fetchone()
                if _Ccombination == None:
                    return json.dumps(
                        {"message": "alreadyExisted", "text": "存在しません"},
                        ensure_ascii=False,
                    )
                if _Ccombination["userid"] != token["id"]:
                    return json.dumps(
                        {"message": "wrongPass", "text": "アクセス拒否"},
                        ensure_ascii=False,
                    )
                _contents = json.loads(_Ccombination["contents"])
                cur.execute(
                    "UPDATE tskb_combination SET name = ?, description = ?,"
                    " userid = ?, user = ?, passhash = ? ,contents = ? WHERE id = ?;",
                    [
                        _combination["name"],
                        _combination["description"],
                        token["id"],
                        _dataDict["user"],
                        _combination["passhash"],
                        _combination["contents"],
                        _combination["id"],
                    ],
                )
                conn.commit()
                cur.execute(
                    "SELECT * FROM tskb_combination WHERE id = ?;",
                    [_combination["id"]],
                )
                _Ccombination = cur.fetchone()
                return json.dumps(
                    {"message": "processed", "combination": dict(_Ccombination)},
                    ensure_ascii=False,
                )
            return json.dumps({"message": "rejected"})

        if "destroy" in request.form:
            _dataDict.update(json.loads(request.form["destroy"]))
            if token == "":
                return json.dumps(
                    {"message": "tokenNothing", "text": "JWT未提出"}, ensure_ascii=False
                )
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
                cur.execute(
                    "DELETE FROM tskb_combination WHERE id = ? AND userid = ?;",
                    [_dataDict["combination_id"], token["id"]],
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
