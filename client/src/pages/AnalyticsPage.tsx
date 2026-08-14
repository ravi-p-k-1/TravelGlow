import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { getAnalyticsSummary } from "../api/analytics";
import type { AnalyticsSummary } from "../types/analytics";

type PageState =
  | { status: "loading" }
  | { status: "ready"; analytics: AnalyticsSummary }
  | { status: "error"; message: string };

const categoryLabels: Record<string, string> = {
  sunscreen: "Sunscreen",
  cleanser: "Cleanser",
  moisturizer: "Moisturizer",
  "hydrating-serum": "Hydrating serum",
  "lip-spf": "Lip SPF",
  "facial-mist": "Facial mist",
  "after-sun": "After-sun",
};

function MetricCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <article className="analytics-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function RankedList({ children, empty }: { children: ReactNode; empty: boolean }) {
  return empty ? <div className="analytics-empty">No interaction data yet.</div> : <ol className="analytics-ranking">{children}</ol>;
}

export function AnalyticsPage() {
  const [state, setState] = useState<PageState>({ status: "loading" });

  const load = useCallback(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    getAnalyticsSummary(controller.signal)
      .then((analytics) => setState({ status: "ready", analytics }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error", message: error instanceof Error ? error.message : "Analytics are temporarily unavailable." });
      });
    return controller;
  }, []);

  useEffect(() => {
    const controller = load();
    return () => controller.abort();
  }, [load]);

  if (state.status === "loading") return <main className="forecast-loading" aria-live="polite"><div className="forecast-loader" aria-hidden="true"><span /><span /><span /></div><div className="eyebrow">Demo analytics</div><h1>Reading the TravelGlow journey…</h1><p>Aggregating persisted trips, recommendations, and clicks.</p></main>;
  if (state.status === "error") return <main className="forecast-error state-page"><div className="error-orb" aria-hidden="true">!</div><div className="eyebrow">Analytics unavailable</div><h1>We couldn’t load the dashboard.</h1><p>{state.message}</p><button className="primary-action" type="button" onClick={load}>Try again</button></main>;

  const { analytics } = state;
  const maxFunnel = Math.max(analytics.totals.productImpressions, 1);
  const funnel = [
    { label: "Recommendation impressions", value: analytics.totals.productImpressions },
    { label: "Product clicks", value: analytics.totals.productClicks },
    { label: "Retailer link clicks", value: analytics.totals.purchaseLinkClicks },
  ];

  return (
    <main className="analytics-page">
      <div className="analytics-topbar"><Link className="back-link" to="/">← TravelGlow home</Link><button type="button" onClick={load}>Refresh dashboard ↻</button></div>
      <section className="analytics-hero"><div><div className="eyebrow">Hackathon demo dashboard</div><h1>From skin insight to product intent.</h1><p>A lightweight view of how travelers move from personalized recommendations toward qualified outbound traffic.</p></div><aside><span>Last refreshed</span><strong>{new Date(analytics.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</strong><p>Metrics are calculated directly from PostgreSQL.</p></aside></section>

      <section className="analytics-metrics" aria-label="TravelGlow metrics">
        <MetricCard label="Trips" value={analytics.totals.trips} note="Saved travel plans" />
        <MetricCard label="Skin scans" value={analytics.totals.skinScans} note="Completed analyses" />
        <MetricCard label="Forecasts" value={analytics.totals.forecasts} note="Deterministic results" />
        <MetricCard label="Impressions" value={analytics.totals.productImpressions} note="Recommendations shown" />
        <MetricCard label="Product clicks" value={analytics.totals.productClicks} note="Product engagement" />
        <MetricCard label="Retailer clicks" value={analytics.totals.purchaseLinkClicks} note="Outbound intent" />
        <MetricCard label="Product CTR" value={`${analytics.totals.productCtr}%`} note="Clicks ÷ impressions" />
        <MetricCard label="Partner clicks" value={analytics.totals.partnerClicks} note={`${analytics.totals.partnerImpressions} partner impressions`} />
      </section>

      <section className="analytics-funnel" aria-labelledby="funnel-title"><header><div><div className="eyebrow">Recommendation funnel</div><h2 id="funnel-title">Commercial journey</h2></div><p>Event totals across all saved trips</p></header><div>{funnel.map((step, index) => <div className="funnel-row" key={step.label}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.label}</strong><i style={{ width: `${Math.max((step.value / maxFunnel) * 100, step.value > 0 ? 5 : 0)}%` }} /></div><b>{step.value}</b></div>)}</div></section>

      <section className="analytics-breakdown">
        <article><header><span>Top products</span><small>By product clicks</small></header><RankedList empty={analytics.topProducts.length === 0}>{analytics.topProducts.map((product) => <li key={product.productId}><div><strong>{product.name}</strong><span>{product.brand}</span></div><b>{product.clicks}</b></li>)}</RankedList></article>
        <article><header><span>Top retailers</span><small>By outbound clicks</small></header><RankedList empty={analytics.topRetailers.length === 0}>{analytics.topRetailers.map((retailer) => <li key={retailer.retailer}><div><strong>{retailer.retailer}</strong><span>Official product destination</span></div><b>{retailer.clicks}</b></li>)}</RankedList></article>
        <article><header><span>Recommended categories</span><small>Across saved matches</small></header><RankedList empty={analytics.topCategories.length === 0}>{analytics.topCategories.map((category) => <li key={category.category}><div><strong>{categoryLabels[category.category] ?? category.category}</strong><span>Curated catalog</span></div><b>{category.recommendations}</b></li>)}</RankedList></article>
      </section>

      <aside className="analytics-disclosure"><span aria-hidden="true">i</span><p><strong>Demo-scale analytics.</strong> This dashboard stores only application interaction events—no account, payment, location tracking, or third-party analytics platform is involved.</p></aside>
      <section className="next-phase analytics-next-step"><div><span>Coming next</span><strong>Featured Partner demonstration</strong><p>Show how a relevant sponsored placement can create measurable value without overriding suitability.</p></div><button className="submit-action" type="button" disabled>Partner demo →</button></section>
    </main>
  );
}
