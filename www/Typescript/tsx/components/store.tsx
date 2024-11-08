import { configureStore } from '@reduxjs/toolkit'
import { accountSlice, tskbSlice, } from './slice'

import { useSelector, useDispatch } from 'react-redux'

export const store = configureStore({
  reducer: {
    account: accountSlice.reducer,
    tskb: tskbSlice.reducer,
  },
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
