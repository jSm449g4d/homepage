import React, { useState, useEffect } from 'react';

import { jpclock, Unixtime2String } from "../components/util";
import { useAppSelector } from '../components/store'
import "../stylecheets/style.sass";

export const AppMain = () => {
    const user = useAppSelector((state) => state.account.user)
    const userId = useAppSelector((state) => state.account.id)
    const token = useAppSelector((state) => state.account.token)


    const [room, setRoom] = useState({ "id": -1, "user": "", "userid": -1, "room": "", "timestamp": 0, "pass": "" })
    const [tmpRoom, setTmpRoom] = useState("")
    const [tmpText, setTmpText] = useState("")
    const [contents, setContents] = useState([])
    const [tmpAttachment, setTmpAttachment] = useState(null)
    const [tmpMessage, setTmpMessage] = useState("")

    const xhrTimeout = 3000
    useEffect(() => { searchRoom() }, [token])
    useEffect(() => { searchRoom() }, [])

    const roadModalRender = () => {
        return (
            <div className="modal opacity-25" id="roadModal" data-bs-backdrop="static" data-bs-keyboard="false" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content d-flex justify-content-center align-items-center opacity-100">
                        <div className="modal-header">
                            <h5 className="modal-title">通信中</h5>
                        </div>
                        <div className="modal-body">
                            <i className="spinner-border text-success mr-1" role="status" />通信中
                        </div>
                    </div>
                </div>
            </div>)
    }
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
                "token": token, "text": tmpText, "user": user, "room": room["room"],
            }, _additionalDict)

        return (JSON.stringify(_sendDict))
    }
    // setContents([]) causes flickering
    const enterRoom = (_setContentsInitialze = true) => {
        if (_setContentsInitialze) setContents([])
        setTmpRoom(""); setTmpText("");; setTmpAttachment(null);
    }
    const exitRoom = (_setContentsInitialze = true) => {

        if (_setContentsInitialze) setContents([])
        setRoom({ "id": -1, "user": "", "userid": -1, "room": "", "timestamp": 0, "pass": "" }); setTmpRoom("");
        setTmpText(""); setTmpAttachment(null);
    }

    const sortSetContents = (_contents: any = []) => {
        const _sortContents = (a: any, b: any) => { return a["timestamp"] - b["timestamp"] }
        setContents(_contents.sort(_sortContents))
    }
    const compareKeys = (_targetDict: {}, _keys: any[]) => {
        if (Object.keys(_targetDict).sort().join() == _keys.sort().toString())
            return (true)
        return false
    }

    // jpclock (decoration)
    const [jpclockNow, setJpclockNow] = useState("")
    useEffect(() => {
        const _intervalId = setInterval(() => setJpclockNow(jpclock()), 500);
        return () => clearInterval(_intervalId);
    }, []);

    // functions
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
                .then(response => { roadModalAndDelay(fetchChat) })
                .catch(error => console.error(error.message));
        }
        if (tmpAttachment != null) {
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
                .then(response => { roadModalAndDelay(fetchChat) })
                .catch(error => console.error(error.message));
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
            .then(response => { roadModalAndDelay(fetchChat) })
            .catch(error => console.error(error.message));
    }
    const downloadChat = (_id: number) => {
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
                a.setAttribute("download", "");
                a.click();
                roadModalAndDelay(fetchChat)
            })
            .catch(error => console.error(error.message));
    }
    const fetchChat = (_roomid = room["id"]) => {
        enterRoom(false)
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("fetch", JSON.stringify({ "roomid": _roomid }))
        const request = new Request("/tptef.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                if (resJ["message"] == "processed") {
                    setRoom(resJ["room"]);
                    sortSetContents(resJ["chats"])
                }
                setTmpMessage(resJ["message"])
            })
            .catch(error => console.error(error.message));
    }
    // renders
    const chatTable = () => {
        // if contents dont have enough element for example contents hold chat_data ,table need break
        if (0 < contents.length)
            if (!compareKeys(contents[0],["id", "user", "userid", "roomid", "text", "mode", "timestamp"]))
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
                            <i className="far fa-user mr-1"></i>{contents[i]["user"]}
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
                                    <i className="far fa-trash-alt mr-1" style={{ pointerEvents: "none" }}></i>Delete
                                </button> : <div></div>}
                    </div></div>)
            }
            // file
            if (contents[i]["mode"] == "attachment") {
                _tmpData.push(
                    <div className="col-12 border d-flex"
                        style={{ background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.15))" }}>
                        <h5 className="me-auto">
                            <i className="far fa-user mr-1"></i>{contents[i]["user"]}
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
                                downloadChat(evt.target.name);
                            }} name={contents[i]["id"]}>
                            <i className="fa-solid fa-download mr-1" style={{ pointerEvents: "none" }}></i>Download
                        </button>
                        {
                            contents[i]["userid"] == userId ?
                                <button className="btn btn-outline-danger rounded-pill"
                                    onClick={(evt: any) => {
                                        deleteChat(evt.target.name);
                                    }} name={contents[i]["id"]}>
                                    <i className="far fa-trash-alt mr-1" style={{ pointerEvents: "none" }}></i>Delete
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
                        <i className="far fa-comment-dots mr-1" style={{ pointerEvents: "none" }}></i>要入力
                    </button>
                )
            return (
                <button className="btn btn-success"
                    onClick={() => { remarkChat(); roadModalAndDelay(fetchChat, 1000) }}>
                    <i className="far fa-comment-dots mr-1" style={{ pointerEvents: "none" }}></i>
                    送信
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
                        <input type="file" className="form-control " placeholder="attachment file"
                            onChange={(evt) => { setTmpAttachment(evt.target.files[0]) }} />
                        {remarkButton()}
                    </div>
                </div>
            </div>
        )
    }

    const searchRoom = () => {
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
                if (resJ["message"] == "processed") {
                    sortSetContents(resJ["rooms"])
                }
                setTmpMessage(resJ["message"])
            })
            .catch(error => console.error(error.message));
    }
    const createRoom = () => {
        exitRoom()
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("create", JSON.stringify({ "room": tmpRoom }))
        const request = new Request("/tptef.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                setRoom(resJ["room"])
                if (resJ["message"] == "processed") {
                    roadModalAndDelay(fetchChat)
                }
                setTmpMessage(resJ["message"])
            })
            .catch(error => console.error(error.message));
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
            .then(response => { roadModalAndDelay(searchRoom) })
            .catch(error => console.error(error.message));
    }

    const roomTable = (_search = "") => {
        const _tmpRecord = [];
        // if contents dont have enough element for example contents hold chat_data ,table need break
        if (0 < contents.length)
            if (!compareKeys(contents[0],["id", "user", "userid", "room", "timestamp", "pass"]))
                return (<div className="row m-1">loading</div>)
        for (var i = 0; i < contents.length; i++) {
            if (contents[i]["room"].indexOf(_search) == -1) continue
            const _tmpData = [];
            _tmpData.push(
                <div className="col-12 border d-flex"
                    style={{ background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.15))" }}>
                    <h5 className="me-auto">
                        <i className="far fa-user mr-1"></i>{contents[i]["user"]}
                    </h5>
                    <button className="btn btn-outline-primary rounded-pill"
                        onClick={(evt: any) => {
                            fetchChat(evt.target.name)
                        }} name={contents[i]["id"]}>
                        <i className="fa-solid fa-right-to-bracket mr-1" style={{ pointerEvents: "none" }}></i>Enter
                    </button>
                    {contents[i]["userid"] == userId ?
                        <button className="btn btn-outline-danger rounded-pill"
                            onClick={(evt: any) => { destroyRoom(evt.target.name); }} name={contents[i]["id"]}>
                            <i className="far fa-trash-alt mr-1" style={{ pointerEvents: "none" }}></i>Delete
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

    const roomsFormButton = () => {
        if (tmpRoom == "")
            return (
                <button className="btn btn-outline-primary btn-lg" type="button"
                    data-bs-toggle="tooltip" data-bs-placement="bottom" title="Plz put in room name"
                    disabled >
                    <i className="fa-solid fa-hammer mr-1" />
                    部屋作成
                </button>)

        if (token == "")
            return (
                <button className="btn btn-outline-primary btn-lg" type="button"
                    data-bs-toggle="tooltip" data-bs-placement="bottom" bs-title="Need login"
                    disabled >
                    <i className="fa-solid fa-hammer mr-1" />
                    部屋作成
                </button>)
        return (<button className="btn btn-outline-primary btn-lg" type="button"
            data-bs-toggle="tooltip" data-bs-placement="bottom" title="Create room"
            onClick={() => { createRoom(); }}>
            <i className="fa-solid fa-hammer mr-1" />
            部屋作成
        </button>)
    }
    const appBody = () => {
        return (
            <div>
                {roadModalRender()}
                <div className="">
                    {room["room"] == "" ?
                        <div className="m-1">
                            <div className="input-group d-flex justify-content-center align-items-center y-1">
                                <button className="btn btn-outline-success btn-lg" type="button"
                                    data-bs-toggle="tooltip" data-bs-placement="bottom" title="reload"
                                    onClick={() => { searchRoom() }}>
                                    <i className="fa-solid fa-rotate-right mr-1" />
                                </button>
                                <input className="flex-fill form-control form-control-lg" type="text" placeholder="部屋名" value={tmpRoom}
                                    onChange={(evt: any) => { setTmpRoom(evt.target.value) }} />
                                {roomsFormButton()}
                            </div>
                            {roomTable(tmpRoom)}
                        </div>
                        :
                        <div className="m-1">
                            <div className="input-group d-flex justify-content-center align-items-center my-1">
                                <button className="btn btn-outline-success btn-lg" type="button"
                                    data-bs-toggle="tooltip" data-bs-placement="bottom" title="reload"
                                    onClick={() => { fetchChat() }}>
                                    <i className="fa-solid fa-rotate-right mr-1" />
                                </button>
                                <input className="flex-fill form-control form-control-lg" type="text" value={room["room"]}
                                    disabled>
                                </input >
                                {room["userid"] == userId ?
                                    <button className="btn btn-outline-danger btn-lg" type="button"
                                        data-bs-toggle="tooltip" data-bs-placement="bottom" title="Destroy room"
                                        onClick={() => { destroyRoom() }}>
                                        <i className="far fa-trash-alt mr-1"></i>
                                        部屋を削除
                                    </button>
                                    :
                                    <button className="btn btn-outline-dark btn-lg" type="button"
                                        data-bs-toggle="tooltip" data-bs-placement="bottom" title="You are not own this room"
                                        disabled>
                                        <i className="far fa-user mr-1"></i>{room["user"]}
                                    </button>
                                }
                                <button className="btn btn-outline-dark btn-lg" type="button"
                                    data-bs-toggle="tooltip" data-bs-placement="bottom" title="Exit room"
                                    onClick={() => { searchRoom() }}>
                                    <i className="fa-solid fa-right-from-bracket mr-1"></i>
                                    部屋を出る
                                </button>
                            </div>
                            {chatTable()}{inputConsole()}
                        </div>
                    }
                </div>
            </div>
        )
    }
    return (
        <div>
            {appBody()}
        </div>
    )

};

//
export const titleLogo = () => {
    return (<div id="titlelogo" style={{ fontFamily: "Impact", color: "black" }}>チャットアプリ</div>)
}