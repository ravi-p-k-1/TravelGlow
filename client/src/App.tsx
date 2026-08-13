import { useEffect, useState } from "react";

type HealthResponse = {
  status: "ok";
  service: string;
  database: "connected";
  timestamp: string;
};

type HealthState =
  | { kind: "loading" }
  | { kind: "ready"; data: HealthResponse }
  | { kind: "error" };

export function App() {
  const [health, setHealth] = useState<HealthState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function checkHealth() {
      try {
        const response = await fetch("/api/health", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Health check returned ${response.status}`);
        }

        const data = (await response.json()) as HealthResponse;
        setHealth({ kind: "ready", data });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHealth({ kind: "error" });
      }
    }

    void checkHealth();
    return () => controller.abort();
  }, []);

  return (
    <main className="page-shell">
      <nav className="nav" aria-label="Primary navigation">
        <a className="brand" href="/" aria-label="TravelGlow home">
          <span className="brand-mark" aria-hidden="true">TG</span>
          TravelGlow
        </a>
        <span className="phase-label">Hackathon MVP</span>
      </nav>

      <section className="hero">
        <div className="eyebrow">Travel-aware skin intelligence</div>
        <h1>Know what your skin may need before you travel.</h1>
        <p className="hero-copy">
          TravelGlow combines your current skin condition with destination
          weather to create a personalized travel skin forecast.
        </p>
        <button className="primary-action" type="button" disabled>
          Plan my skin trip
          <span aria-hidden="true">→</span>
        </button>
        <p className="coming-soon">Trip planning arrives in Phase 2.</p>
      </section>

      <section className="health-card" aria-live="polite">
        <div>
          <p className="card-label">Foundation status</p>
          <h2>
            {health.kind === "loading" && "Checking the TravelGlow stack…"}
            {health.kind === "ready" && "The TravelGlow stack is ready"}
            {health.kind === "error" && "The API is unavailable"}
          </h2>
          <p className="health-detail">
            {health.kind === "loading" && "Connecting to the backend and database."}
            {health.kind === "ready" &&
              `API online · PostgreSQL ${health.data.database}`}
            {health.kind === "error" &&
              "Start the backend and PostgreSQL, then refresh this page."}
          </p>
        </div>
        <span
          className={`status-dot status-dot--${health.kind}`}
          aria-hidden="true"
        />
      </section>
    </main>
  );
}
