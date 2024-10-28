import { createSlice } from '@reduxjs/toolkit'
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
    accountSetState: (state, action:{payload: accountInterface}) => {
      state.token = action.payload.token
      state.user = action.payload.user
    },
  },
})

export const { accountInit, accountSetState } = accountSlice.actions
