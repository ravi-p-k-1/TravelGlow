import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTripEnvironment } from "../api/environment";
import { generateSkinForecast, getSkinForecast, SkinForecastApiError } from "../api/skinForecast";
import { getTrip } from "../api/trips";
import type { TripEnvironment } from "../types/environment";
import type { SkinForecast, SkinConcernForecast } from "../types/skinForecast";
import type { Trip } from "../types/trip";

type PageState =
  | { status: "loading" }
  | { status: "ready"; trip: Trip; environment: TripEnvironment; forecast?: SkinForecast }
  | { status: "error"; message: string };

function signed(value: number | undefined, suffix: string): string {
  if (value === undefined) return "—";
  return `${value > 0 ? "+" : ""}${Math.round(value)}${suffix}`;
}

function ConcernCard({ concern }: { concern: SkinConcernForecast }) {
  return (
    <article className={`concern-card concern-card--${concern.level}`}>
      <header><div><span className="concern-kicker">Personalized concern</span><h3>{concern.concern}</h3></div><span className="risk-badge">{concern.level} priority</span></header>
      <div className="concern-body"><div><strong>Why it may matter</strong><ul>{concern.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul></div><div><strong>Prepare with</strong><ul>{concern.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul></div></div>
    </article>
  );
}

export function ForecastPage() {
  const { tripId = "" } = useParams();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getTrip(tripId, controller.signal),
      getTripEnvironment(tripId, controller.signal),
      getSkinForecast(tripId, controller.signal).catch((error: unknown) => {
        if (error instanceof SkinForecastApiError && error.status === 404) return undefined;
        throw error;
      }),
    ]).then(([trip, environment, forecast]) => setState({ status: "ready", trip, environment, forecast }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error", message: error instanceof Error ? error.message : "The forecast is unavailable." });
      });
    return () => controller.abort();
  }, [tripId]);

  async function handleGenerate() {
    if (state.status !== "ready") return;
    setIsGenerating(true); setGenerationError(null);
    try { setState({ ...state, forecast: await generateSkinForecast(tripId) }); }
    catch (error) { setGenerationError(error instanceof Error ? error.message : "The forecast could not be generated."); }
    finally { setIsGenerating(false); }
  }

  if (state.status === "loading") return <main className="state-page"><p>Preparing your forecast…</p></main>;
  if (state.status === "error") return <main className="state-page"><div className="eyebrow">Forecast unavailable</div><h1>{state.message}</h1><Link className="primary-action" to={`/trips/${tripId}`}>Return to trip</Link></main>;

  const { trip, environment, forecast } = state;
  return (
    <main className="forecast-page">
      <Link className="back-link" to={`/trips/${tripId}/skin-scan`}>← Back to skin scan</Link>
      <section className="forecast-hero">
        <div><div className="eyebrow">Travel Skin Forecast</div><h1>Your skin outlook for {trip.destination}</h1><p>Deterministic guidance based on your current skin snapshot and the environmental shift from {trip.currentLocation}.</p></div>
        <div className="destination-weather"><span>Destination snapshot</span><strong>{Math.round(environment.destination.temperatureF ?? 0)}°F</strong><small>{Math.round(environment.destination.humidity ?? 0)}% humidity · UV {environment.destination.uvIndex ?? "—"}</small></div>
      </section>
      <section className="forecast-comparison">
        <div><span>Temperature shift</span><strong>{signed(environment.comparison.temperatureChangeF, "°F")}</strong></div>
        <div><span>Humidity shift</span><strong>{signed(environment.comparison.humidityChange, "%")}</strong></div>
        <div><span>UV shift</span><strong>{signed(environment.comparison.uvChange, "")}</strong></div>
      </section>

      {!forecast ? (
        <section className="forecast-generate"><div className="weather-orb" aria-hidden="true">✦</div><div><div className="eyebrow">Inputs ready</div><h2>Build your personalized outlook.</h2><p>The Travel Skin Engine will apply transparent rules to your saved scores and conditions. It does not diagnose medical conditions.</p></div><button className="submit-action" type="button" onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? "Building forecast…" : "Generate my forecast"} →</button>{generationError && <div className="form-alert" role="alert">{generationError}</div>}</section>
      ) : (
        <>
          <section className="forecast-heading"><div><div className="eyebrow">Personalized outlook</div><h2>What may need your attention</h2></div><span>{forecast.concerns.length} priorities · Engine v{forecast.engineVersion}</span></section>
          <section className="concern-list">{forecast.concerns.length > 0 ? forecast.concerns.map((concern) => <ConcernCard concern={concern} key={concern.id} />) : <div className="forecast-clear"><strong>No elevated travel concerns identified.</strong><p>Continue your usual gentle skincare and daily sun protection.</p></div>}</section>
          <p className="forecast-disclaimer">This forecast uses cautious, possibility-based guidance and is not a medical diagnosis. Consult a dermatologist for severe or persistent concerns.</p>
          <section className="next-phase"><div><span>Coming next</span><strong>Friendly forecast summary</strong><p>Gemini will explain only these deterministic findings in accessible language.</p></div><button className="submit-action" type="button" disabled>Generate explanation →</button></section>
        </>
      )}
    </main>
  );
}
