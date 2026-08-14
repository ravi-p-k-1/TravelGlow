import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTripEnvironment } from "../api/environment";
import {
  generateSkinForecast,
} from "../api/skinForecast";
import { getTrip } from "../api/trips";
import type { EnvironmentData, TripEnvironment } from "../types/environment";
import type {
  ConcernLevel,
  SkinConcernForecast,
  SkinForecast,
} from "../types/skinForecast";
import type { Trip } from "../types/trip";

type PageState =
  | { status: "loading"; message: string }
  | { status: "ready"; trip: Trip; environment: TripEnvironment; forecast: SkinForecast }
  | { status: "error"; message: string };

const possibleEffects: Record<string, string> = {
  "uv-protection": "Higher UV exposure may make consistent sun protection more important throughout your trip.",
  oiliness: "Your skin may feel oilier, while humidity and perspiration could contribute to a heavier or more congested feel.",
  hydration: "Lower humidity may leave your skin feeling tighter or less comfortable than it does at home.",
  "heat-congestion": "Warmer conditions may increase perspiration and could make oiliness or congestion feel more noticeable.",
  "barrier-dryness": "A colder, drier environment may make your skin feel less comfortable and increase the need for barrier support.",
};

const priorityOrder: Record<ConcernLevel, number> = { high: 3, moderate: 2, low: 1 };

function signed(value: number | undefined, suffix: string): string {
  if (value === undefined) return "Not available";
  return `${value > 0 ? "+" : ""}${Math.round(value)}${suffix}`;
}

function metric(value: number | undefined, suffix: string): string {
  return value === undefined ? "—" : `${Math.round(value)}${suffix}`;
}

function formatTripDates(departureDate: string, returnDate: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", timeZone: "UTC",
  });
  return `${formatter.format(new Date(`${departureDate}T00:00:00Z`))} – ${formatter.format(new Date(`${returnDate}T00:00:00Z`))}`;
}

function comparisonDescription(
  value: number | undefined,
  positive: string,
  negative: string,
  similar: string,
): string {
  if (value === undefined) return "Comparison unavailable";
  if (Math.abs(value) < 1) return similar;
  return value > 0 ? positive : negative;
}

function weatherSymbol(condition: string | undefined): string {
  const normalized = condition?.toLowerCase() ?? "";
  if (normalized.includes("rain") || normalized.includes("drizzle")) return "☂";
  if (normalized.includes("cloud") || normalized.includes("overcast")) return "☁";
  if (normalized.includes("snow")) return "❄";
  return "☀";
}

function buildHeadline(concerns: SkinConcernForecast[]): string {
  const high = concerns.filter((concern) => concern.level === "high");
  const focus = (high.length > 0 ? high : concerns)
    .slice(0, 2)
    .map((concern) => concern.concern.toLowerCase());
  if (focus.length === 0) return "Your usual routine travels well.";
  if (focus.length === 1) return `Make ${focus[0]} your travel priority.`;
  return `Prepare for ${focus[0]} and ${focus[1]}.`;
}

function EnvironmentCard({ label, data }: { label: string; data: EnvironmentData }) {
  return (
    <article className="forecast-environment-card">
      <header>
        <div><span>{label}</span><strong>{data.location}</strong></div>
        <i aria-hidden="true">{weatherSymbol(data.condition)}</i>
      </header>
      <div className="forecast-environment-metrics">
        <strong>{metric(data.temperatureF, "°F")}</strong>
        <span>{metric(data.humidity, "%")} humidity</span>
        <span>UV {metric(data.uvIndex, "")}</span>
      </div>
      <p>{data.condition ?? "Conditions unavailable"}</p>
    </article>
  );
}

