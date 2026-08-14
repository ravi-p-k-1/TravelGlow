# TravelGlow

TravelGlow is a travel-aware skincare web app that combines skin analysis with destination conditions to help travelers prepare a personalized skincare plan.

## Current MVP foundation

The initial stack includes:

- React, TypeScript, and Vite frontend
- Express and TypeScript API
- PostgreSQL database
- Multi-stage production Docker images
- nginx static hosting and `/api` reverse proxy
- End-to-end frontend → API → PostgreSQL health check
- PostgreSQL-backed trip creation and retrieval
- Validated trip REST API and responsive trip-planning flow
- Persisted home and destination environment snapshots
- Deterministic environment comparison with mock and WeatherAPI.com adapters
- YouCam-compatible selfie upload and persisted normalized skin analysis
- Deterministic, versioned Travel Skin Engine with persisted forecasts
- Deterministic, persisted skincare packing lists with item-level reasons
- PostgreSQL-backed curated product catalog and relevance-first recommendations
- First-party recommendation analytics and a demo/admin dashboard

## Trip API

The Phase 2 trip endpoints are:

```text
POST  /api/trips
GET   /api/trips/:id
PATCH /api/trips/:id
```

Database migrations run automatically when the backend starts. Applied migration names are recorded in the `schema_migrations` table so existing schemas are not recreated.

## Weather integration

TravelGlow uses a server-side WeatherAPI.com adapter for live current-condition snapshots. Set `WEATHER_API_KEY` and `USE_MOCK_WEATHER=false` in `.env` to enable it.

Mock weather is enabled by default for a reliable demo. It produces the specification’s San Francisco-to-Miami comparison while preserving the locations entered on the trip. Environment results are persisted and reused on refresh.

```text
POST /api/trips/:id/environment  Generate once, or return the saved result
GET  /api/trips/:id/environment  Return the saved result
```

## YouCam skin analysis

Selfies are accepted as JPEG or PNG files under 10 MB with a minimum short side of 480 pixels. Uploaded image bytes are processed in memory and are not stored by TravelGlow; only normalized analysis scores are persisted.

```text
POST /api/trips/:id/skin-analysis  Upload and analyze a new selfie
GET  /api/trips/:id/skin-analysis  Return the saved analysis
```

Mock analysis is enabled by default. To use the documented YouCam Skin Analysis v2.1 workflow, set `USE_MOCK_YOUCAM=false` and provide `YOUCAM_API_KEY`. The backend requests a presigned upload URL, uploads the image, creates an asynchronous analysis task, polls for completion, and normalizes the returned scores.

## Travel Skin Engine

The Travel Skin Engine runs deterministic, independently tested rules for UV exposure, humidity and oiliness, dry-climate hydration, heat and congestion, and cold/dry barrier support. Gemini does not select risks or recommendations.

```text
POST /api/trips/:id/forecast  Generate once, or return the saved forecast
GET  /api/trips/:id/forecast  Return the saved forecast
```

Forecasts record the engine version and the exact skin-analysis and environmental-comparison records used. A new skin scan or changed trip/environment input invalidates the old forecast.

The forecast page is the primary TravelGlow results experience. It automatically generates a missing deterministic forecast, compares home and destination snapshots, summarizes priority levels, and presents cautious possible effects alongside preparation recommendations.

## Gemini explanation layer

After the deterministic forecast exists, the backend sends only normalized skin scores, environmental differences, rule findings, and approved recommendations to Gemini. Gemini returns structured JSON containing a headline, summary, concern explanations, and selected travel tips.

The response is validated before persistence: concern IDs must exactly match the deterministic forecast, and tips must be copied from engine recommendations. If Gemini is unavailable or returns unsupported content, TravelGlow logs the failure and still returns the complete deterministic forecast.

## Personalized packing list

The packing-list generator converts the deterministic forecast, destination conditions, and saved skin snapshot into Essential, Recommended for Your Skin, and Optional sections. Every item includes a reason, and duplicate product needs are removed before the list is saved with the trip.

```text
POST /api/trips/:id/packing-list  Generate once, or return the saved list
GET  /api/trips/:id/packing-list  Return the saved list
```

Packing lists record their generator version and source forecast. Replacing a skin analysis or invalidating the forecast also removes the old packing list through its database relationship.

## Product recommendations

TravelGlow maintains an internal catalog of 20 curated products and manual official-brand purchase links. It does not call an external cosmetics catalog at runtime. Recommendations are ranked by packing-list category, deterministic forecast concern, destination climate, and skin-profile fit, then persisted against the source forecast.

```text
GET /api/trips/:id/products  Generate if needed, then return saved recommendations
GET /api/products/:id       Return a curated catalog product and its purchase links
```

Only products matching a packing-list need are eligible. The ranking engine supports a tightly capped partner boost for the later demo phase, but that boost cannot make an irrelevant product eligible or override a meaningful relevance match. Catalog prices are optional snapshots and should be confirmed on the linked official product page.

## Analytics dashboard

TravelGlow records recommendation impressions, product clicks, and purchase-link clicks directly in PostgreSQL. Event requests are strictly validated: the backend confirms that a product was recommended for the stated trip, verifies retailer links against the catalog, and derives partner status server-side.

```text
POST /api/analytics/events  Validate and record a first-party interaction event
GET  /api/admin/analytics   Return aggregate demo metrics and rankings
```

Open `/admin/analytics` to view totals for trips, scans, forecasts, impressions, clicks, CTR, partner activity, top products, top retailers, and recommended categories. The dashboard is intentionally demo-scale and does not use Firebase or another third-party analytics service.

## Run with Docker

Optionally copy `.env.example` to `.env` and adjust its development values. Then run:

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:8080
- Backend health endpoint: http://localhost:5000/api/health
- PostgreSQL: localhost:5432

The frontend status card calls `/api/health` through nginx and reports whether the API and database are available.

### Stop Docker

To stop and remove the TravelGlow containers and network while preserving the PostgreSQL data, run:

```bash
docker compose down
```

To also delete the PostgreSQL data volume, run:

```bash
docker compose down --volumes
```

The second command permanently removes the local database data stored by Docker.

## Run locally

Install and start each package in separate terminals:

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

The Vite development server is available at http://localhost:5173 and proxies `/api` to the backend at http://localhost:5000.
