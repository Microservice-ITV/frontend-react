import { matchPath } from 'react-router-dom'

export const isInvoicePrintRoute = (pathname: string): boolean => Boolean(
  matchPath({ path: '/account/invoices/:invoiceNumber/print', end: true }, pathname) ||
  matchPath({ path: '/account/invoices/:invoiceNumber/receipt/print', end: true }, pathname),
)
