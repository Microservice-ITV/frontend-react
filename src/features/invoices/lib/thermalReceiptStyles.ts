import interBoldUrl from '@/assets/fonts/inter/Inter-Bold.woff2?url'
import interMediumUrl from '@/assets/fonts/inter/Inter-Medium.woff2?url'
import interRegularUrl from '@/assets/fonts/inter/Inter-Regular.woff2?url'
import interSemiBoldUrl from '@/assets/fonts/inter/Inter-SemiBold.woff2?url'

/**
 * Thermal receipt styling for 58mm and 80mm POS printers.
 * 
 * These styles are designed for compact, black-and-white thermal printing
 * with appropriate margins and no horizontal overflow.
 */
export const THERMAL_RECEIPT_STYLES = `
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

.thermal-receipt {
  --receipt-font: Arial, Helvetica, sans-serif;
  --receipt-ink: #000000;
  --receipt-muted: #444444;
  --receipt-faint: #666666;
  --receipt-line: #888888;
  --receipt-paper: #ffffff;
  font-family: var(--receipt-font);
  color: var(--receipt-ink);
  background: var(--receipt-paper);
  line-height: 1.2;
}

.thermal-receipt,
.thermal-receipt * {
  font-family: var(--receipt-font) !important;
  box-sizing: border-box;
}

.thermal-receipt .receipt-ink { color: var(--receipt-ink); }
.thermal-receipt .receipt-muted { color: var(--receipt-muted); }
.thermal-receipt .receipt-faint { color: var(--receipt-faint); }
.thermal-receipt .receipt-border { border-color: var(--receipt-line); }
.thermal-receipt .receipt-accent { font-weight: 700; }
.thermal-receipt .receipt-center { text-align: center; }
.thermal-receipt .receipt-right { text-align: right; }
.thermal-receipt .receipt-left { text-align: left; }
.thermal-receipt .receipt-uppercase { text-transform: uppercase; }
.thermal-receipt .receipt-bold { font-weight: 700; }
.thermal-receipt .receipt-semibold { font-weight: 600; }
.thermal-receipt .receipt-medium { font-weight: 500; }
.thermal-receipt .receipt-normal { font-weight: 400; }
.thermal-receipt .text-green-700,
.thermal-receipt .text-amber-700 { color: var(--receipt-ink) !important; }

.thermal-receipt > header,
.thermal-receipt > section,
.thermal-receipt > footer { padding: 4px 6px !important; }
.thermal-receipt .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 3px !important; }
.thermal-receipt .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 2px !important; }
.thermal-receipt .mb-4 { margin-bottom: 3px !important; }
.thermal-receipt .mb-3 { margin-bottom: 3px !important; }

.thermal-receipt .receipt-divider {
  border-top: 1px dotted #777777;
  margin: 3px 0;
}

.thermal-receipt .receipt-item-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(18mm, auto);
  align-items: baseline;
  column-gap: 1.5mm;
  padding: 1px 0;
  break-inside: avoid;
  page-break-inside: avoid;
}

.thermal-receipt .receipt-item-heading {
  grid-template-columns: minmax(0, 1fr) auto minmax(18mm, auto);
  border-bottom: 1px dotted var(--receipt-line);
  margin-bottom: 1px;
  padding-bottom: 2px;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: .04em;
}

.thermal-receipt .receipt-item-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.thermal-receipt .receipt-item-qty,
.thermal-receipt .receipt-item-price {
  white-space: nowrap;
  text-align: right;
}

.thermal-receipt .receipt-item-price { font-weight: 600; min-width: 18mm; }
.thermal-receipt .receipt-address { overflow-wrap: anywhere; line-height: 1.25; }
.thermal-receipt .receipt-address-section { break-inside: avoid; page-break-inside: avoid; }
.thermal-receipt .receipt-item-block { padding: 1px 0; break-inside: avoid; page-break-inside: avoid; }
.thermal-receipt .receipt-item-wide-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(18mm, max-content);
  align-items: baseline;
  column-gap: 1.5mm;
  padding: 1px 0;
  break-inside: avoid;
  page-break-inside: avoid;
}
.thermal-receipt .receipt-item-wide-row .receipt-item-name {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow-wrap: normal;
  word-break: normal;
}
.thermal-receipt .receipt-item-narrow-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 2mm;
  line-height: 1.2;
  break-inside: avoid;
  page-break-inside: avoid;
}
.thermal-receipt .thermal-item-table-narrow .receipt-item-name {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow-wrap: normal;
  word-break: normal;
  line-height: 1.2;
}
.thermal-receipt .receipt-item-unit { min-width: 0; white-space: nowrap; font-size: .95em; }
.thermal-receipt .receipt-item-total { white-space: nowrap; text-align: right; }
.thermal-receipt .receipt-item-secondary {
  display: flex;
  flex-wrap: wrap;
  column-gap: 2mm;
  font-size: 0.85em;
  line-height: 1.2;
  overflow-wrap: anywhere;
  break-inside: avoid;
  page-break-inside: avoid;
}

.thermal-receipt .receipt-double-divider {
  border-top: 1px dotted var(--receipt-line);
  margin: 3px 0;
}
.thermal-receipt .receipt-payment-method { margin-top: 2px; font-size: 9px; line-height: 1.15; }

.thermal-receipt .receipt-qr-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 3mm;
  margin: 3px 0;
}

.thermal-receipt .receipt-qr-caption {
  font-size: 10px;
  color: var(--receipt-muted);
  line-height: 1.35;
  margin: 0;
  overflow-wrap: anywhere;
}

.thermal-receipt .receipt-qr-footer-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1mm;
}

.thermal-receipt .receipt-qr-footer-copy .receipt-qr-caption:first-child {
  color: var(--receipt-ink);
  font-size: 11px;
  font-weight: 700;
}

.thermal-receipt .receipt-store-name {
  font-weight: 700;
  font-size: 16px;
  text-align: center;
  margin-bottom: 2px;
}

.thermal-receipt .receipt-document-title {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  margin-bottom: 3px;
}

.thermal-receipt .receipt-section-title {
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 4px;
}

.thermal-receipt .receipt-label {
  font-weight: 500;
  font-size: 10px;
  color: var(--receipt-muted);
}

.thermal-receipt .receipt-value {
  font-weight: 400;
  font-size: 11px;
}

.thermal-receipt .receipt-amount {
  font-weight: 600;
  font-size: 11px;
}

.thermal-receipt .receipt-total {
  font-weight: 700;
  font-size: 12px;
}

.thermal-receipt .receipt-footer {
  font-size: 9px;
  color: var(--receipt-faint);
  text-align: center;
  margin-top: 4px;
}

.thermal-receipt .receipt-qr-image { width: 12mm; max-width: 12mm; height: auto; image-rendering: pixelated; }
.thermal-receipt .receipt-footer-main { border-top: 1px dotted var(--receipt-line); }
.thermal-receipt .receipt-policy-note { border-top: 1px dotted var(--receipt-line); margin-top: 1mm; padding-top: 1mm; font-size: 9px; line-height: 1.25; text-align: center; break-inside: avoid; page-break-inside: avoid; }

`

