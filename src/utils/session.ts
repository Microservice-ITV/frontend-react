const HAS_SESSION_KEY = 'has_session'
// Match backend refresh window (e.g. 7 days). Used so we know to call /refresh on next load.
const HAS_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60 // 604800

export const hasSessionCookie = (): boolean => {
    return document.cookie
        .split('; ')
        .some(c => c.startsWith(`${HAS_SESSION_KEY}=`))
}

// Set after login/OAuth/refresh so bootstrap knows to call /refresh (refresh_token is HttpOnly on API origin).
export const setSessionCookie = (): void => {
    document.cookie = `${HAS_SESSION_KEY}=1; path=/; max-age=${HAS_SESSION_MAX_AGE_SEC}; SameSite=Lax`
}

// Clear on logout so bootstrap does not try refresh.
export const clearSessionCookie = (): void => {
    document.cookie = `${HAS_SESSION_KEY}=; path=/; max-age=0`
}