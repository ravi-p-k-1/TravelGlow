import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { generatePackingList } from "../api/packingList";
import { getTrip } from "../api/trips";
import type { PackingCategory, PackingItem, PackingList } from "../types/packingList";
import type { Trip } from "../types/trip";

type PageState =
  | { status: "loading" }
  | { status: "ready"; trip: Trip; packingList: PackingList }
  | { status: "error"; message: string };

const categoryDetails: Record<PackingCategory, { title: string; description: string; number: string }> = {
  essential: { title: "Essential", description: "The everyday foundation for your travel routine.", number: "01" },
  recommended: { title: "Recommended for your skin", description: "Selected from your skin snapshot and forecast priorities.", number: "02" },
  optional: { title: "Optional", description: "Useful comfort extras if you have room in your bag.", number: "03" },
};
const categories: PackingCategory[] = ["essential", "recommended", "optional"];

function PackingItemRow({ item, checked, onToggle }: { item: PackingItem; checked: boolean; onToggle: () => void }) {
  return (
    <label className={`packing-item${checked ? " packing-item--checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <span className="packing-checkbox" aria-hidden="true">{checked ? "✓" : ""}</span>
      <span className="packing-item-copy"><strong>{item.name}</strong><small><b>Why:</b> {item.reason}</small></span>
    </label>
  );
}

export function PackingListPage() {
  const { tripId = "" } = useParams();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getTrip(tripId, controller.signal), generatePackingList(tripId, controller.signal)])
      .then(([trip, packingList]) => setState({ status: "ready", trip, packingList }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error", message: error instanceof Error ? error.message : "Your packing list is temporarily unavailable." });
      });
    return () => controller.abort();
  }, [tripId]);

  const grouped = useMemo(() => {
    if (state.status !== "ready") return new Map<PackingCategory, PackingItem[]>();
    return new Map(categories.map((category) => [category, state.packingList.items.filter((item) => item.category === category)]));
  }, [state]);

  function toggleItem(itemId: string) {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  }

  if (state.status === "loading") {
    return <main className="forecast-loading" aria-live="polite"><div className="forecast-loader" aria-hidden="true"><span /><span /><span /></div><div className="eyebrow">Personalized packing list</div><h1>Turning your forecast into a travel kit…</h1><p>Organizing essentials and climate-aware recommendations.</p></main>;
  }
  if (state.status === "error") {
    return <main className="forecast-error state-page"><div className="error-orb" aria-hidden="true">!</div><div className="eyebrow">Packing list unavailable</div><h1>We couldn’t build your checklist.</h1><p>{state.message}</p><div className="error-actions"><button className="primary-action" type="button" onClick={() => window.location.reload()}>Try again</button><Link className="text-action" to={`/trips/${tripId}/forecast`}>Return to forecast</Link></div></main>;
  }

  const total = state.packingList.items.length;
  const progress = total === 0 ? 0 : Math.round((checkedIds.size / total) * 100);
  const progressStyle = { "--packing-progress": `${progress * 3.6}deg` } as CSSProperties;

  return (
    <main className="packing-page">
      <div className="packing-topbar"><Link className="back-link" to={`/trips/${tripId}/forecast`}>← Back to forecast</Link><span>List v{state.packingList.generatorVersion} · Saved with this trip</span></div>
      <section className="packing-hero">
        <div><div className="eyebrow">Your travel skincare kit</div><h1>Pack for {state.trip.destination}, with purpose.</h1><p>Every item has a reason grounded in your saved skin snapshot and destination forecast. Check things off as they go into your bag.</p></div>
        <aside className="packing-progress" aria-label={`${checkedIds.size} of ${total} items packed`}><div className="packing-progress-ring" style={progressStyle}><span><strong>{checkedIds.size}</strong><small>of {total}</small></span></div><div><strong>{progress}% packed</strong><span>{progress === 100 ? "Ready to glow" : "Keep going—your kit is taking shape"}</span></div></aside>
      </section>
      <div className="packing-sections">
        {categories.map((category) => {
          const details = categoryDetails[category];
          const items = grouped.get(category) ?? [];
          if (items.length === 0) return null;
          return <section className={`packing-section packing-section--${category}`} key={category}><header><span>{details.number}</span><div><h2>{details.title}</h2><p>{details.description}</p></div><small>{items.length} {items.length === 1 ? "item" : "items"}</small></header><div className="packing-items">{items.map((item) => <PackingItemRow item={item} checked={checkedIds.has(item.id)} onToggle={() => toggleItem(item.id)} key={item.id} />)}</div></section>;
        })}
      </div>
      <aside className="forecast-safety packing-note"><span aria-hidden="true">i</span><p><strong>Keep it familiar.</strong> Travel is usually not the best time to introduce several new products. This checklist is planning guidance, not medical advice.</p></aside>
      <section className="next-phase packing-next-step"><div><span>Coming next</span><strong>Product recommendations</strong><p>Match this checklist with curated products for your travel needs.</p></div><button className="submit-action" type="button" disabled>Explore products →</button></section>
    </main>
  );
}
