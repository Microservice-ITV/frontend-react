import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { Minus, Plus, RotateCcw } from 'lucide-react'

type ThermalPdfPreviewProps = {
  pdf: Blob | null
  loading?: boolean
  kind: 'invoice' | 'receipt'
  width: '58mm' | '80mm'
  errorMessage?: string | null
}

type PdfPage = {
  number: number
  width: number
  height: number
}

// Give the on-screen preview a little breathing room while leaving the source PDF untouched.
const previewScaleForWidth = (width: ThermalPdfPreviewProps['width']) => width === '58mm' ? 0.96 : 0.95

const ThermalPdfPreview = ({ pdf, loading = false, kind, width, errorMessage }: ThermalPdfPreviewProps) => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef(new Map<number, HTMLCanvasElement>())
  const renderTasks = useRef<RenderTask[]>([])
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null)
  const [loadedPdf, setLoadedPdf] = useState<Blob | null>(null)
  const [pages, setPages] = useState<PdfPage[]>([])
  const [hasRenderedPages, setHasRenderedPages] = useState(false)
  const [availableWidth, setAvailableWidth] = useState(0)
  const [availableHeight, setAvailableHeight] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const measure = () => {
      setAvailableWidth(Math.max(0, node.clientWidth - 32))
      setAvailableHeight(Math.max(0, node.clientHeight - 32))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!pdf) {
      setPdfDocument(null)
      setLoadedPdf(null)
      setPages([])
      setHasRenderedPages(false)
      setError(null)
      return
    }

    let active = true
    let loadedDocument: PDFDocumentProxy | null = null
    setPdfDocument(null)
    setLoadedPdf(null)
    setPages([])
    setHasRenderedPages(false)
    setError(null)

    const load = async () => {
      try {
        const [{ GlobalWorkerOptions, getDocument }, data] = await Promise.all([
          import('pdfjs-dist'),
          pdf.arrayBuffer(),
        ])
        GlobalWorkerOptions.workerSrc = pdfWorkerUrl
        const loadingTask: PDFDocumentLoadingTask = getDocument({ data })
        loadedDocument = await loadingTask.promise
        const pageSizes: PdfPage[] = []
        for (let number = 1; number <= loadedDocument.numPages; number += 1) {
          const page = await loadedDocument.getPage(number)
          const viewport = page.getViewport({ scale: 1 })
          pageSizes.push({ number, width: viewport.width, height: viewport.height })
        }
        if (!active) return
        setPdfDocument(loadedDocument)
        setLoadedPdf(pdf)
        setPages(pageSizes)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to preview this PDF.')
      }
    }

    void load()
    return () => {
      active = false
      loadedDocument?.cleanup()
    }
  }, [pdf])

  useEffect(() => {
    for (const task of renderTasks.current) task.cancel()
    renderTasks.current = []
    if (!pdfDocument || availableWidth <= 0 || availableHeight <= 0 || pages.length === 0) return

    const outputScale = Math.min(window.devicePixelRatio || 1, 2)
    const maxCanvasPixels = 16_000_000
    const maxCanvasDimension = 16_000
    const nextTasks: RenderTask[] = []
    const renderPages = async () => {
      for (const pageInfo of pages) {
        const canvas = canvasRefs.current.get(pageInfo.number)
        if (!canvas) continue
        const page = await pdfDocument.getPage(pageInfo.number)
        const documentHeight = pages.reduce((height, page) => height + page.height, 0) + (pages.length - 1) * 16
        const fitScale = Math.min(availableWidth / pageInfo.width, availableHeight / documentHeight)
        const scale = fitScale * previewScaleForWidth(width) * zoom
        const viewport = page.getViewport({ scale })
        const pixelLimitScale = Math.sqrt(maxCanvasPixels / (viewport.width * viewport.height))
        const dimensionLimitScale = maxCanvasDimension / Math.max(viewport.width, viewport.height)
        const renderScale = Math.min(outputScale, pixelLimitScale, dimensionLimitScale)
        const renderViewport = page.getViewport({ scale: scale * renderScale })
        canvas.width = Math.ceil(renderViewport.width)
        canvas.height = Math.ceil(renderViewport.height)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
        const task = page.render({
          canvas,
          viewport: renderViewport,
          background: '#ffffff',
        })
        nextTasks.push(task)
        renderTasks.current = nextTasks
        try {
          await task.promise
        } catch (renderError) {
          if (!(renderError instanceof Error) || renderError.name !== 'RenderingCancelledException') {
            setError('Unable to render this PDF preview.')
          }
          return
        }
      }
      setHasRenderedPages(true)
    }

    void renderPages()
    return () => {
      for (const task of nextTasks) task.cancel()
    }
  }, [availableHeight, availableWidth, pages, pdfDocument, width, zoom])

  const isCurrentPdf = Boolean(pdf && loadedPdf === pdf)

  return (
    <section
      aria-label={`${width} thermal ${kind} PDF preview`}
      data-thermal-pdf-preview
      data-paper-width={width}
      data-document-kind={kind}
      className="w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-200 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-white px-3 py-2" data-print-hide>
        <span className="text-xs font-medium text-slate-600">Fit to page · {width}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setZoom((value) => Math.max(0.5, Number((value - 0.1).toFixed(1))))} aria-label="Zoom out" className="rounded p-1.5 text-slate-700 hover:bg-slate-100"><Minus size={15} /></button>
          <span aria-live="polite" className="min-w-12 text-center text-xs text-slate-600">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((value) => Math.min(2, Number((value + 0.1).toFixed(1))))} aria-label="Zoom in" className="rounded p-1.5 text-slate-700 hover:bg-slate-100"><Plus size={15} /></button>
          <button type="button" onClick={() => setZoom(1)} aria-label="Fit to page" className="ml-1 inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"><RotateCcw size={13} /> Fit</button>
        </div>
      </div>
      <div ref={viewportRef} className="h-[min(68vh,620px)] min-h-[280px] overflow-auto p-4" data-testid="thermal-pdf-scroll-viewport">
        {(loading || !error && (!isCurrentPdf || !hasRenderedPages)) && (
          <div role="status" aria-label="Preparing PDF preview" className="mx-auto flex min-h-[360px] max-w-[420px] items-start justify-center py-5">
            <div className="w-full animate-pulse rounded-md border border-slate-300 bg-white px-5 py-6 shadow-sm" aria-hidden="true">
              <div className="mx-auto mb-6 h-2 w-2/5 rounded bg-slate-200" />
              <div className="mb-5 space-y-2">
                <div className="h-2 w-3/4 rounded bg-slate-200" />
                <div className="h-2 w-1/2 rounded bg-slate-200" />
              </div>
              <div className="mb-5 space-y-3 border-y border-dashed border-slate-200 py-4">
                <div className="h-2 w-full rounded bg-slate-100" />
                <div className="h-2 w-11/12 rounded bg-slate-100" />
                <div className="h-2 w-4/5 rounded bg-slate-100" />
              </div>
              <div className="ml-auto h-3 w-2/5 rounded bg-slate-200" />
            </div>
            <span className="sr-only">Preparing PDF preview…</span>
          </div>
        )}
        {(errorMessage || error) && <p role="alert" className="py-2 text-center text-sm text-rose-700">{errorMessage || error}</p>}
        {isCurrentPdf && pdfDocument && pages.map((page) => (
          <canvas
            key={page.number}
            ref={(node) => {
              if (node) canvasRefs.current.set(page.number, node)
              else canvasRefs.current.delete(page.number)
            }}
            aria-label={`PDF page ${page.number}`}
            className="mx-auto mb-4 block bg-white shadow-md last:mb-0"
            style={{ maxWidth: 'none' }}
          />
        ))}
      </div>
    </section>
  )
}

export default ThermalPdfPreview
