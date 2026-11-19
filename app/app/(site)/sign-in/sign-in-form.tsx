'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Sign in by email link first (no password to remember, for an audience of
 * 35 to 65 and up). A password is there for staff and anyone who prefers one.
 * The link comes back to /auth/confirm, which opens the session and goes on
 * to `next`.
 */
export function SignInForm({ next, email: initialEmail, error: initialError, expired }: {
  next: string; email: string | null; error: string | null; expired: boolean
}) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail ?? '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(expired ? null : initialError)

  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/confirm/?next=${encodeURIComponent(next)}` : undefined

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return setError('Enter your email address first.')
    setBusy(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function withPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return setError('Enter your email and password.')
    setBusy(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setBusy(false); setError(error.message === 'Invalid login credentials' ? 'That email and password don’t match.' : error.message); return }
    router.push(next)
    router.refresh()
  }

  if (sent) {
    return (
      <div className="card card--lg stack">
        <h1 className="t-h3">Check your inbox.</h1>
        <p>We sent a sign-in link to <strong>{email}</strong>. Open it on this device and you&rsquo;re in. It works once and for an hour.</p>
        <p className="form-note">Nothing arrived? Look in spam, or <button className="link" type="button" onClick={() => setSent(false)}>try again</button>.</p>
      </div>
    )
  }

  return (
    <div className="card card--lg">
      <h1 className="t-h3">Sign in</h1>
      <p className="t-muted">Enter your email and we&rsquo;ll send you a link. No password to remember.</p>
      {expired && <p className="note"><span>That link has expired or was already used. Ask for a fresh one below.</span></p>}
      {error && <p className="note" role="alert" style={{ borderLeftColor: 'var(--glass-madder)' }}><span>{error}</span></p>}

      <form className="stack stack--sm" onSubmit={sendLink}>
        <div className="field">
          <label className="field__label" htmlFor="si-email">Email</label>
          <input className="input" id="si-email" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="btn btn--solid" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
      </form>

      <details>
        <summary>Have a password? Sign in with it</summary>
        <form className="stack stack--sm mt-sm" onSubmit={withPassword}>
          <div className="field">
            <label className="field__label" htmlFor="si-password">Password</label>
            <input className="input" id="si-password" type="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn" type="submit" disabled={busy}>Sign in</button>
        </form>
      </details>
    </div>
  )
}
