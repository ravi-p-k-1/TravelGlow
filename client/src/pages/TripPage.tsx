import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTrip } from "../api/trips";
import type { Trip } from "../types/trip";

type TripState =
  | { status: "loading" }
  | { status: "ready"; trip: Trip }
  | { status: "error" };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function TripPage() {
  const { tripId = "" } = useParams();
  const [state, setState] = useState<TripState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    getTrip(tripId, controller.signal)
      .then((trip) => setState({ status: "ready", trip }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [tripId]);

  if (state.status === "loading") {
    return <main className="state-page"><p>Loading your trip…</p></main>;
  }

  if (state.status === "error") {
    return (
      <main className="state-page">
        <div className="eyebrow">Trip unavailable</div>
        <h1>We couldn’t find that trip.</h1>
        <Link className="primary-action" to="/trips/new">Create a new trip</Link>
      </main>
    );
  }

  const { trip } = state;
  return (
    <main className="state-page">
      <div className="success-mark" aria-hidden="true">✓</div>
      <div className="eyebrow">Trip saved</div>
      <h1>Your journey is ready for a skin check.</h1>
      <section className="saved-trip-card">
        <div>
          <span>From</span>
          <strong>{trip.currentLocation}</strong>
        </div>
        <span className="journey-arrow" aria-hidden="true">→</span>
        <div>
          <span>To</span>
          <strong>{trip.destination}</strong>
        </div>
        <div className="trip-dates">
          {formatDate(trip.departureDate)} – {formatDate(trip.returnDate)}
        </div>
      </section>
      <button className="submit-action" type="button" disabled>
        Continue to skin scan <span aria-hidden="true">→</span>
      </button>
      <p className="privacy-note">Skin scanning arrives in Phase 4.</p>
    </main>
  );
}
