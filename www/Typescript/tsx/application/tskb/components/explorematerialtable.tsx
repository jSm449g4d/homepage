import React, { useState, useEffect } from 'react';

import { HIModal, CIModal } from "../../../components/imodals";
import { satisfyDictKeys, Unixtime2String } from "../../../components/util";
import { accountSetState, tskbSetState } from '../../../components/slice'
import { useAppSelector, useAppDispatch } from '../../../components/store'


export const EMTable = () => {
    const [contents, setContents] = useState([])
    const [tmpMaterial, setTmpeMaterial] = useState("")
    const [tmpPrivateFlag, setTmpPrivateFlag] = useState(false)

    const user = useAppSelector((state) => state.account.user)
    const userId = useAppSelector((state) => state.account.id)
    const token = useAppSelector((state) => state.account.token)
    const roomKey = useAppSelector((state) => state.account.roomKey)
    const tableStatus = useAppSelector((state) => state.tskb.tableStatus)
    const combination = useAppSelector((state) => state.tskb.combination)
    const AppDispatch = useAppDispatch()
    const xhrTimeout = 3000
    const xhrDelay = 100


    useEffect(() => {
        if (tableStatus == "MTable") exploreMaterial()
        setTmpeMaterial("")
        setTmpPrivateFlag(false)
    }, [tableStatus, userId])
    useEffect(() => { exploreMaterial() }, [])

    const stringForSend = (_additionalDict: {} = {}) => {
        const _sendDict = Object.assign(
            {
                "token": token, "user": user, roomKey: roomKey,
            }, _additionalDict)
        return (JSON.stringify(_sendDict))
    }
    // fetchAPI
    const exploreMaterial = (_tmpPrivateFlag = tmpPrivateFlag) => {
        const sortSetExploreContents = (_contents: any = []) => {
            const _sortContents = (a: any, b: any) => { return a["timestamp"] - b["timestamp"] }
            setContents(_contents.sort(_sortContents))
        }
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("explore", JSON.stringify({
            "keyword": tmpMaterial, "privateFlag": _tmpPrivateFlag
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
                    case "processed": {
                        sortSetExploreContents(resJ["materials"]); break;
                    }
                    default: {
                        if ("text" in resJ) CIModal(resJ["text"]); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    // modal
    /** 
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
                                        value={tmpMaterial} onChange={(evt) => { setTmpMaterial(evt.target.value) }} />
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
                                            if (evt.target.checked == true) { setTmpPrivateFlag(true) }
                                            else { setTmpPrivateFlag(false) }
                                        }}>
                                    </input>
                                    <div className="m-1">
                                        <label className="form-label">概説</label>
                                        <textarea className="form-control" rows={3} value={tmpDescription}
                                            onChange={(evt) => { setTmpDescription(evt.target.value) }}></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                {tmpMaterial != "" && token != "" ?
                                    <div>
                                        <button type="button" className="btn btn-outline-primary" data-bs-dismiss="modal"
                                            onClick={() => registerMaterial(-1)}>
                                            <i className="fa-solid fa-hammer mx-1" style={{ pointerEvents: "none" }} />
                                            作成
                                        </button></div> :
                                    <div>
                                        <button className="btn btn-outline-info" type="button"
                                            onClick={() => { HIModal("素材名を入力してください") }}>
                                            <i className="fa-solid fa-circle-info  mx-1" style={{ pointerEvents: "none" }}></i>
                                            作成
                                        </button>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }*/
    // app
    const topForm = () => {
        return (
            <div>
                <div className="input-group d-flex justify-content-center align-items-center my-1">
                    <button className="btn btn-outline-success btn-lg" type="button"
                        onClick={() => { exploreMaterial() }}>
                        <i className="fa-solid fa-magnifying-glass mx-1" style={{ pointerEvents: "none" }} />
                        素材検索
                    </button>
                    {token == "" ?
                        <button className="btn btn-outline-primary btn-lg" type="button" disabled>
                            <i className="fa-solid fa-book-open mx-1" style={{ pointerEvents: "none" }} />
                            自作素材
                        </button> :
                        <button className="btn btn-outline-primary btn-lg" type="button"
                            onClick={() => { setTmpPrivateFlag(true); exploreMaterial(true); }}>
                            <i className="fa-solid fa-book-open mx-1" style={{ pointerEvents: "none" }} />
                            自作素材
                        </button>
                    }
                    <input className="flex-fill form-control form-control-lg" type="text" value={tmpMaterial}
                        placeholder="検索文字列"
                        onChange={(evt: any) => setTmpeMaterial(evt.target.value)}>
                    </input >
                    {token == "" ?
                        <button className="btn btn-outline-primary btn-lg" type="button" disabled >
                            + 素材新規作成
                        </button> :
                        <button className="btn btn-outline-primary btn-lg" type="button"
                            onClick={() => AppDispatch(tskbSetState({ tableStatus: "CMTable" }))} >
                            + 素材新規作成
                        </button>}
                </div></div>)
    }
    {/** const materialConfigModal = () => {
            return (
                <div>
                    <div className="modal fade" id="materialConfigModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3 className="modal-title fs-5">
                                        <i className="fa-solid fa-cheese mx-1" />素材編集
                                    </h3>
                                </div>
                                <div className="modal-body row">
                                    <div className="input-group m-1 col-12">
                                        <span className="input-group-text">素材名</span>
                                        <input type="text" className="form-control" placeholder="Username" aria-label="user"
                                            value={tmpMaterial} onChange={(evt) => { setTmpMaterial(evt.target.value) }} />
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
                                                onClick={() => {
                                                    $("#deleteMaterialModal").modal('show')
                                                }}>
                                                <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>
                                                素材消去
                                            </button>
                                        </div> :
                                        <div>
                                            <button type="button" className="btn btn-outline-primary" data-bs-dismiss="modal"
                                                onClick={() => { }}>
                                                <i className="fa-solid fa-copy mx-1" style={{ pointerEvents: "none" }} />複製
                                            </button>
                                            <button className="btn btn-outline-info" type="button"
                                                onClick={() => {
                                                    HIModal("権限について",
                                                        "レシピ及び素材のの作成や編集は作成者しかできません" +
                                                        "代わりに公開設定のそれらは複製できます※(予定です)開発中")
                                                }}>
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
        }*/}
    // if contents dont have enough element for example contents hold chat_data ,table need break
    if (0 < contents.length)
        if (!satisfyDictKeys(contents[0], ["id", "userid", "description", "passhash", "timestamp"]))
            return (<div className="row m-1">loading</div>)
    const _tmpRecord = [];
    for (var i = 0; i < contents.length; i++) {
        const _tmpData = [];
        var _style = { background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.2))" }
        if (contents[i]["passhash"] != "")
            _style = { background: "linear-gradient(rgba(60,60,60,0), rgba(150,150,60,0.2))" }
        _tmpData.push(
            <div className="col-12 border d-flex" style={_style}>
                <h5 className="me-auto">
                    <i className="fa-solid fa-lemon mx-1"></i>{contents[i]["name"]}
                </h5>
                {contents[i]["userid"] == userId ?
                    <button className="btn btn-outline-success rounded-pill"
                        onClick={(evt: any) => {
                            AppDispatch(tskbSetState({ tableStatus: "CMTable" }));
                            AppDispatch(tskbSetState({ material: contents[evt.target.value] }));
                        }}
                        value={i}>
                        <i className="fa-solid fa-cheese mx-1" style={{ pointerEvents: "none" }}></i>編集
                    </button> : <div></div>
                }
                {combination["userid"] == userId ?
                    <button className="btn btn-outline-primary rounded-pill"
                        onClick={(evt: any) => { }} value={contents[i]["id"]}>
                        + レシピに追加
                    </button> : <div></div>
                }
            </div >)
        _tmpData.push(
            <div className="col-12 col-md-10 p-1">
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
            {topForm()}
            <div className="row m-1">
                {_tmpRecord}
            </div>
        </div>)
}