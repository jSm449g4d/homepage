import React from 'react';
import ReactDOM from "react-dom";
import { Query2Dict } from "./components/util";
import { AppWidgetHead, AppWidgetFoot } from "./components/widget";

// WidgetHead
document.body.insertAdjacentHTML('beforeend', '<div id="AppWidgetHead">AppWidgetHead loading...<\/div>');
ReactDOM.render(<AppWidgetHead />, document.getElementById("AppWidgetHead"));
// App
document.body.insertAdjacentHTML('beforeend', '<div id="appMain">appMain loading...<\/div>');
require.context('./application/', true, /\.ts(x?)$/)
// Alias / homepage
if ("application" in Query2Dict() == false) {
    import("./application/homepage").then((module) => {
        ReactDOM.render(<module.AppMain />, document.getElementById("appMain"));
        ReactDOM.render(<module.titleLogo />, document.getElementById("titlelogo_tsx"));
    })
}
else {
    import("./application/" + Query2Dict()["application"]).then((module) => {
        ReactDOM.render(<module.AppMain />, document.getElementById("appMain"));
        ReactDOM.render(<module.titleLogo />, document.getElementById("titlelogo_tsx"));
    })
}

// WidgetFoot
    document.body.insertAdjacentHTML('beforeend', '<div id="AppWidgetFoot">AppWidgetFoot loading...<\/div>');
    ReactDOM.render(<AppWidgetFoot />, document.getElementById("AppWidgetFoot"));

// DefaultLogin
if ("portfolio" in Query2Dict() == true) {
}
