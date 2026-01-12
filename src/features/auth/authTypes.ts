export interface User {
    id: number
    name: string
    email: string
}

export interface AuthPayload {
    user: User
    accessToken: string
}

export interface RefreshTokenPayload {
    accessToken: string
}

export interface AuthState {
    user: User | null
    accessToken: string | null
    isAuthenticated: boolean
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
    error: string | null
}