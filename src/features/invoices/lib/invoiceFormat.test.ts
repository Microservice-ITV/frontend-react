import { describe, expect, it } from 'vitest'
import { addressToLines, formatAmountInWords, formatCurrency } from './invoiceFormat'

describe('addressToLines', () => {
  it('removes empty values and repeated township/city components while preserving order', () => {
    expect(addressToLines({
      address_line_1: ' Aye Mya Kyi Lin Ward ',
      address_line_2: ' ',
      ward: undefined,
      district: 'Kyaukse',
      township: ' kyaukse ',
      city: 'kyaukse',
      state: 'Mandalay',
      postal_code: null,
      country: 'Myanmar',
    })).toEqual([
      'Aye Mya Kyi Lin Ward',
      'Kyaukse',
      'Mandalay',
      'Myanmar',
    ])
  })

  it('preserves distinct location components', () => {
    expect(addressToLines({
      district: 'Kyaukse',
      city: 'Mandalay',
      location: ' Myanmar ',
    })).toEqual(['Kyaukse', 'Mandalay', 'Myanmar'])
  })

  it('deduplicates repeated rows in a multiline seller address', () => {
    expect(addressToLines('Aye Mya Kyi Lin Ward\nKyaukse\nKyaukse\nMandalay\nMyanmar'))
      .toEqual(['Aye Mya Kyi Lin Ward', 'Kyaukse', 'Mandalay', 'Myanmar'])
  })
})

describe('formatAmountInWords', () => {
  it('formats the actual MMK total, including hundredths only when present', () => {
    expect(formatAmountInWords('11660.26', 'MMK'))
      .toBe('Eleven Thousand Six Hundred Sixty MMK and 26 hundredths only')
    expect(formatAmountInWords('11660', 'MMK'))
      .toBe('Eleven Thousand Six Hundred Sixty MMK only')
  })
})

describe('formatCurrency', () => {
  it('preserves fractional MMK amounts instead of rounding to whole kyat', () => {
    expect(formatCurrency('11660.26', 'MMK').replace(/\s/g, ' ')).toBe('MMK 11,660.26')
    expect(formatCurrency('160', 'MMK')).toBe('MMK 160')
  })
})
