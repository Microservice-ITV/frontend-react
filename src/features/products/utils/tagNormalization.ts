export function normalizeTags(tags: unknown): string[] {
  if (tags === undefined || tags === null) return [];

  if (Array.isArray(tags)) {
    return tags
      .map((tag) => (typeof tag === 'string' ? tag.trim() : String(tag).trim()))
      .filter((tag) => tag.length > 0);
  }

  if (typeof tags === 'string') {
    const trimmed = tags.trim();
    if (trimmed === '') return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((tag: unknown) => (typeof tag === 'string' ? tag.trim() : String(tag).trim()))
          .filter((tag: string) => tag.length > 0);
      }
    } catch {
      // Not JSON — fall through to comma-separated parsing.
    }

    return trimmed
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  return String(tags)
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}