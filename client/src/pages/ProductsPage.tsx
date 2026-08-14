import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTripProducts } from "../api/products";
import { getTrip } from "../api/trips";
import type { ProductCategory, ProductRecommendation } from "../types/product";
import type { Trip } from "../types/trip";

type PageState =
  | { status: "loading" }
  | { status: "ready"; trip: Trip; recommendations: ProductRecommendation[] }
  | { status: "error"; message: string };

const categoryLabels: Record<ProductCategory, string> = {
  sunscreen: "Sunscreen",
  cleanser: "Cleanser",
  moisturizer: "Moisturizer",
  "hydrating-serum": "Hydrating serum",
  "lip-spf": "Lip SPF",
  "facial-mist": "Facial mist",
  "after-sun": "After-sun",
};

function formatPrice(priceCents: number | undefined): string | null {
  if (priceCents === undefined) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(priceCents / 100);
}

function ProductCard({ recommendation }: { recommendation: ProductRecommendation }) {
  const { product } = recommendation;
  const price = formatPrice(product.priceCents);
  return (
    <article className="product-card">
      <div className={`product-image product-image--${product.category}`}>
        {product.imageUrl ? <img src={product.imageUrl} alt={`${product.name} product illustration`} /> : <span>{product.brand.slice(0, 1)}</span>}
        <span className="product-rank">#{recommendation.rank}</span>
        {product.partner && <span className="partner-badge">Featured Partner</span>}
      </div>
      <div className="product-card-body">
        <div className="product-meta"><span>{categoryLabels[product.category]}</span>{product.spf && <small>SPF {product.spf}</small>}</div>
        <p className="product-brand">{product.brand}</p>
        <h2>{product.name}</h2>
        <div className="product-reason"><strong>Why it fits your trip</strong><ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
        <div className="product-card-footer">
          <div>{price ? <strong className="product-price">{price}</strong> : <span className="price-unavailable">See current price</span>}<small>{price ? "Price captured for demo" : "On the product page"}</small></div>
          <div className="purchase-links">{product.purchaseLinks.map((purchaseLink) => <a href={purchaseLink.url} target="_blank" rel="noreferrer" key={purchaseLink.id}>View at {purchaseLink.retailer}<span aria-hidden="true">↗</span></a>)}</div>
        </div>
      </div>
    </article>
  );
}

export function ProductsPage() {
  const { tripId = "" } = useParams();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "all">("all");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getTrip(tripId, controller.signal), getTripProducts(tripId, controller.signal)])
      .then(([trip, recommendations]) => setState({ status: "ready", trip, recommendations }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error", message: error instanceof Error ? error.message : "Product recommendations are temporarily unavailable." });
      });
    return () => controller.abort();
  }, [tripId]);

  const availableCategories = useMemo(() => state.status === "ready"
    ? [...new Set(state.recommendations.map(({ product }) => product.category))]
    : [], [state]);
  const visibleRecommendations = state.status === "ready"
    ? state.recommendations.filter(({ product }) => activeCategory === "all" || product.category === activeCategory)
    : [];

  if (state.status === "loading") {
    return <main className="forecast-loading" aria-live="polite"><div className="forecast-loader" aria-hidden="true"><span /><span /><span /></div><div className="eyebrow">Curated product matches</div><h1>Matching products to your packing plan…</h1><p>Ranking the internal catalog by skincare need and destination climate.</p></main>;
  }
  if (state.status === "error") {
    return <main className="forecast-error state-page"><div className="error-orb" aria-hidden="true">!</div><div className="eyebrow">Products unavailable</div><h1>We couldn’t load your matches.</h1><p>{state.message}</p><div className="error-actions"><button className="primary-action" type="button" onClick={() => window.location.reload()}>Try again</button><Link className="text-action" to={`/trips/${tripId}/packing-list`}>Return to packing list</Link></div></main>;
  }

  return (
    <main className="products-page">
      <div className="products-topbar"><Link className="back-link" to={`/trips/${tripId}/packing-list`}>← Back to packing list</Link><span>{state.recommendations.length} saved matches · Curated catalog</span></div>
      <section className="products-hero"><div><div className="eyebrow">Products for your travel plan</div><h1>Consider these for {state.trip.destination}.</h1><p>Ranked by category, forecast concern, destination climate, and your skin snapshot—not by sponsorship.</p></div><aside><span>How ranking works</span><strong>Relevance first.</strong><p>A product must match something in your packing plan before it can appear here.</p></aside></section>
      <nav className="product-filters" aria-label="Filter product recommendations"><button className={activeCategory === "all" ? "active" : ""} type="button" onClick={() => setActiveCategory("all")}>All <span>{state.recommendations.length}</span></button>{availableCategories.map((category) => <button className={activeCategory === category ? "active" : ""} type="button" onClick={() => setActiveCategory(category)} key={category}>{categoryLabels[category]} <span>{state.recommendations.filter(({ product }) => product.category === category).length}</span></button>)}</nav>
      {visibleRecommendations.length > 0 ? <section className="product-grid">{visibleRecommendations.map((recommendation) => <ProductCard recommendation={recommendation} key={recommendation.id} />)}</section> : <section className="product-empty"><strong>No matches in this category.</strong><p>Try another filter to see your saved recommendations.</p></section>}
      <aside className="product-disclosure"><span aria-hidden="true">i</span><p>Product information comes from TravelGlow’s manually curated demo catalog. Prices and availability can change; confirm details with the linked brand. No brand partnership is implied.</p></aside>
      <section className="next-phase product-next-step"><div><span>Coming next</span><strong>Recommendation analytics</strong><p>Measure which recommendations and retailer links help travelers most.</p></div><button className="submit-action" type="button" disabled>View analytics →</button></section>
    </main>
  );
}
