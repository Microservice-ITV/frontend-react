import { afterEach, describe, expect, it, vi } from 'vitest'
import { compressReceiptFile, isReceiptImageTooLarge } from './receiptImage'

const outputDataUrl = 'data:image/webp;base64,d2VicC1pbWFnZQ=='

const setupCanvas = (sourceWidth: number, sourceHeight: number, blob: Blob | null = new Blob(['webp'], { type: 'image/webp' })) => {
  let readCount = 0
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
    })),
    toBlob: vi.fn((callback: BlobCallback, type?: string, quality?: number) => {
      expect(type).toBe('image/webp')
      expect(quality).toBe(0.75)
      callback(blob)
    }),
  }

  class MockFileReader {
    result: string | ArrayBuffer | null = null
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null
    error: DOMException | null = null

    readAsDataURL = vi.fn(() => {
      readCount += 1
      this.result = readCount === 1
        ? `data:image/${readCount === 1 ? 'jpeg' : 'webp'};base64,${'A'.repeat(20)}`
        : outputDataUrl
      queueMicrotask(() => this.onload?.(new ProgressEvent('load')))
    })
  }

  vi.stubGlobal('FileReader', MockFileReader)
  vi.stubGlobal('Image', class {
    width = sourceWidth
    height = sourceHeight
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_value: string) {
      queueMicrotask(() => this.onload?.())
    }
  })
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'canvas') return canvas as unknown as HTMLCanvasElement
    return document.createElementNS('http://www.w3.org/1999/xhtml', tagName)
  })

  return canvas
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('receiptImage helpers', () => {
  it('rejects data URLs that exceed the backend limit', () => {
    const large = 'data:image/jpeg;base64,' + 'A'.repeat(8_000_000)
    expect(isReceiptImageTooLarge(large)).toBe(true)
  })

  it.each(['jpeg', 'png'])('converts %s receipts to WebP', async (type) => {
    setupCanvas(800, 600)
    const result = await compressReceiptFile(new File(['receipt'], `receipt.${type}`, { type: `image/${type}` }))

    expect(result).toBe(outputDataUrl)
    expect(result).toMatch(/^data:image\/webp;base64,/)
  })

  it('converts an already-small image without resizing it', async () => {
    const canvas = setupCanvas(800, 600)
    await compressReceiptFile(new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' }))

    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(600)
  })

  it('compresses large images to 1600px wide while preserving aspect ratio', async () => {
    const canvas = setupCanvas(4000, 2000)
    await compressReceiptFile(new File(['large-receipt'], 'receipt.png', { type: 'image/png' }))

    expect(canvas.width).toBe(1600)
    expect(canvas.height).toBe(800)
    expect(canvas.toBlob).toHaveBeenCalledTimes(1)
  })

  it('reports compression failure when WebP encoding returns no blob', async () => {
    setupCanvas(800, 600, null)

    await expect(compressReceiptFile(new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' })))
      .rejects.toThrow('Could not compress receipt image to WebP')
  })
})
