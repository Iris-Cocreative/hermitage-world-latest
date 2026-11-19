/**
 * Makes (or updates) a person and gives them a role, using the server key.
 *
 *   node scripts/make-staff.mjs <email> [password] [--role admin|staff|member]
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local
 * (or the environment). With a password the person can sign in with it;
 * without one they sign in by email link. Default role: admin.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, '../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const args = process.argv.slice(2);
const roleIdx = args.indexOf('--role');
const role = roleIdx >= 0 ? args.splice(roleIdx, 2)[1] : 'admin';
const [email, password] = args;

if (!email || !['admin', 'staff', 'member'].includes(role)) {
  console.error('usage: node scripts/make-staff.mjs <email> [password] [--role admin|staff|member]');
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are needed (see .env.example).');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: existing, error: lookupError } = await admin.from('profiles').select('id').ilike('email', email).maybeSingle();
if (lookupError) throw lookupError;

let id = existing?.id;
if (id) {
  if (password) {
    const { error } = await admin.auth.admin.updateUserById(id, { password, email_confirm: true });
    if (error) throw error;
  }
} else {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  id = data.user.id;
}

const { error: roleError } = await admin.from('profiles').update({ role }).eq('id', id);
if (roleError) throw roleError;

console.log(`${email} is now ${role}${password ? ' (password set)' : ' (signs in by email link)'}.`);
