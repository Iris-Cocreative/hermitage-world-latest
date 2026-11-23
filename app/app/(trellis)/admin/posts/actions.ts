'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { freeSlug, POST_KINDS, POST_STATUSES, slugify } from '@/lib/format'


type Kind = (typeof POST_KINDS)[number]
type Status = (typeof POST_STATUSES)[number]

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? '').trim()
}
function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}
function back(id: string, q: string) {
  redirect(`/admin/posts/${id}/?${q}`)
}

export async function createPost(formData: FormData) {
  const viewer = await requireStaff('/admin/posts/new/')
  const title = str(formData, 'title')
  if (!title) redirect('/admin/posts/new/?error=A+title+is+needed')
  const supabase = await createClient()
  // Only a title is needed: the address is made from it and kept free.
  const slug = await freeSlug(str(formData, 'slug') || title, async (s) => {
    const { count } = await supabase.from('posts').select('id', { count: 'exact', head: true }).eq('slug', s)
    return (count ?? 0) > 0
  })
  const { data, error } = await supabase
    .from('posts')
    .insert({ title, slug, kind: pick<Kind>(str(formData, 'kind'), POST_KINDS, 'post'), author_id: viewer.user.id })
    .select('id')
    .single()
  if (error || !data) redirect(`/admin/posts/new/?error=${encodeURIComponent(error?.message ?? 'Could not save')}`)
  revalidatePath('/admin/posts/')
  back(data.id, 'saved=1')
}

export async function updatePost(formData: FormData) {
  const id = str(formData, 'id')
  await requireStaff(`/admin/posts/${id}/`)
  const title = str(formData, 'title')
  if (!title) back(id, 'error=A+title+is+needed')
  const status = pick<Status>(str(formData, 'status'), POST_STATUSES, 'draft')
  const dateText = str(formData, 'published_at')
  const supabase = await createClient()
  const { data: current } = await supabase.from('posts').select('published_at').eq('id', id).maybeSingle()
  // A date typed in wins; otherwise publishing stamps now, once.
  const published_at = dateText ? new Date(dateText).toISOString() : status === 'published' ? current?.published_at ?? new Date().toISOString() : current?.published_at ?? null
  const { error } = await supabase
    .from('posts')
    .update({
      title,
      slug: slugify(str(formData, 'slug') || title),
      kind: pick<Kind>(str(formData, 'kind'), POST_KINDS, 'post'),
      status,
      excerpt: str(formData, 'excerpt'),
      body: String(formData.get('body') ?? ''),
      published_at,
    })
    .eq('id', id)
  if (error) back(id, `error=${encodeURIComponent(error.message)}`)
  revalidatePath('/posts/')
  revalidatePath('/admin/posts/')
  back(id, 'saved=1')
}

export async function deletePost(formData: FormData) {
  const id = str(formData, 'id')
  await requireStaff(`/admin/posts/${id}/`)
  const supabase = await createClient()
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) back(id, `error=${encodeURIComponent(error.message)}`)
  revalidatePath('/posts/')
  revalidatePath('/admin/posts/')
  redirect('/admin/posts/?deleted=1')
}

export async function setPostCover(postId: string, path: string) {
  await requireStaff(`/admin/posts/${postId}/`)
  const supabase = await createClient()
  const { error } = await supabase.from('posts').update({ cover_path: path }).eq('id', postId)
  if (error) throw new Error(error.message)
  revalidatePath('/posts/')
  revalidatePath(`/admin/posts/${postId}/`)
}
