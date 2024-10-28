# Standard
import hashlib
import os
import sys
import importlib
import json
import threading
import time
from urllib import parse
# Additional
import flask
import urllib3
import certifi
from google.cloud import firestore
from google.cloud import storage as firestorage


# global variable
access_counter = 0
restartflag: bool = False

# application
with open(os.path.join(os.path.dirname(__file__), "config.json"), "r", encoding="utf-8") as fp:
    try:  # on CaaS
        wsgi_h = importlib.import_module("wsgi_h")
        db = wsgi_h.db
        DELETE_FIELD = wsgi_h.DELETE_FIELD
        storage = wsgi_h.GCS.get_bucket(json.load(fp)["GCS_bucket"])
    except:  # on FaaS
        db = firestore.Client()
        DELETE_FIELD = firestore.DELETE_FIELD
        storage = firestorage.Client().get_bucket(json.load(fp)["GCS_bucket"])


def postFunc(request):
    try:
        _dataDict = json.loads(request.get_data())
        _docRef = db.document(_dataDict["uri"])
        # Confirm permission
        if(_dataDict["uri"].startswith("oszv_c") == True):
            # Operation
            if(_dataDict["type"] == "create"):
                _docRef.set(_dataDict["recodes"], merge=True)
            if(_dataDict["type"] == "delete"):
                _docRef.set({list(_dataDict["recodes"])[0]: DELETE_FIELD}, merge=True)
            return json.dumps("oszv_c_OK", ensure_ascii=False), 200
        if(_dataDict["uri"].startswith("mypage") == True):
            # Operation
            if(_dataDict["type"] == "called"):
                _docRef.set({"announce":"called"}, merge=True)
                return json.dumps("called_OK", ensure_ascii=False), 200
            if(_dataDict["type"] == "gotOrder"):
                _docRef.set({"announce":"gotOrder"}, merge=True)
                return json.dumps("gotOrder_OK", ensure_ascii=False), 200
            if(_dataDict["type"] == "nurseCall"):
                _docRef.set({"announce":"nurseCall"}, merge=True)
                return json.dumps("nurseCall_OK", ensure_ascii=False), 200
    except:
        return json.dumps("error on postFunc", ensure_ascii=False), 200


def show(request):

    if request.method == "POST":
        return postFunc(request)

    # render
    kwargs = {}
    with open(os.path.join(os.path.dirname(__file__), "main.html"), "r", encoding="utf-8") as f:
        html = f.read()
        for kw, arg in kwargs.items():
            html = html.replace("{{"+kw+"}}", arg)
        return flask.render_template_string(html)
    return "404: nof found → main.html", 404
