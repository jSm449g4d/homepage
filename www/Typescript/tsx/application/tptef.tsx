import React, { useState, useEffect } from 'react';
import { stopf5, jpclock, Unixtime2String } from "../components/util";
import { useAppSelector } from '../components/store'

export const AppMain = () => {
    const user = useAppSelector((state) => state.account.user)
    const token = useAppSelector((state) => state.account.token)


    const [room, setRoom] = useState("")
    const [roomOwnerFlag, setRoomOwnerFlag] = useState("") //""=false else true
    const [tmpRoom, setTmpRoom] = useState("")
    const [tmpText, setTmpText] = useState("")
    const [Contents, setContents] = useState("")
    const [tmpFile, setTmpFile] = useState("")
    const [tmpMessage, setTmpMessage] = useState("")

    const stringForSend = (order: string, _tmpRoom: string = tmpRoom) => {
        return (JSON.stringify({ "order": order, "token": token, "text": tmpText, "user": user, "room": _tmpRoom }))
    }
    const exitRoom = () => {
        setRoom(""); setRoomOwnerFlag(""); setTmpRoom("");
        setTmpText(""); setContents(""); setTmpFile(""); 
    }
    useEffect(() => { exitRoom() }, [token])
    //useEffect(() => { dispatchTptef({ type: "setUri", uri: "tptef/" + room }); }, [room])

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
        xhr.send(stringForSend("remark", room));
    }
    const deleteRemark = (tsuid: string) => {
    }
    const fetchChat = () => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/tptef.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            if (resp["message"] == "processed") {
                setRoom(resp["room"]); setTmpRoom("")
                setRoomOwnerFlag(resp["roomownerflag"]);
                setContents(resp["chats"])
                setTmpMessage(resp["message"]);
            }
            else { setTmpMessage(resp["message"]); }
        };
        xhr.timeout = 5000;
        xhr.send(stringForSend("fetch"));
    }
    // renders
    const threadTable = () => {
        const tmpRecord = [];
        const tsuids = Object.keys({}).sort();
        for (var i = 0; i < tsuids.length; i++) {
            const tmpData = [];
            tmpData.push(
                <div className="col-12 p-1 border"
                    style={{ background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.15))" }}>
                    <h5 className="text-center">
                        <i className="far fa-user mr-1"></i>{ }{"user: "}{tsuids[i].split("_")[1]}
                    </h5>
                </div>)
            tmpData.push(
                <div className="col-sm-12 col-lg-2 p-1 border"><div className="text-center">
                    {Unixtime2String(Number(tsuids[i].split("_")[0]))}
                </div></div>)
            tmpData.push(
                <div className="col-sm-12 col-lg-8 p-1 border"><div className="text-center">
                    { }
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
                    </button>)*/
            //delete button
            /*
            if (tsuids[i].split("_")[1] == uid)
                tmpDatum.push(
                    <button key={2} className="flex-fill btn btn-outline-danger rounded-pill btn-push m-1"
                        onClick={(evt: any) => { deleteRemark(evt.target.name) }} name={tsuids[i]}>
                        <i className="far fa-trash-alt mr-1" style={{ pointerEvents: "none" }}></i>Delete
                    </button>)
                    */
            tmpRecord.push(
                <div style={{
                    border: "1px inset silver", borderRadius: "5px", marginBottom: "3px", boxShadow: "2px 2px 1px rgba(60,60,60,0.2)"
                }}><div className="row p-1 px-3">{tmpData}</div></div>)
        }
        return (<div>{tmpRecord}</div>)
    }
    const inputConsole = () => {
        if (token == "") return (<div className="m-1"></div>)
        return (
            <div className="m-1 p-2 row"
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
                            <button className="btn btn-success btn-lg ">
                                <i className="far fa-comment-dots mr-1" style={{ pointerEvents: "none" }}></i>送信
                            </button>
                            :
                            <button className="btn btn-success btn-lg"
                                onClick={() => { remarkChat(); setTmpText(""); setTmpFile(null); }}>
                                <i className="far fa-comment-dots mr-1" style={{ pointerEvents: "none" }}></i>送信
                            </button>
                        }
                    </div>
                </div>
            </div>
        )
    }

    const searchRoom = () => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/tptef.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            if (resp["message"] == "processed") {
                alert(resp["rooms"].stringify())
                setTmpMessage(resp["message"]);
            }
            else { setTmpMessage(resp["message"]); }
        };
        xhr.timeout = 5000;
        xhr.send(stringForSend("search"));
    }
    const createRoom = () => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/tptef.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            if (resp["message"] == "processed") {
                setRoom(resp["room"]); setTmpRoom("");
                setRoomOwnerFlag("youerOwner");
                setTmpMessage(resp["message"]);
            }
            else { setTmpMessage(resp["message"]); }
        };
        xhr.timeout = 5000;
        xhr.send(stringForSend("create"));
    }
    const destroyRoom = () => {
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
        xhr.send(stringForSend("destroy", room));
    }
    const roomsFormButton = () => {
        if (tmpRoom == "") {
            return (
                <div className="btn-group w-100">
                    <button className="btn btn-primary btn-lg" type="button" disabled>
                        部屋に移動
                    </button>
                    <button className="btn btn-warning btn-lg" type="button" disabled>
                        部屋を作成
                    </button>
                </div>)
        }
        return (
            <div className="btn-group w-100">
                <button className="btn btn-primary btn-lg" type="button"
                    onClick={() => { fetchChat() }}>
                    部屋に移動
                </button>
                {token == "" ?
                    <button className="btn btn-dark btn-lg" type="button" disabled>
                        ログインが必要
                    </button> :
                    <button className="btn btn-warning btn-lg" type="button"
                        onClick={() => { createRoom() }}>
                        部屋を作成
                    </button>}
            </div>

        )
    }
    const appBody = () => {
        return (
            <div>
                <div>
                    {room == "" ?
                        <div className="row p-1 px-3">
                            <div className="col-12 col-md-8 d-flex justify-content-center align-items-center">
                                <div className="input-group">
                                    <button className="btn btn-success btn-lg w-80" type="button"
                                        onClick={() => { searchRoom() }}>
                                        検索
                                    </button>
                                    <input className="flex-fill form-control form-control-lg" type="text" placeholder="部屋名" value={tmpRoom}
                                        onChange={(evt: any) => { setTmpRoom(evt.target.value) }} />
                                </div>
                            </div>
                            <div className="col-12 col-md-4 d-flex justify-content-center align-items-center"> {roomsFormButton()}</div>
                        </div>
                        :
                        <div className="row p-1 px-3">
                            <h4 className="col-12 col-md-8 d-flex justify-content-center align-items-center">
                                {room}
                            </h4>
                            <div className="col-12 col-md-4 d-flex justify-content-center align-items-center">
                                <div className="btn-group w-100">
                                    <button className="btn btn-secondary btn-lg" type="button"
                                        onClick={() => { exitRoom() }}>
                                        部屋を出る
                                    </button>
                                    {roomOwnerFlag == "" ?
                                        <button className="btn  btn-dark btn-lg" type="button" disabled>
                                            部屋を削除
                                        </button> :
                                        <button className="btn btn-lg btn-danger" type="button"
                                            onClick={() => { destroyRoom() }}>
                                            部屋を削除
                                        </button>}
                                </div>
                            </div>
                        </div>
                    }
                </div>
                {threadTable()}
                {room == "" ? <div></div> : inputConsole()}
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