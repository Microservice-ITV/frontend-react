const HAS_SESSION_KEY = 'has_session'

/**
 * OAuth popup / URL-hash flows never receive JSON from auth-service.
 * Set `VITE_REFRESH_TTL_SECONDS` to `JWT_REFRESH_TTL * 60` from auth-service `.env`
 * so this fallback stays aligned when you change refresh policy (until those flows issue JSON too).
 */
export const getRefreshTtlFallbackSeconds = (): number => {
    const raw = import.meta.env.VITE_REFRESH_TTL_SECONDS
    const n = typeof raw === 'string' && raw.trim() !== '' ? Number.parseInt(raw, 10) : Number.NaN
    if (Number.isFinite(n) && n > 0) return n
    return 604800 // 7 days — matches auth-service JWT_REFRESH_TTL default (10080 min)
}

export const hasSessionCookie = (): boolean => {
    return document.cookie.split('; ').some((c) => c.startsWith(`${HAS_SESSION_KEY}=`))
}

/**
 * Mirrors backend `has_session` cookie lifetime (`JWT_REFRESH_TTL` minutes → seconds).
 * Prefer passing `seconds` from login/register/refresh JSON (`refresh_ttl_seconds`).
 */
export const setSessionCookie = (maxAgeSeconds?: number): void => {
    const sec =
        typeof maxAgeSeconds === 'number' && Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0
            ? Math.floor(maxAgeSeconds)
            : getRefreshTtlFallbackSeconds()
    document.cookie = `${HAS_SESSION_KEY}=1; path=/; max-age=${sec}; SameSite=Lax`
}

/** Clear on logout so bootstrap does not try refresh. */
export const clearSessionCookie = (): void => {
    document.cookie = `${HAS_SESSION_KEY}=; path=/; max-age=0`
}
