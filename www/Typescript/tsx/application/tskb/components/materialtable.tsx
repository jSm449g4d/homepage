import React, { useState, useEffect } from 'react';

import { HIModal, CIModal } from "../../../components/imodals";
import { satisfyDictKeys, Unixtime2String, toSignificantDigits } from "../../../components/util";
import { accountSetState, tskbSetState, startTable } from '../../../components/slice'
import { useAppSelector, useAppDispatch } from '../../../components/store'


export const MTable = () => {
    const [contents, setContents] = useState([])
    const [requirements, setRequirements] = useState([])
    const [requirementNumber, setRequirementNumber] = useState(0)
    //tmpAttachment -1: delete, 1: alreadyExist null: noImage, else: uploadImage
    const [tmpAttachment, setTmpAttachment] = useState(null)
    const [tmpCombination, setTmpCombination] = useState({
        "id": -1, "name": "", "tag": "", "description": "", "userid": -1, "user": "",
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
                "token": token, "user": user,
            }, _additionalDict)
        return (JSON.stringify(_sendDict))
    }
    // fetchAPI
    const fetchMaterial = () => {
        const sortSetContents = (_contents: any = []) => {
            const _sortContents = (a: any, b: any) => { return a["timestamp"] - b["timestamp"] }
            setContents(_contents.sort(_sortContents))
        }
        const sortSetRequirements = (_contents: any = []) => {
            const _sortContents = (a: any, b: any) => { return a["id"] - b["id"] }
            setRequirements(_contents.sort(_sortContents))
        }
        const headers = new Headers();
        const formData = new FormData();
        formData.append("info", stringForSend())
        formData.append("fetch", JSON.stringify({ "combinationid": combination["id"] }))
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
                        sortSetRequirements(resJ["requirements"]);
                        AppDispatch(accountSetState({ token: resJ["token"] }));
                        downloadImage();
                        break;
                    }
                    default: {
                        if ("text" in resJ) CIModal(resJ["text"]);
                        AppDispatch(startTable({ tableStatus: "CTable", combitation: null }));
                        break;
                    }
                }
            })
            .catch(error => {
                CIModal("通信エラー")
                console.error(error.message)
            });
    }
    const combineCombination = (_tmpTargetId: string) => {
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
                        setTimeout(() => fetchMaterial(), xhrDelay)
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
        switch (tmpAttachment) {
            case -1:
                formData.append("delimage", JSON.stringify({}))
                break;
            case 1:
                break;
            case null:
                break;
            default:
                formData.append("upimage", tmpAttachment, tmpAttachment.name)
                break;
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
                        setTimeout(() => fetchMaterial(), xhrDelay)
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
    const downloadImage = () => {
        const headers = new Headers();
        const formData = new FormData();
        $("#MTimage").css('visibility', '');
        setTmpAttachment(null)
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
                if (blob.type.indexOf("image") != -1) {
                    const _url = window.URL.createObjectURL(blob);
                    $("#MTimage").attr({ "src": _url });
                    $("#MTimage").css('visibility', '');
                    setTmpAttachment(1)
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
        const _imgForm = (
            <div className="d-flex justify-content-center">
                {combination["userid"] == userId ?
                    <div>
                        {tmpAttachment == null || tmpAttachment == -1 ?
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
                        {tmpAttachment == null || tmpAttachment == -1 ?
                            <h4>No Image</h4> : <div />
                        }
                    </div>
                }
                <img className="img-fluid" src="" id="MTimage"
                    style={{ height: 300, objectFit: "contain", visibility: "hidden" }} />
            </div>
        )
        return (
            <div className="row m-1">
                <div className="col-12 my-1">
                    <div className="input-group d-flex justify-content-center align-items-center">
                        <button className="btn btn-outline-dark btn-lg" type="button"
                            onClick={() => { AppDispatch(startTable({ tableStatus: "CTable", combitation: null })) }}>
                            <i className="fa-solid fa-right-from-bracket mx-1"></i>レシピ一覧に戻る
                        </button>
                        <button className="btn btn-outline-success btn-lg" type="button"
                            onClick={() => { fetchMaterial() }}>
                            <i className="fa-solid fa-rotate-right mx-1" style={{ pointerEvents: "none" }} />
                        </button>
                        {combination["userid"] == userId ?
                            <input className="flex-fill form-control form-control-lg" type="text"
                                value={tmpCombination["name"].slice(0, 50)}
                                onChange={(evt: any) => { setTmpCombinationDict("name", evt.target.value) }}>
                            </input > :
                            <span className="input-group-text flex-fill">
                                <h4>{tmpCombination["name"].slice(0, 50)}</h4>
                            </span>
                        }
                    </div>
                </div>
                <div className="col-12 col-md-4 my-1">
                    {_imgForm}
                </div>
                <div className="col-12 col-md-4 my-1">
                    <div className="input-group">
                        <span className="input-group-text"><i className="fa-solid fa-tag mx-1" /></span>
                        <input className="form-control" type="text" placeholder="タグ名"
                            value={tmpCombination.tag.slice(0, 50)}
                            onChange={(evt: any) => setTmpCombinationDict("tag", evt.target.value)} />
                    </div>
                    <div className="border border-2 bg-light p-2">
                        <p><i className="far fa-user mx-1"></i>作成者{": " + combination["user"]}</p>
                        <p>作成時間:<br />{Unixtime2String(Number(combination.timestamp))}</p>
                    </div>
                </div>
                <div className="col-12 col-md-4 my-1">
                    <div className="d-flex justify-content-center align-items-center">
                        <h4 className="mx-3">概説</h4>
                    </div>
                    <textarea className="form-control col-12 w-80" rows={4} value={tmpCombination["description"].slice(0, 200)}
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
                                    onClick={() => {
                                        updateCombination()
                                        window.scrollTo({ top: 0, behavior: "smooth", });
                                    }}>
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
                        <div /><div />
                    </div>
                }
            </div>)
    }
    const _tmpElementColumn = [];
    _tmpElementColumn.push(
        <tr>
            <th scope="col">操作</th>
            <th scope="col">名称</th>
            <th scope="col">量
                <i className="text-info fa-solid fa-circle-question mx-1"
                    onClick={() => {
                        HIModal("単位となる数量", "基本的に素材100[g]当たりの栄養価." +
                            "サプリは1[個]当たりの栄養価." +
                            "人間は体重[kg].")
                    }}>
                </i><br />{"[g|1|kg]"}
            </th>
            <th scope="col">単価<br />{"[円]"}</th>
            <th scope="col">熱量<br />{"[kcal]"}</th>
            <th scope="col">炭水化物<br />{"[g]"}
                <i className="text-info fa-solid fa-circle-question mx-1"
                    onClick={() => {
                        HIModal("糖質", "糖質=炭水化物-食物繊維"
                        )
                    }}>
                </i></th>
            <th scope="col">タンパク質<br />{"[g]"}	</th>
            <th scope="col">脂質<br />{"[g]"}</th>
            <th scope="col">飽和脂肪酸<br />{"[g]"}
                <i className="text-info fa-solid fa-circle-question mx-1"
                    onClick={() => {
                        HIModal("上限量", "飽和脂肪酸は、体内合成が可能であり、必須栄養素ではない。" +
                            "、高 LDLコレステロール血症の主な危険因子の 1 つであり、" +
                            "心筋梗塞を始めとする循環器疾患の危険因子でもある。"
                        )
                    }}>
                </i></th>
            <th scope="col">n-3脂肪酸<br />{"[g]"}</th>
            <th scope="col">DHA-EPA<br />{"[g]"}</th>
            <th scope="col">n-6脂肪酸<br />{"[g]"}</th>
            <th scope="col">食物繊維<br />{"[g]"}</th>
            <th scope="col">コリン<br />{"[mg]"}</th>
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
    )
    const _tmpRecord = [];
    const _ccontents = JSON.parse(tmpCombination.contents)

    if (0 == requirements.length) {
        return (
            <div style={{ overflow: "auto" }}>
                工事中⇒必要栄養素テーブルをセットしてください
            </div>)
    }
    var _nutrition = JSON.parse(JSON.stringify(requirements[requirementNumber]))
    const requirementNameDrop = () => {
        const _tmpItems = []
        for (let _i = 0; _i < requirements.length; _i++) {
            _tmpItems.push(
                <li>
                    <button className="dropdown-item" value={_i}
                        onClick={(evt: any) => setRequirementNumber(evt.target.value)}>
                        {requirements[_i]["name"]}
                    </button>
                </li>)
        }
        return (
            <div className="dropdown">
                <button className="btn btn-dark dropdown-toggle"
                    type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {_nutrition["name"].slice(0, 20)}
                </button>
                <ul className="dropdown-menu">
                    {_tmpItems}
                </ul>
            </div>

        )
    }
    _tmpRecord.push(
        <tr>
            <td></td>
            <td>
                <div className="d-flex">
                    {requirementNameDrop()}
                    <i className="text-primary fa-solid fa-message mx-1"
                        onClick={() => {
                            HIModal("概説", $("#MTrequirementDescription").attr("value"))
                        }}>
                    </i>
                    <button value={_nutrition["description"]} id="MTrequirementDescription"
                        style={{ visibility: "hidden" }} />
                </div>
            </td>
            <td>{_nutrition["unit"]}</td>
            <td></td>
            <td>{toSignificantDigits(_nutrition["kcal"])}</td>
            <td>{toSignificantDigits(_nutrition["carbo"])}</td>
            <td>{toSignificantDigits(_nutrition["protein"])}</td>
            <td>{toSignificantDigits(_nutrition["fat"])}</td>
            <td>{toSignificantDigits(_nutrition["saturated_fat"])}</td>
            <td>{toSignificantDigits(_nutrition["n3"])}</td>
            <td>{toSignificantDigits(_nutrition["DHA_EPA"])}</td>
            <td>{toSignificantDigits(_nutrition["n6"])}</td>
            <td>{toSignificantDigits(_nutrition["fiber"])}</td>
            <td>{toSignificantDigits(_nutrition["colin"])}</td>
            <td>{toSignificantDigits(_nutrition["ca"])}</td>
            <td>{toSignificantDigits(_nutrition["cl"])}</td>
            <td>{toSignificantDigits(_nutrition["cr"])}</td>
            <td>{toSignificantDigits(_nutrition["cu"])}</td>
            <td>{toSignificantDigits(_nutrition["i"])}</td>
            <td>{toSignificantDigits(_nutrition["fe"])}</td>
            <td>{toSignificantDigits(_nutrition["mg"])}</td>
            <td>{toSignificantDigits(_nutrition["mn"])}</td>
            <td>{toSignificantDigits(_nutrition["mo"])}</td>
            <td>{toSignificantDigits(_nutrition["p"])}</td>
            <td>{toSignificantDigits(_nutrition["k"])}</td>
            <td>{toSignificantDigits(_nutrition["se"])}</td>
            <td>{toSignificantDigits(_nutrition["na"])}</td>
            <td>{toSignificantDigits(_nutrition["zn"])}</td>
            <td>{toSignificantDigits(_nutrition["va"])}</td>
            <td>{toSignificantDigits(_nutrition["vb1"])}</td>
            <td>{toSignificantDigits(_nutrition["vb2"])}</td>
            <td>{toSignificantDigits(_nutrition["vb3"])}</td>
            <td>{toSignificantDigits(_nutrition["vb5"])}</td>
            <td>{toSignificantDigits(_nutrition["vb6"])}</td>
            <td>{toSignificantDigits(_nutrition["vb7"])}</td>
            <td>{toSignificantDigits(_nutrition["vb9"])}</td>
            <td>{toSignificantDigits(_nutrition["vb12"])}</td>
            <td>{toSignificantDigits(_nutrition["vc"])}</td>
            <td>{toSignificantDigits(_nutrition["vd"])}</td>
            <td>{toSignificantDigits(_nutrition["ve"])}</td>
            <td>{toSignificantDigits(_nutrition["vk"])}</td>
        </tr>
    )
    const _totalNutritionRender = (_val_: number, _stand_: number, _reverse = false) => {
        var _val = _val_, _stand = _stand_
        if (_reverse == true) { _val = _stand_, _stand = _val_ }
        if (_val < _stand * 0.8) { return (<b style={{ "color": "deeppink" }}>{_val_}</b>) }
        if (_val < _stand) { return (<b style={{ "color": "lightpink" }}>{_val_}</b>) }
        if (_val < _stand * 1.2 || _val == _stand) { return (<b>{_val_}</b>) }
        if (_val < _stand * 2) { return (<b style={{ "color": "lightskyblue" }}>{_val_}</b>) }
        else { return (<b style={{ "color": "deepskyblue" }}>{_val_}</b>) }
    }
    var _nutrition = JSON.parse(JSON.stringify(requirements[0]))
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
            <td>{_totalNutritionRender(_nutrition["kcal"], requirements[requirementNumber]["kcal"])}</td>
            <td>{_totalNutritionRender(_nutrition["carbo"], requirements[requirementNumber]["carbo"])}</td>
            <td>{_totalNutritionRender(_nutrition["protein"], requirements[requirementNumber]["protein"])}</td>
            <td>{_totalNutritionRender(_nutrition["fat"], requirements[requirementNumber]["fat"])}</td>
            <td>{_totalNutritionRender(_nutrition["saturated_fat"],
                requirements[requirementNumber]["saturated_fat"], true)}</td>
            <td>{_totalNutritionRender(_nutrition["n3"], requirements[requirementNumber]["n3"])}</td>
            <td>{_totalNutritionRender(_nutrition["DHA_EPA"], requirements[requirementNumber]["DHA_EPA"])}</td>
            <td>{_totalNutritionRender(_nutrition["n6"], requirements[requirementNumber]["n6"])}</td>
            <td>{_totalNutritionRender(_nutrition["fiber"], requirements[requirementNumber]["fiber"])}</td>
            <td>{_totalNutritionRender(_nutrition["colin"], requirements[requirementNumber]["colin"])}</td>
            <td>{_totalNutritionRender(_nutrition["ca"], requirements[requirementNumber]["ca"])}</td>
            <td>{_totalNutritionRender(_nutrition["cl"], requirements[requirementNumber]["cl"])}</td>
            <td>{_totalNutritionRender(_nutrition["cr"], requirements[requirementNumber]["cr"])}</td>
            <td>{_totalNutritionRender(_nutrition["cu"], requirements[requirementNumber]["cu"])}</td>
            <td>{_totalNutritionRender(_nutrition["i"], requirements[requirementNumber]["i"])}</td>
            <td>{_totalNutritionRender(_nutrition["fe"], requirements[requirementNumber]["fe"])}</td>
            <td>{_totalNutritionRender(_nutrition["mg"], requirements[requirementNumber]["mg"])}</td>
            <td>{_totalNutritionRender(_nutrition["mn"], requirements[requirementNumber]["mn"])}</td>
            <td>{_totalNutritionRender(_nutrition["mo"], requirements[requirementNumber]["mo"])}</td>
            <td>{_totalNutritionRender(_nutrition["p"], requirements[requirementNumber]["p"])}</td>
            <td>{_totalNutritionRender(_nutrition["k"], requirements[requirementNumber]["k"])}</td>
            <td>{_totalNutritionRender(_nutrition["se"], requirements[requirementNumber]["se"])}</td>
            <td>{_totalNutritionRender(_nutrition["na"], requirements[requirementNumber]["na"])}</td>
            <td>{_totalNutritionRender(_nutrition["zn"], requirements[requirementNumber]["zn"])}</td>
            <td>{_totalNutritionRender(_nutrition["va"], requirements[requirementNumber]["va"])}</td>
            <td>{_totalNutritionRender(_nutrition["vb1"], requirements[requirementNumber]["vb1"])}</td>
            <td>{_totalNutritionRender(_nutrition["vb2"], requirements[requirementNumber]["vb2"])}</td>
            <td>{_totalNutritionRender(_nutrition["vb3"], requirements[requirementNumber]["vb3"])}</td>
            <td>{_totalNutritionRender(_nutrition["vb5"], requirements[requirementNumber]["vb5"])}</td>
            <td>{_totalNutritionRender(_nutrition["vb6"], requirements[requirementNumber]["vb6"])}</td>
            <td>{_totalNutritionRender(_nutrition["vb7"], requirements[requirementNumber]["vb7"])}</td>
            <td>{_totalNutritionRender(_nutrition["vb9"], requirements[requirementNumber]["vb9"])}</td>
            <td>{_totalNutritionRender(_nutrition["vb12"], requirements[requirementNumber]["vb12"])}</td>
            <td>{_totalNutritionRender(_nutrition["vc"], requirements[requirementNumber]["vc"])}</td>
            <td>{_totalNutritionRender(_nutrition["vd"], requirements[requirementNumber]["vd"])}</td>
            <td>{_totalNutritionRender(_nutrition["ve"], requirements[requirementNumber]["ve"])}</td>
            <td>{_totalNutritionRender(_nutrition["vk"], requirements[requirementNumber]["vk"])}</td>
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
                <td>{contents[i]["name"].slice(0, 20)}</td>
                <td><input type="text" size={4} value={String(_amount).replace(/[^0-9|.]/g, '')}
                    onChange={(evt: any) => {
                        setTmpCombinationContents(evt.target.name, evt.target.value)
                    }}
                    name={String(contents[i]["id"])} />
                </td>
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
            <div className="slidein-1" style={{ overflow: "auto" }}>
                <table className="table table-dark table-striped-columns table-bordered"
                    style={{ whiteSpace: "nowrap" }}>
                    <thead>{_tmpElementColumn}</thead>
                    <tbody>{_tmpRecord}</tbody>
                </table>
            </div>
            {bottomForm()}
        </div>)
}