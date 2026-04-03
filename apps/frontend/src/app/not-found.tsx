import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="shell page-section">
      <div className="panel error-panel">
        <p className="eyebrow">Missing page</p>
        <h1 className="section-heading">This travel page does not exist.</h1>
        <p className="muted-copy">
          The offer may have been removed or the link may be incorrect.
        </p>
        <Link className="button button-primary" href="/offers">
          Browse offers
        </Link>
      </div>
    </div>
  );
}
