import React, { useState, useEffect } from 'react';

import { HIModal, CIModal } from "../../../components/imodals";
import { satisfyDictKeys, Unixtime2String } from "../../../components/util";
import { accountSetState, tskbSetState, startTable } from '../../../components/slice'
import { useAppSelector, useAppDispatch } from '../../../components/store'


export const CMTable = () => {
    const [tmpTargetId, setTmpTargetId] = useState(-1)
    const [tmpMaterial, setTmpMaterial] = useState({
        "id": -1, "name": "", "tag": "", "description": "", "userid": -1, "user": "",
        "passhash": "", "timestamp": 0, "unit": "g", "cost": "", "carbo": "", "fiber": "",
        "protein": "", "fat": "", "saturated_fat": "", "n3": "", "DHA_EPA": "", "n6": "",
        "ca": "", "cl": "", "cr": "", "cu": "", "i": "", "fe": "", "mg": "", "mn": "",
        "mo": "", "p": "", "k": "", "se": "", "na": "", "zn": "", "va": "",
        "vb1": "", "vb2": "", "vb3": "", "vb5": "", "vb6": "", "vb7": "", "vb9": "",
        "vb12": "", "vc": "", "vd": "", "ve": "", "vk": "", "colin": "", "kcal": "",
    })
    const setTmpMaterialDict = (_key: string, _value: any) => {
        let _copy = JSON.parse(JSON.stringify(tmpMaterial))
        _copy[_key] = _value
        setTmpMaterial(_copy)
    }
    const reSetTmpMaterialDict = (_keys: any[]) => {
        let _copy = JSON.parse(JSON.stringify(tmpMaterial))
        for (let i = 0; i < _keys.length; i++) {
            _copy[_keys[i]] = JSON.parse(JSON.stringify(material))[_keys[i]]
        }
        setTmpMaterial(_copy)
    }

    const user = useAppSelector((state) => state.account.user)
    const userId = useAppSelector((state) => state.account.id)
    const token = useAppSelector((state) => state.account.token)
    const roomKey = useAppSelector((state) => state.account.roomKey)
    const tableStatus = useAppSelector((state) => state.tskb.tableStatus)
    const material = useAppSelector((state) => state.tskb.material)
    const reloadFlag = useAppSelector((state) => state.tskb.reloadFlag)
    const AppDispatch = useAppDispatch()
    const xhrTimeout = 3000
    const xhrDelay = 100


    useEffect(() => {
        setTmpTargetId(-1)
    }, [reloadFlag])
    useEffect(() => {
        if (tableStatus == "CMTable") setTmpMaterial(material)
    }, [material])

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
            return _contents.sort(_sortContentsRev)
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
                        AppDispatch(startTable({
                            tableStatus: "CTable",
                            tmpContents: sortSetContentsRev(resJ["combinations"])
                        }))
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
            "roomKey": roomKey, "material": tmpMaterial
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
                        HIModal("登録完了")
                        AppDispatch(startTable({ tableStatus: "MTable", material: resJ["material"] }));
                        break;
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
                        AppDispatch(startTable({ tableStatus: "MTable" })); break;
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
    const CMTMaterialDeleteModal = () => {
        return (
            <div className="modal fade" id="CMTMaterialDeleteModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
    const CMTMaterialTagModal = () => {
        return (
            <div className="modal fade" id="CMTMaterialTagModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="fa-solid fa-gear" />タグ編集
                            </h4>
                        </div>
                        <div className="modal-footer d-flex">
                            <button type="button" className="btn btn-secondary me-auto" data-bs-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-danger" data-bs-dismiss="modal"
                                onClick={() => { }}>
                                <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }} />test
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
            <div className="row m-1">
                <div className="col-12">
                    <div className="input-group d-flex justify-content-center align-items-center my-1">
                        <button className="btn btn-outline-dark btn-lg" type="button"
                            onClick={() => { AppDispatch(startTable({ tableStatus: "MTable" })) }}>
                            <i className="fa-solid fa-right-from-bracket mx-1"></i>レシピ閲覧に戻る
                        </button>
                        <button className="btn btn-outline-success btn-lg" type="button"
                            onClick={() => { setTmpMaterial(material) }}>
                            <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                        </button>
                        <span className="input-group-text form-control-lg">
                            <i className="fa-solid fa-lemon mx-1" />
                        </span>
                        {tmpMaterial["userid"] == userId || tmpMaterial["userid"] == -1 ?
                            <input className="flex-fill form-control form-control-lg" type="text" value={tmpMaterial["name"]}
                                placeholder='素材名を入力してください'
                                onChange={(evt: any) => { setTmpMaterialDict("name", evt.target.value) }}>
                            </input > :
                            <input className="flex-fill form-control form-control-lg" type="text" value={tmpMaterial["name"]}
                                disabled >
                            </input >
                        }
                    </div>
                </div>
                <div className="col-12 col-md-4 my-1">
                </div>
                <div className="col-12 col-md-4 my-1">
                    <div className="input-group">
                        <span className="input-group-text"><i className="fa-solid fa-tag mx-1" /></span>
                        <input className="form-control" type="text" placeholder="タグ名"
                            value={tmpMaterial.tag} onChange={(evt: any) => setTmpMaterialDict("tag", evt.target.value)} />
                    </div>
                    <div className="border border-2 bg-light p-2">
                        <p><i className="far fa-user mx-1"></i>作成者{": " + material["user"]}</p>
                        <p>作成時間:<br />{Unixtime2String(Number(material.timestamp))}</p>
                    </div>
                </div>
                <div className="col-12 col-md-4 my-1">
                    <div className="d-flex justify-content-center align-items-center">
                        <h4 className="mx-3">概説</h4>
                    </div>
                    <textarea className="form-control col-12 w-80" rows={4} value={tmpMaterial["description"]}
                        onChange={(evt: any) => { setTmpMaterialDict("description", evt.target.value) }}
                        style={{ resize: "none" }} />
                </div>
            </div>)
    }
    const bottomForm = () => {
        return (
            <div>
                {tmpMaterial["userid"] == userId || tmpMaterial["userid"] == -1 ?
                    <div className="d-flex justify-content-between align-items-center my-1">
                        {tmpMaterial["passhash"] == "" ?
                            <button className="btn btn-outline-warning btn-lg" type="button"
                                onClick={() => { setTmpMaterialDict("passhash", "0") }}>
                                <i className="fa-solid fa-lock-open mx-1" style={{ pointerEvents: "none" }} />
                                公開&nbsp;&nbsp;
                            </button> :
                            <button className="btn btn-warning btn-lg" type="button"
                                onClick={() => { setTmpMaterialDict("passhash", "") }}>
                                <i className="fa-solid fa-lock mx-1" style={{ pointerEvents: "none" }} />
                                非公開
                            </button>
                        }
                        {tmpMaterial["name"] == "" ?
                            <button className="btn btn-outline-primary btn-lg" type="button" disabled>
                                <i className="fa-solid fa-circle-info mx-1" style={{ pointerEvents: "none" }} />
                                素材名を入力してください
                            </button> :
                            <div>
                                {material["id"] == -1 ?
                                    <button className="btn btn-outline-primary btn-lg" type="button"
                                        onClick={() => {
                                            registerMaterial();
                                            window.scrollTo({ top: 0, behavior: "smooth", });
                                        }}>
                                        <i className="fa-solid fa-lemon mx-1" style={{ pointerEvents: "none" }} />
                                        登録
                                    </button> :
                                    <button className="btn btn-outline-success btn-lg" type="button"
                                        onClick={() => {
                                            registerMaterial();
                                            window.scrollTo({ top: 0, behavior: "smooth", });
                                        }}>
                                        <i className="fa-solid fa-cheese mx-1" style={{ pointerEvents: "none" }} />
                                        更新
                                    </button>
                                }
                            </div>
                        }
                        <div>
                            {tmpMaterial["name"] == "" ?
                                <button className="btn btn-outline-info btn-lg" type="button"
                                    onClick={() => { HIModal("素材名入力が必要") }}>
                                    <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>素材破棄
                                </button> :
                                <button className="btn btn-outline-danger btn-lg" type="button"
                                    onClick={() => { $("#CMTMaterialDeleteModal").modal('show') }}>
                                    <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>素材破棄
                                </button>}
                        </div>
                    </div> :
                    <div className="d-flex justify-content-between align-items-center my-1">
                        {tmpMaterial["passhash"] == "" ?
                            <button className="btn btn-outline-warning btn-lg" type="button" disabled>
                                <i className="fa-solid fa-lock-open mx-1" style={{ pointerEvents: "none" }} />
                                公開&nbsp;&nbsp;
                            </button> :
                            <button className="btn btn-warning btn-lg" type="button" disabled>
                                <i className="fa-solid fa-lock mx-1" style={{ pointerEvents: "none" }} />
                                非公開
                            </button>
                        }
                        <button className="btn btn-outline-info btn-lg" type="button"
                            onClick={() => { HIModal("作成者のみ許可された操作") }}>
                            <i className="fa-solid fa-cheese mx-1" style={{ pointerEvents: "none" }} />
                            更新
                        </button>
                        <button className="btn btn-outline-info btn-lg" type="button"
                            onClick={() => { HIModal("作成者のみ許可された操作") }}>
                            <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>
                            素材破棄
                        </button>
                    </div>
                }
            </div>)
    }
    const _tmpTable = (
        <div style={{ overflow: "auto" }}>
            <table className="table table-dark table-striped-columns table-bordered" style={{ whiteSpace: "nowrap" }}>
                <tbody>
                    <tr>
                        <th scope="col"><h4>基本</h4></th>
                        <th scope="col">単位数量
                            <i className="text-info fa-solid fa-circle-question"
                                onClick={() => {
                                    HIModal("単位となる数量", "基本的に素材100[g]当たりの栄養価\n" +
                                        "サプリ等は1[個]当たりの栄養価." +
                                        "人間は体重[kg].")
                                }}>
                            </i><br />{"[g|1|kg]"}
                        </th>
                        <th scope="col">単価<br />{"[円]"}</th>
                        <th scope="col">熱量<br />{"[kcal]"}</th>
                        <th scope="col">炭水化物<br />{"[g]"}</th>
                        <th scope="col">タンパク質<br />{"[g]"}</th>
                        <th scope="col">脂質<br />{"[g]"}</th>
                    </tr>
                    <tr>
                        <td><button className="btn btn-success" type="button"
                            onClick={() => {
                                reSetTmpMaterialDict(
                                    ["unit", "cost", "kcal", "carbo", "protein", "fat"])
                            }}>
                            <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                        </button></td>
                        <td><input type="text" size={4} value={parseFloat("0" + tmpMaterial["unit"])}
                            onChange={(evt: any) => { setTmpMaterialDict("unit", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["cost"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("cost", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["kcal"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("kcal", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["carbo"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("carbo", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["protein"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("protein", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["fat"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("fat", evt.target.value) }} /></td>
                    </tr>
                    <tr>
                        <th scope="col"><h4>詳細</h4></th>
                        <th scope="col">飽和脂肪酸<br />{"[g]"}</th>
                        <th scope="col">n-3脂肪酸<br />{"[g]"}</th>
                        <th scope="col">DHA-EPA<br />{"[g]"}</th>
                        <th scope="col">n-6脂肪酸<br />{"[g]"}</th>
                        <th scope="col">食物繊維<br />{"[g]"}</th>
                        <th scope="col">コリン<br />{"[mg]"}</th>
                    </tr>
                    <tr>
                        <td><button className="btn btn-success" type="button"
                            onClick={() => {
                                reSetTmpMaterialDict(
                                    ["fiber", "colin", "saturated_fat", "n3", "DHA_EPA", "n6"])
                            }}>
                            <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                        </button></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["saturated_fat"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("saturated_fat", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["n3"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("n3", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["DHA_EPA"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("DHA_EPA", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["n6"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("n6", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["fiber"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("fiber", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["colin"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("colin", evt.target.value) }} /></td>
                    </tr>
                    <tr>
                        <th scope="col"><h4>ミネラル</h4></th>
                        <th scope="col">カルシウム<br />{"[mg]"}</th>
                        <th scope="col">塩素<br />{"[mg]"}</th>
                        <th scope="col">クロム<br />{"[μg]"}</th>
                        <th scope="col">銅<br />{"[μg]"}</th>
                        <th scope="col">ヨウ素<br />{"[μg]"}</th>
                        <th scope="col">鉄<br />{"[mg]"}</th>
                        <th scope="col">マグネシウム<br />{"[mg]"}</th>
                        <th scope="col">マンガン<br />{"[mg]"}</th>
                        <th scope="col">モリブデン<br />{"[μg]"}</th>
                        <th scope="col">リン<br />{"[mg]"}</th>
                        <th scope="col">カリウム<br />{"[mg]"}</th>
                        <th scope="col">セレン<br />{"[μg]"}</th>
                        <th scope="col">ナトリウム<br />{"[mg]"}</th>
                        <th scope="col">亜鉛<br />{"[mg]"}</th>
                    </tr>
                    <tr>
                        <td><button className="btn btn-success" type="button"
                            onClick={() => {
                                reSetTmpMaterialDict(
                                    ["ca", "cl", "cr", "cu", "i", "fe", "mg", "mn", "mo", "p", "ca", "se", "na", "zn"])
                            }}>
                            <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                        </button></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["ca"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("ca", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["cl"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("cl", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["cr"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("cr", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["cu"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("cu", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["i"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("i", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["fe"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("fe", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["mg"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("mg", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["mn"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("mn", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["mo"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("mo", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["p"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("p", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["ca"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("ca", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["se"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("se", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["na"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("na", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["zn"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("zn", evt.target.value) }} /></td>
                    </tr>
                    <tr>
                        <th scope="col"><h4>ビタミン</h4></th>
                        <th scope="col">VA<br />{"[μgRE]"}</th>
                        <th scope="col">VB1<br />{"[mg]"}</th>
                        <th scope="col">VB2<br />{"[mg]"}</th>
                        <th scope="col">VB3<br />{"[mgNE]"}</th>
                        <th scope="col">VB5<br />{"[mg]"}</th>
                        <th scope="col">VB6<br />{"[mg]"}</th>
                        <th scope="col">VB7<br />{"[μg]"}</th>
                        <th scope="col">VB9<br />{"[μg]"}</th>
                        <th scope="col">VB12<br />{"[μg]"}</th>
                        <th scope="col">VC<br />{"[mg]"}</th>
                        <th scope="col">VD<br />{"[μg]"}</th>
                        <th scope="col">VE<br />{"[mg]"}</th>
                        <th scope="col">VK<br />{"[μg]"}</th>
                    </tr>
                    <tr>
                        <td><button className="btn btn-success" type="button"
                            onClick={() => {
                                reSetTmpMaterialDict(
                                    ["va", "vb1", "vb2", "vb3", "vb5", "vb6", "vb7", "vb9", "vb12", "vc", "vd", "ve", "vk"])
                            }}>
                            <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                        </button></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["va"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("va", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["vb1"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("vb", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["vb2"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("vb2", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["vb3"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("vb3", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["vb5"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("vb5", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["vb6"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("vb6", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["vb7"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("vb7", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["vb9"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("vb9", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["vb12"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("vb12", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["vc"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("vc", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["vd"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("vd", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["ve"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("ve", evt.target.value) }} /></td>
                        <td><input type="text" size={4} value={String(tmpMaterial["vk"]).replace(/[^0-9|.]/g, '')}
                            onChange={(evt: any) => { setTmpMaterialDict("vk", evt.target.value) }} /></td>
                    </tr>
                </tbody>
            </table>
        </div>
    )

    return (
        <div className="p-1" style={{
            background: "linear-gradient(45deg,rgba(180,230,240,0.2), rgba(60,60,60,0.0))"
        }}>
            {CMTMaterialTagModal()}
            {CMTMaterialDeleteModal()}
            {topForm()}
        <div className="slidein-1">{_tmpTable}</div>
            {bottomForm()}
        </div>)
}