import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector


// HOOKS FOR:
// 1. Enforce type safety
// 2. Reduce repetitive typing
// 3. Standardize how Redux is accessed throughout the application
// This file acts as a single abstraction layer between React components and the Redux store.