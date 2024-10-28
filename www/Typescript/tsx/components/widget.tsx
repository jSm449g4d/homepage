import React, { useState, useEffect } from 'react';
import ReactDOM from "react-dom";
import { stopf5, Query2Dict } from "./util";
require.context('../application/', true, /\.ts(x?)$/)


export const AppWidgetHead = () => {
    const [user, setUser] = useState("")
    const [tmpUser, setTempUser] = useState("")
    const [token, setToken] = useState("")
    const [tmpPass, setTempPass] = useState("")
    const [tmpMessage, setTmpMessage] = useState("")
    //AccountControl
    const _logoutInit = () => {
        setTempUser(""); setTempPass(""); setTempUser(""); setTempPass(""); setUser(""); setToken(""); setTmpMessage("");
    }
    const _login = () => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/login.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            if (resp["message"] == "processed") { setUser(resp["user"]); setToken(resp["token"]); setTmpMessage(resp["message"]); }
            else { setTmpMessage(resp["message"]); }
        };
        xhr.timeout = 5000;
        xhr.send(JSON.stringify({ "order": "login", "user": tmpUser, "pass": tmpPass }));
        setTempUser(""); setTempPass("");
    }
    const _signin = () => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/login.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            if (resp["message"] == "processed") { setUser(resp["user"]); setToken(resp["token"]); setTmpMessage(resp["message"]); }
            else { setTmpMessage(resp["message"]); }
        };
        xhr.timeout = 5000;
        xhr.send(JSON.stringify({ "order": "signin", "user": tmpUser, "pass": tmpPass }));
        setTempUser(""); setTempPass("");
    }
    const _logout = () => { _logoutInit() }
    const _accountDelete = () => {
        // access to backend
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", "/login.py", true);
        xhr.ontimeout = () => console.error("The request timed out.");
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) console.log(xhr.responseText);
            const resp: any = JSON.parse(xhr.responseText)
            setTmpMessage(resp["message"]);
        };
        xhr.timeout = 5000;
        xhr.send(JSON.stringify({ "order": "account_delete", "user": tmpUser, "token": token }));
        _logoutInit()
    }
    const accountDeleteModal = () => {
        return (
            <div className="modal fade" id="accountDeleteModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="exampleModalLabel">Are you sure to delete account?</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group mb-3">
                                <span className="input-group-text" id="account-addon1">User</span>
                                <input type="text" className="form-control" placeholder="Username" aria-label="Username" id="account-from1"
                                    value={tmpUser} onChange={(evt) => { setTempUser(evt.target.value) }} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            {user == tmpUser ?
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal"
                                    onClick={() => _accountDelete()}>Delete</button>
                                :
                                <button type="button" className="btn btn-danger" disabled>Delete</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    const accountForm = () => {
        if (tmpMessage == "notexist")
            return (
                <div className="mx-auto p-2">
                    <h5 className="modal-body">
                        account is notexist
                    </h5>
                    <button className="btn btn-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false"
                        onClick={(evt) => { _logoutInit() }}>
                        back
                    </button>
                </div>)
        if (tmpMessage == "rejected")
            return (
                <div className="mx-auto p-2">
                    <h5 className="modal-body">
                        account access is rejected.<br />plz check your pass.
                    </h5>
                    <button className="btn btn-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false"
                        onClick={(evt) => { _logoutInit() }}>
                        back
                    </button>
                </div>)
        if (tmpMessage == "alreadyExisted")
            return (
                <div className="mx-auto p-2">
                    <h5 className="modal-body">
                        account is already exist
                    </h5>
                    <button className="btn btn-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false"
                        onClick={(evt) => { _logoutInit() }}>
                        back
                    </button>
                </div>)
        if (token == "") {
            return (
                <div className="mx-auto p-2">
                    <div className="modal fade" id="exampleModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h1 className="modal-title fs-5" id="exampleModalLabel">Login operation denied</h1>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    reason ⇒ {tmpMessage}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="input-group mb-3">
                        <span className="input-group-text" id="account-addon1">User</span>
                        <input type="text" className="form-control" placeholder="Username" aria-label="Username" id="account-from1"
                            value={tmpUser} onChange={(evt) => { setTempUser(evt.target.value) }} />
                    </div>
                    <div className="input-group mb-3">
                        <span className="input-group-text" id="account-addon2">Pass</span>
                        <input type="password" className="form-control" placeholder="pass" aria-label="pass" id="account-from2"
                            aria-labelledby="passwordHelpBlock"
                            value={tmpPass} onChange={(evt) => { setTempPass(evt.target.value) }} />
                    </div>
                    {tmpUser == "" || tmpPass == "" ?
                        <button className="btn btn-secondary w-100" type="button" aria-expanded="false" disabled>
                            Plz input User and Pass
                        </button>
                        :
                        <div className="btn-group w-100">
                            <button className="btn btn-primary" type="button" aria-expanded="false"
                                onClick={() => { _login(); }}>
                                login
                            </button>
                            <button className="btn btn-success" type="button" aria-expanded="false"
                                onClick={() => { _signin(); }}>
                                signIn
                            </button>
                        </div>
                    }
                </div>)
        }
        return (
            <div className="mx-auto p-2">
                {accountDeleteModal()}
                <h4 className="">ようこそ {user} さん</h4>
                <div className="btn-group w-100">
                    <button className="btn btn-warning" type="button" aria-expanded="false"
                        onClick={() => { _logout() }}>
                        logout
                    </button>
                    <button className="btn btn-danger" type="button" aria-expanded="false"
                        data-bs-toggle="modal" data-bs-target="#accountDeleteModal">
                        accountDelete
                    </button></div>
            </div>)
    }
    // functions
    const _switchApp = (application: string) => {
        if (stopf5.check("_switchapp", 50, true) == false) return; // To prevent high freq access
        import("../application/" + application).then((module) => {
            ReactDOM.unmountComponentAtNode(document.getElementById("appMain"));
            ReactDOM.render(<module.AppMain />, document.getElementById("appMain"));
            ReactDOM.unmountComponentAtNode(document.getElementById("titlelogo_tsx"));
            ReactDOM.render(<module.titleLogo />, document.getElementById("titlelogo_tsx"));
        })
    }
    return (
        <div style={{ borderBottom: "3px double gray", background: "linear-gradient(rgba(60,60,60,0),rgba(60,60,60,0.1)" }}>
            <div className="row p-1 px-3">
                <div className="col-sm-12 col-lg-8 p-1">
                    <h2 className="d-flex justify-content-center justify-content-lg-start">
                        <div className="form-inline">
                            <div className="rotxin-2" id="titlelogo_tsx">タイトル未設定</div>
                        </div>
                    </h2>
                    <div className="">
                        <div className="dropdown">
                            <button className="btn btn-primary dropdown-toggle btn-lg  w-100"
                                type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                アプリ一覧
                            </button>
                            <ul className="dropdown-menu">
                                <li><a className="dropdown-item" style={{ fontSize: "1.5em" }}
                                    onClick={() => { _switchApp("homepage") }}>
                                    <i className="fas fa-home mr-1"></i>ホームページ
                                </a></li>
                                <li><a className="dropdown-item" style={{ fontSize: "1.5em" }}
                                    onClick={() => { _switchApp("tptef") }}>
                                    <i className="far fa-comments mr-1"></i>チャット
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="col-sm-12 col-lg-4 p-1">
                    <div>
                        {accountForm()}
                    </div>
                </div></div></div>
    );
}

export const AppWidgetFoot = () => {
    return (
        <div className="d-flex justify-content-between p-2"
            style={{ color: "goldenrod", backgroundColor: "royalblue", border: "3px double silver" }}>
            <div>
                <b style={{ fontSize: "1.5em" }}>Links: </b>
                <i className="fab fa-wordpress fa-2x fa-btn-goldbadge mr-1"
                    onClick={() => window.location.href = "https://huxiin.ga/wordpress"}></i>
                <i className="fab fa-github fa-2x fa-btn-goldbadge mr-1"
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
