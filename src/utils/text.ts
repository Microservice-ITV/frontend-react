export const truncateText = (value: string | null | undefined, maxLength = 100): string => {
  const text = (value ?? '').trim()
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}...`
}