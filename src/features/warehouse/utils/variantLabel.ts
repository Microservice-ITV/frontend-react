export type ParsedVariant = {
  colorId: string
  sizeId: string
  colorName: string
  sizeName: string
  label: string
}

const PREFIX = 'v1'

const clean = (value?: string | null) => (value ?? '').trim()

/** Parse inventory / receipt variant keys produced by warehouse-service. */
export function parseVariantId(variantId?: string | null): ParsedVariant {
  const raw = clean(variantId)
  if (!raw) {
    return { colorId: '', sizeId: '', colorName: '', sizeName: '', label: '' }
  }
  if (raw.startsWith(`${PREFIX}::`)) {
    const parts = raw.split('::')
    const colorId = parts[1] ?? ''
    const sizeId = parts[2] ?? ''
    const colorName = parts[3] ?? ''
    const sizeName = parts[4] ?? ''
    const label = [colorName, sizeName].filter(Boolean).join(' / ')
    return {
      colorId,
      sizeId,
      colorName,
      sizeName,
      // Prefer human names only — never show color/size UUIDs as the label.
      label,
    }
  }
  return { colorId: '', sizeId: '', colorName: '', sizeName: '', label: '' }
}

export function variantDisplayLabel(
  variantId?: string | null,
  extras?: { variantLabel?: string | null; colorName?: string | null; sizeName?: string | null },
): string {
  const fromExtras = [extras?.colorName?.trim(), extras?.sizeName?.trim()].filter(Boolean).join(' / ')
  if (fromExtras) return fromExtras
  if (extras?.variantLabel?.trim()) return extras.variantLabel.trim()
  return parseVariantId(variantId).label
}
