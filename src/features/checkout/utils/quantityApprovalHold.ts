const QUANTITY_APPROVAL_HOLD_KEY = 'dni.quantity-approval-hold'

export const holdCheckoutForQuantityApproval = (): void => {
  sessionStorage.setItem(QUANTITY_APPROVAL_HOLD_KEY, '1')
}

export const releaseQuantityApprovalHold = (): void => {
  sessionStorage.removeItem(QUANTITY_APPROVAL_HOLD_KEY)
}

export const isQuantityApprovalHold = (): boolean =>
  sessionStorage.getItem(QUANTITY_APPROVAL_HOLD_KEY) === '1'
