export const getRecaptchaToken = async (action = 'submit'): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!window.grecaptcha) {
            reject('reCAPTCHA not loaded')
            return
        }

        window.grecaptcha.ready(() => {
            window.grecaptcha
                .execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action })
                .then(resolve)
                .catch(reject)
        })
    })
}
