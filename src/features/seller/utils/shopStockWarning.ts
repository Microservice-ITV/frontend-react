export const SHOP_LOW_STOCK_THRESHOLD = 10

export const shopStockWarning = (shopStock: number) => {
  if (shopStock <= 0) {
    return { label: 'Out of stock', className: 'bg-red-100 text-red-700' }
  }
  if (shopStock < SHOP_LOW_STOCK_THRESHOLD) {
    return { label: 'Low stock', className: 'bg-amber-100 text-amber-800' }
  }
  return null
}

export const isShopStockAlert = (shopStock: number) => shopStock < SHOP_LOW_STOCK_THRESHOLD
