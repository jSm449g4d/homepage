import { createSlice } from '@reduxjs/toolkit'
import React from 'react';

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
  },
})
export const { accountInit, accountSetState } = accountSlice.actions


export const tskbSlice = createSlice({
  name: 'tskb',
  initialState: {
    tableStatus: "",
    combination:
    {
      "id": -1, "name": "", "tag": [], "description": "", "userid": -1, "user": "",
      "timestamp": 0, "passhash": "", "contents": ""
    },
    material: {

    },
    tmpContents: [],
  },
  reducers: {
    tskbSetState: (state, action: { payload: any }) => {
      if ("tableStatus" in action.payload) state.tableStatus = action.payload.tableStatus
      if ("combination" in action.payload) state.combination = action.payload.combination
      if ("material" in action.payload) state.material = action.payload.material
      if ("tmpContents" in action.payload) state.tmpContents = action.payload.tmpContents
    },
  },
})
export const { tskbSetState } = tskbSlice.actions