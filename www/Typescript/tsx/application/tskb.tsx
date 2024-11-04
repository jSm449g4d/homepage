import React, { useState, useEffect } from 'react';

import { jpclock, Unixtime2String } from "../components/util";
import { HIModal, CIModal } from "../components/imodals";
import { accountSetState } from '../components/slice'
import { useAppSelector, useAppDispatch } from '../components/store'
import "../stylecheets/style.sass";
import { string } from 'prop-types';

export const AppMain = () => {
    const user = useAppSelector((state) => state.account.user)
    const userId = useAppSelector((state) => state.account.id)
    const token = useAppSelector((state) => state.account.token)
    const roomKey = useAppSelector((state) => state.account.roomKey)
    const dispatch = useAppDispatch()
    const xhrTimeout = 3000
    const fileSizeMax = 1024 * 1024 * 2

    const [room, setRoom] = useState({ "id": -1, "user": "", "userid": -1, "room": "", "timestamp": 0, "passhash": "" })
    const [combination, setCombination] = useState({
        "id": -1, "name": "", "tag": [], "description": "", "userid": -1, "user": "",
        "timestamp": 0, "passhash": "", "contents": ""
    })
    const [tmpCombination, setTmpCombination] = useState("")
    const [tmpMaterial, setTmpMaterial] = useState("")
    const [tmpnutrition, setTmpNutrition] = useState({})
    const [tmpRoomKey, setTmpRoomKey] = useState("")
    const [tmpText, setTmpText] = useState("")
    const [tmpDescription, setTmpDescription] = useState("")
    const [contents, setContents] = useState([])
    const [searchContents, setSearchContents] = useState([])
    const [tmpAttachment, setTmpAttachment] = useState(null)
    const [tmpTargetId, setTmpTargetId] = useState("")
    const [tmpPrivateFlag, setTmpPrivateFlag] = useState(false)

    useEffect(() => {
        if (combination["name"] == "") searchCombination()
        else fetchMaterial()
    }, [userId])
    useEffect(() => { searchCombination() }, [])

    // jpclock (decoration)
    const [jpclockNow, setJpclockNow] = useState("")
    useEffect(() => {
        const _intervalId = setInterval(() => setJpclockNow(jpclock()), 500);
        return () => clearInterval(_intervalId);
    }, []);
    // related to fetchAPI
    const roadDelay = (_callback = () => { }, _delay = 100) => {
        setTimeout(() => { _callback(); }, _delay);
    }
    const stringForSend = (_additionalDict: {} = {}) => {
        const _sendDict = Object.assign(
            {
                "token": token, "text": tmpText, "user": user, roomid: room["id"], roomKey: roomKey,
            }, _additionalDict)
        return (JSON.stringify(_sendDict))
    }
    const enterCombination = (_setContentsInitialze = true) => {
        if (_setContentsInitialze) { setContents([]), setSearchContents([]) }
        setTmpCombination(""); setTmpMaterial(""); setTmpNutrition({}); setTmpText(""); setTmpRoomKey("");
        setTmpAttachment(null); setTmpDescription("")
        $('#inputConsoleAttachment').val(null)
    }
    const exitCombination = (_setContentsInitialze = true) => {
        if (_setContentsInitialze) { setContents([]), setSearchContents([]) }
        setCombination({
            "id": -1, "name": "", "tag": [], "description": "", "userid": -1, "user": "",
            "timestamp": 0, "passhash": "", "contents": ""
        })
        setTmpCombination(""); setTmpMaterial(""); setTmpNutrition({}); setTmpText(""); setTmpRoomKey("");
        setTmpAttachment(null); setTmpDescription("")
    }
    const satisfyDictKeys = (_targetDict: {}, _keys: any[]) => {
        for (let _i = 0; _i < _keys.length; _i++) if (_keys[_i] in _targetDict == false) return false
        return true
    }
    const fetchChat = (_roomid = room["id"], _roomKey = roomKey) => { }
    const exploreMaterial = (_combinationid = combination["id"], _roomKey = roomKey) => {
        const sortSetSearchContents = (_contents: any = []) => {
            const _sortContents = (a: any, b: any) => { return a["timestamp"] - b["timestamp"] }
            setSearchContents(_contents.sort(_sortContents))
        }
        enterCombination(false)
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("explore", JSON.stringify({ "keyword": tmpMaterial }))
        const request = new Request("/tskb/main.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed": {
                        sortSetSearchContents(resJ["materials"]); break;

                    }
                    case "wrongPass": {
                        CIModal("部屋のパスワードが違います")
                        searchCombination(); break;
                    }
                    case "notExist": {
                        CIModal("部屋が存在しません")
                        searchCombination(); break;
                    }
                    case "tokenNothing": {
                        CIModal("JWTトークン未提出")
                        searchCombination(); break;
                    }
                    case "tokenTimeout": {
                        CIModal("JWTトークンタイムアウト");
                        break;
                    }
                    default: {
                        CIModal("その他のエラー")
                        searchCombination(); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    const fetchMaterial = (_combinationid = combination["id"], _roomKey = roomKey) => {
        const sortSetContents = (_contents: any = []) => {
            const _sortContents = (a: any, b: any) => { return a["timestamp"] - b["timestamp"] }
            setContents(_contents.sort(_sortContents))
        }
        enterCombination(false)
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("fetch", JSON.stringify({ "combinationid": _combinationid, "roomKey": _roomKey }))
        const request = new Request("/tskb/main.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed": {
                        setCombination(resJ["combination"]);
                        sortSetContents(resJ["materials"]);
                        dispatch(accountSetState({ token: resJ["token"] })); break;

                    }
                    case "wrongPass": {
                        CIModal("部屋のパスワードが違います")
                        searchCombination(); break;
                    }
                    case "notExist": {
                        CIModal("部屋が存在しません")
                        searchCombination(); break;
                    }
                    case "tokenNothing": {
                        CIModal("JWTトークン未提出")
                        searchCombination(); break;
                    }
                    case "tokenTimeout": {
                        CIModal("JWTトークンタイムアウト");
                        break;
                    }
                    default: {
                        CIModal("その他のエラー")
                        searchCombination(); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    const registerMaterial = () => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("register", JSON.stringify(Object.assign({
            "name": tmpMaterial, "description": tmpDescription,
            "roomKey": tmpRoomKey, "privateFlag": tmpPrivateFlag,
            "materialid": tmpTargetId, "tmpnutrition": tmpnutrition
        }),

        ))
        const request = new Request("/tskb/main.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed": roadDelay(fetchMaterial); break;
                    case "wrongPass": {
                        CIModal("部屋のパスワードが違います")
                        searchCombination(); break;
                    }
                    case "notExist": {
                        CIModal("部屋が存在しません")
                        searchCombination(); break;
                    }
                    case "tokenNothing": {
                        CIModal("JWTトークン未提出")
                        searchCombination(); break;
                    }
                    default: {
                        CIModal("その他のエラー")
                        searchCombination(); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    const deleteChat = (_id: number) => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("delete", JSON.stringify({ "chatid": _id }))
        const request = new Request("/tptef/main.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed": roadDelay(fetchChat); break;
                    case "wrongPass": {
                        CIModal("部屋のパスワードが違います")
                        searchRoom(); break;
                    }
                    case "notExist": {
                        CIModal("部屋が存在しません")
                        searchRoom(); break;
                    }
                    case "tokenNothing": {
                        CIModal("JWTトークン未提出")
                        searchRoom(); break;
                    }
                    default: {
                        CIModal("その他のエラー")
                        searchRoom(); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    const downloadChat = (_id: number, _fileName: string = "") => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("download", JSON.stringify({ "chatid": _id }))
        const request = new Request("/tptef/main.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.blob())
            .then(blob => {
                var a = document.createElement("a");
                a.href = window.URL.createObjectURL(blob);
                document.body.appendChild(a);
                a.setAttribute("style", "display: none");
                a.setAttribute("download", _fileName);
                a.click();
                roadDelay(fetchChat)
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    const searchRoom = () => {
    }
    const searchCombination = () => {
        const sortSetContentsRev = (_contents: any = []) => {
            const _sortContentsRev = (a: any, b: any) => { return b["timestamp"] - a["timestamp"] }
            setContents(_contents.sort(_sortContentsRev))
        }
        exitCombination(false)
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("search", JSON.stringify({}))
        const request = new Request("/tskb/main.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed": {
                        sortSetContentsRev(resJ["combinations"]);
                        dispatch(accountSetState({ token: resJ["token"] })); break;
                    }
                    case "tokenTimeout": {
                        CIModal("JWTトークンタイムアウト");
                        break;
                    }
                    default: {
                        CIModal("その他のエラー")
                        break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    const createCombination = () => {
        exitCombination()
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("create", JSON.stringify({
            "name": tmpCombination, "description": tmpDescription,
            "roomKey": tmpRoomKey, "privateFlag": tmpPrivateFlag,
        }))
        const request = new Request("/tskb/main.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed": roadDelay(searchCombination); break;
                    case "alreadyExisted": {
                        CIModal("既存の名前")
                        searchCombination(); break;
                    }
                    case "tokenNothing": {
                        CIModal("JWTトークン未提出")
                        searchCombination(); break;
                    }
                    default: {
                        CIModal("その他のエラー")
                        searchCombination(); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    const destroyCombination = (_id = combination["id"]) => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("destroy", JSON.stringify({ "combination_id": _id }))
        const request = new Request("/tskb/main.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed": roadDelay(searchCombination); break;
                    case "notExist": {
                        CIModal("レシピが存在しません")
                        searchCombination(); break;
                    }
                    case "tokenNothing": {
                        CIModal("JWTトークン未提出")
                        searchCombination(); break;
                    }
                    case "youerntOwner": {
                        CIModal("所有権がありません")
                        searchCombination(); break;
                    }
                    default: {
                        CIModal("その他のエラー")
                        searchCombination(); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    // ConsoleRender
    const combinationTopFormRender = () => {
        const combinationCreateModal = () => {
            return (
                <div>
                    <div className="modal fade" id="combinationCreateModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3 className="modal-title fs-5">
                                        <i className="fa-solid fa-hammer mx-1" />レシピ作成
                                    </h3>
                                </div>
                                <div className="modal-body row">
                                    <div className="input-group m-1 col-12">
                                        <span className="input-group-text">レシピ名</span>
                                        <input type="text" className="form-control" placeholder="Username" aria-label="user"
                                            value={tmpCombination} onChange={(evt) => { setTmpCombination(evt.target.value) }} />
                                    </div>
                                    <div className="form-check form-switch m-1">
                                        <label className="form-check-label">非公開設定</label>
                                        <input className="form-check-input" type="checkbox" role="switch" checked={tmpPrivateFlag}
                                            style={{ transform: "rotate(90deg)" }}
                                            onChange={(evt: any) => {
                                                if (evt.target.checked == true) {
                                                    setTmpPrivateFlag(true)
                                                    $("#combinationCreateModalRoomKey").prop("disabled", true)
                                                    setTmpRoomKey("")
                                                }
                                                else {
                                                    setTmpPrivateFlag(false)
                                                    $("#combinationCreateModalRoomKey").prop("disabled", false)
                                                }
                                            }}>
                                        </input>
                                    </div>
                                    <div className="input-group m-1 col-12">
                                        <span className="input-group-text">Pass</span>
                                        <input type="text" className="form-control" placeholder="Password" aria-label="pass"
                                            id="combinationCreateModalRoomKey"
                                            value={tmpRoomKey} onChange={(evt) => { setTmpRoomKey(evt.target.value) }} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    {tmpCombination != "" && token != "" ? <div>
                                        {tmpRoomKey == "" ?
                                            <button type="button" className="btn btn-outline-primary" data-bs-dismiss="modal"
                                                onClick={() => createCombination()}>
                                                <i className="fa-solid fa-hammer mx-1" style={{ pointerEvents: "none" }} />作成
                                            </button> :
                                            <button type="button" className="btn btn-outline-warning" data-bs-dismiss="modal"
                                                onClick={() => {
                                                    dispatch(accountSetState({ "roomKey": tmpRoomKey }))
                                                    createCombination()
                                                }}>
                                                <i className="fa-solid fa-key mx-1" style={{ pointerEvents: "none" }} />作成
                                            </button>
                                        }</div> :
                                        <button type="button" className="btn btn-outline-primary" disabled>
                                            <i className="fa-solid fa-hammer mx-1" style={{ pointerEvents: "none" }} />作成
                                        </button>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div>
                {combinationCreateModal()}
                <div className="input-group d-flex justify-content-center align-items-center my-1">

                    <button className="btn btn-outline-success btn-lg" type="button"
                        onClick={() => { searchCombination() }}>
                        <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                    </button>
                    <input className="flex-fill form-control form-control-lg" type="text" placeholder="レシピ検索"
                        value={tmpCombination} onChange={(evt: any) => { setTmpCombination(evt.target.value) }} />
                    {token == "" ?
                        <button className="btn btn-outline-info btn-lg" type="button"
                            onClick={() => {
                                HIModal("レシピ作成にはログインが必要")
                            }}>
                            <i className="fa-solid fa-circle-info mx-1" style={{ pointerEvents: "none" }} />
                            レシピ作成
                        </button> :
                        <button className="btn btn-outline-primary btn-lg" type="button"
                            onClick={() => {
                                setTmpCombination("")
                                $('#combinationCreateModal').modal('show');
                            }}>
                            <i className="fa-solid fa-hammer mx-1" style={{ pointerEvents: "none" }} />
                            レシピ作成
                        </button>}
                </div>
            </div>)
    }
    const combinationTable = () => {
        const combinationInterModal = () => {
            return (
                <div className="modal fade" id="combinationInterModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5">
                                    <i className="fa-solid fa-lock mx-1" />パスワード入力
                                </h1>
                            </div>
                            <div className="modal-body row">
                                <div className="input-group m-1 col-12">
                                    <span className="input-group-text">Pass</span>
                                    <input type="text" className="form-control" placeholder="Password" aria-label="pass"
                                        value={tmpRoomKey} onChange={(evt) => { setTmpRoomKey(evt.target.value) }} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" value={-1} id="combinationInterModalButton"
                                    className="btn btn-secondary" data-bs-dismiss="modal">
                                    Close
                                </button>
                                {tmpRoomKey != "" ?
                                    <button type="button" className="btn btn-outline-primary" data-bs-dismiss="modal"
                                        onClick={
                                            () => {
                                                // roomKey cannot be updated in time
                                                dispatch(accountSetState({ roomKey: tmpRoomKey }))
                                                fetchMaterial(Number(tmpTargetId), tmpRoomKey)
                                            }}>
                                        <i className="fa-solid fa-right-to-bracket mx-1" style={{ pointerEvents: "none" }} />閲覧
                                    </button> :
                                    <button type="button" className="btn btn-outline-primary" disabled>
                                        <i className="fa-solid fa-right-to-bracket mx-1" style={{ pointerEvents: "none" }} />閲覧
                                    </button>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        const combinationTableDestroycombinationConfirmationModal = () => {
            return (
                <div className="modal fade" id="combinationTableDestroycombinationConfirmationModal"
                    aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">
                                    <i className="fa-solid fa-circle-info mx-1" />レシピを破棄しますか?
                                </h4>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal"
                                    onClick={() => { destroyCombination(Number(tmpTargetId)) }}>
                                    <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }} />破棄
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        const _tmpRecord = [];
        if (0 < contents.length)
            if (!satisfyDictKeys(contents[0], ["id", "name", "description", "userid", "user", "passhash", "timestamp", "contents"]))
                return (<div className="row m-1">loading</div>)
        for (var i = 0; i < contents.length; i++) {
            if (contents[i]["name"].indexOf(tmpCombination) == -1) continue
            const _tmpData = [];
            var _style = { background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.2))" }
            if (contents[i]["passhash"] != "") { _style = { background: "linear-gradient(rgba(60,60,60,0), rgba(150,150,60,0.2))" } }
            if (contents[i]["passhash"] == "0") { _style = { background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,150,0.2))" } }
            _tmpData.push(
                <div className="col-12 border d-flex" style={_style}>
                    <h5 className="me-auto">
                        <i className="fa-solid fa-jar mx-1"></i>{contents[i]["name"]}
                    </h5>
                    {contents[i]["passhash"] == "" ?
                        <button className="btn btn-outline-primary rounded-pill"
                            onClick={(evt: any) => { fetchMaterial(evt.target.value) }} value={contents[i]["id"]}>
                            <i className="fa-solid fa-right-to-bracket mx-1" style={{ pointerEvents: "none" }}></i>閲覧
                        </button> :
                        <button className="btn btn-outline-dark rounded-pill"
                            onClick={(evt: any) => {
                                setTmpTargetId(evt.target.value)
                                $('#combinationInterModal').modal('show')
                            }} value={contents[i]["id"]}>
                            <i className="fa-solid fa-lock mx-1" style={{ pointerEvents: "none" }}></i>閲覧
                        </button>
                    }
                    {contents[i]["userid"] == userId ?
                        <button className="btn btn-outline-danger rounded-pill"
                            onClick={(evt: any) => {
                                setTmpTargetId(evt.target.value)
                                $('#combinationTableDestroycombinationConfirmationModal').modal('show');
                            }} value={contents[i]["id"]}>
                            <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>破棄
                        </button> : <div></div>
                    }
                </div>)
            _tmpData.push(
                <div className="col-12 col-md-10 p-1 d-flex justify-content-center align-items-center border">
                    <div>
                        {contents[i]["description"]}
                    </div>
                </div>)
            _tmpData.push(
                <div className="col-12 col-md-2 p-1 border"><div className="text-center">
                    {Unixtime2String(Number(contents[i]["timestamp"]))}
                </div></div>)
            _tmpRecord.push(
                <div className="col-12 col-md-6" style={{
                    border: "1px inset silver", borderRadius: "5px", marginBottom: "3px", boxShadow: "2px 2px 1px rgba(60,60,60,0.2)"
                }}>
                    <div className="row p-1">{_tmpData}</div>
                </div>
            )
        }
        return (
            <div>
                {combinationInterModal()}
                {combinationTableDestroycombinationConfirmationModal()}
                <div className="row m-1">{_tmpRecord}
                </div>
            </div>)
    }
    const materialTopFormRender = () => {
        const destroyCombinationConfirmationModal = () => {
            return (
                <div className="modal fade" id="destroyCombinationConfirmationModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">
                                    <i className="fa-solid fa-circle-info mx-1" />レシピを破棄しますか?
                                </h4>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal"
                                    onClick={() => { destroyCombination() }}>
                                    <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }} />破棄
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div>
                {destroyCombinationConfirmationModal()}
                <div className="input-group d-flex justify-content-center align-items-center my-1">
                    <button className="btn btn-outline-success btn-lg" type="button"
                        onClick={() => { fetchMaterial() }}>
                        <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                    </button>
                    <button className="btn btn-outline-dark btn-lg" type="button"
                        disabled>
                        <i className="far fa-user mx-1"></i>{combination["user"]}
                    </button>
                    <input className="flex-fill form-control form-control-lg" type="text" value={combination["name"]}
                        disabled>
                    </input >
                    {combination["userid"] == userId ?
                        <button className="btn btn-outline-danger btn-lg" type="button"
                            onClick={() => { $("#destroyCombinationConfirmationModal").modal('show') }}>
                            <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>レシピ破棄
                        </button> :
                        <button className="btn btn-outline-info btn-lg" type="button"
                            onClick={() => { HIModal("レシピ破棄は作成者にしかできません") }}>
                            <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>レシピ破棄
                        </button>
                    }
                    <button className="btn btn-outline-dark btn-lg" type="button"
                        onClick={() => { searchCombination() }}>
                        <i className="fa-solid fa-right-from-bracket mx-1"></i>レシピ一覧に戻る
                    </button>
                </div></div>)
    }
    const materialAddFormRender = () => {
        const destroyMaterialConfirmationModal = () => {
            return (
                <div className="modal fade" id="destroyMaterialConfirmationModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">
                                    <i className="fa-solid fa-circle-info mx-1" />レシピを破棄しますか?
                                </h4>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal"
                                    onClick={() => { destroyCombination() }}>
                                    <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }} />破棄
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        const materialCreateModal = () => {
            return (
                <div>
                    <div className="modal fade" id="materialCreateModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3 className="modal-title fs-5">
                                        <i className="fa-solid fa-lemon mx-1" />素材追加
                                    </h3>
                                </div>
                                <div className="modal-body row">
                                    <div className="input-group m-1 col-12">
                                        <span className="input-group-text">素材名</span>
                                        <input type="text" className="form-control" placeholder="Username" aria-label="user"
                                            value={tmpCombination} onChange={(evt) => { setTmpCombination(evt.target.value) }} />
                                    </div>
                                    <div className="form-check form-switch m-1">
                                        {tmpPrivateFlag == true ?
                                            <label className="form-check-label">
                                                <i className="fa-solid fa-lock mx-1" />非公開</label> :
                                            <label className="form-check-label">
                                                <i className="fa-solid fa-lock-open mx-1" />公開</label>
                                        }
                                        <input className="form-check-input" type="checkbox" role="switch" checked={tmpPrivateFlag}
                                            style={{ transform: "rotate(90deg)" }}
                                            onChange={(evt: any) => {
                                                if (evt.target.checked == true) {
                                                    setTmpPrivateFlag(true)
                                                }
                                                else {
                                                    setTmpPrivateFlag(false)
                                                }
                                            }}>
                                        </input>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    {tmpCombination != "" && token != "" ? <div>
                                        {tmpRoomKey == "" ?
                                            <button type="button" className="btn btn-outline-primary" data-bs-dismiss="modal"
                                                onClick={() => createCombination()}>
                                                <i className="fa-solid fa-hammer mx-1" style={{ pointerEvents: "none" }} />作成
                                            </button> :
                                            <button type="button" className="btn btn-outline-warning" data-bs-dismiss="modal"
                                                onClick={() => {
                                                    dispatch(accountSetState({ "roomKey": tmpRoomKey }))
                                                    createCombination()
                                                }}>
                                                <i className="fa-solid fa-key mx-1" style={{ pointerEvents: "none" }} />作成
                                            </button>
                                        }</div> :
                                        <button type="button" className="btn btn-outline-primary" disabled>
                                            <i className="fa-solid fa-hammer mx-1" style={{ pointerEvents: "none" }} />作成
                                        </button>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        const materialConfigModal = () => {
            return (
                <div>
                    <div className="modal fade" id="materialConfigModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3 className="modal-title fs-5">
                                        <i className="fa-solid fa-lemon mx-1" />素材編集
                                    </h3>
                                </div>
                                <div className="modal-body row">
                                    <div className="input-group m-1 col-12">
                                        <span className="input-group-text">素材名</span>
                                        <input type="text" className="form-control" placeholder="Username" aria-label="user"
                                            value={tmpCombination} onChange={(evt) => { setTmpCombination(evt.target.value) }} />
                                    </div>
                                    <div className="form-check form-switch m-1">
                                        {tmpPrivateFlag == true ?
                                            <label className="form-check-label">
                                                <i className="fa-solid fa-lock mx-1" />非公開</label> :
                                            <label className="form-check-label">
                                                <i className="fa-solid fa-lock-open mx-1" />公開</label>
                                        }
                                        <input className="form-check-input" type="checkbox" role="switch" checked={tmpPrivateFlag}
                                            style={{ transform: "rotate(90deg)" }}
                                            onChange={(evt: any) => {
                                                if (evt.target.checked == true) {
                                                    setTmpPrivateFlag(true)
                                                }
                                                else {
                                                    setTmpPrivateFlag(false)
                                                }
                                            }}>
                                        </input>
                                    </div>
                                </div>
                                <div className="modal-footer d-flex">
                                    <button type="button" className="btn btn-secondary me-auto" data-bs-dismiss="modal">Close</button>
                                    {combination["userid"] == userId ?
                                        <div>
                                            <button type="button" className="btn btn-outline-primary"
                                                onClick={() => { }}>
                                                <i className="fa-solid fa-rotate-right mx-1" />更新
                                            </button>
                                            <button className="btn btn-outline-danger" type="button"
                                                onClick={() => { $("#destroyMaterialConfirmationModal").modal('show') }}>
                                                <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>素材破棄
                                            </button>
                                        </div> :
                                        <div>
                                            <button type="button" className="btn btn-outline-primary" data-bs-dismiss="modal"
                                                onClick={() => { }}>
                                                <i className="fa-solid fa-copy mx-1" style={{ pointerEvents: "none" }} />複製
                                            </button>
                                            <button className="btn btn-outline-info" type="button"
                                                onClick={() => { HIModal("権限について",
                                                "レシピ及び素材のの作成や編集は作成者しかできません"+
                                                "代わりに公開設定のそれらは複製できます※(予定です)開発中") }}>
                                                <i className="fa-solid fa-circle-info  mx-1" style={{ pointerEvents: "none" }}></i>
                                                権限の解説
                                            </button>
                                        </div>

                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div>
                {materialCreateModal()}
                {materialConfigModal()}
                {destroyMaterialConfirmationModal()}
                <div className="input-group d-flex justify-content-center align-items-center my-1">
                    <button className="btn btn-outline-success btn-lg" type="button"
                        onClick={() => { exploreMaterial() }}>
                        <i className="fa-solid fa-magnifying-glass mx-1" style={{ pointerEvents: "none" }} />
                        素材検索
                    </button>
                    <input className="flex-fill form-control form-control-lg" type="text" value={tmpMaterial}
                        onChange={(evt: any) => setTmpMaterial(evt.target.value)}>
                    </input >
                    {token!="" ?
                        <button className="btn btn-outline-success btn-lg" type="button"
                            onClick={() => { $("#materialConfigModal").modal('show') }}>
                            <i className="fa-solid fa-cheese mx-1" style={{ pointerEvents: "none" }}></i>素材編集
                        </button> :
                        <button className="btn btn-outline-info btn-lg" type="button"
                            onClick={() => { HIModal("ログインが必要です") }}>
                            <i className="fa-solid fa-cheese mx-1" style={{ pointerEvents: "none" }}></i>素材編集
                        </button>
                    }
                    {combination["userid"] == userId ?
                        <button className="btn btn-outline-primary btn-lg" type="button"
                            onClick={() => $("#materialCreateModal").modal("show")} >
                            + 素材作成
                        </button> :
                        <button className="btn btn-outline-info btn-lg" type="button"
                            onClick={() => HIModal("素材作成にはログインが必要")} >
                            + 素材作成
                        </button>}
                </div></div>)
    }
    const materialTable = () => {
        "(id,name,tag,description,userid,user,passhash,timestamp,"
        "g,cost,carbo,fiber,protein,fat,saturated_fat,n3,DHA_EPA,n6,"
        "ca,cr,cu,i,fe,mg,mn,mo,p,k,se,na,zn,va,vb1,vb2,vb3,vb5,vb6,vb7,vb9,vb12,vc,vd,ve,vk,colin,kcal)"
        if (0 < contents.length)
            if (!satisfyDictKeys(contents[0], ["id", "user", "userid", "roomid", "text", "mode", "timestamp", "contents"]))
                return (<div className="row m-1">loading</div>)
        const _tmpRecord = [];

        const _tmpElementColumns = [];
        // text
        _tmpElementColumns.push(
            <tr>
                <th scope="col">名称</th><th scope="col">概説</th><th scope="col">量</th><th scope="col">単価</th>
                <th scope="col">炭水化物</th><th scope="col">食物繊維</th><th scope="col">タンパク質</th><th scope="col">熱量</th>
                <th scope="col">脂質</th><th scope="col">飽和脂肪酸</th><th scope="col">n-3脂肪酸</th>
                <th scope="col">DHA-EPA</th><th scope="col">n-6脂肪酸</th><th scope="col">カルシウム</th>
                <th scope="col">クロム</th><th scope="col">銅</th><th scope="col">ヨウ素</th><th scope="col">鉄</th>
                <th scope="col">マグネシウム</th><th scope="col">マンガン</th><th scope="col">モリブデン</th>
                <th scope="col">リン</th><th scope="col">カリウム</th><th scope="col">セレン</th><th scope="col">ナトリウム</th>
                <th scope="col">亜鉛</th><th scope="col">VA</th><th scope="col">VB1</th><th scope="col">VB2</th>
                <th scope="col">vb3</th><th scope="col">vb5</th><th scope="col">vb6</th><th scope="col">vb7</th>
                <th scope="col">vb9</th><th scope="col">vb12</th><th scope="col">vc</th><th scope="col">vd</th>
                <th scope="col">ve</th><th scope="col">vk</th><th scope="col">コリン</th>
            </tr>
        )
        _tmpRecord.push(<thead>{_tmpElementColumns}</thead>)
        const _tmpTargetColumn = [];
        _tmpTargetColumn.push(
            <th>
                mokuhyouchi
            </th>)
        _tmpTargetColumn.push(
            <th>
                kari2
            </th>)
        _tmpTargetColumn.push(
            <th>
                kari3
            </th>)
        _tmpRecord.push(<tr className="table-success">{_tmpTargetColumn}</tr>)
        const _tmpCurrentColumns = [];
        _tmpCurrentColumns.push(
            <th>
                genzaichi
            </th>)
        _tmpCurrentColumns.push(
            <th>
                kari2
            </th>)
        _tmpCurrentColumns.push(
            <th>
                kari3
            </th>)
        _tmpRecord.push(<tr className="table-success">{_tmpCurrentColumns}</tr>)


        for (var i = 0; i < contents.length; i++) {
            const _tmpData = [];
            _tmpData.push(
                <th>
                    kari1
                </th>)
            _tmpData.push(
                <th>
                    kari2
                </th>)
            _tmpData.push(
                <th>
                    kari3
                </th>)
            if ((i % 5) % 2 == 0)
                _tmpRecord.push(<tr className="table-active">{_tmpData}</tr>)
            else
                _tmpRecord.push(<tr>{_tmpData}</tr>)
        }
        _tmpRecord.push(<tr><div>
        </div></tr>)

        for (var i = 0; i < searchContents.length; i++) {
            const _tmpData = [];
            _tmpData.push(
                <tr>
                    <th>{searchContents[i]["name"]}</th><th scope="col">概説</th><th scope="col">量</th><th scope="col">単価</th>
                    <th scope="col">炭水化物</th><th scope="col">食物繊維</th><th scope="col">タンパク質</th><th scope="col">熱量</th>
                    <th scope="col">脂質</th><th scope="col">飽和脂肪酸</th><th scope="col">n-3脂肪酸</th>
                    <th scope="col">DHA-EPA</th><th scope="col">n-6脂肪酸</th><th scope="col">カルシウム</th>
                    <th scope="col">クロム</th><th scope="col">銅</th><th scope="col">ヨウ素</th><th scope="col">鉄</th>
                    <th scope="col">マグネシウム</th><th scope="col">マンガン</th><th scope="col">モリブデン</th>
                    <th scope="col">リン</th><th scope="col">カリウム</th><th scope="col">セレン</th><th scope="col">ナトリウム</th>
                    <th scope="col">亜鉛</th><th scope="col">VA</th><th scope="col">VB1</th><th scope="col">VB2</th>
                    <th scope="col">vb3</th><th scope="col">vb5</th><th scope="col">vb6</th><th scope="col">vb7</th>
                    <th scope="col">vb9</th><th scope="col">vb12</th><th scope="col">vc</th><th scope="col">vd</th>
                    <th scope="col">ve</th><th scope="col">vk</th><th scope="col">コリン</th>
                </tr>
            )
            if ((i % 5) % 2 == 0)
                _tmpRecord.push(<tr className="table-active">{_tmpData}</tr>)
            else
                _tmpRecord.push(<tr>{_tmpData}</tr>)


        }
        return (
            <div>
                <table className="table table-dark table-bordered" ><tbody>{_tmpRecord}</tbody></table>
            </div>)
    }
    const inputConsole = () => {
        const remarkButton = () => {
            if (tmpAttachment == null && tmpMaterial == "")
                return (
                    <button className="btn btn-dark " disabled>
                        <i className="far fa-comment-dots mx-1" style={{ pointerEvents: "none" }}></i>要入力
                    </button>
                )
            return (
                <button className="btn btn-success"
                    onClick={() => { registerMaterial(); }}>
                    <i className="far fa-comment-dots mx-1" style={{ pointerEvents: "none" }}></i>送信
                </button>
            )
        }
        if (token == "") return (
            <div className="m-1 p-2 row w-100"
                style={{ color: "#CCFFFF", border: "3px double silver", background: "#001111" }}>
                <div className="col-12 d-flex justify-content-center">
                    <h5><i className="far fa-clock "></i>{jpclockNow}</h5>
                </div>
                <div className="col-12 my-1">
                    <div className="input-group">
                        <input type="file" className="form-control" placeholder="attachment file"
                            disabled />
                        <button className="btn btn-outline-info"
                            onClick={() => { HIModal("仮実装"); }}>
                            <i className="fa-solid fa-circle-info mx-1" style={{ pointerEvents: "none" }} ></i>送信
                        </button>
                    </div>
                </div>
            </div>)
        return (
            <div className="m-1 p-2 row w-100"
                style={{ color: "#CCFFFF", border: "3px double silver", background: "#001111" }}>
                <div className="col-12 d-flex justify-content-center">
                    <h5><i className="far fa-clock "></i>{jpclockNow}</h5>
                </div>
                <textarea className="form-control col-12 w-80" id="tptef_content" rows={4} value={tmpMaterial}
                    onChange={(evt) => { setTmpMaterial(evt.target.value) }}></textarea>
                <div className="col-12 my-1">
                    <div className="input-group">
                        <input type="file" className="form-control" placeholder="attachment file"
                            id="inputConsoleAttachment"
                            onChange={(evt) => { setTmpAttachment(evt.target.files[0]) }} />
                        {remarkButton()}
                    </div>
                </div>
            </div>
        )
    }
    // applicationRender
    return (
        <div>
            {combination["name"] == "" ?
                <div className="m-1">
                    {combinationTopFormRender()}
                    {combinationTable()}
                </div> :
                <div className="m-1">
                    {materialTopFormRender()}
                    {materialAddFormRender()}
                    {materialTable()}
                </div>
            }
        </div>
    )
};

// titleLogo
export const titleLogo = () => {
    return (<div id="rotxin-2" style={{ fontFamily: "Impact", color: "black" }}>
        <i className="fa-solid fa-book mx-1" style={{ pointerEvents: "none" }}></i>栄養計算
    </div>)
}