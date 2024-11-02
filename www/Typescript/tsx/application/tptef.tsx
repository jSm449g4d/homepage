import React, { useState, useEffect } from 'react';

import { jpclock, Unixtime2String } from "../components/util";
import { HIModal, CIModal } from "../components/imodals";
import { accountSetRoomKey } from '../components/slice'
import { useAppSelector, useAppDispatch } from '../components/store'
import "../stylecheets/style.sass";

export const AppMain = () => {
    const user = useAppSelector((state) => state.account.user)
    const userId = useAppSelector((state) => state.account.id)
    const token = useAppSelector((state) => state.account.token)
    const roomKey = useAppSelector((state) => state.account.roomKey)
    const dispatch = useAppDispatch()
    const xhrTimeout = 3000
    const fileSizeMax = 1024 * 1024 * 2

    const [room, setRoom] = useState({ "id": -1, "user": "", "userid": -1, "room": "", "timestamp": 0, "passhash": "" })
    const [tmpRoom, setTmpRoom] = useState("")
    const [tmpText, setTmpText] = useState("")
    const [contents, setContents] = useState([])
    const [tmpAttachment, setTmpAttachment] = useState(null)
    const [tmpTargetRoom, setTmpTargetRoom] = useState("")

    useEffect(() => {
        if (room["room"] == "") searchRoom()
        else fetchChat()
    }, [token])
    useEffect(() => { searchRoom() }, [])

    // jpclock (decoration)
    const [jpclockNow, setJpclockNow] = useState("")
    useEffect(() => {
        const _intervalId = setInterval(() => setJpclockNow(jpclock()), 500);
        return () => clearInterval(_intervalId);
    }, []);
    // related to fetchAPI
    const roadModalAndDelay = (_callback = () => { }, _delay = 100) => {
        if (200 < _delay) $('#roadModal').modal('show');
        setTimeout(() => {
            _callback();
            $('#roadModal').modal('hide');
        }, _delay);
    }
    const stringForSend = (_additionalDict: {} = {}) => {
        const _sendDict = Object.assign(
            {
                "token": token, "text": tmpText, "user": user, roomid: room["id"], roomKey: roomKey
            }, _additionalDict)
        return (JSON.stringify(_sendDict))
    }
    const enterRoom = (_setContentsInitialze = true) => {
        if (_setContentsInitialze) setContents([])
        setTmpRoom(""); setTmpText(""); setTmpAttachment(null);
        $('#inputConsoleAttachment').val(null)
    }
    const exitRoom = (_setContentsInitialze = true) => {
        if (_setContentsInitialze) setContents([])
        setRoom({ "id": -1, "user": "", "userid": -1, "room": "", "timestamp": 0, "passhash": "" });
        setTmpRoom(""); setTmpText(""); setTmpAttachment(null);
    }
    const compareDictKeys = (_targetDict: {}, _keys: any[]) => {
        if (Object.keys(_targetDict).sort().join() == _keys.sort().toString())
            return (true)
        return false
    }
    const fetchChat = (_roomid = room["id"], _roomKey = roomKey) => {
        const sortSetContents = (_contents: any = []) => {
            const _sortContents = (a: any, b: any) => { return a["timestamp"] - b["timestamp"] }
            setContents(_contents.sort(_sortContents))
        }
        enterRoom(false)
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("fetch", JSON.stringify({ "roomid": _roomid, "roomKey": _roomKey }))
        const request = new Request("/tptef.py", {
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
                        setRoom(resJ["room"]);
                        sortSetContents(resJ["chats"])
                    } break;
                    case "wrongPass": {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("部屋のパスワードが違います")
                        searchRoom(); break;
                    }
                    case "notExist": {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("部屋が存在しません")
                        searchRoom(); break;
                    }
                    case "tokenNothing": {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("JWTトークン未提出です")
                        searchRoom(); break;
                    }
                    default: {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("その他のエラー")
                        searchRoom(); break;
                    }
                }
            })
            .catch(error => {
                $('#cautionInfoModal').modal('show');
                $('#cautionInfoModalTitle').text("通信エラー")
                console.error(error.message)
            });
    }
    const remarkChat = () => {
        if (tmpText != "") {
            const headers = new Headers();
            const formData = new FormData();
            formData.append("info", stringForSend())
            formData.append("remark", JSON.stringify({}))
            const request = new Request("/tptef.py", {
                method: 'POST',
                headers: headers,
                body: formData,
                signal: AbortSignal.timeout(xhrTimeout)
            });
            fetch(request)
                .then(response => response.json())
                .then(resJ => {
                    switch (resJ["message"]) {
                        case "processed": roadModalAndDelay(fetchChat); break;
                        case "wrongPass": {
                            $('#cautionInfoModal').modal('show');
                            $('#cautionInfoModalTitle').text("部屋のパスワードが違います")
                            searchRoom(); break;
                        }
                        case "notExist": {
                            $('#cautionInfoModal').modal('show');
                            $('#cautionInfoModalTitle').text("部屋が存在しません")
                            searchRoom(); break;
                        }
                        case "tokenNothing": {
                            $('#cautionInfoModal').modal('show');
                            $('#cautionInfoModalTitle').text("JWTトークン未提出です")
                            searchRoom(); break;
                        }
                        default: {
                            $('#cautionInfoModal').modal('show');
                            $('#cautionInfoModalTitle').text("その他のエラー")
                            searchRoom(); break;
                        }
                    }
                })
                .catch(error => {
                    $('#cautionInfoModal').modal('show');
                    $('#cautionInfoModalTitle').text("通信エラー")
                    console.error(error.message)
                });
        }
        if (fileSizeMax <= tmpAttachment.size) {
            $('#cautionInfoModal').modal('show');
            $('#cautionInfoModalTitle').text(
                "ファイルサイズが大きすぎます(" + String(fileSizeMax) + " byte)未満")
        }
        if (tmpAttachment != null && tmpAttachment.size < fileSizeMax) {
            const headers = new Headers();
            const formData = new FormData();
            formData.append("info", stringForSend())
            formData.append("upload", tmpAttachment, tmpAttachment.name)
            const request = new Request("/tptef.py", {
                method: 'POST',
                headers: headers,
                body: formData,
                signal: AbortSignal.timeout(xhrTimeout)
            });
            fetch(request)
                .then(response => response.json())
                .then(resJ => {
                    switch (resJ["message"]) {
                        case "processed": roadModalAndDelay(fetchChat); break;
                        case "wrongPass": {
                            $('#cautionInfoModal').modal('show');
                            $('#cautionInfoModalTitle').text("部屋のパスワードが違います")
                            searchRoom(); break;
                        }
                        case "notExist": {
                            $('#cautionInfoModal').modal('show');
                            $('#cautionInfoModalTitle').text("部屋が存在しません")
                            searchRoom(); break;
                        }
                        case "tokenNothing": {
                            $('#cautionInfoModal').modal('show');
                            $('#cautionInfoModalTitle').text("JWTトークン未提出です")
                            searchRoom(); break;
                        }
                        default: {
                            $('#cautionInfoModal').modal('show');
                            $('#cautionInfoModalTitle').text("その他のエラー")
                            searchRoom(); break;
                        }
                    }
                })
                .catch(error => {
                    $('#cautionInfoModal').modal('show');
                    $('#cautionInfoModalTitle').text("通信エラー")
                    console.error(error.message)
                });
        }
    }
    const deleteChat = (_id: number) => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("delete", JSON.stringify({ "chatid": _id }))
        const request = new Request("/tptef.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed": roadModalAndDelay(fetchChat); break;
                    case "wrongPass": {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("部屋のパスワードが違います")
                        searchRoom(); break;
                    }
                    case "notExist": {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("部屋が存在しません")
                        searchRoom(); break;
                    }
                    case "tokenNothing": {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("JWTトークン未提出です")
                        searchRoom(); break;
                    }
                    default: {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("その他のエラー")
                        searchRoom(); break;
                    }
                }
            })
            .catch(error => {
                $('#cautionInfoModal').modal('show');
                $('#cautionInfoModalTitle').text("通信エラー")
                console.error(error.message)
            });
    }
    const downloadChat = (_id: number, _fileName: string = "") => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("download", JSON.stringify({ "chatid": _id }))
        const request = new Request("/tptef.py", {
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
                roadModalAndDelay(fetchChat)
            })
            .catch(error => {
                $('#cautionInfoModal').modal('show');
                $('#cautionInfoModalTitle').text("通信エラー")
                console.error(error.message)
            });
    }
    const searchRoom = () => {
        const sortSetContentsRev = (_contents: any = []) => {
            const _sortContentsRev = (a: any, b: any) => { return b["timestamp"] - a["timestamp"] }
            setContents(_contents.sort(_sortContentsRev))
        }
        exitRoom(false)
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("search", JSON.stringify({}))
        const request = new Request("/tptef.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed": sortSetContentsRev(resJ["rooms"]); break;
                    default: {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("その他のエラー")
                        break;
                    }
                }
            })
            .catch(error => {
                $('#cautionInfoModal').modal('show');
                $('#cautionInfoModalTitle').text("通信エラー")
                console.error(error.message)
            });
    }
    const createRoom = (_roomKey = roomKey) => {
        exitRoom()
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("create", JSON.stringify({ "room": tmpRoom, "roomKey": _roomKey }))
        const request = new Request("/tptef.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed": roadModalAndDelay(searchRoom); break;
                    case "alreadyExisted": {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("既にその名前の部屋が存在します")
                        searchRoom(); break;
                    }
                    case "tokenNothing": {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("JWTトークン未提出です")
                        searchRoom(); break;
                    }
                    default: {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("その他のエラー")
                        searchRoom(); break;
                    }
                }
            })
            .catch(error => {
                $('#cautionInfoModal').modal('show');
                $('#cautionInfoModalTitle').text("通信エラー")
                console.error(error.message)
            });
    }
    const destroyRoom = (_roomid = room["id"]) => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("destroy", JSON.stringify({ "roomid": _roomid }))
        const request = new Request("/tptef.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed": roadModalAndDelay(searchRoom); break;
                    case "notExist": {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("部屋が存在しません")
                        searchRoom(); break;
                    }
                    case "tokenNothing": {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("JWTトークン未提出です")
                        searchRoom(); break;
                    }
                    case "youerntOwner": {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("部屋の所有権がありません")
                        searchRoom(); break;
                    }
                    default: {
                        $('#cautionInfoModal').modal('show');
                        $('#cautionInfoModalTitle').text("その他のエラー")
                        searchRoom(); break;
                    }
                }
            })
            .catch(error => {
                $('#cautionInfoModal').modal('show');
                $('#cautionInfoModalTitle').text("通信エラー")
                console.error(error.message)
            });
    }
    // ConsoleRender
    const roomTopFormRender = () => {
        const roomCreateModal = () => {
            return (
                <div>
                    <div className="modal fade" id="roomCreateModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h1 className="modal-title fs-5" id="exampleModalLabel">
                                        <i className="fa-solid fa-hammer mx-1" />Create Room
                                    </h1>
                                </div>
                                <div className="modal-body row">
                                    <div className="input-group m-1 col-12">
                                        <span className="input-group-text" id="room-addon1">Room</span>
                                        <input type="text" className="form-control" placeholder="Username" aria-label="user"
                                            value={tmpRoom} onChange={(evt) => { setTmpRoom(evt.target.value) }} />
                                    </div>
                                    <div className="input-group m-1 col-12">
                                        <span className="input-group-text" id="room-addon2">Pass</span>
                                        <input type="text" className="form-control" placeholder="Password" aria-label="pass"
                                            value={tmpText} onChange={(evt) => { setTmpText(evt.target.value) }} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    {tmpRoom != "" && token != "" ? <div>
                                        {tmpText == "" ?
                                            <button type="button" className="btn btn-outline-primary" data-bs-dismiss="modal"
                                                onClick={() => createRoom()}>
                                                <i className="fa-solid fa-hammer mx-1" />Create
                                            </button> :
                                            <button type="button" className="btn btn-outline-warning" data-bs-dismiss="modal"
                                                onClick={() => {
                                                    // roomKey cannot be updated in time
                                                    dispatch(accountSetRoomKey(tmpText))
                                                    createRoom(tmpText)
                                                }}>
                                                <i className="fa-solid fa-key mx-1" />Create
                                            </button>
                                        }</div> :
                                        <button type="button" className="btn btn-outline-primary" disabled>
                                            <i className="fa-solid fa-hammer mx-1" />Create
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
            <div className="input-group d-flex justify-content-center align-items-center my-1">
                {roomCreateModal()}
                <button className="btn btn-outline-success btn-lg" type="button"
                    data-bs-toggle="tooltip" data-bs-placement="bottom" title="reload"
                    onClick={() => { searchRoom() }}>
                    <i className="fa-solid fa-rotate-right mx-1" />
                </button>
                <input className="flex-fill form-control form-control-lg" type="text" placeholder="部屋名検索" value={tmpRoom}
                    onChange={(evt: any) => { setTmpRoom(evt.target.value) }} />
                {token == "" ?
                    <button className="btn btn-outline-info btn-lg" type="button"
                        data-bs-toggle="tooltip" data-bs-placement="bottom" bs-title="Need login"
                        onClick={() => {
                            $('#helpInfoModal').modal('show');
                            $('#helpInfoModalTitle').text("部屋作成にはログインが必要です")
                        }}>
                        <i className="fa-solid fa-circle-info mx-1" style={{ pointerEvents: "none" }} />
                        部屋作成
                    </button> :
                    <button className="btn btn-outline-primary btn-lg" type="button"
                        data-bs-toggle="tooltip" data-bs-placement="bottom" title="Create room"
                        onClick={() => { $('#roomCreateModal').modal('show'); }}>
                        <i className="fa-solid fa-hammer mx-1" style={{ pointerEvents: "none" }} />
                        部屋作成
                    </button>}
            </div>)
    }
    const roomTable = () => {
        const roomInterModal = () => {
            return (
                <div className="modal fade" id="roomInterModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5">
                                    <i className="fa-solid fa-lock mx-1" />Need Password
                                </h1>
                            </div>
                            <div className="modal-body row">
                                <div className="input-group m-1 col-12">
                                    <span className="input-group-text">Pass</span>
                                    <input type="text" className="form-control" placeholder="Password" aria-label="pass"
                                        value={tmpText} onChange={(evt) => { setTmpText(evt.target.value) }} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" value={-1} id="roomInterModalButton"
                                    className="btn btn-secondary" data-bs-dismiss="modal">
                                    Close
                                </button>
                                {tmpText != "" ?
                                    <button type="button" className="btn btn-outline-primary" data-bs-dismiss="modal"
                                        onClick={
                                            () => {
                                                // roomKey cannot be updated in time
                                                dispatch(accountSetRoomKey(tmpText))
                                                fetchChat(Number(tmpTargetRoom), tmpText)
                                            }}>
                                        <i className="fa-solid fa-right-to-bracket mx-1" style={{ pointerEvents: "none" }} />Enter
                                    </button> :
                                    <button type="button" className="btn btn-outline-primary" disabled>
                                        <i className="fa-solid fa-right-to-bracket mx-1" style={{ pointerEvents: "none" }} />Enter
                                    </button>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        const roomPassWrongModal = () => {
            return (
                <div className="modal fade" id="roomPassWrongModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5">
                                    <i className="fa-solid fa-ban mx-1" />Password Wrong!
                                </h1>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-success" data-bs-dismiss="modal"
                                    onClick={() => $('#roomInterModal').modal('show')}>
                                    continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        const roomTableDestroyRoomConfirmationModal = () => {
            return (
                <div className="modal fade" id="roomTableDestroyRoomConfirmationModal"
                    aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">
                                    <i className="fa-solid fa-circle-info mx-1" />Are you sure Destory Room?
                                </h4>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal"
                                    onClick={() => { destroyRoom(Number(tmpTargetRoom)) }}>
                                    <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }} />Destroy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        const _tmpRecord = [];
        // if contents dont have enough element for example contents hold chat_data ,table need break
        if (0 < contents.length)
            if (!compareDictKeys(contents[0], ["id", "user", "userid", "room", "timestamp", "passhash"]))
                return (<div className="row m-1">loading</div>)
        for (var i = 0; i < contents.length; i++) {
            if (contents[i]["room"].indexOf(tmpRoom) == -1) continue
            const _tmpData = [];
            _tmpData.push(
                <div className="col-12 border d-flex"
                    style={{ background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.15))" }}>
                    {roomPassWrongModal()}
                    {roomInterModal()}
                    {roomTableDestroyRoomConfirmationModal()}
                    <h5 className="me-auto">
                        <i className="far fa-user mx-1"></i>{contents[i]["user"]}
                    </h5>
                    {contents[i]["passhash"] == "" ?
                        <button className="btn btn-outline-primary rounded-pill"
                            onClick={(evt: any) => { fetchChat(evt.target.value) }} value={contents[i]["id"]}>
                            <i className="fa-solid fa-right-to-bracket mx-1" style={{ pointerEvents: "none" }}></i>Enter
                        </button> :
                        <button className="btn btn-outline-dark rounded-pill"
                            onClick={(evt: any) => {
                                setTmpTargetRoom(evt.target.value)
                                $('#roomInterModal').modal('show')
                            }} value={contents[i]["id"]}>
                            <i className="fa-solid fa-lock mx-1" style={{ pointerEvents: "none" }}></i>Enter
                        </button>
                    }
                    {contents[i]["userid"] == userId ?
                        <button className="btn btn-outline-danger rounded-pill"
                            onClick={(evt: any) => {
                                setTmpTargetRoom(evt.target.value)
                                $('#roomTableDestroyRoomConfirmationModal').modal('show');

                            }} value={contents[i]["id"]}>
                            <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>Delete
                        </button> : <div></div>
                    }
                </div>)
            _tmpData.push(
                <div className="col-12 col-md-2 p-1 border"><div className="text-center">
                    {Unixtime2String(Number(contents[i]["timestamp"]))}
                </div></div>)
            _tmpData.push(
                <div className="col-12 col-md-10 p-1 d-flex justify-content-center align-items-center border">
                    <h3>
                        {contents[i]["room"]}
                    </h3>
                </div>)
            _tmpRecord.push(
                <div className="col-12 col-md-6" style={{
                    border: "1px inset silver", borderRadius: "5px", marginBottom: "3px", boxShadow: "2px 2px 1px rgba(60,60,60,0.2)"
                }}>
                    <div className="row p-1">{_tmpData}</div>
                </div>
            )
        }
        return (<div className="row m-1">{_tmpRecord}</div>)
    }
    const chatTopFormRender = () => {
        const destroyRoomConfirmationModal = () => {
            return (
                <div className="modal fade" id="destroyRoomConfirmationModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">
                                    <i className="fa-solid fa-circle-info mx-1" />Are you sure Destory Room?
                                </h4>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal"
                                    onClick={() => { destroyRoom() }}>
                                    <i className="far fa-trash-alt mx-1" />Destroy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div className="input-group d-flex justify-content-center align-items-center my-1">
                {destroyRoomConfirmationModal()}
                <button className="btn btn-outline-success btn-lg" type="button"
                    data-bs-toggle="tooltip" data-bs-placement="bottom" title="reload"
                    onClick={() => { fetchChat() }}>
                    <i className="fa-solid fa-rotate-right mx-1" />
                </button>
                <button className="btn btn-outline-dark btn-lg" type="button"
                    data-bs-toggle="tooltip" data-bs-placement="bottom" title="You are not own this room"
                    disabled>
                    <i className="far fa-user mx-1"></i>{room["user"]}
                </button>
                <input className="flex-fill form-control form-control-lg" type="text" value={room["room"]}
                    disabled>
                </input >
                {room["userid"] == userId ?
                    <button className="btn btn-outline-danger btn-lg" type="button"
                        data-bs-toggle="tooltip" data-bs-placement="bottom" title="Destroy room"
                        onClick={() => { $("destroyRoomConfirmationModal").modal("show") }}>
                        <i className="far fa-trash-alt mx-1 " style={{ pointerEvents: "none" }}></i>部屋削除
                    </button> :
                    <button className="btn btn-outline-info btn-lg" type="button"
                        data-bs-toggle="tooltip" data-bs-placement="bottom" title="Destroy room"
                        onClick={() => {
                            $('#helpInfoModal').modal('show');
                            $('#helpInfoModalTitle').text("部屋削除は部屋作成者にしかできません")
                        }}>
                        <i className="fa-solid fa-circle-info mx-1" style={{ pointerEvents: "none" }} />部屋削除
                    </button>
                }
                <button className="btn btn-outline-dark btn-lg" type="button"
                    data-bs-toggle="tooltip" data-bs-placement="bottom" title="Exit room"
                    onClick={() => { searchRoom() }}>
                    <i className="fa-solid fa-right-from-bracket mx-1"></i>
                    部屋を出る
                </button>
            </div>)
    }
    const chatTable = () => {
        // if contents dont have enough element for example contents hold chat_data ,table need break
        if (0 < contents.length)
            if (!compareDictKeys(contents[0], ["id", "user", "userid", "roomid", "text", "mode", "timestamp"]))
                return (<div className="row m-1">loading</div>)
        const _tmpRecord = [];
        for (var i = 0; i < contents.length; i++) {
            const _tmpData = [];
            // text
            if (contents[i]["mode"] == "text") {
                _tmpData.push(
                    <div className="col-12 border d-flex"
                        style={{ background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.15))" }}>
                        <h5 className="me-auto">
                            <i className="far fa-user mx-1"></i>{contents[i]["user"]}
                        </h5>
                        {Unixtime2String(Number(contents[i]["timestamp"]))}
                    </div>)
                _tmpData.push(
                    <div className="col-12 col-md-9 border"><div className="text-center">
                        {contents[i]["text"]}
                    </div></div>)
                _tmpData.push(
                    <div className="col-12 col-md-3 border"><div className="text-center">
                        {
                            contents[i]["userid"] == userId ?
                                <button className="btn btn-outline-danger rounded-pill"
                                    onClick={(evt: any) => {
                                        deleteChat(evt.target.name);
                                    }} name={contents[i]["id"]}>
                                    <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>Delete
                                </button> : <div></div>}
                    </div></div>)
            }
            // file
            if (contents[i]["mode"] == "attachment") {
                _tmpData.push(
                    <div className="col-12 border d-flex"
                        style={{ background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.15))" }}>
                        <h5 className="me-auto">
                            <i className="far fa-user mx-1"></i>{contents[i]["user"]}
                        </h5>
                        {Unixtime2String(Number(contents[i]["timestamp"]))}
                    </div>)
                _tmpData.push(
                    <div className="col-12 col-md-9 border"><div className="text-center">
                        {contents[i]["text"]}
                    </div></div>)
                _tmpData.push(
                    <div className="col-12 col-md-3 border"><div className="text-center">
                        <button className="btn btn-outline-primary rounded-pill"
                            onClick={(evt: any) => {
                                downloadChat(evt.target.value, evt.target.name);
                            }} value={contents[i]["id"]} name={contents[i]["text"]}>
                            <i className="fa-solid fa-download mx-1" style={{ pointerEvents: "none" }}></i>Download
                        </button>
                        {
                            contents[i]["userid"] == userId ?
                                <button className="btn btn-outline-danger rounded-pill"
                                    onClick={(evt: any) => {
                                        deleteChat(evt.target.name);
                                    }} name={contents[i]["id"]}>
                                    <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>Delete
                                </button> : <div></div>
                        }
                    </div></div>)
            }
            _tmpRecord.push(
                <div style={{
                    border: "1px inset silver", borderRadius: "5px", marginBottom: "3px", boxShadow: "2px 2px 1px rgba(60,60,60,0.2)"
                }}><div className="m-1 row">{_tmpData}</div></div>)
        }
        return (<div className="">{_tmpRecord}</div>)
    }
    const inputConsole = () => {
        const remarkButton = () => {
            if (tmpAttachment == null && tmpText == "")
                return (
                    <button className="btn btn-dark " disabled>
                        <i className="far fa-comment-dots mx-1" style={{ pointerEvents: "none" }}></i>要入力
                    </button>
                )
            return (
                <button className="btn btn-success"
                    onClick={() => { remarkChat(); }}>
                    <i className="far fa-comment-dots mx-1" style={{ pointerEvents: "none" }}></i>送信
                </button>
            )
        }
        if (token == "") return (<div className="m-1"></div>)
        return (
            <div className="m-1 p-2 row w-100"
                style={{ color: "#CCFFFF", border: "3px double silver", background: "#001111" }}>
                <div className="col-12 d-flex justify-content-center">
                    <h5><i className="far fa-clock "></i>{jpclockNow}</h5>
                </div>
                <textarea className="form-control col-12 w-80" id="tptef_content" rows={4} value={tmpText}
                    onChange={(evt) => { setTmpText(evt.target.value) }}></textarea>
                <div className="col-12 row my-1">
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
    const helpInfoModal = () => {
        return (
            <div className="modal fade" id="helpInfoModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="fa-solid fa-circle-info mx-1" />
                            </h4>
                            <h4 className="modal-title" id="helpInfoModalTitle">
                                help
                            </h4>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    const cautionInfoModal = () => {
        return (
            <div className="modal fade" id="cautionInfoModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="fa-solid fa-circle-exclamation mx-1" />Caution⇒
                            </h4>
                            <h4 className="modal-title" id="cautionInfoModalTitle">
                                notitle
                            </h4>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    const roadModalRender = () => {
        return (
            <div className="modal opacity-25" id="roadModal" data-bs-backdrop="static" data-bs-keyboard="false" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content d-flex justify-content-center align-items-center opacity-100">
                        <div className="modal-header">
                            <h5 className="modal-title">通信中</h5>
                        </div>
                        <div className="modal-body">
                            <i className="spinner-border text-success mx-1" role="status" />通信中
                        </div>
                    </div>
                </div>
            </div>)
    }
    return (
        <div>
            {roadModalRender()}
            <div className="">
                {room["room"] == "" ?
                    <div className="m-1">
                        {roomTopFormRender()}
                        {roomTable()}
                    </div> :
                    <div className="m-1">
                        {chatTopFormRender()}
                        {chatTable()}
                        {inputConsole()}
                    </div>
                }
            </div>
        </div>
    )
};

// titleLogo
export const titleLogo = () => {
    return (<div id="titlelogo" style={{ fontFamily: "Impact", color: "black" }}>チャットアプリ</div>)
}