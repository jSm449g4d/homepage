import React, { useState, useEffect } from 'react';

import { HIModal, CIModal } from "../../../components/imodals";
import { satisfyDictKeys, Unixtime2String } from "../../../components/util";
import { accountSetState, tskbSetState, startTable } from '../../../components/slice'
import { useAppSelector, useAppDispatch } from '../../../components/store'


export const CTable = () => {
    const [contents, setContents] = useState([])
    const [tmpTargetId, setTmpTargetId] = useState(-1)
    const [tmpCombination, setTmpCombination] = useState("")
    const [tmpDescription, setTpDescription] = useState("")
    const [tmpPrivateFlag, setTmpPrivateFlag] = useState(false)

    const user = useAppSelector((state) => state.account.user)
    const userId = useAppSelector((state) => state.account.id)
    const token = useAppSelector((state) => state.account.token)
    const roomKey = useAppSelector((state) => state.account.roomKey)
    const tableStatus = useAppSelector((state) => state.tskb.tableStatus)
    const reloadFlag = useAppSelector((state) => state.tskb.reloadFlag)
    const AppDispatch = useAppDispatch()
    const xhrTimeout = 3000
    const xhrDelay = 100


    useEffect(() => {
        if (reloadFlag == false) return
        if (tableStatus == "CTable") searchCombination()
        initTmps()
    }, [reloadFlag])

    const initTmps = () => {
        setTmpTargetId(-1)
        setTmpCombination("")
        setTpDescription("")
        setTmpPrivateFlag(false)
    }
    const stringForSend = (_additionalDict: {} = {}) => {
        const _sendDict = Object.assign(
            {
                "token": token, "user": user, roomKey: roomKey,
            }, _additionalDict)
        return (JSON.stringify(_sendDict))
    }
    // fetchAPI
    const searchCombination = () => {
        const sortSetContentsRev = (_contents: any = []) => {
            const _sortContentsRev = (a: any, b: any) => { return b["timestamp"] - a["timestamp"] }
            setContents(_contents.sort(_sortContentsRev))
        }
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
                        AppDispatch(accountSetState({ token: resJ["token"] })); break;
                    }
                    default: {
                        if ("text" in resJ) CIModal(resJ["text"]);
                        searchCombination(); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    const createCombination = () => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("create", JSON.stringify({
            "name": tmpCombination, "description": tmpDescription,
            "privateFlag": tmpPrivateFlag,
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
                    case "processed": setTimeout(() => { searchCombination() }, xhrDelay)
                        break;
                    default: {
                        if ("text" in resJ) CIModal(resJ["text"]);
                        searchCombination(); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    const destroyCombination = () => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("destroy", JSON.stringify({ "combination_id": tmpTargetId }))
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
                    case "processed":
                        setTimeout(() => { searchCombination(); }, xhrDelay); break;
                    default: {
                        if ("text" in resJ) CIModal(resJ["text"]);
                        searchCombination(); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    // modal
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
                            <div className="modal-body d-flex justify-content-center row">
                                <div className="input-group col-12 m-1">
                                    <span className="input-group-text">レシピ名</span>
                                    <input type="text" className="form-control" placeholder="レシピ名" aria-label="user"
                                        value={tmpCombination} onChange={(evt) => { setTmpCombination(evt.target.value) }} />
                                </div>
                                {tmpPrivateFlag == false ?
                                    <button className="btn btn-outline-warning btn-lg col-12" type="button"
                                        onClick={() => { setTmpPrivateFlag(true) }}>
                                        <i className="fa-solid fa-lock-open mx-1" style={{ pointerEvents: "none" }} />
                                        公開&nbsp;&nbsp;
                                    </button> :
                                    <button className="btn btn-warning btn-lg col-12" type="button"
                                        onClick={() => { setTmpPrivateFlag(false) }}>
                                        <i className="fa-solid fa-lock mx-1" style={{ pointerEvents: "none" }} />
                                        非公開
                                    </button>
                                }
                                <h4 className="mx-3 col-12">概説</h4>
                                <textarea className="form-control w-80 col-12" rows={4} value={tmpDescription}
                                    onChange={(evt) => { setTpDescription(evt.target.value) }} />
                            </div>
                            <div className="modal-footer d-flex col-12">
                                <button type="button" className="btn btn-secondary me-auto" data-bs-dismiss="modal">
                                    Close
                                </button>
                                {tmpCombination != "" && token != "" ? <div>
                                    <button type="button" className="btn btn-outline-primary " data-bs-dismiss="modal"
                                        onClick={() => createCombination()}>
                                        <i className="fa-solid fa-hammer mx-1" style={{ pointerEvents: "none" }} />作成
                                    </button>
                                </div> :
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
    const combinationDestroyModal = () => {
        return (
            <div className="modal fade" id="combinationDestroyModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="fa-solid fa-circle-info mx-1" />レシピを破棄しますか?
                            </h4>
                        </div>
                        <div className="modal-footer d-flex">
                            <button type="button" className="btn btn-secondary me-auto" data-bs-dismiss="modal">Close</button>
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
    // app
    const topForm = () => {
        return (
            <div>
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
                                initTmps()
                                $('#combinationCreateModal').modal('show');
                            }}>
                            <i className="fa-solid fa-hammer mx-1" style={{ pointerEvents: "none" }} />
                            レシピ作成
                        </button>}
                </div>
            </div>)

    }
    const _tmpRecord = [];
    if (0 < contents.length)
        if (!satisfyDictKeys(contents[0], ["id", "name", "description", "userid", "user", "passhash", "timestamp", "contents"]))
            return (<div className="row m-1">loading</div>)
    for (var i = 0; i < contents.length; i++) {
        if (contents[i]["name"].indexOf(tmpCombination) == -1) continue
        const _tmpData = [];
        var _style = { background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.2))" }
        if (contents[i]["passhash"] == "0") { _style = { background: "linear-gradient(rgba(60,60,60,0), rgba(150,150,60,0.3))" } }
        _tmpData.push(
            <div className="col-12 border d-flex" style={_style}>
                <h5 className="me-auto">
                    <i className="fa-solid fa-jar mx-1"></i>{contents[i]["name"]}
                </h5>
                <button className="btn btn-outline-primary rounded-pill"
                    onClick={(evt: any) => {
                        AppDispatch(startTable({
                            tableStatus: "MTable",
                            combination: JSON.parse(evt.target.value)
                        }))
                    }} value={JSON.stringify(contents[i])}>
                    <i className="fa-solid fa-right-to-bracket mx-1" style={{ pointerEvents: "none" }}></i>閲覧
                </button>
                {contents[i]["userid"] == userId ?
                    <button className="btn btn-outline-danger rounded-pill"
                        onClick={(evt: any) => {
                            setTmpTargetId(evt.target.value)
                            $('#combinationDestroyModal').modal('show')
                        }} value={contents[i]["id"]}>
                        <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>破棄
                    </button> :
                    <div></div>
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
        <div className="p-1" style={{
            background: "linear-gradient(45deg,rgba(250,200,200,0.2), rgba(60,60,60,0.0))"
        }}>
            {combinationCreateModal()}
            {combinationDestroyModal()}
            {topForm()}
            <div className="row m-1">
                {_tmpRecord}
            </div>
        </div>)
}