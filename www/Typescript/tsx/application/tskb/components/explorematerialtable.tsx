import React, { useState, useEffect } from 'react';

import { HIModal, CIModal } from "../../../components/imodals";
import { satisfyDictKeys, Unixtime2String } from "../../../components/util";
import { accountSetState, tskbSetState, startTable } from '../../../components/slice'
import { useAppSelector, useAppDispatch } from '../../../components/store'


export const EMTable = () => {
    const [contents, setContents] = useState([])
    const [tmpMaterial, setTmpeMaterial] = useState("")
    const [tmpAttachment, setTmpAttachment] = useState(null)
    const [tmpsearchRadio, setTmpsearchRadio] = useState("name")

    const user = useAppSelector((state) => state.account.user)
    const userId = useAppSelector((state) => state.account.id)
    const token = useAppSelector((state) => state.account.token)
    const roomKey = useAppSelector((state) => state.account.roomKey)
    const tableStatus = useAppSelector((state) => state.tskb.tableStatus)
    const combination = useAppSelector((state) => state.tskb.combination)
    const reloadFlag = useAppSelector((state) => state.tskb.reloadFlag)
    const AppDispatch = useAppDispatch()
    const xhrTimeout = 3000
    const xhrDelay = 100
    const fileSizeMax = 1024 * 1024 * 10


    useEffect(() => {
        if (tableStatus == "MTable") setTimeout(() => exploreMaterial(), xhrDelay)
        if (tableStatus == "CMTable") setTimeout(() => exploreMaterial(), xhrDelay)
        setTmpeMaterial("")
        setTmpAttachment(null)
        setTmpsearchRadio("name")
    }, [reloadFlag])

    const stringForSend = (_additionalDict: {} = {}) => {
        const _sendDict = Object.assign(
            {
                "token": token, "user": user, roomKey: roomKey,
            }, _additionalDict)
        return (JSON.stringify(_sendDict))
    }
    // fetchAPI
    const exploreMaterial = (_tmpPrivateFlag = false) => {
        const sortSetExploreContents = (_contents: any = []) => {
            const _sortContents = (a: any, b: any) => { return a["timestamp"] - b["timestamp"] }
            setContents(_contents.sort(_sortContents))
        }
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("explore", JSON.stringify({
            "keyword": tmpMaterial, "search_radio": tmpsearchRadio
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
    const combineMaterial = (_tmpTargetId: string) => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("combine", JSON.stringify({
            "combination": combination,
            "add_material": _tmpTargetId
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
                        AppDispatch(startTable({ tableStatus: "MTable" }))
                        break;
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
    const updataMaterial = () => {
        if (tmpAttachment == null) return
        if (fileSizeMax <= tmpAttachment.size) {
            CIModal("ファイルサイズが大きすぎます", String(fileSizeMax) + " byte未満")
            return
        }
        HIModal("アップロード中です", "時間がかかりますのでお待ちください");
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("updata", tmpAttachment, tmpAttachment.name)
        const request = new Request("/tskb/main.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout * 10)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                switch (resJ["message"]) {
                    case "processed":
                        {
                            HIModal("ファイルアップロード成功");
                            setTmpAttachment(null)
                            AppDispatch(startTable({ "tableStatus": "MTable" }))
                        }
                        break;
                    default: {
                        setTmpAttachment(null)
                        if ("text" in resJ) CIModal(resJ["text"]); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                setTmpAttachment(null)
                console.error(error.message)
            });
    }
    // modal
    const EMTUpdataModal = () => {
        return (
            <div className="modal fade" id="EMTUpdataModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="fa-solid fa-arrow-up-right-from-square mx-1" style={{ pointerEvents: "none" }} />
                                データセット提出
                            </h4>
                        </div>
                        <div className="modal-body">
                            <div>
                                json形式{"[{'name': '素材名', ...}, {}, ... {}]"}<br />
                                各素材はのレコードはnameがキーになってます<br />
                                処理的にはpython3のjson.dumpsとjson.loadsを使用してます<br />
                            </div>
                            <div className="input-group">
                                <input type="file" className="form-control" placeholder="attachment file"
                                    onChange={(evt) => { setTmpAttachment(evt.target.files[0]) }} />
                                <button className="btn btn-warning" type="button"
                                    onClick={() => updataMaterial()}>
                                    <i className="fa-solid fa-arrow-up-right-from-square mx-1" style={{ pointerEvents: "none" }} />
                                    提出
                                </button>
                            </div>
                        </div>
                        <div className="modal-footer d-flex">
                            <button type="button" className="btn btn-secondary me-auto" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    // app
    const topForm = () => {
        return (<div>
            <div className="my-1 d-flex justify-content-center">
                <h3>素材フォーム</h3>
            </div>
            <div>
                <div className="input-group d-flex justify-content-evenly my-1">
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="exampleRadios"
                            checked={tmpsearchRadio == "name"}
                            onChange={() => setTmpsearchRadio("name")} />
                        <label className="form-check-label">
                            名前検索
                        </label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="exampleRadios"
                            checked={tmpsearchRadio == "tag"}
                            onChange={() => setTmpsearchRadio("tag")} />
                        <label className="form-check-label">
                            タグ検索
                        </label>
                    </div>
                    {userId != -1 ?
                        <div className="form-check form-check-inline">
                            <input className="form-check-input" type="radio" name="exampleRadios"
                                checked={tmpsearchRadio == "private"}
                                onChange={() => setTmpsearchRadio("private")} />
                            <label className="form-check-label">
                                非公開名前検索
                            </label>
                        </div> :
                        <div />
                    }
                </div>
                <div className="input-group d-flex justify-content-center my-1">
                    <button className="btn btn-outline-success btn-lg" type="button" id="EMTExploreButton"
                        onClick={() => { exploreMaterial() }}>
                        <i className="fa-solid fa-magnifying-glass mx-1" style={{ pointerEvents: "none" }} />
                        素材検索
                    </button>
                    <input className="flex-fill form-control form-control-lg" type="text" value={tmpMaterial}
                        placeholder="検索文字列"
                        onChange={(evt: any) => setTmpeMaterial(evt.target.value)}
                        onKeyDown={(evt: any) => {
                            if (evt.key == "Enter") $("#EMTExploreButton").trigger("click")
                        }} />
                </div>
                <div className="d-flex justify-content-between my-1">
                    {token == "" ?
                        <button className="btn btn-outline-dark btn-sm" type="button" disabled>
                            <i className="fa-solid fa-arrow-up-right-from-square mx-1" style={{ pointerEvents: "none" }} />
                            データセット提出<br />※管理者用機能
                        </button> :
                        <button className="btn btn-outline-warning btn-sm" type="button"
                            onClick={() => $("#EMTUpdataModal").modal("show")}>
                            <i className="fa-solid fa-arrow-up-right-from-square mx-1" style={{ pointerEvents: "none" }} />
                            データセット提出<br />※管理者用機能
                        </button>
                    }
                    {token == "" ?
                        <button className="btn btn-outline-primary btn-lg" type="button" disabled >
                            + 新規作成
                        </button> :
                        <button className="btn btn-outline-primary btn-lg" type="button"
                            onClick={() =>
                                AppDispatch(startTable({ material: null, tableStatus: "CMTable" }))
                            } >
                            + 新規作成
                        </button>}
                </div>
            </div></div>)
    }
    // if contents dont have enough element for example contents hold chat_data ,table need break
    if (0 < contents.length)
        if (!satisfyDictKeys(contents[0], ["id", "userid", "description", "passhash", "timestamp"]))
            return (<div className="row m-1">loading</div>)
    const _tmpRecord = [];
    for (var i = 0; i < contents.length; i++) {
        const _tmpData = [];
        var _style = { background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.2))" }
        if (contents[i]["passhash"] != "")
            _style = { background: "linear-gradient(rgba(60,60,60,0), rgba(150,150,60,0.3))" }
        _tmpData.push(
            <div className="col-12 border d-flex" style={_style}>
                <h5 className="me-auto">
                    <i className="fa-solid fa-lemon mx-1"></i>{contents[i]["name"]}
                </h5>
                {contents[i]["userid"] == userId ?
                    <button className="btn btn-outline-success rounded-pill"
                        onClick={(evt: any) => {
                            AppDispatch(startTable({
                                tableStatus: "CMTable",
                                material: JSON.parse(evt.target.value)
                            }))
                            window.scrollTo({ top: 0, behavior: "smooth", });
                        }}
                        value={JSON.stringify(contents[i])}>
                        <i className="fa-solid fa-cheese mx-1" style={{ pointerEvents: "none" }}></i>編集
                    </button> :
                    <button className="btn btn-outline-primary rounded-pill"
                        onClick={(evt: any) => {
                            AppDispatch(startTable({
                                tableStatus: "CMTable",
                                material: JSON.parse(evt.target.value)
                            }))
                            window.scrollTo({ top: 0, behavior: "smooth", });
                        }}
                        value={JSON.stringify(contents[i])}>
                        <i className="fa-solid fa-cheese mx-1" style={{ pointerEvents: "none" }}></i>閲覧
                    </button>
                }
                {combination["userid"] == userId ?
                    <button className="btn btn-outline-primary rounded-pill"
                        onClick={(evt: any) => {
                            combineMaterial(evt.target.value)
                            window.scrollTo({ top: 0, behavior: "smooth", });
                        }
                        } value={contents[i]["id"]} >
                        + レシピに追加
                    </button > : <div></div>
                }
            </div >)
        _tmpData.push(
            <div className="col-12 col-md-12 p-1">
                {contents[i]["tag"] != "" ?
                    <button className="btn btn-outline-dark btn-sm rounded-pill" disabled>
                        <i className="fa-solid fa-tag mx-1" />{contents[i]["tag"]}
                    </button > :
                    <div />}
                {contents[i]["description"]}
            </div>)
        _tmpRecord.push(
            <div className="col-12 col-md-6" style={{
                border: "1px inset silver", borderRadius: "5px", marginBottom: "3px", boxShadow: "2px 2px 1px rgba(60,60,60,0.2)"
            }}>
                <div className="row">{_tmpData}</div>
            </div>
        )
    }
    return (
        <div className="p-1" style={{
            border: "3px double silver",
            background: "linear-gradient(45deg,rgba(240,150,110,0.2), rgba(60,60,60,0.0))"
        }}>
            {EMTUpdataModal()}
            {topForm()}
            <div className="row m-1">
                {_tmpRecord}
            </div>
        </div>)
}