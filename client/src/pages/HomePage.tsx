import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="eyebrow">Travel-aware skin intelligence</div>
        <h1>Know what your skin may need before you travel.</h1>
        <p className="hero-copy">
          Compare your current skin condition with the climate at your next
          destination, then get a personalized preparation plan.
        </p>
        <Link className="primary-action" to="/trips/new">
          Plan my skin trip <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="process-card" aria-label="How TravelGlow works">
        <div className="process-step">
          <span>01</span>
          <strong>Tell us where</strong>
          <p>Add your home, destination, and travel dates.</p>
        </div>
        <div className="process-step">
          <span>02</span>
          <strong>Scan your skin</strong>
          <p>Understand your current skin condition before departure.</p>
        </div>
        <div className="process-step">
          <span>03</span>
          <strong>Prepare with confidence</strong>
          <p>Receive your travel skin forecast, packing plan, and curated product matches.</p>
        </div>
      </section>
    </main>
  );
}
