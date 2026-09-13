import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <p className="eyebrow">Error / 404</p>
      <h1 id="not-found-title">That page is not here.</h1>
      <p className="lede">
        The link may be out of date, or the item may have moved. Return to the stock overview to
        continue.
      </p>
      <Link className="button button-primary" to="/">
        Back to stock overview
      </Link>
    </section>
  )
}
