import React, { useState, useEffect } from 'react';

import { HIModal, CIModal } from "../../../components/imodals";
import { satisfyDictKeys, Unixtime2String } from "../../../components/util";
import { accountSetState, tskbSetState } from '../../../components/slice'
import { useAppSelector, useAppDispatch } from '../../../components/store'


export const MTable = () => {
    const [contents, setContents] = useState([])
    const [tmpRoomKey, setTmpRoomKey] = useState("")
    const [tmpTargetId, setTmpTargetId] = useState(-1)
    const [tmpCombination, setTmpCombination] = useState("")
    const [tmpDescription, setTpDescription] = useState("")
    const [tmpPrivateFlag, setTmpPrivateFlag] = useState(false)

    const user = useAppSelector((state) => state.account.user)
    const userId = useAppSelector((state) => state.account.id)
    const token = useAppSelector((state) => state.account.token)
    const roomKey = useAppSelector((state) => state.account.roomKey)
    const tableStatus = useAppSelector((state) => state.tskb.tableStatus)
    const tmpContents = useAppSelector((state) => state.tskb.tmpContents)
    const combination = useAppSelector((state) => state.tskb.combination)
    const AppDispatch = useAppDispatch()
    const xhrTimeout = 3000
    const xhrDelay = 100


    useEffect(() => {
        if (tableStatus == "MTable") setContents(tmpContents)
        setTmpRoomKey("")
        setTmpTargetId(-1)
        setTmpCombination("")
        setTpDescription("")
        setTmpPrivateFlag(false)
    }, [tableStatus, userId])
    useEffect(() => { }, [])

    const stringForSend = (_additionalDict: {} = {}) => {
        const _sendDict = Object.assign(
            {
                "token": token, "user": user, roomKey: roomKey,
            }, _additionalDict)
        return (JSON.stringify(_sendDict))
    }
    // fetchAPI
    const fetchMaterial = () => {
        const sortSetContents = (_contents: any = []) => {
            const _sortContents = (a: any, b: any) => { return a["timestamp"] - b["timestamp"] }
            setContents(_contents.sort(_sortContents))
        }
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("fetch", JSON.stringify({ "combinationid": combination["id"], "roomKey": roomKey }))
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
                        AppDispatch(tskbSetState({ tableStatus: "MTable" }));
                        AppDispatch(tskbSetState({ token: resJ["combination"] }));
                        sortSetContents(resJ["materials"]);
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
                        AppDispatch(tskbSetState({ tableStatus: "CTable" }));
                        sortSetContentsRev(resJ["combinations"]);
                        AppDispatch(accountSetState({ token: resJ["token"] })); break;
                    }
                    default: {
                        if ("text" in resJ) CIModal(resJ["text"]);
                        break;
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
    const combinationDestroyModal1 = () => {
        return (
            <div className="modal fade" id="combinationDestroyModal1" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
    const materialTopForm = () => {
        return (
            <div>
                <div className="input-group d-flex justify-content-center align-items-center my-1">
                    <button className="btn btn-outline-dark btn-lg" type="button"
                        onClick={() => { searchCombination() }}>
                        <i className="fa-solid fa-right-from-bracket mx-1"></i>レシピ一覧に戻る
                    </button>
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
                            onClick={() => { $("#combinationDestroyModal1").modal('show') }}>
                            <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>レシピ破棄
                        </button> :
                        <button className="btn btn-outline-info btn-lg" type="button"
                            onClick={() => { HIModal("レシピ破棄は作成者にしかできません") }}>
                            <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>レシピ破棄
                        </button>
                    }
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
    return (
        <div>
            {combinationDestroyModal1()}
            {materialTopForm()}
            <div style={{ overflow: "auto" }}>
                <table className="table table-dark table-striped-columns table-bordered"
                    style={{ whiteSpace: "nowrap" }}>
                    <thead>{_tmpElementColumn}</thead>
                    <tbody>{_tmpRecord}</tbody>
                </table>
            </div>
        </div>)
}