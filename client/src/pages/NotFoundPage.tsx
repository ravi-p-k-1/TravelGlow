import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="state-page not-found-page">
      <div className="error-orb" aria-hidden="true">404</div>
      <div className="eyebrow">Route not found</div>
      <h1>This journey isn’t on the map.</h1>
      <p>The page may have moved, or the address may be incomplete.</p>
      <Link className="primary-action" to="/">Return to TravelGlow</Link>
    </main>
  );
}
