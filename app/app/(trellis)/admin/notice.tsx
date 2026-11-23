type SP = Record<string, string | string[] | undefined>

/** A short message at the top of an admin page: saved, deleted, or what went wrong. */
export function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warn' }) {
  return tone === 'warn'
    ? <div className="card hw-admin-alert" role="alert"><p className="t-body">{children}</p></div>
    : <div className="card" role="status"><p className="t-body">{children}</p></div>
}

/** The line at the top of an editor page after a save. */
export function Saved({ sp }: { sp: SP }) {
  if (!sp.saved) return null
  return <Notice>Saved.</Notice>
}

/** The problem a save came back with, if it failed. */
export function errorOf(sp: SP) {
  return typeof sp.error === 'string' ? sp.error : undefined
}
