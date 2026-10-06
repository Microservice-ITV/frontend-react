import { useState } from 'react'
import {
  CalendarDays,
  CreditCard,
  Download,
  Heart,
  ImageOff,
  Info,
  Mail,
  MapPin,
  PackageCheck,
  Printer,
  Store,
  UserRound,
  Wallet,
} from 'lucide-react'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import {
  addressToLines,
  formatAmountInWords,
  formatCurrency,
  formatInvoiceDate,
  formatInvoiceNumber,
  formatPaymentMethodLabel,
  lineItemImage,
  textToLines,
} from '../lib/invoiceFormat'
import { INVOICE_DOCUMENT_STYLES, INVOICE_PRINT_STYLES } from '../lib/invoicePrintStyles'

type InvoiceDocumentSheetProps = {
  invoice: InvoiceDocument
  onDownload?: () => void
  isDownloading?: boolean
  /** Set false when the host page renders its own action bar. */
  showActions?: boolean
  /** Set false to hide the Payment information block. */
  showPaymentInformation?: boolean
  /** `print` renders the document alone, for the print/PDF route. */
  mode?: 'screen' | 'print'
}

const CUSTOMER_NOTE = 'You may want to check the parcel before accepting.Thank you for shopping with us.'

const SectionLabel = ({ children }: { children: string }) => (
  <h2 className="text-[10px] font-bold uppercase tracking-[0.13em] invoice-accent-text">{children}</h2>
)

const ProductThumbnail = ({ src, name }: { src: string; name: string }) => {
  const [hasError, setHasError] = useState(!src)

  if (!src || hasError) {
    return (
      <span
        role="img"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border invoice-border invoice-soft invoice-faint"
        aria-label={`${name} image unavailable`}
      >
        <ImageOff size={18} aria-hidden="true" />
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setHasError(true)}
      className="h-14 w-14 shrink-0 rounded-lg border invoice-border bg-white object-contain p-1"
    />
  )
}

