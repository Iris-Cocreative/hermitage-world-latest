export default function NotFound() {
  return (
    <div className="frame hw-page">
      <div className="stack hw-page-head">
        <h1 className="t-h2">This door leads nowhere, yet.</h1>
        <p className="t-lg u-text-secondary hw-measure">The page you were looking for isn’t here. The map behind the menu lists every room of the site.</p>
        <div className="cluster">
          <a className="button cc-primary" href="/"><span className="button-label">Home</span></a>
          <a className="button" href="/library/"><span className="button-label">The Library</span></a>
        </div>
      </div>
    </div>
  )
}
