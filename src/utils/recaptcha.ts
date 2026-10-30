let recaptchaLoadPromise: Promise<void> | null = null

const ensureRecaptchaLoaded = (): Promise<void> => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined
  if (!siteKey) return Promise.resolve()
  if (window.grecaptcha) return Promise.resolve()
  if (recaptchaLoadPromise) return recaptchaLoadPromise

  recaptchaLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-recaptcha-loader="true"]',
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => resolve(), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    script.dataset.recaptchaLoader = 'true'
    script.onload = () => resolve()
    script.onerror = () => resolve()
    document.head.appendChild(script)
  })

  return recaptchaLoadPromise
}

export const getRecaptchaToken = async (action = 'submit'): Promise<string> => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined
  if (!siteKey) return ''

  await ensureRecaptchaLoaded()

  return new Promise((resolve) => {
    if (!window.grecaptcha) {
      resolve('')
      return
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha!
        .execute(siteKey, { action })
        .then(resolve)
        .catch(() => resolve(''))
    })
  })
}
