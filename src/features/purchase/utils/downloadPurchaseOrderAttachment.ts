import { purchaseApi } from '../api/purchaseApi'
import type { PurchaseOrderAttachment } from '../types/purchaseTypes'

/** Download a PO attachment and trigger a browser save dialog. */
export async function downloadPurchaseOrderAttachment(
  orderId: string,
  attachment: PurchaseOrderAttachment,
): Promise<void> {
  const response = await purchaseApi.downloadPurchaseOrderAttachment(orderId, attachment.id)
  const blob = new Blob([response.data], {
    type: attachment.mimeType || 'application/octet-stream',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.fileName
  link.click()
  URL.revokeObjectURL(url)
}
