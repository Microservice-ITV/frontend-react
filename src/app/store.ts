import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootReducer'

// Global State Configuration (Single source of truth)
export const store = configureStore({ // configureStore = to combine reducer
    reducer: rootReducer
});

// RootState, AppDispatch:
//  1. Strongly type useSelector, 
// 2. Strongly type useDispatch, 
// 3.Ensure type safety across the application
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch