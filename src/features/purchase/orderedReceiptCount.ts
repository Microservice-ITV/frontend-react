export const ORDERED_RECEIPT_COUNT_EVENT = 'dni:ordered-purchase-orders'

export const notifyOrderedReceiptCountChanged = () => {
  window.dispatchEvent(new Event(ORDERED_RECEIPT_COUNT_EVENT))
}
