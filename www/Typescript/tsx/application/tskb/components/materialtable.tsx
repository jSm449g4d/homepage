import React, { useState, useEffect } from 'react';

import { HIModal, CIModal } from "../../../components/imodals";
import { satisfyDictKeys, Unixtime2String, toSignificantDigits } from "../../../components/util";
import { accountSetState, tskbSetState, startTable } from '../../../components/slice'
import { useAppSelector, useAppDispatch } from '../../../components/store'


export const MTable = () => {
    const [contents, setContents] = useState([])
    const [tmpAttachment, setTmpAttachment] = useState(null)
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


    useEffect(() => {
        AppDispatch(tskbSetState({}));
        if (tableStatus == "MTable") setTimeout(() => fetchMaterial(), xhrDelay)
    }, [reloadFlag])
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
                        AppDispatch(accountSetState({ token: resJ["token"] }));
                        downloadImage();
                        break;
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
        if (tmpAttachment == - 1) {
            formData.append("delimage", JSON.stringify({}))
        }
        else if (tmpAttachment != null) {
            formData.append("upimage", tmpAttachment, tmpAttachment.name)
        }
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
    const downloadImage = () => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("dlimage", JSON.stringify({ "combination_id": combination["id"] }))
        const request = new Request("/tskb/main.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.blob())
            .then(blob => {
                //if (blob.type.indexOf("image") == -1) return
                const _url = window.URL.createObjectURL(blob);
                $("#MTimage").attr({ "src": _url });
                $("#MTimage").css('visibility', '');
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
        formData.append("destroy", JSON.stringify({ "combination_id": combination["id"] }))
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
            <div className="row m-1">
                <div className="col-12 my-1">
                    <div className="input-group d-flex justify-content-center align-items-center">
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
                        {combination["userid"] == userId ?
                            <input className="flex-fill form-control form-control-lg" type="text" value={tmpCombination["name"]}
                                onChange={(evt: any) => { setTmpCombinationDict("name", evt.target.value) }}>
                            </input > :
                            <input className="flex-fill form-control form-control-lg" type="text" value={tmpCombination["name"]}
                                disabled>
                            </input >

                        }
                    </div>
                </div>
                <div className="col-12 col-md-4 my-1">
                    <div className="d-flex justify-content-center">
                        {combination["userid"] == userId ?
                            <div>
                                {tmpAttachment == null || tmpAttachment == -1?
                                    <div>
                                        <h4>画像のアップロード</h4>
                                        <input type="file" className="form-control"
                                            accept="image/*" placeholder='画像のアップロード'
                                            onChange={(evt) => {
                                                setTmpAttachment(evt.target.files[0])
                                                if (!evt.target.files[0]) return
                                                var _reader = new FileReader()
                                                _reader.onload = () => {
                                                    $("#MTimage").attr({ "src": _reader.result })
                                                    $("#MTimage").css('visibility', '');
                                                    HIModal("画像登録", "更新してください")
                                                };
                                                _reader.readAsDataURL(evt.target.files[0])
                                            }} />
                                    </div> :
                                    <button className="btn btn-outline-danger" type="button"
                                        onClick={() => {
                                            setTmpAttachment(-1)
                                            $("#MTimage").attr({ "src": "" })
                                            $("#MTimage").css('visibility', 'hidden');
                                            HIModal("画像削除", "更新してください")
                                        }}>
                                        <i className=" fa-solid fa-xmark" style={{ pointerEvents: "none" }} />
                                    </button>
                                }
                            </div> :
                            <div>
                                {tmpAttachment == null ?
                                    <h4>No Image</h4>
                                    : <div />
                                }
                            </div>
                        }
                        <img className="img-fluid" src="" id="MTimage"
                            style={{ height: 200, objectFit: "contain", visibility: "hidden" }} />
                    </div>
                </div>
                <div className="col-12 col-md-8 my-1">
                    <div className="d-flex justify-content-center align-items-center">
                        <h4 className="mx-3">概説</h4>
                    </div>
                    <textarea className="form-control col-12 w-80" rows={3} value={combination["description"]}
                        onChange={(evt: any) => { setTmpCombinationDict("description", evt.target.value) }}
                        style={{ resize: "none" }} />
                </div>
            </div>)
    }
    const bottomForm = () => {
        return (
            <div>
                {combination["userid"] == userId ?
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
                                    <i className="fa-solid fa-up-right-from-square mx-1" style={{ pointerEvents: "none" }} />
                                    更新
                                </button>
                            </div>
                        }
                        <button className="btn btn-outline-danger btn-lg" type="button"
                            onClick={() => { $("#combinationDestroyModal1").modal('show') }}>
                            <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>レシピ破棄
                        </button>
                    </div> :
                    <div className="d-flex justify-content-between align-items-center my-1">
                        {tmpCombination["passhash"] == "" ?
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
                            <i className="fa-solid fa-up-right-from-square mx-1" style={{ pointerEvents: "none" }} />
                            更新
                        </button>
                        <button className="btn btn-outline-info btn-lg" type="button"
                            onClick={() => { HIModal("作成者のみ許可された操作") }}>
                            <i className="far fa-trash-alt mx-1" style={{ pointerEvents: "none" }}></i>レシピ破棄
                        </button>
                    </div>
                }
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
            <th scope="col">量
                <i className="text-info fa-solid fa-circle-question mx-1"
                    onClick={() => {
                        HIModal("単位となる数量", "基本的に素材100[g]当たりの栄養価\n" +
                            "サプリ等は1[個]当たりの栄養価")
                    }}>
                </i>
            </th>
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
    const _ccontents = JSON.parse(tmpCombination.contents)
    if (0 < contents.length) {
        var _nutrition = JSON.parse(JSON.stringify(contents[0]))
        for (let _key in _nutrition) { _nutrition[_key] = 0 }
        for (let _i = 0; _i < contents.length; _i++) {
            if (contents[_i]["id"] in _ccontents == false) continue
            for (let _key in _nutrition) {
                _nutrition[_key] +=
                    parseFloat("0" + (contents[_i][_key]) *
                        parseFloat("0" + _ccontents[contents[_i]["id"]])) /
                    parseFloat("0" + contents[_i]["unit"])
            }
        }
        for (let _key in _nutrition) { _nutrition[_key] = toSignificantDigits(_nutrition[_key]) }
        _tmpRecord.push(
            <tr>
                <td></td>
                <td>総計</td>
                <td></td>
                <td>{_nutrition["cost"]}</td>
                <td>{_nutrition["kcal"]}</td>
                <td>{_nutrition["carbo"]}</td>
                <td>{_nutrition["protein"]}</td>
                <td>{_nutrition["fat"]}</td>
                <td>{_nutrition["saturated_fat"]}</td>
                <td>{_nutrition["n3"]}</td>
                <td>{_nutrition["DHA_EPA"]}</td>
                <td>{_nutrition["n6"]}</td>
                <td>{_nutrition["fiber"]}</td>
                <td>{_nutrition["colin"]}</td>
                <td>{_nutrition["ca"]}</td>
                <td>{_nutrition["cl"]}</td>
                <td>{_nutrition["cr"]}</td>
                <td>{_nutrition["cu"]}</td>
                <td>{_nutrition["i"]}</td>
                <td>{_nutrition["fe"]}</td>
                <td>{_nutrition["mg"]}</td>
                <td>{_nutrition["mn"]}</td>
                <td>{_nutrition["mo"]}</td>
                <td>{_nutrition["p"]}</td>
                <td>{_nutrition["k"]}</td>
                <td>{_nutrition["se"]}</td>
                <td>{_nutrition["na"]}</td>
                <td>{_nutrition["zn"]}</td>
                <td>{_nutrition["va"]}</td>
                <td>{_nutrition["vb1"]}</td>
                <td>{_nutrition["vb2"]}</td>
                <td>{_nutrition["vb3"]}</td>
                <td>{_nutrition["vb5"]}</td>
                <td>{_nutrition["vb6"]}</td>
                <td>{_nutrition["vb7"]}</td>
                <td>{_nutrition["vb9"]}</td>
                <td>{_nutrition["vb12"]}</td>
                <td>{_nutrition["vc"]}</td>
                <td>{_nutrition["vd"]}</td>
                <td>{_nutrition["ve"]}</td>
                <td>{_nutrition["vk"]}</td>
            </tr>
        )
    }
    _tmpRecord.push(
        <tr className="">
        </tr>
    )
    for (let i = 0; i < contents.length; i++) {
        const _button = (
            <td>
                {combination["userid"] == userId ?
                    <button type="button" className="btn btn-outline-danger rounded-pill"
                        onClick={(evt: any) => { combineCombination(evt.target.value) }}
                        value={contents[i]["id"]}>
                        <i className="fa-solid fa-minus" style={{ pointerEvents: "none" }} />
                    </button> :
                    <button type="button" className="btn btn-outline-danger rounded-pill"
                        disabled>
                        <i className="fa-solid fa-minus" style={{ pointerEvents: "none" }} />
                    </button>
                }
            </td>)
        if (contents[i]["id"] in _ccontents == false) {
            _tmpRecord.push(
                <tr>
                    <td>{_button}</td>
                    <td>未使用の素材です</td>
                </tr>)
            continue
        }
        const _amount = parseFloat("0" + _ccontents[contents[i]["id"]])
        const _unit = _amount / parseFloat("0" + contents[i]["unit"])
        _tmpRecord.push(
            <tr>
                <td>{_button}</td>
                <td>{contents[i]["name"]}</td>
                <td><input type="text" size={4} value={_amount}
                    onChange={(evt: any) => {
                        setTmpCombinationContents(evt.target.name, evt.target.value)
                    }}
                    id={"MTamount_" + i} name={String(contents[i]["id"])} /></td>
                <td>{toSignificantDigits(contents[i]["cost"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["kcal"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["carbo"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["protein"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["fat"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["saturated_fat"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["n3"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["DHA_EPA"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["n6"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["fiber"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["colin"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["ca"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["cl"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["cr"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["cu"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["i"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["fe"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["mg"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["mn"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["mo"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["p"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["k"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["se"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["na"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["zn"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["va"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["vb1"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["vb2"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["vb3"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["vb5"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["vb6"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["vb7"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["vb9"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["vb12"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["vc"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["vd"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["ve"] * _unit)}</td>
                <td>{toSignificantDigits(contents[i]["vk"] * _unit)}</td>
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