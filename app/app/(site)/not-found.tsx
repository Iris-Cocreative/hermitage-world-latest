import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="section" data-room="dark">
      <div className="container container--narrow stack stack--lg">
        <h1 className="t-h2">This door leads nowhere, yet.</h1>
        <p className="t-lede">The page you were looking for isn&rsquo;t here. The map behind the sun button lists every room of the site.</p>
        <div className="cluster">
          <a className="btn btn--solid" href="/">Home</a>
          <Link className="btn" href="/shop/">The shop</Link>
        </div>
      </div>
    </section>
  )
}
