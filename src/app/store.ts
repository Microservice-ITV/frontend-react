import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/authSlice'
import appReducer from '@/features/app/appSlice'

export const store = configureStore({
    reducer: {
        app: appReducer,
        auth: authReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch