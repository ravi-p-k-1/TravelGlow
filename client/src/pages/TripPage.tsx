import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  EnvironmentApiError,
  generateTripEnvironment,
  getTripEnvironment,
} from "../api/environment";
import { getTrip } from "../api/trips";
import type { EnvironmentData, TripEnvironment } from "../types/environment";
import type { Trip } from "../types/trip";

type PageState =
  | { status: "loading" }
  | { status: "ready"; trip: Trip; environment?: TripEnvironment }
  | { status: "error" };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function metric(value: number | undefined, suffix: string): string {
  return value === undefined ? "—" : `${Math.round(value)}${suffix}`;
}

function delta(value: number | undefined, suffix: string): string {
  if (value === undefined) return "Not available";
  const sign = value > 0 ? "+" : "";
  return `${sign}${Math.round(value)}${suffix}`;
}

function comparisonPhrase(value: number | undefined, kind: "temperature" | "humidity" | "uv") {
  if (value === undefined) return "Comparison unavailable";
  if (Math.abs(value) < 1) return `Similar ${kind}`;
  if (kind === "temperature") return value > 0 ? "Warmer" : "Cooler";
  if (kind === "humidity") return value > 0 ? "More humid" : "Drier";
  return value > 0 ? "Higher UV" : "Lower UV";
}

function ConditionsCard({ title, data }: { title: string; data: EnvironmentData }) {
  return (
    <article className="conditions-card">
      <div className="conditions-heading">
        <div><span>{title}</span><h3>{data.location}</h3></div>
        <strong>{metric(data.temperatureF, "°")}</strong>
      </div>
      <p className="weather-condition">{data.condition ?? "Conditions unavailable"}</p>
      <div className="weather-metrics">
        <div><span>Humidity</span><strong>{metric(data.humidity, "%")}</strong></div>
        <div><span>UV index</span><strong>{metric(data.uvIndex, "")}</strong></div>
        <div><span>Precipitation</span><strong>{metric(data.precipitationChance, "%")}</strong></div>
      </div>
    </article>
  );
}

export function TripPage() {
  const { tripId = "" } = useParams();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getTrip(tripId, controller.signal),
      getTripEnvironment(tripId, controller.signal).catch((error: unknown) => {
        if (error instanceof EnvironmentApiError && error.status === 404) return undefined;
        throw error;
      }),
    ])
      .then(([trip, environment]) => setState({ status: "ready", trip, environment }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [tripId]);

  async function handleGenerate() {
    if (state.status !== "ready") return;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const environment = await generateTripEnvironment(tripId);
      setState({ ...state, environment });
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "Destination conditions could not be retrieved.",
      );
    } finally { setIsGenerating(false); }
  }

  if (state.status === "loading") return <main className="state-page"><p>Loading your trip…</p></main>;
  if (state.status === "error") {
    return <main className="state-page"><div className="eyebrow">Trip unavailable</div><h1>We couldn’t find that trip.</h1><Link className="primary-action" to="/trips/new">Create a new trip</Link></main>;
  }

  const { trip, environment } = state;
  return (
    <main className="trip-page">
      <section className="trip-summary">
        <div><div className="eyebrow">Your saved trip</div><h1>{trip.destination}</h1></div>
        <div className="trip-route-summary">
          <span>{trip.currentLocation}</span><span aria-hidden="true">→</span><strong>{trip.destination}</strong>
          <small>{formatDate(trip.departureDate)} – {formatDate(trip.returnDate)}</small>
        </div>
      </section>

      {!environment ? (
        <section className="environment-empty">
          <div className="weather-orb" aria-hidden="true">☀</div>
          <div><div className="eyebrow">Destination environment</div><h2>See how the climates compare.</h2><p>We’ll capture current conditions at home and at your destination, then calculate the differences that may matter to your skin.</p></div>
          <button className="submit-action" type="button" onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? "Checking conditions…" : "Compare environments"}<span aria-hidden="true">→</span></button>
          {generationError && <div className="form-alert" role="alert">{generationError}</div>}
        </section>
      ) : (
        <section className="environment-results">
          <div className="section-heading"><div><div className="eyebrow">Current conditions snapshot</div><h2>From home climate to destination climate</h2></div><span className="saved-badge">Saved</span></div>
          <div className="conditions-grid"><ConditionsCard title="At home" data={environment.current} /><ConditionsCard title="At destination" data={environment.destination} /></div>
          <div className="comparison-strip">
            <div><span>Temperature</span><strong>{delta(environment.comparison.temperatureChangeF, "°F")}</strong><small>{comparisonPhrase(environment.comparison.temperatureChangeF, "temperature")}</small></div>
            <div><span>Humidity</span><strong>{delta(environment.comparison.humidityChange, "%")}</strong><small>{comparisonPhrase(environment.comparison.humidityChange, "humidity")}</small></div>
            <div><span>UV exposure</span><strong>{delta(environment.comparison.uvChange, "")}</strong><small>{comparisonPhrase(environment.comparison.uvChange, "uv")}</small></div>
          </div>
          <p className="snapshot-note">Conditions were captured {new Date(environment.destination.fetchedAt).toLocaleString()}. Refreshing this page uses the saved snapshot without calling the weather provider again.</p>
          <div className="next-phase"><div><span>Next step</span><strong>Add your skin analysis</strong><p>We’ll combine these environmental differences with your current skin condition.</p></div><button className="submit-action" type="button" disabled>Continue to skin scan →</button></div>
        </section>
      )}
    </main>
  );
}
