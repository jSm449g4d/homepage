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
      "passhash": "", "timestamp": 0, "contents": ""
    },
    // "(id,name,tag,description,userid,user,passhash,timestamp,"
    // "g,cost,carbo,fiber,protein,fat,saturated_fat,n3,DHA_EPA,n6,"
    // "ca,cr,cu,i,fe,mg,mn,mo,p,k,se,na,zn,va,vb1,vb2,vb3,vb5,vb6,vb7,vb9,vb12,vc,vd,ve,vk,colin,kcal)"
    material: {
      "id": -1, "name": "", "tag": [], "description": "", "userid": -1, "user": "",
      "passhash": "", "timestamp": 0, "g": "", "cost": "", "carbo": "", "fiber": "",
      "protein": "", "fat": "", "saturated_fat": "", "n3": "", "DHA_EPA": "", "n6": "",
      "ca": "", "cr": "", "cu": "", "i": "", "fe": "", "mg": "", "mn": "",
      "mo": "", "p": "", "k": "", "se": "", "na": "", "zn": "", "va": "",
      "vb1": "", "vb2": "", "vb3": "", "vb5": "", "vb6": "", "vb7": "", "vb9": "",
      "vb12": "", "vc": "", "vd": "", "ve": "", "vk": "", "colin": "", "kcal": "",
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