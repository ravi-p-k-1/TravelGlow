import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  analyzeSelfie,
  getSkinAnalysis,
  SkinAnalysisApiError,
} from "../api/skinAnalysis";
import { getTrip } from "../api/trips";
import type { SkinAnalysis } from "../types/skinAnalysis";
import type { Trip } from "../types/trip";

type PageState =
  | { status: "loading" }
  | { status: "ready"; trip: Trip; analysis?: SkinAnalysis }
  | { status: "error" };

const metrics: Array<[keyof SkinAnalysis, string]> = [
  ["oiliness", "Oiliness"], ["hydration", "Hydration"], ["acne", "Acne"],
  ["redness", "Redness"], ["pores", "Pores"], ["texture", "Texture"],
  ["radiance", "Radiance"], ["firmness", "Firmness"],
  ["darkCircles", "Dark circles"], ["spots", "Spots"], ["wrinkles", "Wrinkles"],
];

async function validateImage(file: File): Promise<string | null> {
  if (!["image/jpeg", "image/png"].includes(file.type)) return "Choose a JPEG or PNG image.";
  if (file.size > 10 * 1024 * 1024) return "The selfie must be smaller than 10 MB.";
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Invalid image"));
      image.src = url;
    });
    if (Math.min(image.naturalWidth, image.naturalHeight) < 480) {
      return "Choose a larger selfie—the shortest side must be at least 480 pixels.";
    }
    return null;
  } catch { return "TravelGlow could not read that image."; }
  finally { URL.revokeObjectURL(url); }
}

function AnalysisResults({ analysis }: { analysis: SkinAnalysis }) {
  const availableMetrics = metrics.filter(([key]) => typeof analysis[key] === "number");
  return (
    <section className="analysis-results">
      <div className="analysis-summary">
        <div className="success-mark" aria-hidden="true">✓</div>
        <div><div className="eyebrow">Analysis complete</div><h2>Your current skin snapshot</h2><p>These scores will be combined with your destination environment in the Travel Skin Engine.</p></div>
        {analysis.overallScore !== undefined && <div className="overall-score"><strong>{Math.round(analysis.overallScore)}</strong><span>Overall score</span></div>}
      </div>
      <div className="skin-metrics-grid">
        {availableMetrics.map(([key, label]) => {
          const value = analysis[key] as number;
          return <div className="skin-metric" key={key}><div><span>{label}</span><strong>{Math.round(value)}</strong></div><div className="score-track" aria-label={`${label} score ${Math.round(value)} out of 100`}><span style={{ width: `${value}%` }} /></div></div>;
        })}
      </div>
      <p className="analysis-disclaimer">TravelGlow uses these cosmetic skin-analysis scores for travel planning. This is not a medical diagnosis.</p>
    </section>
  );
}

export function SkinScanPage() {
  const { tripId = "" } = useParams();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getTrip(tripId, controller.signal),
      getSkinAnalysis(tripId, controller.signal).catch((error: unknown) => {
        if (error instanceof SkinAnalysisApiError && error.status === 404) return undefined;
        throw error;
      }),
    ]).then(([trip, analysis]) => setState({ status: "ready", trip, analysis }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [tripId]);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(null); setFileError(null); setRequestError(null);
    if (!selected) return;
    const error = await validateImage(selected);
    if (error) { setFileError(error); event.target.value = ""; return; }
    setFile(selected);
  }

  async function handleAnalyze() {
    if (!file || state.status !== "ready") return;
    setIsAnalyzing(true); setRequestError(null);
    try {
      const analysis = await analyzeSelfie(tripId, file);
      setState({ ...state, analysis }); setFile(null);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Skin analysis is temporarily unavailable.");
    } finally { setIsAnalyzing(false); }
  }

  if (state.status === "loading") return <main className="state-page"><p>Loading skin scan…</p></main>;
  if (state.status === "error") return <main className="state-page"><div className="eyebrow">Trip unavailable</div><h1>We couldn’t open this skin scan.</h1><Link className="primary-action" to="/trips/new">Create a new trip</Link></main>;

  return (
    <main className="skin-scan-page">
      <Link className="back-link" to={`/trips/${tripId}`}>← Back to trip</Link>
      <header className="scan-heading"><div className="eyebrow">Skin scan · {state.trip.destination}</div><h1>Show us your skin today.</h1><p>Use a clear, front-facing selfie so TravelGlow can prepare your destination-aware skin forecast.</p></header>

      {state.analysis && !file ? (
        <>
          <AnalysisResults analysis={state.analysis} />
          <div className="analysis-actions"><label className="secondary-action">Analyze a new selfie<input type="file" accept="image/jpeg,image/png" capture="user" onChange={selectFile} /></label><Link className="submit-action" to={`/trips/${tripId}/forecast`}>Build my skin forecast →</Link></div>
        </>
      ) : (
        <section className="scan-layout">
          <div className="upload-panel">
            {previewUrl ? <img className="selfie-preview" src={previewUrl} alt="Selected selfie preview" /> : <div className="face-guide" aria-hidden="true"><div className="face-outline"><span>•</span><span>•</span><i /></div></div>}
            <label className="upload-action">{file ? "Choose another selfie" : "Upload or take a selfie"}<input type="file" accept="image/jpeg,image/png" capture="user" onChange={selectFile} /></label>
            <small>JPEG or PNG · under 10 MB · at least 480 px</small>
            {fileError && <div className="form-alert" role="alert">{fileError}</div>}
          </div>
          <aside className="photo-tips"><div className="eyebrow">For the clearest scan</div><ul><li><strong>Face forward</strong><span>Look directly at the camera with your full face visible.</span></li><li><strong>Use even light</strong><span>Avoid harsh shadows, filters, and strong backlighting.</span></li><li><strong>Keep it clear</strong><span>Remove glasses and make sure the image is in focus.</span></li></ul><button className="submit-action" type="button" onClick={handleAnalyze} disabled={!file || isAnalyzing}>{isAnalyzing ? "Analyzing your selfie…" : "Analyze my skin"}<span aria-hidden="true">→</span></button>{requestError && <div className="form-alert" role="alert">{requestError}</div>}</aside>
        </section>
      )}
    </main>
  );
}
