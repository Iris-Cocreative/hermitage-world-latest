/** Money, dates and slugs, the few ways the app writes them. */

export function money(cents: number, currency = 'usd') {
  if (cents === 0) return 'Free'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100)
}

export function longDate(iso: string | null | undefined) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'America/Indiana/Indianapolis' }).format(new Date(iso))
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export const KINDS = ['track', 'album', 'book', 'video', 'program', 'bundle', 'other'] as const
export const STATUSES = ['draft', 'active', 'archived'] as const
export const FILE_KINDS = ['audio', 'video', 'pdf', 'image', 'other'] as const
export const POST_KINDS = ['post', 'letter', 'news', 'teaching'] as const
export const POST_STATUSES = ['draft', 'published'] as const

export const KIND_LABEL: Record<string, string> = {
  track: 'Recording', album: 'Album', book: 'Book', video: 'Video', program: 'Program', bundle: 'Set', other: 'Other',
}

export const POST_KIND_LABEL: Record<string, string> = {
  post: 'Post', letter: 'Weekly letter', news: 'News', teaching: 'Teaching',
}

/** Same-origin paths only, so ?next= can never send someone off the site. */
export function safeNext(raw: string | null | undefined, fallback = '/account/') {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : fallback
}
