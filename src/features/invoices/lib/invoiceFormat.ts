/**
 * Shared invoice display formatting.
 *
 * These are **display-only** helpers: stored values are never mutated. Every
 * prefixing helper is idempotent, so an already-prefixed value (e.g.
 * `DNI-INV-20261005-000002`) is returned unchanged rather than double-prefixed.
 */

const DNI_PREFIX = 'DNI-'

/**
 * Ensures `DNI-<code>-<rest>` exactly once.
 * `INV-20261005-000004` -> `DNI-INV-20261005-000004`
 * `DNI-INV-20261005-000002` -> `DNI-INV-20261005-000002` (unchanged)
 */
const withDniPrefix = (raw: string | null | undefined, code: 'INV' | 'ORD'): string => {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return ''

  const withoutDni = trimmed.replace(new RegExp(`^${DNI_PREFIX}`, 'i'), '')
  const codePattern = new RegExp(`^${code}-`, 'i')
  const body = codePattern.test(withoutDni) ? withoutDni : `${code}-${withoutDni}`

  return `${DNI_PREFIX}${body}`
}

export const formatInvoiceNumber = (raw: string | null | undefined): string =>
  withDniPrefix(raw, 'INV')

export const formatOrderReference = (raw: string | null | undefined): string =>
  withDniPrefix(raw, 'ORD')

/** Formats an amount using the invoice's own currency. No conversion is performed. */
export const formatCurrency = (value: string | number, currency: string): string => {
  const amount = Number(value || 0)
  const code = currency || 'MMK'

  try {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)
    return `${code} ${formattedAmount}`
  } catch {
    return `${code} ${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`
  }
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

const chunkToWords = (value: number): string => {
  if (value < 20) return ONES[value]
  if (value < 100) return `${TENS[Math.floor(value / 10)]}${value % 10 ? ` ${ONES[value % 10]}` : ''}`
  if (value < 1000) {
    const rest = value % 100
    return `${ONES[Math.floor(value / 100)]} Hundred${rest ? ` ${chunkToWords(rest)}` : ''}`
  }
  return ''
}

const integerToWords = (input: number): string => {
  if (!Number.isFinite(input) || input < 0) return ''
  if (input === 0) return 'Zero'

  const scales: Array<[number, string]> = [
    [1_000_000_000, 'Billion'],
    [1_000_000, 'Million'],
    [1_000, 'Thousand'],
  ]

  let remaining = Math.floor(input)
  const parts: string[] = []

  for (const [scale, name] of scales) {
    const count = Math.floor(remaining / scale)
    if (count > 0) {
      parts.push(`${chunkToWords(count)} ${name}`)
      remaining %= scale
    }
  }

  if (remaining > 0) parts.push(chunkToWords(remaining))
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Presentational "amount in words" for MMK.
 * The invoice schema has no amount-in-words field, so this is display-only.
 */
export const formatAmountInWords = (
  value: string | number,
  currency: string,
): string => {
  const code = (currency || 'MMK').toUpperCase()
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return ''

  const rounded = Math.round(amount * 100) / 100
  const whole = Math.floor(Math.abs(rounded))
  const fraction = Math.round((Math.abs(rounded) - whole) * 100)

  const words = `${integerToWords(whole) || 'Zero'} ${code}`
  if (fraction === 0) return `${words} only`

  const hundredths = fraction.toString().padStart(2, '0')
  return `${words} and ${hundredths} hundredths only`
}

export const isCodPayment = (method: string | null | undefined): boolean => {
  const value = (method ?? '').trim().toUpperCase().replace(/[_-]+/g, ' ')
  return value === 'COD' || value === 'CASH ON DELIVERY'
}

export const formatPaymentMethodLabel = (method: string | null | undefined): string => {
  const value = (method ?? '').trim().toUpperCase()
  if (isCodPayment(method) || value === 'COD') return 'Cash on delivery'
  if (value === 'PREPAID' || value === 'CARD' || value === 'STRIPE') return 'Card / online'
  return (method ?? '').trim() || 'Not provided'
}

export const formatInvoiceStatusLabel = (
  status: string | null | undefined,
  paymentMethod?: string | null,
): string => {
  const value = (status ?? '').trim().toUpperCase()
  if (isCodPayment(paymentMethod) && value === 'UNPAID') return 'Due on delivery'
  if (isCodPayment(paymentMethod) && value === 'PAID') return 'Collected'
  if (value === 'UNPAID') return 'Unpaid'
  if (value === 'PENDING_VERIFICATION') return 'Pending verification'
  if (value === 'PAID') return 'Paid'
  if (value === 'REJECTED') return 'Rejected'
  if (value === 'VOID') return 'Void'
  if (value === 'REFUNDED') return 'Refunded'
  return status?.trim() || 'Unknown'
}

export const formatInvoiceDate = (value: string | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ADDRESS_KEYS = [
  'address_line_1', 'addressLine1', 'address_line_2', 'addressLine2',
  'ward', 'ward_name', 'wardName', 'township', 'township_name', 'townshipName',
  'district', 'district_name', 'districtName', 'city', 'city_name', 'cityName',
  'state', 'state_name', 'stateName', 'region', 'region_name', 'regionName',
  'location', 'location_name', 'locationName', 'postal_code', 'postalCode',
  'country', 'country_name', 'countryName',
]

/** Collapses runs of whitespace and trims, without altering the value itself. */
const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim()

/**
 * Flattens an address snapshot into clean display lines.
 *
 * Empty values are ignored, whitespace is normalised, and repeated components
 * are removed case-insensitively while preserving the original order of the
 * remaining meaningful parts. This is shared by the web invoice and the PDF
 * (the PDF renders this same component), so both always show one clean address.
 */
export const addressToLines = (
  address: Record<string, unknown> | string | null | undefined,
): string[] => {
  if (!address) return []

  const seen = new Set<string>()
  const lines: string[] = []
  const values = typeof address === 'string'
    ? address.split(/\r?\n/)
    : ADDRESS_KEYS.map((key) => address[key])

  for (const rawValue of values) {
    const value = typeof rawValue === 'string'
      ? rawValue
      : typeof rawValue === 'number' && Number.isFinite(rawValue)
        ? String(rawValue)
      : rawValue && typeof rawValue === 'object'
        ? ['name', 'label', 'value']
          .map((field) => (rawValue as Record<string, unknown>)[field])
          .find((field): field is string => typeof field === 'string' && Boolean(field.trim()))
        : undefined
    if (typeof value !== 'string') continue

    for (const part of value.split(/\r?\n/)) {
      const line = normalizeWhitespace(part)
      if (!line) continue

      // Location snapshots can repeat a place under different field names.
      const dedupeKey = line.normalize('NFKC').toLowerCase()
      if (seen.has(dedupeKey)) continue

      seen.add(dedupeKey)
      lines.push(line)
    }
  }

  return lines
}

export const textToLines = (value: string | null | undefined): string[] =>
  (value ?? '').split('\n').map((line) => line.trim()).filter(Boolean)

/**
 * First real image URL on a line item, if the snapshot ever carries one.
 * Accepts an arbitrary item so it stays safe when the snapshot has no image.
 */
export const lineItemImage = (item: unknown): string => {
  if (!item || typeof item !== 'object') return ''

  const record = item as Record<string, unknown>
  const candidate = [
    record.imageUrl,
    record.image_url,
    record.thumbnail,
    record.productImageUrl,
    record.productImage,
    record.image,
  ].find((value): value is string => typeof value === 'string' && Boolean(value.trim()))

  return candidate?.trim() ?? ''
}