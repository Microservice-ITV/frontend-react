/** YouTube URL helpers for PDP Preview Video (watch / youtu.be / embed / shorts). */

const YOUTUBE_URL_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?[^\s]+|embed\/[\w-]+|shorts\/[\w-]+)|youtu\.be\/[\w-]+)[^\s]*/gi

function withHttps(raw: string): string {
  return /^(https?:)?\/\//i.test(raw) ? raw : `https://${raw}`
}

export function extractYouTubeVideoId(raw: string): string | null {
  const input = raw.trim()
  if (!input) return null
  try {
    const url = new URL(withHttps(input))
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return url.pathname.replace(/^\//, '').split('/')[0] || null
    if (!host.includes('youtube.com') && !host.includes('youtube-nocookie.com')) {
      return null
    }
    const path = url.pathname
    return (
      url.searchParams.get('v') ||
      (path.startsWith('/embed/') ? path.slice(7).split('/')[0] : '') ||
      (path.startsWith('/shorts/') ? path.slice(8).split('/')[0] : '') ||
      null
    )
  } catch {
    return null
  }
}

/** Empty string or a parsable YouTube URL (seller form + backend-normalized links). */
export function isYouTubeUrl(value: string): boolean {
  const v = value.trim()
  return v === '' || extractYouTubeVideoId(v) != null
}

export function toYouTubeEmbedSrc(
  raw: string,
  options?: { autoplay?: boolean },
): string | null {
  const id = extractYouTubeVideoId(raw)
  if (!id) return null
  const params = new URLSearchParams({ rel: '0' })
  if (options?.autoplay) params.set('autoplay', '1')
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params}`
}

export function toYouTubeThumbnailSrc(raw: string): string | null {
  const id = extractYouTubeVideoId(raw)
  return id
    ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`
    : null
}

export function findYouTubeUrlInText(text: string): string | null {
  for (const m of text.match(YOUTUBE_URL_RE) ?? []) {
    if (extractYouTubeVideoId(m)) return m
  }
  return null
}

export function stripYouTubeUrlsFromText(text: string): string {
  return text
    .replace(YOUTUBE_URL_RE, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Resolve description text + click-to-load embed assets for Preview Video. */
export function resolvePreviewVideo(description?: string, videoUrl?: string) {
  const raw = description?.trim() ?? ''
  const fromField = videoUrl?.trim() || null
  const fromText = fromField ? null : findYouTubeUrlInText(raw)
  const resolved = fromField || fromText
  return {
    displayText: fromText ? stripYouTubeUrlsFromText(raw) : raw,
    embedSrc: resolved ? toYouTubeEmbedSrc(resolved, { autoplay: true }) : null,
    thumbnailSrc: resolved ? toYouTubeThumbnailSrc(resolved) : null,
  }
}
