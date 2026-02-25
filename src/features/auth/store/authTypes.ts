// Types => Type Definitions
// User shape returned by /me
export interface User {
    id: string
    name: string
    email: string
}

// Payload returned by login/register/refresh
export interface TokenPayload {
    accessToken: string
}

// Redux auth state
export interface AuthState {
    user: User | null
    accessToken: string | null
    isAuthenticated: boolean
    hasSession: boolean
    initialized: boolean 
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
    error: string | null
    // Draft form data for auth flows (not persisted across reloads)
    loginDraft: {
        email: string
        password: string
    }
    registerDraft: {
        name: string
        email: string
        password: string
    }
}