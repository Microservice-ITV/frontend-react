const MAX_RECEIPT_BYTES = 5 * 1024 * 1024
const MAX_BASE64_LENGTH = 7_000_000
const WEBP_QUALITY = 0.75
const MAX_WIDTH = 1600

export const isReceiptImageTooLarge = (dataUrl?: string | null): boolean => {
  if (!dataUrl) return false
  return dataUrl.length > MAX_BASE64_LENGTH
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read receipt file'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Could not read receipt file'))
    reader.readAsDataURL(file)
  })

const compressDataUrl = async (dataUrl: string, quality = WEBP_QUALITY): Promise<string> => {
  if (typeof window === 'undefined' || !document?.createElement) {
    throw new Error('Receipt image compression is not supported in this browser')
  }

  const sourceImage = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load receipt image'))
    image.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  const scale = Math.min(1, MAX_WIDTH / sourceImage.width)
  const width = Math.max(1, Math.round(sourceImage.width * scale))
  const height = Math.max(1, Math.round(sourceImage.height * scale))

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Could not prepare receipt image for compression')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(sourceImage, 0, 0, width, height)

  return await new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not compress receipt image to WebP'))
          return
        }

        void fileToDataUrl(new File([blob], 'receipt.webp', { type: 'image/webp' }))
          .then(resolve)
          .catch(reject)
      },
      'image/webp',
      quality,
    )
  })
}

export const compressReceiptFile = async (file: File, maxBytes = MAX_RECEIPT_BYTES): Promise<string> => {
  const dataUrl = await fileToDataUrl(file)

  console.info('[receipt-size]', {
    fileName: file.name,
    fileSize: file.size,
    dataUrlLength: dataUrl.length,
    maxBytes,
  })

  let compressed = dataUrl
  let quality = WEBP_QUALITY

  for (let attempt = 0; attempt < 5; attempt += 1) {
    compressed = await compressDataUrl(compressed, quality)

    if (compressed.length <= MAX_BASE64_LENGTH && compressed.length <= maxBytes * 1.5) {
      console.info('[receipt-compressed]', {
        originalBytes: file.size,
        outputBytes: Math.round((compressed.length * 3) / 4),
        compressionRatio: Number((compressed.length / dataUrl.length).toFixed(3)),
        attempt: attempt + 1,
      })
      return compressed
    }

    quality = Math.max(0.45, quality - 0.1)
  }

  if (compressed.length > MAX_BASE64_LENGTH || compressed.length > maxBytes * 1.5) {
    throw new Error('Receipt image must be 5 MB or smaller.')
  }

  console.info('[receipt-final]', {
    finalLength: compressed.length,
  })

  return compressed
}
