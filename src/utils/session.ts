export const hasSessionCookie = (): boolean => {
    return document.cookie
        .split('; ')
        .some(c => c.startsWith('has_session='))
}