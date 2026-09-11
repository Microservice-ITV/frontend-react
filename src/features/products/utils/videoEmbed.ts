/**
 * Turn a YouTube URL into a privacy-friendly iframe embed src.
 */
export function toYouTubeEmbedSrc(raw: string): string | null {
  const input = raw.trim()
  if (!input) return null

  try {
    const url = new URL(input)

    // youtu.be/<id>
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0]
      return id
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
        : null
    }

    // youtube.com/watch?v= | /embed/ | /shorts/
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtube-nocookie.com')) {
      const path = url.pathname
      let id = url.searchParams.get('v') ?? ''
      if (!id && path.startsWith('/embed/')) id = path.slice('/embed/'.length).split('/')[0]
      if (!id && path.startsWith('/shorts/')) id = path.slice('/shorts/'.length).split('/')[0]
      return id
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
        : null
    }
  } catch {
    return null
  }

  return null
}

const YOUTUBE_URL_RE =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?[^\s]+|embed\/[\w-]+|shorts\/[\w-]+)|youtu\.be\/[\w-]+)[^\s]*/gi

/** First YouTube URL found in free text (e.g. product description). */
export function findYouTubeUrlInText(text: string): string | null {
  const matches = text.match(YOUTUBE_URL_RE)
  if (!matches?.length) return null
  for (const m of matches) {
    if (toYouTubeEmbedSrc(m)) return m
  }
  return null
}

/** Remove YouTube URLs from description so they only appear as the embed. */
export function stripYouTubeUrlsFromText(text: string): string {
  return text
    .replace(YOUTUBE_URL_RE, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
