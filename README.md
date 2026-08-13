# TravelGlow

TravelGlow is a travel-aware skincare web app that combines skin analysis with destination conditions to help travelers prepare a personalized skincare plan.

## Phase 1 foundation

The initial stack includes:

- React, TypeScript, and Vite frontend
- Express and TypeScript API
- PostgreSQL database
- Multi-stage production Docker images
- nginx static hosting and `/api` reverse proxy
- End-to-end frontend → API → PostgreSQL health check

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
