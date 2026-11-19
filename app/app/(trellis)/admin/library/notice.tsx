type SP = Record<string, string | string[] | undefined>

/** The line at the top of an editor page after a save. */
export function Saved({ sp }: { sp: SP }) {
  if (!sp.saved) return null
  return <div className="card" role="status"><p className="t-body">Saved.</p></div>
}

/** The problem a save came back with, if it failed. */
export function errorOf(sp: SP) {
  return typeof sp.error === 'string' ? sp.error : undefined
}
