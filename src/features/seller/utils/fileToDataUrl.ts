/**
 * Browser File → base64 data URL (seller-identity API accepts plain base64 or data URLs).
 */
export const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const r = reader.result
            if (typeof r === 'string') resolve(r)
            else reject(new Error('Could not read file'))
        }
        reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
        reader.readAsDataURL(file)
    })