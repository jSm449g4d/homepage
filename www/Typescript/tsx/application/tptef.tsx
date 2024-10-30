import React, { useState, useEffect } from 'react';

import { jpclock, Unixtime2String } from "../components/util";
import { useAppSelector } from '../components/store'
import "../stylecheets/style.sass";

export const AppMain = () => {
    const user = useAppSelector((state) => state.account.user)
    const userId = useAppSelector((state) => state.account.id)
    const token = useAppSelector((state) => state.account.token)


    const [room, setRoom] = useState({ "id": -1, "user": "", "userid": -1, "room": "", "timestamp": 0 })
    const [tmpRoom, setTmpRoom] = useState("")
    const [tmpText, setTmpText] = useState("")
    const [contents, setContents] = useState([])
    const [tmpFile, setTmpFile] = useState("")
    const [tmpMessage, setTmpMessage] = useState("")

    const roadModalRender = () => {
        return (
            <div className="modal" id="roadModal" data-bs-backdrop="static" data-bs-keyboard="false" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content d-flex justify-content-center align-items-center">
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
        $('#roadModal').modal('show');
        setTimeout(() => {
            _callback();
            $('#roadModal').modal('hide');
        }, _delay);
    }

    const stringForSend = (order: string, _additionalDict: {} = {}) => {
        const _sendDict = Object.assign(
            {
                "order": order, "token": token, "text": tmpText, "user": user, "room": room["room"],
            }, _additionalDict)
        return (JSON.stringify(_sendDict))
    }
    const enterRoom = () => {
        setTmpRoom(""); setTmpText(""); setContents([]); setTmpFile("");
    }
    const exitRoom = () => {
        setRoom({ "id": -1, "user": "", "userid": -1, "room": "", "timestamp": 0 }); setTmpRoom("");
        setTmpText(""); setContents([]); setTmpFile("");
    }
    useEffect(() => { searchRoom() }, [token])
    useEffect(() => { searchRoom() }, [])

    const sortSetContents = (_contents: any = []) => {
        const _sortContents = (a: any, b: any) => { return a["timestamp"] - b["timestamp"] }
        setContents(_contents.sort(_sortContents))
    }

    // jpclock (decoration)
    const [jpclockNow, setJpclockNow] = useState("")
    useEffect(() => {
        const _intervalId = setInterval(() => setJpclockNow(jpclock()), 500);
        return () => clearInterval(_intervalId);
    }, []);

    // functions
    const remarkChat = () => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/tptef.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            if (resp["message"] == "processed") {
                setTmpMessage(resp["message"]);
            }
            else { setTmpMessage(resp["message"]); }
        };
        xhr.timeout = 5000;
        xhr.send(stringForSend("remark"));
    }
    const deleteChat = (_id: number) => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/tptef.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            if (resp["message"] == "processed") {
                setTmpMessage(resp["message"]);
            }
            else { setTmpMessage(resp["message"]); }
        };
        xhr.timeout = 5000;
        xhr.send(stringForSend("delete", { "chatid": _id }));
        roadModalAndDelay(fetchChat, 1000);
    }
    const fetchChat = (_roomid = room["id"]) => {
        enterRoom()
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/tptef.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            if (resp["message"] == "processed") {
                setRoom(resp["room"]);
                sortSetContents(resp["chats"])
                setTmpMessage(resp["message"]);
            }
            else { setTmpMessage(resp["message"]); }
        };
        xhr.timeout = 5000;
        xhr.send(stringForSend("fetch", { "roomid": _roomid }));
    }
    // renders
    const chatTable = () => {
        const _tmpRecord = [];
        for (var i = 0; i < contents.length; i++) {
            const _tmpData = [];
            _tmpData.push(
                <div className="col-12 border d-flex"
                    style={{ background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.15))" }}>
                    <h5 className="me-auto">
                        <i className="far fa-user mr-1"></i>{contents[i]["user"]}
                    </h5>
                    {contents[i]["userid"] == userId ?
                        <button className="btn btn-outline-danger rounded-pill"
                            onClick={(evt: any) => {
                                deleteChat(evt.target.name);
                            }} name={contents[i]["id"]}>
                            <i className="far fa-trash-alt mr-1" style={{ pointerEvents: "none" }}></i>Delete
                        </button> : <div></div>
                    }
                </div>)
            _tmpData.push(
                <div className="col-12 col-md-2 border"><div className="text-center">
                    {Unixtime2String(Number(contents[i]["timestamp"]))}
                </div></div>)
            _tmpData.push(
                <div className="col-12 col-md-10 border"><div className="text-center">
                    {contents[i]["text"]}
                </div></div>)
            //attachment download button
            /*
            if (dbTptef[tsuids[i]]["attachment"] != "")
                tmpDatum.push(
                    <button key={1} className="flex-fill btn btn-primary btn-push m-1"
                        onClick={(evt: any) => {
                            dispatchTptef({
                                type: "download",
                                fileName: evt.target.name,
                                func: (_url: any) => window.open(_url, '_blank')
                            })
                        }}
                        name={dbTptef[tsuids[i]]["attachment"]}>
                        <i className="fas fa-paperclip mr-1" style={{ pointerEvents: "none" }}></i>
                        {dbTptef[tsuids[i]]["attachment"].split("/").pop().slice(0, 16)}
                    </button>)
            //delete button
            const _tmpDatum = [];
            if (contents[i]["userid"] == userId)
                _tmpDatum.push(
                    <button key={2} className="flex-fill btn btn-outline-danger rounded-pill m-1"
                        onClick={(evt: any) => { setTargetId(evt.target.name); deleteChat() }} name={contents[i]["id"]}>
                        <i className="far fa-trash-alt mr-1" style={{ pointerEvents: "none" }}></i>Delete
                    </button>)
            if (_tmpDatum.length > 0)
                _tmpData.push(
                    <div className="col-sm-12 col-md-2 p-1 border">
                        <div className="d-flex flex-column">
                            {_tmpDatum}
                        </div>
                    </div>)*/

            _tmpRecord.push(
                <div style={{
                    border: "1px inset silver", borderRadius: "5px", marginBottom: "3px", boxShadow: "2px 2px 1px rgba(60,60,60,0.2)"
                }}><div className="p-1 row">{_tmpData}</div></div>)
        }
        return (<div className="m-1">{_tmpRecord}</div>)
    }
    const inputConsole = () => {
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
                        <input type="file" className="form-control "
                            placeholder="attachment file" ></input>
                        {tmpText == "" ?
                            <button className="btn btn-dark " >
                                <i className="far fa-comment-dots mr-1" style={{ pointerEvents: "none" }}></i>要発言
                            </button>
                            :
                            <button className="btn btn-success"
                                onClick={() => {
                                    remarkChat(); setTmpText(""); setTmpFile(null);
                                    roadModalAndDelay(fetchChat, 1000)
                                }}>
                                <i className="far fa-comment-dots mr-1" style={{ pointerEvents: "none" }}></i>送信
                            </button>
                        }
                    </div>
                </div>
            </div>
        )
    }

    const searchRoom = () => {
        exitRoom()
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/tptef.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            if (resp["message"] == "processed") {
                sortSetContents(resp["rooms"])
                setTmpMessage(resp["message"]);
            }
            else { setTmpMessage(resp["message"]); }
        };
        xhr.timeout = 5000;
        xhr.send(stringForSend("search"));
    }
    const createRoom = () => {
        enterRoom()
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/tptef.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            if (resp["message"] == "processed") {
                setRoom(resp["room"]); setTmpRoom("");
                setTmpMessage(resp["message"]);
            }
            else { setTmpMessage(resp["message"]); }
        };
        xhr.timeout = 5000;
        xhr.send(stringForSend("create", { "room": tmpRoom }));
    }
    const destroyRoom = (_roomid = room["id"]) => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/tptef.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            if (resp["message"] == "processed") {
                exitRoom()
                setTmpMessage(resp["message"]);
            }
            else { setTmpMessage(resp["message"]); }
        };
        xhr.timeout = 5000;
        xhr.send(stringForSend("destroy", { "roomid": _roomid }));
        roadModalAndDelay(searchRoom, 1000)
    }

    const roomTable = (_search = "") => {
        const _tmpRecord = [];
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
                        <i className="fa-solid fa-right-to-bracket mr-1"></i>Enter
                    </button>
                    {contents[i]["userid"] == userId ?
                        <button className="btn btn-outline-danger rounded-pill"
                            onClick={(evt: any) => { destroyRoom(evt.target.name); }} name={contents[i]["id"]}>
                            <i className="far fa-trash-alt mr-1"></i>Delete
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