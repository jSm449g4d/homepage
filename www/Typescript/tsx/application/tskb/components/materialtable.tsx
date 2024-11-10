import React, { useState, useEffect } from 'react';

import { HIModal, CIModal } from "../../../components/imodals";
import { satisfyDictKeys, Unixtime2String } from "../../../components/util";
import { accountSetState, tskbSetState, startTable } from '../../../components/slice'
import { useAppSelector, useAppDispatch } from '../../../components/store'


export const MTable = () => {
    const [contents, setContents] = useState([])
    const [tmpCombination, setTmpCombination] = useState({
        "id": -1, "name": "", "tag": [], "description": "", "userid": -1, "user": "",
        "passhash": "", "timestamp": 0, "contents": "{}"
    })
    const setTmpCombinationDict = (_key: string, _value: any) => {
        let _copy = JSON.parse(JSON.stringify(tmpCombination))
        _copy[_key] = _value
        setTmpCombination(_copy)
    }
    const setTmpCombinationContents = (_key: string, _value: Number) => {
        let _copy = JSON.parse(tmpCombination.contents)
        _copy[_key] = _value
        _copy = JSON.stringify(_copy)
        setTmpCombinationDict("contents", _copy)
    }
    const reSetTmpConbinationDict = (_keys: any[]) => {
        let _copy = JSON.parse(JSON.stringify(tmpCombination))
        for (let i = 0; i < _keys.length; i++) {
            _copy[_keys[i]] = JSON.parse(JSON.stringify(combination))[_keys[i]]
        }
        setTmpCombination(_copy)
    }

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
        if (tableStatus == "MTable") fetchMaterial()
    }, [tableStatus, userId])
    useEffect(() => {
        setTmpCombination(combination)
    }, [combination])

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
                        AppDispatch(tskbSetState({ combination: resJ["combination"] }));
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
    const combineCombination = (_tmpTargetId: string) => {
        const sortSetExploreContents = (_contents: any = []) => {
            const _sortContents = (a: any, b: any) => { return a["timestamp"] - b["timestamp"] }
            setContents(_contents.sort(_sortContents))
        }
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("combine", JSON.stringify({
            "combination": tmpCombination,
            "del_material": _tmpTargetId
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
                        sortSetExploreContents(resJ["materials"]);
                        AppDispatch(tskbSetState({ combination: resJ["combination"] }));
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
    const updateCombination = () => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("update", JSON.stringify({
            "combination": tmpCombination,
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
                        HIModal("更新完了")
                        AppDispatch(tskbSetState({ combination: resJ["combination"] }));
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
                        AppDispatch(startTable({ tableStatus: "CTable", combitation: null }))
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
        formData.append("destroy", JSON.stringify({ "combination_id": tmpCombination["id"] }))
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
                        AppDispatch(startTable({ tableStatus: "CTable", combitation: null }))
                        break;
                    default: {
                        if ("text" in resJ) CIModal(resJ["text"]);
                        AppDispatch(startTable({ tableStatus: "CTable", combitation: null }))
                        break;
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
    const topForm = () => {
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
                    <input className="flex-fill form-control form-control-lg" type="text" value={tmpCombination["name"]}
                        onChange={(evt: any) => { setTmpCombinationDict("name", evt.target.value) }}>
                    </input >
                </div></div>)
    }
    const bottomForm = () => {
        return (
            <div>
                <div className="d-flex justify-content-between align-items-center my-1">
                    {tmpCombination["passhash"] == "" ?
                        <button className="btn btn-outline-warning btn-lg" type="button"
                            onClick={() => { setTmpCombinationDict("passhash", "0") }}>
                            <i className="fa-solid fa-lock-open mx-1" style={{ pointerEvents: "none" }} />
                            公開&nbsp;&nbsp;
                        </button> :
                        <button className="btn btn-warning btn-lg" type="button"
                            onClick={() => { setTmpCombinationDict("passhash", "") }}>
                            <i className="fa-solid fa-lock mx-1" style={{ pointerEvents: "none" }} />
                            非公開
                        </button>
                    }
                    {tmpCombination["name"] == "" ?
                        <button className="btn btn-outline-primary btn-lg" type="button" disabled>
                            <i className="fa-solid fa-circle-info mx-1" style={{ pointerEvents: "none" }} />
                            レシピ名を入力してください
                        </button> :
                        <div>
                            <button className="btn btn-outline-success btn-lg" type="button"
                                onClick={() => { updateCombination() }}>
                                <i className="fa-solid fa-cheese mx-1" style={{ pointerEvents: "none" }} />
                                更新
                            </button>
                        </div>
                    }
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
                </div>
            </div>)
    }
    "(id,name,tag,description,userid,user,passhash,timestamp,"
    "g,cost,carbo,fiber,protein,fat,saturated_fat,n3,DHA_EPA,n6,"
    "ca,cr,cu,i,fe,mg,mn,mo,p,k,se,na,zn,va,vb1,vb2,vb3,vb5,vb6,vb7,vb9,vb12,vc,vd,ve,vk,colin,kcal)"
    if (0 < contents.length)
        if (!satisfyDictKeys(contents[0], []))
            return (<div className="row m-1">loading</div>)
    const _tmpElementColumn = [];
    _tmpElementColumn.push(
        <tr>
            <th scope="col">操作</th>
            <th scope="col">名称</th>
            <th scope="col">量</th>
            <th scope="col">単価<br />円</th>
            <th scope="col">熱量<br />kcal</th>
            <th scope="col">炭水化物<br />g</th>
            <th scope="col">タンパク質<br />g	</th>
            <th scope="col">脂質<br />g</th>
            <th scope="col">飽和脂肪酸<br />g</th>
            <th scope="col">n-3脂肪酸<br />g</th>
            <th scope="col">DHA-EPA<br />g</th>
            <th scope="col">n-6脂肪酸<br />g</th>
            <th scope="col">食物繊維<br />g</th>
            <th scope="col">コリン<br />mg</th>
            <th scope="col">カルシウム<br />mg</th>
            <th scope="col">塩素<br />mg</th>
            <th scope="col">クロム<br />μg</th>
            <th scope="col">銅<br />μg</th>
            <th scope="col">ヨウ素<br />μg</th>
            <th scope="col">鉄<br />mg</th>
            <th scope="col">マグネシウム<br />mg</th>
            <th scope="col">マンガン<br />mg</th>
            <th scope="col">モリブデン<br />μg</th>
            <th scope="col">リン<br />mg</th>
            <th scope="col">カリウム<br />mg</th>
            <th scope="col">セレン<br />μg</th>
            <th scope="col">ナトリウム<br />mg</th>
            <th scope="col">亜鉛<br />mg</th>
            <th scope="col">VA<br />μgRE</th>
            <th scope="col">VB1<br />mg</th>
            <th scope="col">VB2<br />mg</th>
            <th scope="col">VB3<br />mgNE</th>
            <th scope="col">VB5<br />mg</th>
            <th scope="col">VB6<br />mg</th>
            <th scope="col">VB7<br />μg</th>
            <th scope="col">VB9<br />μg</th>
            <th scope="col">VB12<br />μg</th>
            <th scope="col">VC<br />mg</th>
            <th scope="col">VD<br />μg</th>
            <th scope="col">VE<br />mg</th>
            <th scope="col">VK<br />μg</th>
        </tr>
    )
    const _tmpRecord = [];
    _tmpRecord.push(
        <tr className="">
        </tr>
    )
    const _ccontents = JSON.parse(tmpCombination.contents)
    for (let i = 0; i < contents.length; i++) {
        const _button = (
            <th>
                <button type="button" className="btn btn-outline-warning rounded-pill"
                    onClick={(evt: any) => { combineCombination(evt.target.value) }}
                    value={contents[i]["id"]}>
                    <i className="fa-solid fa-minus" style={{ pointerEvents: "none" }} />
                </button>
            </th>)
        if (contents[i]["id"] in _ccontents == false) {
            _tmpRecord.push(
                <tr>
                    <th>{_button}</th>
                    <th>素材にアクセスできませんでした</th>
                </tr>)
            continue
        }
        const amount = _ccontents[contents[i]["id"]]
        _ccontents[contents[i]["id"]]
        _tmpRecord.push(
            <tr>
                <th>{_button}</th>
                <th>{contents[i]["name"]}</th>
                <th><input type="text" size={4} value={amount}
                    onChange={(evt: any) => {
                        setTmpCombinationContents(evt.target.name, parseFloat("0" + evt.target.value))
                    }}
                    id={"MTamount_" + i} name={String(contents[i]["id"])} pattern="[0-9|.]{6}" /></th>
                <th>{contents[i]["cost"] * amount}</th>
                <th>{contents[i]["kcal"] * amount}</th>
                <th>{contents[i]["carbo"] * amount}</th>
                <th>{contents[i]["protein"] * amount}</th>
                <th>{contents[i]["fat"] * amount}</th>
                <th>{contents[i]["saturated_fat"] * amount}</th>
                <th>{contents[i]["n3"] * amount}</th>
                <th>{contents[i]["DHA_EPA"] * amount}</th>
                <th>{contents[i]["n6"] * amount}</th>
                <th>{contents[i]["fiber"] * amount}</th>
                <th>{contents[i]["colin"] * amount}</th>
                <th>{contents[i]["ca"] * amount}</th>
                <th>{contents[i]["cl"] * amount}</th>
                <th>{contents[i]["cr"] * amount}</th>
                <th>{contents[i]["cu"] * amount}</th>
                <th>{contents[i]["i"] * amount}</th>
                <th>{contents[i]["fe"] * amount}</th>
                <th>{contents[i]["mg"] * amount}</th>
                <th>{contents[i]["mn"] * amount}</th>
                <th>{contents[i]["mo"] * amount}</th>
                <th>{contents[i]["p"] * amount}</th>
                <th>{contents[i]["k"] * amount}</th>
                <th>{contents[i]["se"] * amount}</th>
                <th>{contents[i]["na"] * amount}</th>
                <th>{contents[i]["zn"] * amount}</th>
                <th>{contents[i]["va"] * amount}</th>
                <th>{contents[i]["vb1"] * amount}</th>
                <th>{contents[i]["vb2"] * amount}</th>
                <th>{contents[i]["vb3"] * amount}</th>
                <th>{contents[i]["vb5"] * amount}</th>
                <th>{contents[i]["vb6"] * amount}</th>
                <th>{contents[i]["vb7"] * amount}</th>
                <th>{contents[i]["vb9"] * amount}</th>
                <th>{contents[i]["vb12"] * amount}</th>
                <th>{contents[i]["vc"] * amount}</th>
                <th>{contents[i]["vd"] * amount}</th>
                <th>{contents[i]["ve"] * amount}</th>
                <th>{contents[i]["vk"] * amount}</th>
            </tr>
        )

    }
    return (
        <div className="p-1" style={{
            background: "linear-gradient(45deg,rgba(60,160,250,0.2), rgba(60,60,60,0.0))"
        }}>
            {combinationDestroyModal1()}
            {topForm()}
            <div style={{ overflow: "auto" }}>
                <table className="table table-dark table-striped-columns table-bordered"
                    style={{ whiteSpace: "nowrap" }}>
                    <thead>{_tmpElementColumn}</thead>
                    <tbody>{_tmpRecord}</tbody>
                </table>
            </div>
            {bottomForm()}
        </div>)
}