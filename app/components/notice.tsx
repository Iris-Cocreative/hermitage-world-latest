/** A short message at the top of a page: saved, sent, denied, failed. */
export function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <p className="note" role="status" style={tone === 'warn' ? { borderLeftColor: 'var(--glass-madder)' } : undefined}>
      <span>{children}</span>
    </p>
  )
}
