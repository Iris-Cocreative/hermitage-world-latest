import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getViewer } from '@/lib/auth'
import { safeNext } from '@/lib/format'
import { SignInForm } from './sign-in-form'

export const metadata: Metadata = { title: 'Sign in' }

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] ?? null : v ?? null
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const next = safeNext(one(sp.next))
  const viewer = await getViewer()
  if (viewer) redirect(next)
  return (
    <section className="section" data-room="dark">
      <div className="container sign-in">
        <SignInForm next={next} email={one(sp.email)} error={one(sp.error)} expired={one(sp.code) === 'expired_link'} />
      </div>
    </section>
  )
}