const InvoiceDocumentSheet = ({
  invoice,
  onDownload,
  isDownloading = false,
  showActions = true,
  showPaymentInformation = true,
  mode = 'screen',
}: InvoiceDocumentSheetProps) => {
  const lineItems = invoice.lineItems ?? []
  const isPrint = mode === 'print'
  const currency = invoice.currency || 'MMK'
  const discountAmount = Number(invoice.discountAmount || 0)
  const taxAmount = Number(invoice.taxAmount || 0)

  const invoiceNumber = formatInvoiceNumber(invoice.invoiceNumber || invoice.id)
  const billingLines = addressToLines(invoice.billingAddress)
  const shippingLines = addressToLines(invoice.shippingAddress)

  const sellerLines = [
    invoice.shopContactName,
    addressToLines(invoice.shopAddress).join(', '),
    invoice.shopContactPhone ? `Phone: ${invoice.shopContactPhone}` : null,
    invoice.shopContactEmail,
  ].filter((line): line is string => Boolean(line?.trim()))

  const buyerLines = [invoice.customerName, invoice.customerEmail, invoice.customerPhone]
    .filter((line): line is string => Boolean(line?.trim()))

  const notes = textToLines(invoice.verificationNote)
  const paymentReference = invoice.paymentGatewayRef?.trim() || ''
  return (
    <article
      data-invoice-root={isPrint ? 'print' : 'screen'}
      className={`invoice-document w-full overflow-hidden bg-white invoice-ink ${isPrint ? '' : 'rounded-xl border invoice-border shadow-sm'}`}
    >
      <style>{`${INVOICE_DOCUMENT_STYLES}${INVOICE_PRINT_STYLES}`}</style>

      <header className="px-5 pt-6 sm:px-8 sm:pt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#FFFFFF] shadow-sm">
              <img src="/logo.svg" alt="Daily Need Items" className="h-full w-full object-contain p-1.5" />
            </span>
            <div className="min-w-0">
              <p className="break-words text-lg font-bold tracking-tight invoice-ink sm:text-xl">
                Daily Need Items
              </p>
              <p className="mt-0.5 text-xs invoice-muted">Quality Products for everyday needs</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border invoice-border invoice-soft px-4 py-3 sm:min-w-[310px] sm:justify-start sm:px-5">
            <CalendarDays size={18} className="shrink-0 invoice-accent-text" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] invoice-accent-text">Invoice</p>
              <p className="whitespace-nowrap text-[14px] font-bold invoice-ink">{invoiceNumber}</p>
              <p className="mt-1 text-xs invoice-muted">{formatInvoiceDate(invoice.createdAt)}</p>
            </div>
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight invoice-ink sm:text-[34px]">Invoice</h1>
      </header>

      <section className="mx-5 mt-5 grid items-start gap-4 sm:mx-8 sm:grid-cols-2" data-print-keep-together>
        <div className="rounded-xl border invoice-border bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <UserRound size={17} className="invoice-accent-text" aria-hidden="true" />
            <SectionLabel>Bill to</SectionLabel>
          </div>
          <div className="mt-3 space-y-1 text-[13px] leading-relaxed invoice-muted">
            {buyerLines.length === 0 ? (
              <p className="invoice-faint">Buyer information unavailable</p>
            ) : (
              buyerLines.map((line, index) => (
                <p
                  key={`buyer-${index}`}
                  className={index === 0 ? 'break-words font-semibold invoice-ink' : 'break-words'}
                >
                  {index === 1 && invoice.customerEmail && line === invoice.customerEmail && (
                    <Mail size={13} className="mr-1.5 inline-block invoice-accent-text" aria-hidden="true" />
                  )}
                  {line}
                </p>
              ))
            )}
            {billingLines.length > 0 && (
              <div className="border-t invoice-border mt-3 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] invoice-faint">Billing address</p>
                <p className="mt-1 break-words text-[13px] invoice-ink">{billingLines.join(', ')}</p>
              </div>
            )}
            <div className="border-t invoice-border mt-3 pt-3">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] invoice-accent-text">
                <MapPin size={14} aria-hidden="true" /> Shipping address
              </p>
              <p className="mt-1 break-words text-[13px] invoice-muted">
                {shippingLines.length > 0 ? shippingLines.join(', ') : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border invoice-border bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Store size={17} className="invoice-accent-text" aria-hidden="true" />
            <SectionLabel>From</SectionLabel>
          </div>
          <div className="mt-3 space-y-1 text-[13px] leading-relaxed invoice-muted">
            <p className="break-words font-semibold invoice-ink">{invoice.shopName || 'Seller information unavailable'}</p>
            {sellerLines.map((line, index) => (
              <p key={`seller-${index}`} className="break-words">{line}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="invoice-desktop-items mx-5 mt-5 hidden overflow-hidden rounded-xl border invoice-border sm:mx-8 md:block">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-y invoice-border invoice-table-heading">
              <th className="w-[43%] px-3 py-3.5 text-[10px] font-bold uppercase tracking-[0.11em] invoice-accent-text">Product</th>
              <th className="w-[17%] px-2 py-3.5 text-[10px] font-bold uppercase tracking-[0.11em] invoice-accent-text">SKU</th>
              <th className="w-[8%] px-2 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.11em] invoice-accent-text">Qty</th>
              <th className="w-[16%] px-2 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.11em] invoice-accent-text">Unit price</th>
              <th className="w-[16%] px-3 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.11em] invoice-accent-text">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={`${item.orderItemId ?? item.name}-${index}`} className="border-b invoice-border">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <ProductThumbnail
                      key={`${item.orderItemId ?? item.name}-${lineItemImage(item)}`}
                      src={lineItemImage(item)}
                      name={item.name || 'Product'}
                    />
                    <div className="min-w-0">
                      <p className="break-words text-[13px] font-medium invoice-ink">
                        {item.name || 'Product information unavailable'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="break-all px-2 py-3 text-[11px] invoice-muted">
                  {item.sku || '—'}
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-right text-[13px] tabular-nums invoice-muted">
                  {item.quantity}
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-right text-[13px] tabular-nums invoice-muted">
                  {formatCurrency(item.unitPrice, currency)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right text-[13px] font-medium tabular-nums invoice-ink">
                  {formatCurrency(item.total, currency)}
                </td>
              </tr>
            ))}
            {lineItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[13px] invoice-faint">
                  Item details unavailable
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="invoice-mobile-items mx-5 mt-5 space-y-3 sm:mx-8 md:hidden">
        {lineItems.map((item, index) => (
          <article
            key={`${item.orderItemId ?? item.name}-${index}`}
            className="rounded-lg border invoice-border bg-white p-3"
          >
            <div className="flex min-w-0 items-start gap-3">
              <ProductThumbnail
                key={`${item.orderItemId ?? item.name}-${lineItemImage(item)}`}
                src={lineItemImage(item)}
                name={item.name || 'Product'}
              />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium invoice-ink">
                  {item.name || 'Product information unavailable'}
                </p>
                <p className="mt-1 break-all text-xs invoice-muted">SKU: {item.sku || '—'}</p>
                <p className="mt-1 text-xs invoice-muted">Quantity: {item.quantity}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs">
              <span className="invoice-muted">Unit price {formatCurrency(item.unitPrice, currency)}</span>
              <span className="font-medium tabular-nums invoice-ink">
                Amount {formatCurrency(item.total, currency)}
              </span>
            </div>
          </article>
        ))}
        {lineItems.length === 0 && (
          <p className="px-1 py-6 text-center text-sm invoice-muted">
            Item details unavailable
          </p>
        )}
      </section>

      <section
        className={`mx-5 mt-5 grid gap-4 sm:mx-8 ${showPaymentInformation ? 'sm:grid-cols-2' : ''}`}
        data-print-keep-together
      >
        {showPaymentInformation && (
          <div className="rounded-xl border invoice-border invoice-soft p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <CreditCard size={19} className="invoice-accent-text" aria-hidden="true" />
              <SectionLabel>Payment Information</SectionLabel>
            </div>
            <dl className="mt-4 space-y-3 border-t invoice-border pt-3 text-[13px]">
              <div>
                <dt className="text-xs invoice-muted">Payment Method</dt>
                <dd className="mt-1 min-w-0 break-words font-medium invoice-ink">
                  {formatPaymentMethodLabel(invoice.paymentMethod)}
                </dd>
              </div>
              <div>
                <dt className="text-xs invoice-muted">Reference</dt>
                <dd className="mt-1 min-w-0 break-all text-[12px] font-medium invoice-ink">
                  {paymentReference || '—'}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className={`total-section w-full rounded-xl border invoice-border bg-white p-4 sm:p-5 ${showPaymentInformation ? '' : 'ml-auto max-w-sm'}`}>
          <dl className="space-y-2 text-[13px]">
            <div className="flex justify-between gap-6">
              <dt className="invoice-muted">Subtotal</dt>
              <dd className="tabular-nums invoice-ink">
                {formatCurrency(invoice.subtotal, currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="invoice-muted">Shipping</dt>
              <dd className="tabular-nums invoice-ink">
                {formatCurrency(invoice.deliveryFee, currency)}
              </dd>
            </div>
            {discountAmount !== 0 && (
              <div className="flex justify-between gap-6">
                <dt className="invoice-muted">Discount</dt>
                <dd className="tabular-nums invoice-ink">
                  -{formatCurrency(invoice.discountAmount, currency)}
                </dd>
              </div>
            )}
            {taxAmount !== 0 && (
              <div className="flex justify-between gap-6">
                <dt className="invoice-muted">Tax</dt>
                <dd className="tabular-nums invoice-ink">
                  {formatCurrency(invoice.taxAmount, currency)}
                </dd>
              </div>
            )}
          </dl>

          <div className="invoice-total-box mt-3 flex items-center justify-between gap-4 rounded-lg border px-3 py-3 print-color-adjust-exact sm:px-4">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] invoice-accent-text">
              <Wallet size={18} aria-hidden="true" /> Total
            </span>
            <span className="text-base font-bold tabular-nums invoice-accent-text sm:text-lg">
              {formatCurrency(invoice.grandTotal, currency)}
            </span>
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em] invoice-muted">
            Amount in words
          </p>
          <p className="mt-1 text-[11px] leading-relaxed invoice-muted">
            {formatAmountInWords(invoice.grandTotal, currency)}
          </p>
        </div>
      </section>

      {notes.length > 0 && (
        <section className="px-5 pb-4 sm:px-8" data-print-keep-together>
          <SectionLabel>Notes</SectionLabel>
          <div className="mt-2 space-y-1 text-[12px] leading-relaxed invoice-muted">
            {notes.map((note, index) => <p key={`note-${index}`}>{note}</p>)}
          </div>
        </section>
      )}

      <aside className="invoice-note invoice-note-box mx-5 mt-5 flex items-center gap-4 rounded-xl border px-4 py-4 sm:mx-8 sm:px-5" data-print-keep-together>
        <Info size={22} className="shrink-0 invoice-accent-text" aria-hidden="true" />
        <span className="h-9 w-px shrink-0 invoice-note-divider" aria-hidden="true" />
        <p className="whitespace-pre-line text-[12px] font-medium leading-relaxed invoice-accent-text">{CUSTOMER_NOTE}</p>
        <PackageCheck size={26} className="ml-auto hidden shrink-0 invoice-accent-text sm:block" aria-hidden="true" />
      </aside>

      <footer className="mt-5 flex items-center justify-between gap-4 border-t invoice-border px-5 py-5 sm:px-8">
        <p className="flex items-center gap-2 text-sm font-semibold italic invoice-accent-text">
          <Heart size={17} fill="currentColor" aria-hidden="true" />
          Thank you for your purchase.
        </p>
        <div className="hidden items-center gap-4 sm:flex">
          <span className="flex items-center gap-1.5 text-[10px] invoice-muted"><PackageCheck size={15} className="invoice-accent-text" aria-hidden="true" /> Quality products</span>
          <span className="h-5 w-px invoice-note-divider" aria-hidden="true" />
          <span className="flex items-center gap-1.5 text-[10px] invoice-muted"><Store size={15} className="invoice-accent-text" aria-hidden="true" /> Daily Need Items</span>
        </div>
      </footer>

      {showActions && !isPrint && (
        <div className="invoice-document-actions flex flex-wrap justify-end gap-2 border-t invoice-border px-5 py-4 sm:px-8">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 rounded-lg border invoice-border bg-white px-3.5 py-2 text-sm font-medium invoice-ink transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              {isDownloading ? 'Preparing PDF…' : 'Download PDF'}
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg invoice-accent-bg px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Printer size={15} />
            Print
          </button>
        </div>
      )}
    </article>
  )
}

export default InvoiceDocumentSheet
