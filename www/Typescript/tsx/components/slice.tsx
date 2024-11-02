import { createSlice } from '@reduxjs/toolkit'
import React from 'react';
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { store } from "./store";

require.context('../application/', true, /\.ts(x?)$/)


interface accountSetStateInterface {
  user: string, token: string, id: number, mail: string, roomKey: string
}
export const accountSlice = createSlice({
  name: 'account',
  initialState: {
    token: "", user: "", id: -1, roomKey: "", mail: ""
  },
  reducers: {
    accountInit: (state) => {
      state.token = ""; state.user = ""; state.id = -1; state.roomKey = "", state.mail = ""
    },
    accountSetState: (state, action: { payload: any }) => {
      if ("token" in action.payload) state.token = action.payload.token
      if ("user" in action.payload) state.user = action.payload.user
      if ("id" in action.payload) state.id = action.payload.id
      if ("mail" in action.payload) state.mail = action.payload.mail
      if ("roomKey" in action.payload) state.roomKey = action.payload.roomKey
    },
    accountSetRoomKey: (state, action: { payload: string }) => {
      state.roomKey = action.payload
    },
  },
})

export const { accountInit, accountSetState } = accountSlice.actions
