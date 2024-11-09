import React, { useState, useEffect } from 'react';

import { tskbSetState } from '../../components/slice'
import { useAppSelector, useAppDispatch } from '../../components/store'
import { CTable } from "./components/combinationTable"
import { EMTable } from "./components/explorematerialtable"
import { MTable } from "./components/materialtable"
import { CMTable } from "./components/configmaterialtable"
import "../../stylecheets/style.sass";

export const AppMain = () => {
    const userId = useAppSelector((state) => state.account.id)
    const tableStatus = useAppSelector((state) => state.tskb.tableStatus)
    const AppDispatch = useAppDispatch()

    useEffect(() => {
        AppDispatch(tskbSetState({ "tableStatus": "CTable" }))
    }, [userId])
    useEffect(() => {
        AppDispatch(tskbSetState({ "tableStatus": "CTable" }))
    }, [])

    // jpclock (decoration)
    /** 
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
        setTmpRoomKey(""); setTmpCombination(""); setTmpMaterial(""); setTmpNutrition({});
        setTmpText(""); setTmpDescription(""); setTmpTargetId(-1); setTmpPrivateFlag(false)
        setTmpExploreMaterial("")
        if (_setContentsInitialze) { setContents([]), setExploreContents([]) }
        $('#inputConsoleAttachment').val(null)
    }
    const exitCombination = (_setContentsInitialze = true) => {
        setCombination({
            "id": -1, "name": "", "tag": [], "description": "", "userid": -1, "user": "",
            "timestamp": 0, "passhash": "", "contents": ""
        })
        setTmpRoomKey(""); setTmpCombination(""); setTmpMaterial(""); setTmpNutrition({});
        setTmpText(""); setTmpDescription(""); setTmpTargetId(-1); setTmpPrivateFlag(false)
        setTmpExploreMaterial("")
        if (_setContentsInitialze) { setContents([]), setExploreContents([]) }
    }
    const exploreMaterial = (_tmpPrivateFlag = tmpPrivateFlag) => {
        const sortSetExploreContents = (_contents: any = []) => {
            const _sortContents = (a: any, b: any) => { return a["timestamp"] - b["timestamp"] }
            setExploreContents(_contents.sort(_sortContents))
        }
        enterCombination(false)
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("explore", JSON.stringify({
            "keyword": tmpExploreMaterial, "privateFlag": _tmpPrivateFlag
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
                        AppDispatch(accountSetState({ token: resJ["token"] })); break;

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
    const registerMaterial = (_tmpTargetId: Number = tmpTargetId) => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("register", JSON.stringify(Object.assign({
            "name": tmpMaterial, "description": tmpDescription,
            "roomKey": tmpRoomKey, "privateFlag": tmpPrivateFlag,
            "materialid": _tmpTargetId, "tmpnutrition": tmpnutrition
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
                    case "processed": roadDelay(exploreMaterial); break;
                    case "wrongPass": {
                        CIModal("素材へのアクセス権が有りません"); break;
                    }
                    case "alreadyExisted": {
                        CIModal("既存の名前"); break;
                    }
                    case "notExist": {
                        CIModal("素材がが存在しません"); break;
                    }
                    case "tokenNothing": {
                        CIModal("JWTトークン未提出"); break;
                    }
                    default: {
                        CIModal("その他のエラー"); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    const deleteMaterial = (_tmpTargetId: Number = tmpTargetId) => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("delete", JSON.stringify({ "materialid": _tmpTargetId }))
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
                    case "processed": roadDelay(exploreMaterial); break;
                    case "wrongPass": {
                        CIModal("素材へのアクセス権が有りません"); break;
                    }
                    case "notExist": {
                        CIModal("素材が存在しません"); break;
                    }
                    case "tokenNothing": {
                        CIModal("JWTトークン未提出"); break;
                    }
                    default: {
                        CIModal("その他のエラー"); break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
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
                        AppDispatch(accountSetState({ token: resJ["token"] })); break;
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
    const destroyCombination = () => {
        const conbinatoinId = combination["name"] == "" ? tmpTargetId : combination["id"]
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("destroy", JSON.stringify({ "combination_id": conbinatoinId }))
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
    const materialTable = () => {
        const materialTopForm = () => {
            return (
                <div>
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
                                onClick={() => { $("#destroyCombinationModal").modal('show') }}>
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
        "(id,name,tag,description,userid,user,passhash,timestamp,"
        "g,cost,carbo,fiber,protein,fat,saturated_fat,n3,DHA_EPA,n6,"
        "ca,cr,cu,i,fe,mg,mn,mo,p,k,se,na,zn,va,vb1,vb2,vb3,vb5,vb6,vb7,vb9,vb12,vc,vd,ve,vk,colin,kcal)"
        if (0 < contents.length)
            if (!satisfyDictKeys(contents[0], []))
                return (<div className="row m-1">loading</div>)
        const _tmpElementColumn = [];
        _tmpElementColumn.push(
            <tr className="sticky-top">
                <th scope="col">操作</th><th scope="col">名称</th><th scope="col">量</th><th scope="col">単価</th>
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
        const _tmpRecord = [];
        const _testColumn = [];
        _testColumn.push(
            <th>
                <button type="button" className="btn btn-primary" data-bs-dismiss="modal"
                    onClick={() => { }}>
                    <i className="fa-solid fa-wrench" style={{ pointerEvents: "none" }} />
                </button>
            </th>)
        _tmpRecord.push(
            <tr>
                {_testColumn}<th>名称1</th><th>量</th><th>単価</th>
                <th>炭水化物</th><th>食物繊維</th><th>タンパク質</th><th>熱量</th>
                <th>脂質</th><th>飽和脂肪酸</th><th>n-3脂肪酸</th>
                <th>DHA-EPA</th><th>n-6脂肪酸</th><th>カルシウム</th>
                <th>クロム</th><th>銅</th><th>ヨウ素</th><th>鉄</th>
                <th>マグネシウム</th><th>マンガン</th><th>モリブデン</th>
                <th>リン</th><th>カリウム</th><th>セレン</th><th>ナトリウム</th>
                <th>亜鉛</th><th>VA</th><th>VB1</th><th>VB2</th>
                <th>vb3</th><th>vb5</th><th>vb6</th><th>vb7</th>
                <th>vb9</th><th>vb12</th><th>vc</th><th>vd</th>
                <th>ve</th><th>vk</th><th>コリン</th>
            </tr>)
        _tmpRecord.push(
            <tr>
                {_testColumn}<th>目標</th><th>量</th><th>単価</th>
                <th>炭水化物</th><th>食物繊維</th><th>タンパク質</th><th>熱量</th>
                <th>脂質</th><th>飽和脂肪酸</th><th>n-3脂肪酸</th>
                <th>DHA-EPA</th><th>n-6脂肪酸</th><th>カルシウム</th>
                <th>クロム</th><th>銅</th><th>ヨウ素</th><th>鉄</th>
                <th>マグネシウム</th><th>マンガン</th><th>モリブデン</th>
                <th>リン</th><th>カリウム</th><th>セレン</th><th>ナトリウム</th>
                <th>亜鉛</th><th>VA</th><th>VB1</th><th>VB2</th>
                <th>vb3</th><th>vb5</th><th>vb6</th><th>vb7</th>
                <th>vb9</th><th>vb12</th><th>vc</th><th>vd</th>
                <th>ve</th><th>vk</th><th>コリン</th>
            </tr>)
        for (var i = 0; i < contents.length; i++) {
            _tmpRecord.push(
                <tr>
                    {_testColumn}<th>概説</th><th>量</th><th>単価</th>
                    <th>炭水化物</th><th>食物繊維</th><th>タンパク質</th><th>熱量</th>
                    <th>脂質</th><th>飽和脂肪酸</th><th>n-3脂肪酸</th>
                    <th>DHA-EPA</th><th>n-6脂肪酸</th><th>カルシウム</th>
                    <th>クロム</th><th>銅</th><th>ヨウ素</th><th>鉄</th>
                    <th>マグネシウム</th><th>マンガン</th><th>モリブデン</th>
                    <th>リン</th><th>カリウム</th><th>セレン</th><th>ナトリウム</th>
                    <th>亜鉛</th><th>VA</th><th>VB1</th><th>VB2</th>
                    <th>vb3</th><th>vb5</th><th>vb6</th><th>vb7</th>
                    <th>vb9</th><th>vb12</th><th>vc</th><th>vd</th>
                    <th>ve</th><th>vk</th><th>コリン</th>
                </tr>)
        }
        return (
            <div>{materialTopForm()}
                <div style={{ overflow: "auto" }}>
                    <table className="table table-dark table-striped-columns table-bordered"
                        style={{ whiteSpace: "nowrap" }}>
                        <thead>{_tmpElementColumn}</thead>
                        <tbody>{_tmpRecord}</tbody>
                    </table>
                </div>
            </div>)
    }
    const materialCongigTable = () => {
        "(id,name,tag,description,userid,user,passhash,timestamp,"
        "g,cost,carbo,fiber,protein,fat,saturated_fat,n3,DHA_EPA,n6,"
        "ca,cr,cu,i,fe,mg,mn,mo,p,k,se,na,zn,va,vb1,vb2,vb3,vb5,vb6,vb7,vb9,vb12,vc,vd,ve,vk,colin,kcal)"
        if (0 < contents.length)
            if (!satisfyDictKeys(contents[0], []))
                return (<div className="row m-1">loading</div>)
        const _tmpElementColumn = [];
        _tmpElementColumn.push(
            <tr className="sticky-top">
                <th scope="col">操作</th><th scope="col">名称</th><th scope="col">量</th><th scope="col">単価</th>
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
        const _tmpRecord = [];
        const _testColumn = [];
        _testColumn.push(
            <th><input type="button" className="btn btn-primary" /></th>
        )
        _tmpRecord.push(
            <tr>
                {_testColumn}<th>名称1</th><th>量</th><th>単価</th>
                <th>炭水化物</th><th>食物繊維</th><th>タンパク質</th><th>熱量</th>
                <th>脂質</th><th>飽和脂肪酸</th><th>n-3脂肪酸</th>
                <th>DHA-EPA</th><th>n-6脂肪酸</th><th>カルシウム</th>
                <th>クロム</th><th>銅</th><th>ヨウ素</th><th>鉄</th>
                <th>マグネシウム</th><th>マンガン</th><th>モリブデン</th>
                <th>リン</th><th>カリウム</th><th>セレン</th><th>ナトリウム</th>
                <th>亜鉛</th><th>VA</th><th>VB1</th><th>VB2</th>
                <th>vb3</th><th>vb5</th><th>vb6</th><th>vb7</th>
                <th>vb9</th><th>vb12</th><th>vc</th><th>vd</th>
                <th>ve</th><th>vk</th><th>コリン</th>
            </tr>)
        return (
            <div>
                <div style={{ overflow: "auto" }}>
                    <table className="table table-dark table-striped-columns table-bordered"
                        style={{ whiteSpace: "nowrap" }}>
                        <thead>{_tmpElementColumn}</thead>
                        <tbody>{_tmpRecord}</tbody>
                    </table>
                </div>
            </div>)
    }
    const exploreMaterialForm = () => {
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
        }
        return (
            <div>
                {materialCreateModal()}
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
                    <input className="flex-fill form-control form-control-lg" type="text" value={tmpExploreMaterial}
                        placeholder="検索文字列"
                        onChange={(evt: any) => setTmpExploreMaterial(evt.target.value)}>
                    </input >
                    {token == "" ?
                        <button className="btn btn-outline-primary btn-lg" type="button" disabled >
                            + 素材新規作成
                        </button> :
                        <button className="btn btn-outline-primary btn-lg" type="button"
                            onClick={() => $("#materialCreateModal").modal("show")} >
                            + 素材新規作成
                        </button>}
                </div></div>)
    }
    const exploreMaterialTable = () => {
        const materialConfigModal = () => {
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
        }
        // if contents dont have enough element for example contents hold chat_data ,table need break
        if (0 < exploreContents.length)
            if (!satisfyDictKeys(exploreContents[0], ["id", "userid", "description", "passhash", "timestamp"]))
                return (<div className="row m-1">loading</div>)
        const _tmpRecord = [];
        for (var i = 0; i < exploreContents.length; i++) {
            const _tmpData = [];
            var _style = { background: "linear-gradient(rgba(60,60,60,0), rgba(60,60,60,0.2))" }
            if (exploreContents[i]["passhash"] != "")
                _style = { background: "linear-gradient(rgba(60,60,60,0), rgba(150,150,60,0.2))" }
            _tmpData.push(
                <div className="col-12 border d-flex" style={_style}>
                    <h5 className="me-auto">
                        <i className="fa-solid fa-lemon mx-1"></i>{exploreContents[i]["name"]}
                    </h5>
                    {exploreContents[i]["userid"] == userId ?
                        <button className="btn btn-outline-success rounded-pill"
                            onClick={(evt: any) => {
                                $("#materialConfigModal").modal("show")
                                setTmpTargetId(evt.target.value)
                            }}
                            value={exploreContents[i]["id"]}>
                            <i className="fa-solid fa-cheese mx-1" style={{ pointerEvents: "none" }}></i>編集
                        </button> : <div></div>
                    }
                    {combination["userid"] == userId ?
                        <button className="btn btn-outline-primary rounded-pill"
                            onClick={(evt: any) => { }} value={exploreContents[i]["id"]}>
                            + レシピに追加
                        </button> : <div></div>
                    }
                </div >)
            _tmpData.push(
                <div className="col-12 col-md-10 p-1">
                    <div>
                        {exploreContents[i]["description"]}
                    </div>
                </div>)
            _tmpData.push(
                <div className="col-12 col-md-2 p-1 border"><div className="text-center">
                    {Unixtime2String(Number(exploreContents[i]["timestamp"]))}
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
                {materialConfigModal()}
                <div className="row m-1">{_tmpRecord}</div>
            </div>)
    }
    // applicationRender
    const deleteMaterialModal = () => {
        return (
            <div className="modal fade" id="deleteMaterialModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="fa-solid fa-circle-info mx-1" />素材を消去しますか?
                            </h4>
                        </div>
                        <div className="modal-footer d-flex">
                            <button type="button" className="btn btn-secondary me-auto" data-bs-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-danger" data-bs-dismiss="modal"
                                onClick={() => { deleteMaterial() }}>
                                <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }} />消去
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    const destroyCombinationModal = () => {
        return (
            <div className="modal fade" id="destroyCombinationModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
    }*/
    //<CTable/> 
    return (
        <div>
            {tableStatus == "CTable" ?
                <div className="m-1">
                    <CTable />
                </div> :
                <div></div>
            }
            {tableStatus == "MTable" ?
                <div className="m-1">
                    <MTable />
                </div> :
                <div></div>
            }
            {tableStatus == "CMTable" ?
                <div className="m-1">
                    <CMTable />
                </div> :
                <div></div>
            }
            <div className="my-1"></div>
            {tableStatus != "CTable" ?
                <div className="m-1">
                    <EMTable />
                </div> :
                <div></div>
            }

        </div>

    )
};

// titleLogo
export const titleLogo = () => {
    const tableStatus = useAppSelector((state) => state.tskb.tableStatus)
    const [tmpSubtitle, setTmpSubtitle] = useState("")
    useEffect(() => {
        if (tableStatus == "CTable") setTmpSubtitle("レシピ検索")
        if (tableStatus == "MTable") setTmpSubtitle("レシピ閲覧")
        if (tableStatus == "CMTable") setTmpSubtitle("素材編集")
    }, [tableStatus])
    return (
        <div>
            <div className="rotxin-2 row" style={{ fontFamily: "Impact", color: "black" }}>
                <h2 className="col-12 col-md-6">
                    <i className="fa-solid fa-book mx-1" style={{ pointerEvents: "none" }}></i>栄養計算
                </h2>
                <h4 className="col-12 col-md-6">
                    {tmpSubtitle}
                </h4>
            </div>
        </div>)
}