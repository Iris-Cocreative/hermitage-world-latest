/** A product's, post's or order's status, as a small tag: on sale and paid in the success color. */
const LABEL: Record<string, string> = {
  active: 'On sale', draft: 'Draft', archived: 'Archived', published: 'Published',
  pending: 'Not completed', paid: 'Paid', failed: 'Failed', refunded: 'Refunded', canceled: 'Canceled',
}
const KIND: Record<string, string> = { active: ' cc-ok', published: ' cc-ok', paid: ' cc-ok', failed: ' cc-alert', refunded: ' cc-warn', archived: ' cc-outline', canceled: ' cc-outline' }

export function StatusTag({ status }: { status: string }) {
  return <span className={`tag cc-sm${KIND[status] ?? ''}`}><span className="tag-label">{LABEL[status] ?? status}</span></span>
}
