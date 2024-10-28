import React, { useState, useEffect } from 'react';
import { stopf5, jpclock, Unixtime2String } from "../components/util";
import { useAppSelector, useAppDispatch, RootState } from '../components/store'

export const AppMain = () => {
    const dispatch = useAppDispatch()

    const indexColumns = () => {
        return (
            <div className="p-3">
                <div className="row text-center">
                    <div className="col-12 slidein-1">
                        <h4 style={{ backgroundColor: "rgba(225,160,225,0.8)", }}>コンテンツ一覧</h4>
                    </div>
                    <div className="col-sm-6 col-md-4 p-1 fadein-3">
                        <div className="btn-col" style={{ background: "rgba(255,255,255,0.6)" }}>
                            <a className="a-nolink" href='https://github.com/jSm449g4d/summerhackathon_vol2' >
                                <div className="d-flex flex-column" style={{ height: "380px" }}>
                                    <h5>Flask通信</h5>
                                    <div className="d-flex flex-column flex-grow-1">
                                        <img className="img-fluid" src="/static/img/hakka.png" style={{ height: 150, objectFit: "contain" }} />
                                        2020/09/09~16に開催されたハッカソンの作品
                                        <ul>
                                            <li>チーム開発</li>
                                            <li>情報可視化で世の中を便利に!</li>
                                            <li>何時どれだけ、どんな記事?</li>
                                            <li>キーワード検索</li>
                                        </ul>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                    <div className="col-sm-6 col-md-4 p-1 fadein-4">
                        <div className="btn-col" style={{ background: "rgba(255,255,255,0.6)" }}>
                            <a className="a-nolink" href='https://github.com/jSm449g4d/hleb' >
                                <div className="d-flex flex-column" style={{ height: "380px" }}>
                                    <h5>хлеб (半完全栄養食)</h5>
                                    <div className="d-flex flex-column flex-grow-1">
                                        <img className="img-fluid" src="/static/img/hleb.jpg" style={{ height: 150, objectFit: "contain" }} />
                                        私の日常食
                                        <ul>
                                            <li>低カロリー(900[kcal]前後)</li>
                                            <li>低コスト(500[円]以下)</li>
                                            <li>高たんぱく(100[g]以上)</li>
                                            <li>ケト食(糖質20[g]前後)</li>
                                            <li>人工甘味料(NAS)不使用</li>
                                        </ul>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div id="appMain"><div style={{ background: "rgba(255,255,255,0.5)", }}>
        <div id="homepage_githubColumns">{indexColumns()}</div>
            
        </div>
    </div>)

};

//
export const titleLogo = () => {
    return (<div id="titlelogo" style={{ fontFamily: "Impact", color: "black" }}>チャットアプリ</div>)
}