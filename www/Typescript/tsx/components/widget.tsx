import React, { useState, useEffect } from 'react';
import ReactDOM from "react-dom";
import { stopf5, Query2Dict } from "./util";
require.context('../application/', true, /\.ts(x?)$/)

export const AppWidgetHead = () => {
    const [switchAppButton, setSwitchAppButton] = useState(0)
    // functions
    return (
        <div style={{ borderBottom: "3px double gray", background: "linear-gradient(rgba(60,60,60,0),rgba(60,60,60,0.1)" }}>
            <div className="row p-1 px-3">
                <h2 className="d-flex align-items-center">
                    <i className="fab fa-react fa-spin" style={{ color: "mediumturquoise" }}></i>
                    <div className="rotxin-2 col" id="titlelogo_tsx">タイトル未設定</div>
                </h2>
            </div></div>
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
