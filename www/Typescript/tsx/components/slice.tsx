import { createSlice } from '@reduxjs/toolkit'
import React from 'react';
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { store } from "./store";

require.context('../application/', true, /\.ts(x?)$/)


interface accountInterface {
  user: string, token: string
}
export const accountSlice = createSlice({
  name: 'account',
  initialState: {
    token: "", user: ""
  },
  reducers: {
    accountInit: (state) => {
      state.token = ""; state.user = ""
    },
    accountSetState: (state, action: { payload: accountInterface }) => {
      state.token = action.payload.token
      state.user = action.payload.user
    },
  },
})
/*
export const mainappSlice = createSlice({
  name: 'mainapp',
  initialState: {
    appMain: createRoot(document.getElementById("appMain")),
    titlelogo: createRoot(document.getElementById("titlelogo")),
  },
  reducers: {
    mainappRender: (state, action: { payload: string }) => {
      import("../application/" + action.payload).then((module) => {
        state.appMain.unmount()
        //state.appMain = createRoot(document.getElementById("appMain"))
        state.appMain.render(<Provider store={store}><module.AppMain /></Provider>)
        state.titlelogo.unmount()
        //state.titlelogo = createRoot(document.getElementById("titlelogo"))
        state.titlelogo.render(<module.titleLogo />)
      })
    },
  },
})*/

export const { accountInit, accountSetState } = accountSlice.actions
// export const { mainappRender } = mainappSlice.actions
