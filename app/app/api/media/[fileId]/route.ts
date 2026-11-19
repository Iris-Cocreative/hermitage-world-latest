import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requestOrigin } from '@/lib/site'

/**
 * Opens one file of a product the signed-in person owns. The row is read
 * under their own session, so row-level security does the entitlement
 * check (owners and staff read product_files); then the server signs a
 * one-hour URL into the private media bucket and redirects to it. An
 * <audio> element follows the redirect and streams with range requests.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL(`/sign-in/?next=${encodeURIComponent('/account/')}`, requestOrigin(request)))

  const { data: file } = await supabase.from('product_files').select('id, path, label').eq('id', fileId).maybeSingle()
  if (!file) return new NextResponse('Not found', { status: 404 })

  const download = request.nextUrl.searchParams.get('download') === '1'
  const ext = file.path.includes('.') ? file.path.slice(file.path.lastIndexOf('.')) : ''
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from('media').createSignedUrl(file.path, 3600, download ? { download: `${file.label}${ext}` } : undefined)
  if (error || !data) {
    console.error('media: could not sign', error)
    return new NextResponse('Unavailable', { status: 500 })
  }
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { 'Cache-Control': 'private, no-store' } })
}