/**
 * Print rules for thermal receipts (58mm width).
 */
export const THERMAL_PRINT_STYLES_58MM = `
@page {
  size: 58mm auto;
  margin: 0;
}

@media print {
  /* Dashboard invoice printing uses a body-level copy of the same print sheet
     as PDF downloads, so dashboard layout cannot extend the roll page. */
  body.thermal-invoice-printing #root { display: none !important; }
  body.thermal-printing .thermal-print-source { display: block !important; }
  body.thermal-invoice-printing .thermal-print-source { display: none !important; }
  body.thermal-printing [data-thermal-pdf-preview] { height: auto !important; min-height: 0 !important; overflow: visible !important; border: 0 !important; box-shadow: none !important; }

  html:has(body.thermal-printing),
  body.thermal-printing,
  body.thermal-printing #root {
    width: 58mm !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }
  body.thermal-printing #root > div {
    width: 58mm !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  /* Thermal print mode is explicit so an open preview cannot override A4 printing. */
  body.thermal-printing * { visibility: hidden !important; }
  body.thermal-printing .thermal-receipt,
  body.thermal-printing .thermal-receipt * { visibility: visible !important; }

  body.thermal-printing .thermal-receipt,
  body.thermal-printing .thermal-receipt * {
    font-family: Arial, Helvetica, sans-serif !important;
  }

  body.thermal-printing .thermal-receipt {
    position: absolute !important;
    inset: 0 auto auto 3mm;
    width: 52mm !important;
    max-width: 52mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    box-shadow: none !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: #ffffff !important;
    font-size: 8px !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Keep the receipt sheet as one terminal print unit. The PDF renderer sets
     a content-sized roll page; these rules prevent browser pagination from
     appending a trailing blank page after that sheet. */
  body.thermal-printing [data-receipt-root="print"] {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    break-after: avoid-page !important;
    page-break-after: avoid !important;
  }

  body.thermal-printing .thermal-receipt .receipt-store-name { font-size: 10px !important; }
  body.thermal-printing .thermal-receipt .receipt-document-title { font-size: 9px !important; }
  body.thermal-printing .thermal-receipt .receipt-section-title { font-size: 8px !important; }
  body.thermal-printing .thermal-receipt .receipt-label { font-size: 7px !important; }
  body.thermal-printing .thermal-receipt .receipt-value,
  body.thermal-printing .thermal-receipt .receipt-item-name,
  body.thermal-printing .thermal-receipt .receipt-item-qty,
  body.thermal-printing .thermal-receipt .receipt-item-price { font-size: 8px !important; }
  body.thermal-printing .thermal-receipt .receipt-item-heading { font-size: 7px !important; }
  body.thermal-printing .thermal-receipt .receipt-total { font-size: 9px !important; }
  body.thermal-printing .thermal-receipt .receipt-qr-caption,
  body.thermal-printing .thermal-receipt .receipt-policy-note,
  body.thermal-printing .thermal-receipt .receipt-payment-method,
  body.thermal-printing .thermal-receipt .receipt-footer { font-size: 7px !important; }
  body.thermal-printing .thermal-receipt .receipt-qr-footer-copy .receipt-qr-caption:first-child { font-size: 8px !important; }
  body.thermal-printing .thermal-receipt .text-xs { font-size: 7px !important; }

  /* Tailwind section padding is useful in the preview, but creates long empty
     stretches on narrow rolls. Keep a small, even separation in printed output. */
  body.thermal-printing .thermal-receipt > header,
  body.thermal-printing .thermal-receipt > section,
  body.thermal-printing .thermal-receipt > footer {
    padding-top: 1mm !important;
    padding-bottom: 1mm !important;
  }
  body.thermal-printing .thermal-receipt .receipt-qr-container { margin: 3px 0; }
  body.thermal-printing .thermal-receipt .receipt-footer { margin-top: 3px; }

  /* Hide all actions and UI chrome */
  body.thermal-printing .thermal-receipt-actions,
  body.thermal-printing [data-print-hide],
  body.thermal-printing .receipt-actions {
    display: none !important;
  }

  /* Prevent page breaks inside important sections */
  .thermal-receipt header,
  .thermal-receipt footer,
  .thermal-receipt .receipt-total-section,
  .thermal-receipt .receipt-address-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Compact line items */
  /* Keep the high contrast QR comfortably inside the narrow paper margins. */
  .thermal-receipt .receipt-qr-container img {
    width: 12mm !important;
    max-width: 12mm !important;
    max-height: 12mm !important;
    height: auto !important;
    image-rendering: pixelated;
  }
}
`

