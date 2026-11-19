import MarkdownIt from 'markdown-it'

/**
 * Markdown for product descriptions and posts. Raw HTML is off, so a
 * description can never carry a script; links open in place.
 */
const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: false })

export function renderMarkdown(source: string): string {
  return md.render(source ?? '')
}
