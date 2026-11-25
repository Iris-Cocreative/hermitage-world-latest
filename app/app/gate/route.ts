import { NextResponse, type NextRequest } from 'next/server'
import { GATE_COOKIE, GATE_PATH, gateKey } from '@/lib/gate'
import { safeNext } from '@/lib/format'
import { requestOrigin } from '@/lib/site'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

function page(next: string, wrong: boolean) {
  return `<!DOCTYPE html>
<html lang="en" data-product="hermitage" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Hermitage World · Preview</title>
<link rel="icon" href="/assets/img/brand/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=Alegreya+Sans:wght@400;500&display=swap">
<link rel="stylesheet" href="/assets/vendor/trellis/core.css">
<link rel="stylesheet" href="/assets/css/hermitage.css">
</head>
<body>
<main class="frame" style="--frame-max: calc(var(--u) * 36)">
  <div class="section cc-band">
      <form class="card stack" method="post" action="${GATE_PATH}">
        <h1 class="t-h3">Hermitage World</h1>
        <p class="t-body u-text-secondary">This site is a preview until launch. Enter the password to see it.</p>
        <input type="hidden" name="next" value="${esc(next)}">
        <label class="field">
          <span class="field-label">Password</span>
          <input class="input" type="password" name="password" autocomplete="current-password" required autofocus>
          ${wrong ? '<span class="field-hint" role="alert">That password isn’t right.</span>' : ''}
        </label>
        <div class="cluster"><button class="button cc-primary" type="submit"><span class="button-label">Enter</span></button></div>
      </form>
  </div>
</main>
</body>
</html>`
}

const html = (body: string, status = 200) =>
  new NextResponse(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex', 'cache-control': 'no-store' } })

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams
  return html(page(safeNext(p.get('next'), '/'), p.has('wrong')))
}

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const next = safeNext(String(form.get('next') ?? ''), '/')
  const password = process.env.SITE_PASSWORD
  const origin = requestOrigin(request)
  if (!password) return NextResponse.redirect(new URL(next, origin), 303)
  if (String(form.get('password') ?? '') !== password) {
    return NextResponse.redirect(new URL(`${GATE_PATH}?${new URLSearchParams({ next, wrong: '1' })}`, origin), 303)
  }
  const res = NextResponse.redirect(new URL(next, origin), 303)
  res.cookies.set(GATE_COOKIE, await gateKey(password), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
    secure: origin.startsWith('https:'),
  })
  return res
}
