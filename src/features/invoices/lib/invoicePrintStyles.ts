import interBoldUrl from '@/assets/fonts/inter/Inter-Bold.woff2?url'
import interMediumUrl from '@/assets/fonts/inter/Inter-Medium.woff2?url'
import interRegularUrl from '@/assets/fonts/inter/Inter-Regular.woff2?url'
import interSemiBoldUrl from '@/assets/fonts/inter/Inter-SemiBold.woff2?url'

/**
 * Scoped design tokens for the invoice document.
 *
 * Invoice output uses the bundled Inter font in the browser and PDF renderer.
 */
export const INVOICE_DOCUMENT_STYLES = `
@font-face {
  font-family: 'Inter';
  src: url('${interRegularUrl}') format('woff2');
  font-style: normal;
  font-weight: 400;
  font-display: block;
}
@font-face {
  font-family: 'Inter';
  src: url('${interMediumUrl}') format('woff2');
  font-style: normal;
  font-weight: 500;
  font-display: block;
}
@font-face {
  font-family: 'Inter';
  src: url('${interSemiBoldUrl}') format('woff2');
  font-style: normal;
  font-weight: 600;
  font-display: block;
}
@font-face {
  font-family: 'Inter';
  src: url('${interBoldUrl}') format('woff2');
  font-style: normal;
  font-weight: 700;
  font-display: block;
}

.invoice-document {
  --invoice-font: 'Inter', sans-serif;
  --invoice-ink: #202a3a;
  --invoice-muted: #626b78;
  --invoice-faint: #77808d;
  --invoice-line: #e5e7eb;
  --invoice-paper: #ffffff;
  --invoice-paper-soft: var(--dni-primary-50, #ecfdf5);
  --invoice-accent: var(--dni-primary-600, #059669);
  --invoice-accent-strong: var(--dni-primary-700, #047857);
  font-family: var(--invoice-font);
  color: var(--invoice-ink);
  background: var(--invoice-paper);
}

.invoice-document,
.invoice-document * {
  font-family: var(--invoice-font) !important;
}

.invoice-document .invoice-ink { color: var(--invoice-ink); }
.invoice-document .invoice-muted { color: var(--invoice-muted); }
.invoice-document .invoice-faint { color: var(--invoice-faint); }
.invoice-document .invoice-border { border-color: var(--invoice-line); }
.invoice-document .invoice-soft { background-color: var(--invoice-paper-soft); }
.invoice-document .invoice-accent-text { color: var(--invoice-accent); }
.invoice-document .invoice-accent-bg { background-color: var(--invoice-accent); }
.invoice-document .invoice-status-badge {
  background-color: var(--invoice-paper-soft) !important;
  color: var(--invoice-accent) !important;
  --tw-ring-color: var(--invoice-line);
  text-transform: none;
  letter-spacing: 0.03em;
}
.invoice-document .invoice-status-badge > span {
  background-color: var(--invoice-accent) !important;
}
.invoice-document .invoice-note-divider { background-color: var(--invoice-line); }
.invoice-document .invoice-note-box {
  border-color: var(--invoice-line);
  background: var(--invoice-paper-soft);
  color: var(--invoice-ink);
}
.invoice-document .invoice-table-heading { background: var(--invoice-paper-soft); }
.invoice-document .invoice-total-box {
  border-color: var(--invoice-line);
  background: var(--invoice-paper-soft);
}
.invoice-document .invoice-header {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--invoice-paper);
  color: var(--invoice-ink);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.invoice-document .invoice-header::before {
  position: absolute;
  z-index: -1;
  top: 0;
  right: 0;
  width: 10rem;
  height: 10rem;
  border-bottom-left-radius: 100%;
  background: var(--invoice-paper-soft);
  content: "";
}
.invoice-document .invoice-header .invoice-header-muted { color: var(--invoice-muted); }
.invoice-document .invoice-payment-status {
  border-color: var(--invoice-line);
  background: var(--invoice-paper-soft);
  color: var(--invoice-accent-strong);
}

.invoice-document .print-color-adjust-exact {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Dashboard A4 invoices keep the same information in a denser business layout. */
.invoice-document.invoice-document-compact > header { padding: 14px 24px 12px !important; }
.invoice-document.invoice-document-compact > header > div:first-child { gap: 10px !important; }
.invoice-document.invoice-document-compact > header img,
.invoice-document.invoice-document-compact > header > div:first-child > span { width: 42px !important; height: 42px !important; }
.invoice-document.invoice-document-compact > header h1 { font-size: 30px !important; }
@media (min-width: 640px) {
  .invoice-document.invoice-document-compact > header h1 { font-size: 34px !important; }
}
.invoice-document.invoice-document-compact > section { margin-top: 12px !important; }
.invoice-document.invoice-document-compact > section.grid { gap: 10px !important; }
.invoice-document.invoice-document-compact > section.grid > div { padding: 10px !important; }
.invoice-document.invoice-document-compact .invoice-desktop-items th { padding-top: 7px !important; padding-bottom: 7px !important; }
.invoice-document.invoice-document-compact .invoice-desktop-items td { padding-top: 7px !important; padding-bottom: 7px !important; }
.invoice-document.invoice-document-compact .invoice-desktop-items img,
.invoice-document.invoice-document-compact .invoice-desktop-items [role="img"] { width: 38px !important; height: 38px !important; }
.invoice-document.invoice-document-compact > footer { margin-top: 12px !important; padding: 12px 24px !important; }
.invoice-document .invoice-terms { background: #fafafa; }
`

/**
 * Shared print rules for the invoice document.
 *
 * The document isolates itself from the surrounding dashboard chrome so that
 * printing (or "Save as PDF" from the browser) yields a clean invoice only.
 * Scoped by `.invoice-document` so it never affects other pages.
 */
export const INVOICE_PRINT_STYLES = `
@page { size: A4; margin: 9mm; }

.invoice-document {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

@media print {
  /* Isolate the document from surrounding app chrome. */
  body * { visibility: hidden !important; }
  .invoice-document,
  .invoice-document * { visibility: visible !important; }

  .invoice-document {
    position: absolute !important;
    inset: 0 auto auto 0;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    box-shadow: none !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: #ffffff !important;
  }

  /* Actions must never reach the printed/PDF output. */
  .invoice-document-actions,
  [data-print-hide] { display: none !important; }

  /* Keep blocks from splitting across pages. */
  .invoice-document [data-print-keep-together],
  .invoice-document .total-section,
  .invoice-document .invoice-note,
  .invoice-document footer {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Repeat table headers on every page, never split a row. */
  .invoice-document thead { display: table-header-group; }
  .invoice-document tfoot { display: table-footer-group; }
  .invoice-document tr { break-inside: avoid; page-break-inside: avoid; }
  .invoice-mobile-items { display: none !important; }
  .invoice-desktop-items { display: block !important; }
  .invoice-document header,
  .invoice-document footer {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .invoice-document img {
    max-width: 56px !important;
    max-height: 56px !important;
  }

  .invoice-document .invoice-note-box,
  .invoice-document .invoice-total-box,
  .invoice-document .invoice-table-heading {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .invoice-document .invoice-terms { margin-left: 0 !important; margin-right: 0 !important; }
}
`

export default INVOICE_PRINT_STYLES
