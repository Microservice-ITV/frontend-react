export const getRecaptchaToken = async (action = 'submit'): Promise<string> => {
    return new Promise((resolve) => {
        if (!window.grecaptcha || !import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
            resolve('')
            return
        }

        window.grecaptcha.ready(() => {
            window.grecaptcha
                .execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action })
                .then(resolve)
                .catch(() => resolve(''))
        })
    })
}