/**
 * Print rules for thermal receipts (80mm width).
 */
export const THERMAL_PRINT_STYLES_80MM = `
@page {
  size: 80mm auto;
  margin: 0;
}

@media print {
  /* Dashboard invoice printing uses a body-level copy of the same print sheet
     as PDF downloads, so dashboard layout cannot extend the roll page. */
  body.thermal-invoice-printing #root { display: none !important; }

  html:has(body.thermal-printing),
  body.thermal-printing,
  body.thermal-printing #root {
    width: 80mm !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }
  body.thermal-printing #root > div {
    width: 80mm !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  body.thermal-printing * { visibility: hidden !important; }
  body.thermal-printing .thermal-receipt,
  body.thermal-printing .thermal-receipt * { visibility: visible !important; }

  body.thermal-printing .thermal-receipt,
  body.thermal-printing .thermal-receipt * {
    font-family: Arial, Helvetica, sans-serif !important;
  }

  body.thermal-printing .thermal-receipt {
    position: absolute !important;
    inset: 0 auto auto 5mm;
    width: 70mm !important;
    max-width: 70mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    box-shadow: none !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: #ffffff !important;
    font-size: 8px !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Keep the receipt sheet as one terminal print unit. The PDF renderer sets
     a content-sized roll page; these rules prevent browser pagination from
     appending a trailing blank page after that sheet. */
  body.thermal-printing [data-receipt-root="print"] {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    break-after: avoid-page !important;
    page-break-after: avoid !important;
  }

  body.thermal-printing .thermal-receipt .receipt-store-name { font-size: 10px !important; }
  body.thermal-printing .thermal-receipt .receipt-document-title { font-size: 9px !important; }
  body.thermal-printing .thermal-receipt .receipt-section-title { font-size: 8px !important; }
  body.thermal-printing .thermal-receipt .receipt-label { font-size: 7px !important; }
  body.thermal-printing .thermal-receipt .receipt-value,
  body.thermal-printing .thermal-receipt .receipt-item-name,
  body.thermal-printing .thermal-receipt .receipt-item-qty,
  body.thermal-printing .thermal-receipt .receipt-item-price { font-size: 8px !important; }
  body.thermal-printing .thermal-receipt .receipt-item-heading { font-size: 7px !important; }
  body.thermal-printing .thermal-receipt .receipt-total { font-size: 9px !important; }
  body.thermal-printing .thermal-receipt .receipt-qr-caption,
  body.thermal-printing .thermal-receipt .receipt-policy-note,
  body.thermal-printing .thermal-receipt .receipt-payment-method,
  body.thermal-printing .thermal-receipt .receipt-footer { font-size: 7px !important; }
  body.thermal-printing .thermal-receipt .receipt-qr-footer-copy .receipt-qr-caption:first-child { font-size: 8px !important; }
  body.thermal-printing .thermal-receipt .text-xs { font-size: 7px !important; }

  body.thermal-printing .thermal-receipt > header,
  body.thermal-printing .thermal-receipt > section,
  body.thermal-printing .thermal-receipt > footer {
    padding-top: 1mm !important;
    padding-bottom: 1mm !important;
  }
  body.thermal-printing .thermal-receipt .receipt-qr-container { margin: 3px 0; }
  body.thermal-printing .thermal-receipt .receipt-footer { margin-top: 3px; }

  /* Hide all actions and UI chrome */
  body.thermal-printing .thermal-receipt-actions,
  body.thermal-printing [data-print-hide],
  body.thermal-printing .receipt-actions {
    display: none !important;
  }

  /* Prevent page breaks inside important sections */
  .thermal-receipt header,
  .thermal-receipt footer,
  .thermal-receipt .receipt-total-section,
  .thermal-receipt .receipt-address-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* The wider QR remains bounded by the 5mm paper margins. */
  .thermal-receipt .receipt-qr-container img {
    width: 15mm !important;
    max-width: 15mm !important;
    max-height: 15mm !important;
    height: auto !important;
    image-rendering: pixelated;
  }
}
`

/**
 * Get the appropriate print styles based on receipt width.
 */
export const getThermalPrintStyles = (width: '58mm' | '80mm' = '58mm'): string => {
  return width === '58mm' ? THERMAL_PRINT_STYLES_58MM : THERMAL_PRINT_STYLES_80MM
}

/**
 * Combined styles for thermal receipt rendering.
 */
export const getCombinedThermalStyles = (width: '58mm' | '80mm' = '58mm'): string => {
  return THERMAL_RECEIPT_STYLES + getThermalPrintStyles(width)
}

export default THERMAL_RECEIPT_STYLES
