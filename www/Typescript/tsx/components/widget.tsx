import React, { useState, useEffect } from 'react';
import { createRoot } from "react-dom/client"
import { stopf5, Query2Dict } from "./util";
require.context('../application/', true, /\.ts(x?)$/)
import { Provider } from "react-redux"
import { IModalsRender } from "./imodals";
import { store } from "./store";
import { accountInit, accountSetState } from './slice'
import { useAppSelector, useAppDispatch } from './store'

const xhrTimeout = 3000

export const AppWidgetHead = () => {

    const [tmpUser, setTmpUser] = useState("")
    const [tmpPass, setTmpPass] = useState("")
    const [tmpMail, setTmpMail] = useState("")
    const [tmpButtonFlag, setTmpButtonFlag] = useState(false)

    const user = useAppSelector((state) => state.account.user)
    const token = useAppSelector((state) => state.account.token)
    const mail = useAppSelector((state) => state.account.mail)
    const dispatch = useAppDispatch()

    // accountControl
    const _logoutInit = () => {
        setTmpUser(""); setTmpPass(""); setTmpMail(""); setTmpButtonFlag(false); dispatch(accountInit());
    }
    const _formInit = () => {
        setTmpUser(""); setTmpPass(""); setTmpMail(""); setTmpButtonFlag(false);
    }
    const _login = () => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("login", JSON.stringify({ "user": tmpUser, "pass": tmpPass }))
        const request = new Request("/login.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                if (resJ["message"] == "processed") {
                    dispatch(accountSetState({
                        user: resJ["user"], token: resJ["token"],
                        id: resJ["id"], mail: resJ["mail"]
                    }));
                }
                else if (resJ["message"] == "notExist") {
                    $('#accountCautionModal').modal('show')
                    $('#accountCautionModalTitle').text('アカウントが存在しません')
                }
                else if (resJ["message"] == "wrongPass") {
                    $('#accountCautionModal').modal('show')
                    $('#accountCautionModalTitle').text('パスワードが間違ってます')
                }
                else {
                    $('#accountCautionModal').modal('show')
                    $('#accountCautionModalTitle').text('不明なエラーです')
                }
            })
            .catch(error => console.error(error.message));
        _formInit()
    }
    const _signin = () => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("signin", JSON.stringify({ "user": tmpUser, "pass": tmpPass }))
        const request = new Request("/login.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                if (resJ["message"] == "processed") {
                    dispatch(accountSetState({ user: resJ["user"], token: resJ["token"], id: resJ["id"], mail: resJ["mail"] }));
                }
                else if (resJ["message"] == "alreadyExist") {
                    $('#accountCautionModal').modal('show')
                    $('#accountCautionModalTitle').text('既にアカウントが存在します')
                }
                else {
                    $('#accountCautionModal').modal('show')
                    $('#accountCautionModalTitle').text('不明なエラーです')
                }
            })
            .catch(error => console.error(error.message));
        _formInit()
    }
    const _logout = () => { _logoutInit() }
    const _accountChange = () => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("account_change", JSON.stringify({ "token": token, "user": tmpUser, "pass": tmpPass, "mail": tmpMail }))
        const request = new Request("/login.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                if (resJ["message"] == "processed") {
                    dispatch(accountSetState({ user: resJ["user"], mail: resJ["mail"] }));
                }
                else if (resJ["message"] == "notExist") {
                    $('#accountCautionModal').modal('show')
                    $('#accountCautionModalTitle').text('アカウントが存在しません')
                }
                else if (resJ["message"] == "alreadyExist") {
                    $('#accountCautionModal').modal('show')
                    $('#accountCautionModalTitle').text('アカウント名が使われてます')
                }
                else {
                    $('#accountCautionModal').modal('show')
                    $('#accountCautionModalTitle').text('不明なエラーです')
                }
            })
            .catch(error => console.error(error.message));
        _formInit()
    }
    const _accountDelete = () => {
        const headers = new Headers();
        const formData = new FormData();
        formData.append("account_delete", JSON.stringify({ "token": token }))
        const request = new Request("/login.py", {
            method: 'POST',
            headers: headers,
            body: formData,
            signal: AbortSignal.timeout(xhrTimeout)
        });
        fetch(request)
            .then(response => response.json())
            .then(resJ => {
                if (resJ["message"] == "processed") {
                    _logoutInit()
                }
                else {
                    $('#accountCautionModal').modal('show')
                    $('#accountCautionModalTitle').text('不明なエラーです')
                }
            })
            .catch(error => console.error(error.message));
        _formInit()
    }
    const _accountForm = () => {
        const accountConfigModal = () => {
            const accountConfigInfoModal = () => {
                return (
                    <div className="modal fade" id="accountConfigInfoModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h1 className="modal-title fs-5">
                                        <i className="fa-solid fa-circle-info mx-1" />変更したい情報を入力して下さい
                                    </h1>
                                </div>
                                <div className="modal-body">
                                    各項目のチェックボックスをオンにすることで入力可能になります。
                                    オンにした項目が更新されます。<br />
                                    ※現在メール機能は開発中の為、選択できません。
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            return (
                <div className="modal fade" id="accountConfigModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    {accountConfigInfoModal()}
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-headerrow">
                                <h2 className="modal-title row-12 m-1">
                                    <i className="fa-solid fa-wrench mx-1" />Account Config
                                </h2>
                                <h2 className="modal-title row-12 m-1">
                                    <i className="fa-regular fa-user mx-1" />{user}
                                </h2>
                                <h3 className="modal-title row-12 m-1">
                                    {mail == "" ?
                                        <div>
                                            <i className="fa-regular fa-envelope mx-1" />未登録
                                        </div>
                                        : <div>
                                            <i className="fa-regular fa-envelope mx-1" />{mail}
                                        </div>}
                                </h3>
                            </div>
                            <div className="modal-body">
                                <div className="form-check form-switch m-1">
                                    <input className="form-check-input" type="checkbox" role="switch"
                                        style={{ transform: "rotate(90deg)" }}
                                        onChange={(evt: any) => {
                                            if (evt.target.checked == true) {
                                                $('#accountConfigModalUser').prop("disabled", false)
                                            } else {
                                                $('#accountConfigModalUser').prop("disabled", true)
                                                setTmpUser("")
                                            }
                                        }}>
                                    </input><input type="text" className="form-control" placeholder="Username"
                                        value={tmpUser} onChange={(evt) => { setTmpUser(evt.target.value) }}
                                        disabled id="accountConfigModalUser" />
                                </div>
                                <div className="form-check form-switch m-1">
                                    <input className="form-check-input" type="checkbox" role="switch"
                                        style={{ transform: "rotate(90deg)" }}
                                        onChange={(evt: any) => {
                                            if (evt.target.checked == true) {
                                                $('#accountConfigModalPass').prop("disabled", false)
                                            } else {
                                                $('#accountConfigModalPass').prop("disabled", true)
                                                setTmpPass("")
                                            }
                                        }}>
                                    </input><input type="password" className="form-control" placeholder="Password"
                                        value={tmpPass} onChange={(evt) => { setTmpPass(evt.target.value) }}
                                        disabled id="accountConfigModalPass" />
                                </div>
                                <div className="form-check form-switch m-1">
                                    <input className="form-check-input" type="checkbox" role="switch"
                                        style={{ transform: "rotate(90deg)" }} disabled
                                        onChange={(evt: any) => {
                                            if (evt.target.checked == true) {
                                                $('#accountConfigModalMail').prop("disabled", false)
                                            } else {
                                                $('#accountConfigModalMail').prop("disabled", true)
                                                setTmpMail("")
                                            }
                                        }}>
                                    </input><input type="text" className="form-control" placeholder="Mailaddress"
                                        value={tmpMail} onChange={(evt) => { setTmpMail(evt.target.value) }}
                                        disabled id="accountConfigModalMail" />
                                </div>
                            </div>
                            <div className="modal-footer d-flex">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                {tmpUser == "" && tmpPass == "" && tmpMail == "" ?
                                    <button type="button" className="btn btn-info me-auto"
                                        onClick={() => $('#accountConfigInfoModal').modal("show")}>
                                        <i className="fa-solid fa-circle-info mx-1" />Change
                                    </button> :
                                    <button type="button" className="btn btn-warning me-auto" data-bs-dismiss="modal"
                                        onClick={() => _accountChange()}>
                                        <i className="fa-regular fa-user mx-1" style={{ pointerEvents: "none" }} />Change
                                    </button>

                                }
                                <div className="form-check form-switch m-1">
                                    <input className="form-check-input" type="checkbox" role="switch"
                                        style={{ transform: "rotate(90deg)" }}
                                        onChange={(evt: any) => setTmpButtonFlag(evt.target.checked)}>
                                    </input>
                                    {tmpButtonFlag == false ?
                                        <button className="btn btn-danger" type="button" data-bs-dismiss="modal" disabled>
                                            <i className="fa-solid fa-trash mx-1" style={{ pointerEvents: "none" }}></i>Delete
                                        </button> :
                                        <button className="btn btn-danger" type="button" data-bs-dismiss="modal"
                                            onClick={() => _accountDelete()} >
                                            <i className="fa-solid fa-trash mx-1" style={{ pointerEvents: "none" }}></i>Delete
                                        </button>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        const accountCautionModal = () => {
            return (
                <div className="modal fade" id="accountCautionModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3 className="modal-title fs-5">
                                    <i className="fa-solid fa-circle-exclamation mx-1" />Caution⇒
                                </h3>
                                <h3 className="modal-title fs-5" id="accountCautionModalTitle">
                                    notitle
                                </h3>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div>
                {accountCautionModal()}
                {accountConfigModal()}
                {token == "" ?
                    <div className="">
                        <div className="row">
                            <div className="input-group col-12">
                                <span className="input-group-text" id="account-addon1">User</span>
                                <input type="text" className="form-control" placeholder="Username" aria-label="Username"
                                    value={tmpUser} onChange={(evt) => { setTmpUser(evt.target.value) }} />
                                {tmpUser != "" && tmpPass != "" ?
                                    <button className="btn btn-outline-success" type="button"
                                        aria-expanded="false" onClick={() => { _login(); }}>
                                        <i className="fa-solid fa-arrow-right-to-bracket mx-1"></i>logIn&nbsp;
                                    </button> :
                                    <button className="btn btn-outline-success" type="button" aria-expanded="false" disabled>
                                        <i className="fa-solid fa-arrow-right-to-bracket mx-1"></i>logIn&nbsp;
                                    </button>
                                }
                            </div>
                            <div className="input-group col-12">
                                <span className="input-group-text" id="account-addon2">Pass</span>
                                <input type="password" className="form-control" placeholder="pass" aria-label="pass"
                                    aria-labelledby="passwordHelpBlock"
                                    value={tmpPass} onChange={(evt) => { setTmpPass(evt.target.value) }} />
                                {tmpUser != "" && tmpPass != "" ?
                                    <button className="btn btn-outline-primary" type="button" aria-expanded="false"
                                        onClick={() => { _signin(); }}>
                                        <i className="fa-solid fa-pen mx-1"></i>signIn
                                    </button> :
                                    <button className="btn btn-outline-primary" type="button" aria-expanded="false" disabled>
                                        <i className="fa-solid fa-pen mx-1"></i>signIn
                                    </button>
                                }
                            </div>
                        </div>
                    </div> :
                    <div className="row">
                        <div className="col-12 col-md-6 d-flex justify-content-center align-items-center">
                            <h5 className=""> {"ようこそ"}   </h5>
                            <h3 className="mx-2"> {user}</h3>
                            <h5 className=""> {"さん"}   </h5>
                        </div>
                        <div className="col-12 col-md-6 d-flex align-items-center">
                            <div className="btn-group w-100">
                                <button className="btn btn-outline-dark" type="button" aria-expanded="false"
                                    onClick={() => { _logout() }}>
                                    <i className="fa-solid fa-right-from-bracket mx-1" style={{ pointerEvents: "none" }}></i>logout
                                </button>
                                <button className="btn btn-outline-warning" type="button" aria-expanded="false"
                                    onClick={() => { _formInit(); $('#accountConfigModal').modal('show'); }}>
                                    <i className="fa-solid fa-wrench mx-1" style={{ pointerEvents: "none" }}></i>config
                                </button>
                            </div>
                        </div>
                    </div>}
            </div>)
    }
    // mainAppRender
    const _switchApp = (application: string) => {
        if (stopf5.check("_switchapp", 50, true) == false) return; // To prevent high freq access
        import("../application/" + application).then((module) => {
            const appMain = createRoot(document.getElementById("appMain"))
            appMain.render(<Provider store={store}><module.AppMain /></Provider>)
            const titlelogo = createRoot(document.getElementById("titlelogo"))
            titlelogo.render(<module.titleLogo />)
        })
    }
    return (
        <div style={{ borderBottom: "3px double gray", background: "linear-gradient(rgba(60,60,60,0),rgba(60,60,60,0.1)" }}>
            {IModalsRender()}
            <div className="my-1 mx-2 row">
                <div className="col-4 col-md-3">
                    <div className="dropdown d-flex align-items-center">
                        <ul className="dropdown-menu ">
                            <li><a className="dropdown-item btn-col" style={{ fontSize: "1.5em" }}
                                onClick={() => { _switchApp("homepage") }}>
                                <i className="fas fa-home mx-1"></i>ホームページ
                            </a></li>
                            <li><a className="dropdown-item btn-col" style={{ fontSize: "1.5em" }}
                                onClick={() => { _switchApp("tptef") }}>
                                <i className="far fa-comments mx-1"></i>チャット
                            </a></li>
                        </ul>
                        <button className="btn btn-primary dropdown-toggle"
                            type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="fa-solid fa-bars mx-1" />アプリ一覧
                        </button>
                    </div>
                </div>
                <h2 className="col-8 col-md-3 d-flex align-items-center">
                    <div className="rotxin-2" id="titlelogo">タイトル未設定</div>
                </h2>
                <div className="col-12 col-md-6">
                    {_accountForm()}
                </div>
            </div></div>
    );
}

export const AppWidgetFoot = () => {
    return (
        <div className="d-flex justify-content-between p-2"
            style={{ color: "goldenrod", backgroundColor: "royalblue", border: "3px double silver" }}>
            <div>
                <b style={{ fontSize: "1.5em" }}>Links: </b>
                <i className="fab fa-github fa-2x fa-btn-goldbadge mx-1"
                    onClick={() => window.location.href = "https://github.com/jSm449g4d/"}></i>
            </div>
            <h5>===VPSdeWP===</h5>
            <div className="btn-push" data-toggle="widget_widgetfood_tooltip" data-placement="top" title="敗戦国の末路"
                onClick={(evt) => {
                    window.location.href = 'https://www.youtube.com/watch?v=_fj9U6pVNkM&ab_channel=%E9%88%B4%E6%9C%A8%E3%82%86%E3%82%86%E3%81%86%E3%81%9F'
                }}>ご自由にお使いください</div>
        </div>
    );
}
