import React, { useState, useEffect } from 'react';

import { HIModal, CIModal } from "../../../components/imodals";
import { satisfyDictKeys, Unixtime2String } from "../../../components/util";
import { accountSetState, tskbSetState } from '../../../components/slice'
import { useAppSelector, useAppDispatch } from '../../../components/store'


export const CMTable = () => {
    const [contents, setContents] = useState([])
    const [tmpRoomKey, setTmpRoomKey] = useState("")
    const [tmpTargetId, setTmpTargetId] = useState(-1)
    const [tmpMaterial, setTmpMaterial] = useState("")
    const [tmpDescription, setTmpDescription] = useState("")
    const [tmpPrivateFlag, setTmpPrivateFlag] = useState(false)

    const user = useAppSelector((state) => state.account.user)
    const userId = useAppSelector((state) => state.account.id)
    const token = useAppSelector((state) => state.account.token)
    const roomKey = useAppSelector((state) => state.account.roomKey)
    const tableStatus = useAppSelector((state) => state.tskb.tableStatus)
    const tmpContents = useAppSelector((state) => state.tskb.tmpContents)
    const combination = useAppSelector((state) => state.tskb.combination)
    const material = useAppSelector((state) => state.tskb.material)
    const AppDispatch = useAppDispatch()
    const xhrTimeout = 3000
    const xhrDelay = 100


    useEffect(() => {
        if (tableStatus == "CMTable") setContents(tmpContents)
        setTmpRoomKey("")
        setTmpTargetId(-1)
        setTmpMaterial(material["name"])
        setTmpDescription("")
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
    const registerMaterial = (_tmpTargetId: Number = tmpTargetId) => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("register", JSON.stringify(Object.assign({
            "name": tmpMaterial, "description": tmpDescription,
            "roomKey": tmpRoomKey, "privateFlag": tmpPrivateFlag,
            "materialid": material["id"], "material": material
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
                    case "processed":
                        AppDispatch(tskbSetState({ tableStatus: "MTable" })); break;
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
    const deleteMaterial = (_tmpTargetId: Number = tmpTargetId) => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("delete", JSON.stringify({ "materialid": material["id"] }))
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
                        AppDispatch(tskbSetState({ tableStatus: "MTable" })); break;
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
    const materialDestroyModal = () => {
        return (
            <div className="modal fade" id="materialDestroyModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
                                onClick={() => { deleteMaterial() }}>
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
                        <i className="fa-solid fa-right-from-bracket mx-1"></i>レシピ閲覧に戻る
                    </button>
                    <button className="btn btn-outline-dark btn-lg" type="button"
                        disabled>
                        <i className="far fa-user mx-1"></i>{material["user"]}
                    </button>
                    <input className="flex-fill form-control form-control-lg" type="text" value={tmpMaterial}
                        placeholder='素材名'
                        onChange={(evt: any) => { setTmpMaterial(evt.target.value) }}>
                    </input >
                    <div className="form-check form-switch m-1">
                        {tmpPrivateFlag == true ?
                            <label className="form-check-label">
                                <i className="fa-solid fa-lock mx-1" />非公開</label> :
                            <label className="form-check-label">
                                <i className="fa-solid fa-lock-open mx-1" />公開&nbsp;&nbsp;</label>
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
                    {combination["userid"] == userId ?
                        <button className="btn btn-outline-danger btn-lg" type="button"
                            onClick={() => { $("#materialDestroyModal").modal('show') }}>
                            <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>素材破棄
                        </button> :
                        <button className="btn btn-outline-info btn-lg" type="button"
                            onClick={() => { HIModal("レシピ破棄は作成者にしかできません") }}>
                            <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>素材破棄
                        </button>
                    }
                </div></div>)
    }
    "(id,name,tag,description,userid,user,passhash,timestamp,"
    "g,cost,carbo,fiber,protein,fat,saturated_fat,n3,DHA_EPA,n6,"
    "ca,cr,cu,i,fe,mg,mn,mo,p,k,se,na,zn,va,vb1,vb2,vb3,vb5,vb6,vb7,vb9,vb12,vc,vd,ve,vk,colin,kcal)"
    if (0 < contents.length)
        if (!satisfyDictKeys(contents[0], [
            "id", "name", "tag", "description", "userid", "user", "passhash", "timestamp",
            "g", "cost", "carbo", "fiber", "protein", "fat", "saturated_fat", "n3", "DHA_EPA", "n6",
            "ca", "cr", "cu", "i", "fe", "mg", "mn", "mo", "p", "k", "se", "na", "zn", "va", "vb1", "vb2",
            "vb3", "vb5", "vb6", "vb7", "vb9", "vb12", "vc", "vd", "ve", "vk", "colin", "kcal"
        ]))
            return (<div className="row m-1">loading</div>)
    const _tmpTable = (
        <div style={{ overflow: "auto" }}>
            <table className="table table-dark table-striped-columns table-bordered"
                style={{ whiteSpace: "nowrap" }}>
                <tbody>
                    <tr >
                        <th scope="col"><h3>基本</h3></th>
                        <th scope="col">単価</th><th scope="col">熱量</th>
                        <th scope="col">炭水化物</th><th scope="col">タンパク質</th>
                        <th scope="col">脂質</th>
                    </tr>
                    <tr >
                        <th><button className="btn btn-success" type="button"
                            onClick={() => { }}>
                            <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                        </button></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th>
                    </tr>
                    <tr >
                        <th scope="col"><h3>詳細</h3></th>
                        <th scope="col">食物繊維</th><th scope="col">コリン</th>
                        <th scope="col">飽和脂肪酸</th><th scope="col">n-3脂肪酸</th>
                        <th scope="col">DHA-EPA</th><th scope="col">n-6脂肪酸</th>
                    </tr>
                    <tr >
                        <th><button className="btn btn-success" type="button"
                            onClick={() => { }}>
                            <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                        </button></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                    </tr>
                    <tr >
                        <th scope="col"><h3>ミネラル</h3></th><th scope="col">カルシウム</th>
                        <th scope="col">クロム</th><th scope="col">銅</th>
                        <th scope="col">ヨウ素</th><th scope="col">鉄</th>
                        <th scope="col">マグネシウム</th><th scope="col">マンガン</th>
                        <th scope="col">モリブデン</th><th scope="col">リン</th>
                        <th scope="col">カリウム</th><th scope="col">セレン</th>
                        <th scope="col">ナトリウム</th>
                        <th scope="col">亜鉛</th>
                    </tr>
                    <tr >
                        <th><button className="btn btn-success" type="button"
                            onClick={() => { }}>
                            <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                        </button></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/>
                        </th><th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/>
                        </th><th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th>
                    </tr>
                    <tr >
                        <th scope="col"><h3>ビタミン</h3></th>
                        <th scope="col">VA</th><th scope="col">VB1</th>
                        <th scope="col">VB2</th><th scope="col">VB3</th>
                        <th scope="col">VB5</th><th scope="col">VB6</th>
                        <th scope="col">VB7</th><th scope="col">VB9</th>
                        <th scope="col">VB12</th><th scope="col">VC</th>
                        <th scope="col">CD</th><th scope="col">CE</th>
                        <th scope="col">VK</th>
                    </tr>
                    <tr >
                        <th><button className="btn btn-success" type="button"
                            onClick={() => { }}>
                            <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                        </button></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th><th><input type="text" size={5}/></th>
                        <th><input type="text" size={5}/></th>
                    </tr>
                </tbody>
            </table>
        </div>
    )
    const etcForm = (
        <div>
            <textarea className="form-control col-12 w-80" rows={3} value={"工事中"}
                onChange={(evt) => { }}></textarea>
        </div>
    )

    return (
        <div className="m-1">
            {materialDestroyModal()}
            {topForm()}
            {_tmpTable}
            {etcForm}
        </div>)
}