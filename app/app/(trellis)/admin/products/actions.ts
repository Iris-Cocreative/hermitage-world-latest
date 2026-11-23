'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { FILE_KINDS, freeSlug, KINDS, slugify, STATUSES } from '@/lib/format'
import type { Json } from '@/lib/supabase/database.types'

/**
 * Staff actions on products. Each runs as the signed-in staff member, so the
 * database's own policies (products: staff write) are the real gate; the
 * requireStaff() call only gives a kinder redirect.
 */


type Kind = (typeof KINDS)[number]
type Status = (typeof STATUSES)[number]
type FileKind = (typeof FILE_KINDS)[number]

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? '').trim()
}
function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}
function dollarsToCents(s: string) {
  const n = Number(s.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0
}
function back(id: string, q: string) {
  redirect(`/admin/products/${id}/?${q}`)
}

export async function createProduct(formData: FormData) {
  await requireStaff('/admin/products/new/')
  const title = str(formData, 'title')
  if (!title) redirect('/admin/products/new/?error=A+title+is+needed')
  const supabase = await createClient()
  // Only a title is needed: the address is made from it, and kept free of
  // any other product's (a second "Test" becomes test-2, not an error).
  const slug = await freeSlug(str(formData, 'slug') || title, async (s) => {
    const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('slug', s)
    return (count ?? 0) > 0
  })
  const { data, error } = await supabase
    .from('products')
    .insert({
      title,
      slug,
      kind: pick<Kind>(str(formData, 'kind'), KINDS, 'other'),
      price_cents: dollarsToCents(str(formData, 'price')),
    })
    .select('id')
    .single()
  if (error || !data) redirect(`/admin/products/new/?error=${encodeURIComponent(error?.message ?? 'Could not save')}`)
  revalidatePath('/admin/products/')
  back(data.id, 'saved=1')
}

export async function updateProduct(formData: FormData) {
  const id = str(formData, 'id')
  await requireStaff(`/admin/products/${id}/`)
  const title = str(formData, 'title')
  if (!title) back(id, 'error=A+title+is+needed')

  let meta: Json | undefined
  const metaText = str(formData, 'meta')
  if (metaText) {
    try {
      const parsed = JSON.parse(metaText)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) meta = parsed as Json
      else back(id, 'error=Details+must+be+a+JSON+object')
    } catch {
      back(id, 'error=Details+are+not+valid+JSON')
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({
      title,
      slug: slugify(str(formData, 'slug') || title),
      kind: pick<Kind>(str(formData, 'kind'), KINDS, 'other'),
      status: pick<Status>(str(formData, 'status'), STATUSES, 'draft'),
      subtitle: str(formData, 'subtitle'),
      description: String(formData.get('description') ?? ''),
      price_cents: dollarsToCents(str(formData, 'price')),
      sort: Number.parseInt(str(formData, 'sort'), 10) || 0,
      ...(meta ? { meta } : {}),
    })
    .eq('id', id)
  if (error) back(id, `error=${encodeURIComponent(error.message)}`)
  revalidatePath('/shop/')
  revalidatePath('/admin/products/')
  back(id, 'saved=1')
}

export async function deleteProduct(formData: FormData) {
  const id = str(formData, 'id')
  await requireStaff(`/admin/products/${id}/`)
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) back(id, `error=${encodeURIComponent(error.message)}`)
  revalidatePath('/shop/')
  revalidatePath('/admin/products/')
  redirect('/admin/products/?deleted=1')
}

/** Called by the cover uploader once the image is in the covers bucket. */
export async function setCover(productId: string, path: string) {
  await requireStaff(`/admin/products/${productId}/`)
  const supabase = await createClient()
  const { error } = await supabase.from('products').update({ cover_path: path }).eq('id', productId)
  if (error) throw new Error(error.message)
  revalidatePath('/shop/')
  revalidatePath(`/admin/products/${productId}/`)
}

/** Called by the files uploader once a file is in the media bucket. */
export async function attachFile(productId: string, path: string, file: { name: string; size: number; type: string }) {
  await requireStaff(`/admin/products/${productId}/`)
  const kind: FileKind = file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'pdf' : file.type.startsWith('image/') ? 'image' : 'other'
  const label = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim() || file.name
  const supabase = await createClient()
  const { count } = await supabase.from('product_files').select('id', { count: 'exact', head: true }).eq('product_id', productId)
  const { error } = await supabase.from('product_files').insert({ product_id: productId, path, label, kind, size_bytes: file.size, sort: count ?? 0 })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/products/${productId}/`)
}

export async function updateFile(formData: FormData) {
  const id = str(formData, 'id')
  const productId = str(formData, 'product_id')
  await requireStaff(`/admin/products/${productId}/`)
  const supabase = await createClient()
  const minutes = Number(str(formData, 'minutes'))
  const { error } = await supabase
    .from('product_files')
    .update({
      label: str(formData, 'label') || 'Untitled',
      kind: pick<FileKind>(str(formData, 'kind'), FILE_KINDS, 'other'),
      sort: Number.parseInt(str(formData, 'sort'), 10) || 0,
      duration_seconds: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : null,
    })
    .eq('id', id)
  if (error) back(productId, `error=${encodeURIComponent(error.message)}`)
  back(productId, 'saved=1')
}

export async function removeFile(formData: FormData) {
  const id = str(formData, 'id')
  const productId = str(formData, 'product_id')
  await requireStaff(`/admin/products/${productId}/`)
  const supabase = await createClient()
  const { data: file } = await supabase.from('product_files').select('path').eq('id', id).maybeSingle()
  if (file) {
    await supabase.storage.from('media').remove([file.path])
    const { error } = await supabase.from('product_files').delete().eq('id', id)
    if (error) back(productId, `error=${encodeURIComponent(error.message)}`)
  }
  back(productId, 'saved=1')
}