function ConcernCard({ concern, index, explanation }: { concern: SkinConcernForecast; index: number; explanation?: string }) {
  return (
    <article className={`concern-card concern-card--${concern.level}`}>
      <header>
        <span className="concern-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div className="concern-title"><span className="concern-kicker">Personalized concern</span><h3>{concern.concern}</h3></div>
        <span className="risk-badge">{concern.level} priority</span>
      </header>
      <div className="concern-body">
        <section><strong>Why this was flagged</strong><ul>{concern.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul></section>
        <section className="possible-effect"><strong>What you may notice</strong><p>{explanation ?? possibleEffects[concern.id] ?? "The destination environment may make this concern more noticeable during your trip."}</p></section>
        <section className="prepare-list"><strong>Prepare with</strong><ul>{concern.recommendations.map((recommendation) => <li key={recommendation}><span aria-hidden="true">✓</span>{recommendation}</li>)}</ul></section>
      </div>
    </article>
  );
}

function ForecastLoading({ message }: { message: string }) {
  return (
    <main className="forecast-loading" aria-live="polite">
      <div className="forecast-loader" aria-hidden="true"><span /><span /><span /></div>
      <div className="eyebrow">Travel Skin Engine</div>
      <h1>{message}</h1>
      <p>Combining your saved skin snapshot with destination conditions.</p>
    </main>
  );
}

export function ForecastPage() {
  const { tripId = "" } = useParams();
  const [state, setState] = useState<PageState>({ status: "loading", message: "Preparing your forecast…" });

  useEffect(() => {
    const controller = new AbortController();
    async function loadForecast() {
      try {
        const [trip, environment] = await Promise.all([
          getTrip(tripId, controller.signal),
          getTripEnvironment(tripId, controller.signal),
        ]);
        setState({ status: "loading", message: "Building your personalized outlook…" });
        const forecast = await generateSkinForecast(tripId);
        setState({ status: "ready", trip, environment, forecast });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error", message: error instanceof Error ? error.message : "The forecast is temporarily unavailable." });
      }
    }
    void loadForecast();
    return () => controller.abort();
  }, [tripId]);

  if (state.status === "loading") return <ForecastLoading message={state.message} />;
  if (state.status === "error") {
    return (
      <main className="forecast-error state-page">
        <div className="error-orb" aria-hidden="true">!</div>
        <div className="eyebrow">Forecast unavailable</div>
        <h1>We couldn’t prepare this outlook.</h1>
        <p>{state.message}</p>
        <div className="error-actions"><button className="primary-action" type="button" onClick={() => window.location.reload()}>Try again</button><Link className="text-action" to={`/trips/${tripId}`}>Return to trip</Link></div>
      </main>
    );
  }

  const { trip, environment, forecast } = state;
  const concerns = [...forecast.concerns].sort((a, b) => priorityOrder[b.level] - priorityOrder[a.level]);
  const highCount = concerns.filter((concern) => concern.level === "high").length;
  const moderateCount = concerns.filter((concern) => concern.level === "moderate").length;
  const explanationByConcern = new Map(
    forecast.explanation?.concerns.map((item) => [item.concernId, item.explanation]) ?? [],
  );

  return (
    <main className="forecast-page">
      <div className="forecast-topbar">
        <Link className="back-link" to={`/trips/${tripId}/skin-scan`}>← Back to skin scan</Link>
        <span>{formatTripDates(trip.departureDate, trip.returnDate)} · Engine v{forecast.engineVersion}</span>
      </div>

      <section className="forecast-hero">
        <div className="forecast-hero-copy">
          <div className="eyebrow">Your Travel Skin Forecast</div>
          <h1>{buildHeadline(concerns)}</h1>
          <p>Here’s how the shift from <strong>{trip.currentLocation}</strong> to <strong>{trip.destination}</strong> may interact with your current skin snapshot.</p>
          <div className="forecast-priority-summary" aria-label="Forecast priority summary">
            <div><strong>{highCount}</strong><span>High</span></div>
            <div><strong>{moderateCount}</strong><span>Moderate</span></div>
            <div><strong>{concerns.length}</strong><span>Total priorities</span></div>
          </div>
        </div>
        <aside className="destination-spotlight">
          <div className="destination-spotlight-symbol" aria-hidden="true">{weatherSymbol(environment.destination.condition)}</div>
          <span>Destination snapshot</span><h2>{trip.destination}</h2>
          <strong>{metric(environment.destination.temperatureF, "°F")}</strong>
          <p>{environment.destination.condition ?? "Conditions unavailable"}</p>
          <div><span>{metric(environment.destination.humidity, "%")} humidity</span><span>UV {metric(environment.destination.uvIndex, "")}</span></div>
        </aside>
      </section>

      <section className="environment-story" aria-labelledby="environment-story-title">
        <header><div><div className="eyebrow">Compared with home</div><h2 id="environment-story-title">A different climate, at a glance</h2></div><p>Saved current-condition snapshots</p></header>
        <div className="environment-route"><EnvironmentCard label="At home" data={environment.current} /><div className="environment-route-arrow" aria-hidden="true"><span>→</span></div><EnvironmentCard label="At destination" data={environment.destination} /></div>
        <div className="forecast-comparison">
          <div><span>Temperature</span><strong>{signed(environment.comparison.temperatureChangeF, "°F")}</strong><small>{comparisonDescription(environment.comparison.temperatureChangeF, "Warmer than home", "Cooler than home", "Similar temperature")}</small></div>
          <div><span>Humidity</span><strong>{signed(environment.comparison.humidityChange, "%")}</strong><small>{comparisonDescription(environment.comparison.humidityChange, "More humid", "Drier than home", "Similar humidity")}</small></div>
          <div><span>UV exposure</span><strong>{signed(environment.comparison.uvChange, "")}</strong><small>{comparisonDescription(environment.comparison.uvChange, "Higher UV", "Lower UV", "Similar UV")}</small></div>
        </div>
      </section>

      {forecast.explanation && (
        <section className="gemini-narrative" aria-labelledby="gemini-summary-title">
          <div className="gemini-mark" aria-hidden="true">✦</div>
          <div className="gemini-copy">
            <div className="gemini-label"><span>AI-assisted explanation</span><small>Grounded in Travel Skin Engine findings</small></div>
            <h2 id="gemini-summary-title">{forecast.explanation.headline}</h2>
            <p>{forecast.explanation.summary}</p>
          </div>
          {forecast.explanation.travelTips.length > 0 && (
            <div className="gemini-tips"><strong>Quick travel tips</strong><ul>{forecast.explanation.travelTips.map((tip) => <li key={tip}>{tip}</li>)}</ul></div>
          )}
        </section>
      )}

      <section className="forecast-heading">
        <div><div className="eyebrow">Personalized outlook</div><h2>What may need your attention</h2><p>Each priority comes directly from the Travel Skin Engine’s transparent rules.</p></div>
        <div className="risk-legend" aria-label="Priority legend"><span className="risk-legend-high">High</span><span className="risk-legend-moderate">Moderate</span><span className="risk-legend-low">Low</span></div>
      </section>

      <section className="concern-list">
        {concerns.length > 0 ? concerns.map((concern, index) => <ConcernCard concern={concern} index={index} explanation={explanationByConcern.get(concern.id)} key={concern.id} />) : <div className="forecast-clear"><span aria-hidden="true">✓</span><strong>No elevated travel concerns identified.</strong><p>Continue your usual gentle skincare and daily sun protection.</p></div>}
      </section>

      <aside className="forecast-safety"><span aria-hidden="true">i</span><p><strong>Travel planning, not a diagnosis.</strong> This forecast uses cautious, possibility-based guidance. Consider speaking with a dermatologist about severe or persistent concerns.</p></aside>
      <section className="next-phase forecast-next-step"><div><span>Next step</span><strong>Your personalized packing list</strong><p>Turn these preparation recommendations into a simple travel checklist.</p></div><Link className="submit-action" to={`/trips/${tripId}/packing-list`}>Build packing list →</Link></section>
    </main>
  );
}
