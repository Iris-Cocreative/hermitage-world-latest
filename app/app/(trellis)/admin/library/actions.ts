'use server'

import { redirect } from 'next/navigation'
import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { deleteCollection, deleteResource, saveCollection, saveResource, saveTypes } from '@/vendor/collab-library/src/index.ts'

/**
 * The library's editor actions. Each checks that the person is staff, then
 * hands the form to the Collab Library, which writes as that person (row-level
 * security checks library_is_editor() again). A problem comes back to the form
 * as ?error=, in words an editor can act on.
 */

const back = (path: string, error: unknown) =>
  redirect(`${path}?error=${encodeURIComponent(error instanceof Error ? error.message : 'Something went wrong.')}`)

async function db(next: string) {
  await requireStaff(next)
  return createClient()
}

export async function createResource(form: FormData) {
  const supabase = await db('/admin/library/new/')
  let id: string
  try {
    id = await saveResource(supabase, null, form)
  } catch (e) {
    return back('/admin/library/new/', e)
  }
  redirect(`/admin/library/${id}/?saved=1`)
}

export async function updateResource(id: string, form: FormData) {
  const here = `/admin/library/${id}/`
  const supabase = await db(here)
  try {
    await saveResource(supabase, id, form)
  } catch (e) {
    return back(here, e)
  }
  redirect(`${here}?saved=1`)
}

export async function removeResource(id: string) {
  const supabase = await db(`/admin/library/${id}/`)
  try {
    await deleteResource(supabase, id)
  } catch (e) {
    return back(`/admin/library/${id}/`, e)
  }
  redirect('/admin/library/?deleted=1')
}

export async function createPath(form: FormData) {
  const supabase = await db('/admin/library/paths/new/')
  let id: string
  try {
    id = await saveCollection(supabase, null, form)
  } catch (e) {
    return back('/admin/library/paths/new/', e)
  }
  redirect(`/admin/library/paths/${id}/?saved=1`)
}

export async function updatePath(id: string, form: FormData) {
  const here = `/admin/library/paths/${id}/`
  const supabase = await db(here)
  try {
    await saveCollection(supabase, id, form)
  } catch (e) {
    return back(here, e)
  }
  redirect(`${here}?saved=1`)
}

export async function removePath(id: string) {
  const supabase = await db(`/admin/library/paths/${id}/`)
  try {
    await deleteCollection(supabase, id)
  } catch (e) {
    return back(`/admin/library/paths/${id}/`, e)
  }
  redirect('/admin/library/paths/?deleted=1')
}

export async function saveKinds(form: FormData) {
  const supabase = await db('/admin/library/kinds/')
  try {
    await saveTypes(supabase, form)
  } catch (e) {
    return back('/admin/library/kinds/', e)
  }
  redirect('/admin/library/kinds/?saved=1')
}
