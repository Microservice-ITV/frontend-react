import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootReducer'
import { cartPersistenceMiddleware } from '@/features/cart/middleware/cartPersistenceMiddleware'
import { cartActivityMiddleware } from '@/features/cart/middleware/cartActivityMiddleware'
import { wishlistPersistenceMiddleware } from '@/features/wishlist/middleware/wishlistPersistenceMiddleware'
import { wishlistServerSyncMiddleware } from '@/features/wishlist/middleware/wishlistServerSyncMiddleware'

// Global State Configuration (Single source of truth)
export const store = configureStore({ // configureStore = to combine reducer
    reducer: rootReducer,

    // Persist cart & wishlist to localStorage AFTER reducers update state
    // Keeps reducers pure and centralizes persistence logic
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(
            cartPersistenceMiddleware,
            cartActivityMiddleware,
            wishlistPersistenceMiddleware,
            wishlistServerSyncMiddleware,
        ),
});

// RootState, AppDispatch:
//  1. Strongly type useSelector, 
// 2. Strongly type useDispatch, 
// 3.Ensure type safety across the application
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch