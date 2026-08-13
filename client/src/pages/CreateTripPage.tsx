import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiRequestError, createTrip } from "../api/trips";
import type { CreateTripInput } from "../types/trip";

function localDateToday(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const initialForm: CreateTripInput = {
  currentLocation: "",
  destination: "",
  departureDate: "",
  returnDate: "",
};

export function CreateTripPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function updateField(field: keyof CreateTripInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: [] }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.returnDate < form.departureDate) {
      setFieldErrors({ returnDate: ["Return date must be on or after departure date"] });
      return;
    }

    setIsSubmitting(true);
    try {
      const trip = await createTrip(form);
      navigate(`/trips/${trip.id}`);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        setError(requestError.message);
        setFieldErrors(requestError.fieldErrors);
      } else {
        setError("TravelGlow could not save your trip. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const today = localDateToday();

  return (
    <main className="form-page">
      <Link className="back-link" to="/">← Back home</Link>
      <div className="form-layout">
        <section className="form-intro">
          <div className="eyebrow">Step 1 of 3</div>
          <h1>Where is your skin headed?</h1>
          <p>
            We’ll compare the environment you know with the one waiting at your
            destination.
          </p>
        </section>

        <form className="trip-form" onSubmit={handleSubmit} noValidate>
          <fieldset disabled={isSubmitting}>
            <legend>Trip details</legend>
            <div className="field-grid">
              <label className="field">
                <span>Current location</span>
                <input
                  name="currentLocation"
                  value={form.currentLocation}
                  onChange={(event) => updateField("currentLocation", event.target.value)}
                  placeholder="San Francisco, CA"
                  minLength={2}
                  maxLength={200}
                  required
                  autoComplete="address-level2"
                  aria-invalid={Boolean(fieldErrors.currentLocation?.length)}
                />
                {fieldErrors.currentLocation?.[0] && (
                  <small className="field-error">{fieldErrors.currentLocation[0]}</small>
                )}
              </label>

              <div className="route-line" aria-hidden="true"><span>→</span></div>

              <label className="field">
                <span>Destination</span>
                <input
                  name="destination"
                  value={form.destination}
                  onChange={(event) => updateField("destination", event.target.value)}
                  placeholder="Miami, FL"
                  minLength={2}
                  maxLength={200}
                  required
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.destination?.length)}
                />
                {fieldErrors.destination?.[0] && (
                  <small className="field-error">{fieldErrors.destination[0]}</small>
                )}
              </label>
            </div>

            <div className="date-grid">
              <label className="field">
                <span>Departure date</span>
                <input
                  type="date"
                  name="departureDate"
                  min={today}
                  value={form.departureDate}
                  onChange={(event) => updateField("departureDate", event.target.value)}
                  required
                  aria-invalid={Boolean(fieldErrors.departureDate?.length)}
                />
                {fieldErrors.departureDate?.[0] && (
                  <small className="field-error">{fieldErrors.departureDate[0]}</small>
                )}
              </label>

              <label className="field">
                <span>Return date</span>
                <input
                  type="date"
                  name="returnDate"
                  min={form.departureDate || today}
                  value={form.returnDate}
                  onChange={(event) => updateField("returnDate", event.target.value)}
                  required
                  aria-invalid={Boolean(fieldErrors.returnDate?.length)}
                />
                {fieldErrors.returnDate?.[0] && (
                  <small className="field-error">{fieldErrors.returnDate[0]}</small>
                )}
              </label>
            </div>
          </fieldset>

          {error && <div className="form-alert" role="alert">{error}</div>}

          <button className="submit-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving your trip…" : "Save trip and continue"}
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>
          <p className="privacy-note">Your trip is saved only for this TravelGlow demo.</p>
        </form>
      </div>
    </main>
  );
}
