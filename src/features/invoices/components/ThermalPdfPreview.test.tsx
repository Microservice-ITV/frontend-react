// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ThermalPdfPreview from './ThermalPdfPreview'

const pdfMocks = vi.hoisted(() => {
  const render = vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }))
  const getViewport = vi.fn(({ scale }: { scale: number }) => ({ width: 200 * scale, height: 900 * scale }))
  const page = { getViewport, render }
  const document = { numPages: 1, getPage: vi.fn(async () => page), cleanup: vi.fn() }
  const getDocument = vi.fn(() => ({ promise: Promise.resolve(document), destroy: vi.fn(async () => undefined) }))
  return { render, getViewport, document, getDocument }
})

vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: { workerSrc: '' }, getDocument: pdfMocks.getDocument }))

class TestResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) { this.callback([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver) }
  disconnect() {}
}

let measuredViewerWidth = 820
let measuredViewerHeight = 620

describe('ThermalPdfPreview', () => {
  beforeEach(() => {
    measuredViewerWidth = 820
    measuredViewerHeight = 620
    pdfMocks.render.mockClear()
    pdfMocks.getViewport.mockClear()
    pdfMocks.document.getPage.mockClear()
    pdfMocks.getDocument.mockClear()
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,c25hcHNob3Q=')
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => measuredViewerWidth)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => measuredViewerHeight)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each([
    ['58mm', 'invoice'], ['80mm', 'invoice'], ['58mm', 'receipt'], ['80mm', 'receipt'],
  ] as const)('fits the actual %s %s PDF page to the available preview area', async (width, kind) => {
    const pdf = { arrayBuffer: async () => new ArrayBuffer(8) } as Blob
    render(<ThermalPdfPreview pdf={pdf} width={width} kind={kind} />)
    const preview = screen.getByRole('region', { name: `${width} thermal ${kind} PDF preview` })
    expect(preview).toHaveAttribute('data-paper-width', width)
    expect(preview).toHaveAttribute('data-document-kind', kind)
    expect(screen.getByRole('button', { name: 'Fit to page' })).toBeInTheDocument()
    const viewportElement = screen.getByTestId('thermal-pdf-scroll-viewport')
    await waitFor(() => expect(pdfMocks.render).toHaveBeenCalled())
    const canvas = screen.getByLabelText('PDF page 1')
    const canvasWidth = Number.parseFloat(canvas.getAttribute('style')?.match(/width: ([\d.]+)px/)?.[1] || '0')
    const expectedPreviewFactor = width === '58mm' ? 0.96 : 0.95
    const expectedFitScale = Math.min((viewportElement.clientWidth - 32) / 200, (viewportElement.clientHeight - 32) / 900)
    expect(canvasWidth).toBeCloseTo(200 * expectedFitScale * expectedPreviewFactor, 1)
    expect(canvasWidth).toBeGreaterThan(0)
    expect(canvasWidth).toBeLessThanOrEqual(viewportElement.clientWidth - 32)
  })

  it('renders only the actual PDF page and never mounts an HTML thermal fallback', async () => {
    let finishRender!: () => void
    pdfMocks.render.mockImplementationOnce(() => ({ promise: new Promise<void>((resolve) => { finishRender = resolve }), cancel: vi.fn() }))
    const pdf = { arrayBuffer: async () => new ArrayBuffer(8) } as Blob
    render(<ThermalPdfPreview pdf={pdf} width="58mm" kind="invoice" />)
    await waitFor(() => expect(pdfMocks.render).toHaveBeenCalledOnce())
    const viewport = screen.getByTestId('thermal-pdf-scroll-viewport')
    expect(viewport.querySelector('[data-testid="thermal-html-preview"]')).toBeNull()
    expect(viewport.querySelector('[data-testid="thermal-html-preview-stage"]')).toBeNull()
    expect(screen.queryByText('Official Sales Document')).not.toBeInTheDocument()

    finishRender()
    await waitFor(() => expect(screen.getByLabelText('PDF page 1')).toBeVisible())
  })

  it('supports zoom controls while retaining a scrollable viewport for long receipts', async () => {
    const pdf = { arrayBuffer: async () => new ArrayBuffer(8) } as Blob
    render(<ThermalPdfPreview pdf={pdf} width="80mm" kind="receipt" />)
    const canvas = await screen.findByLabelText('PDF page 1')
    await waitFor(() => expect(pdfMocks.render).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    await waitFor(() => expect(pdfMocks.render).toHaveBeenCalledTimes(2))
    expect(screen.getByText('110%')).toBeInTheDocument()
    expect(canvas.closest('[data-testid="thermal-pdf-scroll-viewport"]')).toHaveClass('h-[min(68vh,620px)]', 'overflow-auto')
  })

  it('renders the selected prepared PDF after PDF.js loads it without an HTML replacement', async () => {
    const firstPdf = { arrayBuffer: async () => new ArrayBuffer(8) } as Blob
    const { rerender } = render(<ThermalPdfPreview pdf={firstPdf} width="58mm" kind="invoice" />)
    await waitFor(() => expect(screen.getByLabelText('PDF page 1')).toBeVisible())
    let resolveDocument!: (document: typeof pdfMocks.document) => void
    pdfMocks.getDocument.mockImplementationOnce(() => ({ promise: new Promise((resolve) => { resolveDocument = resolve }), destroy: vi.fn(async () => undefined) }))
    const secondPdf = { arrayBuffer: async () => new ArrayBuffer(16) } as Blob
    rerender(<ThermalPdfPreview pdf={secondPdf} width="80mm" kind="invoice" />)
    await waitFor(() => expect(pdfMocks.getDocument).toHaveBeenCalledTimes(2))
    expect(screen.queryByTestId('thermal-html-preview')).not.toBeInTheDocument()
    resolveDocument(pdfMocks.document)
    await waitFor(() => expect(pdfMocks.render).toHaveBeenCalled())
    expect(screen.getByLabelText('PDF page 1')).toBeVisible()
  })
})
