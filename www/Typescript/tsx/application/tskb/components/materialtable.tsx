import React, { useState, useEffect } from 'react';

import { HIModal, CIModal } from "../../../components/imodals";
import { satisfyDictKeys, Unixtime2String } from "../../../components/util";
import { accountSetState, tskbSetState } from '../../../components/slice'
import { useAppSelector, useAppDispatch } from '../../../components/store'


export const MTable = () => {
    const [contents, setContents] = useState([])
    const [tmpTargetId, setTmpTargetId] = useState(-1)

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
        if (tableStatus == "MTable") fetchMaterial()
        setTmpTargetId(-1)
    }, [tableStatus, userId])

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
        <tr className="sticky-top d-flex justify-content-center">
            <th scope="col">操作</th>
            <th scope="col">名称</th>
            <th scope="col">量</th>
            <th scope="col">単価<br />円</th>
            <th scope="col">熱量<br />kcal</th>
            <th scope="col">炭水化物<br />g</th>
            <th scope="col">タンパク質<br />g	</th>
            <th scope="col">脂質<br />g</th>
            <th scope="col">単価<br />円</th>
            <th scope="col">熱量<br />kcal</th>
            <th scope="col">炭水化物<br />g</th>
            <th scope="col">タンパク質<br />g	</th>
            <th scope="col">脂質<br />g</th>
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
            <th>{_testColumn}</th>
            <th>名称</th>
            <th>量</th>
            <th>単価<br />円</th>
            <th>熱量<br />kcal</th>
            <th>炭水化物<br />g</th>
            <th>タンパク質<br />g	</th>
            <th>脂質<br />g</th>
            <th>単価<br />円</th>
            <th>熱量<br />kcal</th>
            <th>炭水化物<br />g</th>
            <th>タンパク質<br />g	</th>
            <th>脂質<br />g</th>
            <th>カルシウム<br />mg</th>
            <th>塩素<br />mg</th>
            <th>クロム<br />μg</th>
            <th>銅<br />μg</th>
            <th>ヨウ素<br />μg</th>
            <th>鉄<br />mg</th>
            <th>マグネシウム<br />mg</th>
            <th>マンガン<br />mg</th>
            <th>モリブデン<br />μg</th>
            <th>リン<br />mg</th>
            <th>カリウム<br />mg</th>
            <th>セレン<br />μg</th>
            <th>ナトリウム<br />mg</th>
            <th>亜鉛<br />mg</th>
            <th>VA<br />μgRE</th>
            <th>VB1<br />mg</th>
            <th>VB2<br />mg</th>
            <th>VB3<br />mgNE</th>
            <th>VB5<br />mg</th>
            <th>VB6<br />mg</th>
            <th>VB7<br />μg</th>
            <th>VB9<br />μg</th>
            <th>VB12<br />μg</th>
            <th>VC<br />mg</th>
            <th>VD<br />μg</th>
            <th>VE<br />mg</th>
            <th>VK<br />μg</th>
        </tr>)
    _tmpRecord.push(
        <tr>
            <th>{_testColumn}</th>
            <th>総計</th>
            <th>量</th>
            <th>単価<br />円</th>
            <th>熱量<br />kcal</th>
            <th>炭水化物<br />g</th>
            <th>タンパク質<br />g	</th>
            <th>脂質<br />g</th>
            <th>単価<br />円</th>
            <th>熱量<br />kcal</th>
            <th>炭水化物<br />g</th>
            <th>タンパク質<br />g	</th>
            <th>脂質<br />g</th>
            <th>カルシウム<br />mg</th>
            <th>塩素<br />mg</th>
            <th>クロム<br />μg</th>
            <th>銅<br />μg</th>
            <th>ヨウ素<br />μg</th>
            <th>鉄<br />mg</th>
            <th>マグネシウム<br />mg</th>
            <th>マンガン<br />mg</th>
            <th>モリブデン<br />μg</th>
            <th>リン<br />mg</th>
            <th>カリウム<br />mg</th>
            <th>セレン<br />μg</th>
            <th>ナトリウム<br />mg</th>
            <th>亜鉛<br />mg</th>
            <th>VA<br />μgRE</th>
            <th>VB1<br />mg</th>
            <th>VB2<br />mg</th>
            <th>VB3<br />mgNE</th>
            <th>VB5<br />mg</th>
            <th>VB6<br />mg</th>
            <th>VB7<br />μg</th>
            <th>VB9<br />μg</th>
            <th>VB12<br />μg</th>
            <th>VC<br />mg</th>
            <th>VD<br />μg</th>
            <th>VE<br />mg</th>
            <th>VK<br />μg</th>
        </tr>)
    return (
        <div style={{
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
        </div>)
}