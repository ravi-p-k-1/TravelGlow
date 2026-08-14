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
