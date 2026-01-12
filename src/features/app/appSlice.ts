import { createSlice } from '@reduxjs/toolkit'

interface AppState {
  appName: string
}

const initialState: AppState = {
  appName: 'Ecommerce Website',
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {},
})

export default appSlice.reducer