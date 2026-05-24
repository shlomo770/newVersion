# MapLibre React App (JBK Tactical Map)

Modern React 18 + TypeScript tactical map application with MapLibre GL, Redux Toolkit, and real-time WebSocket data (radar, targets, entities, INS, faults).

## Architecture

Layered structure inspired by Feature-Sliced Design:

```
app / pages          → composition & routing
features/*           → domain UI, Redux slices, WS inbound handlers
domain/*             → pure models, enums, wire mappers
core/*               → REST/WS clients, server config, message registry
services/map         → MapLibre engine (no @features imports)
shared/*             → design system, i18n, reusable UI
config/*             → global theme, form tokens, icons
```

### Dependency rules (enforced by ESLint)

| Layer | May import |
|-------|------------|
| `features` | domain, core, shared, services, config |
| `services` | domain, core, shared — **not** `@features` |
| `core`, `domain`, `shared` | each other — **not** `@features` |

Map engine config lives in `src/services/map/config/`. Feature code re-exports via `@features/map/config`.

Entity state reaches map services through `MapServiceRuntime`, wired in `MapFacade` via `createMapServiceRuntime()`.

## Project structure

```
src/
├── app/                 # Bootstrap, store, providers, WS registration
├── pages/               # Route-level pages (Map, Mode, Maintenance)
├── features/            # Feature modules (map, entities, targets, …)
├── domain/              # Models, enums, mappers
├── core/                # REST client, WS client, message registry
├── services/map/        # MapService, drawing, entity renderer
├── shared/              # UI kit, i18n, components
└── config/              # Theme, forms, icons
```

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install & run

```bash
npm install
npm run dev          # Vite dev server → http://localhost:3000
```

### WebSocket backend

The app expects a WebSocket server at `ws://localhost:8080` (see `src/config/communication.json`).

Optional mock server (requires `data/SRTM.tif` for elevation queries):

```bash
npm run mock-server   # ws://localhost:8080
```

`ws` and `geotiff` are included as devDependencies.

Override endpoints via env vars: `VITE_WS_SERVER`, `VITE_MAP_SERVER`, `VITE_API_SERVER`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run mock-server` | WebSocket mock backend (port 8080) |
| `npm run test` | Run Vitest unit tests |
| `npm run lint` | ESLint (includes import boundary rules) |
| `npm run typecheck` | TypeScript check |

## Styling

- **CSS Modules** for component layout
- **Global tokens** via `theme.config.ts` → CSS variables
- **Form primitives** via `forms.css` (`jbk-*` classes)

## Localization

Hebrew UI strings: `src/shared/i18n/he.ts`. Layout stays LTR (icons, map chrome); RTL applies only to Hebrew text (labels, titles, dialogs).

## Tech stack

- React 18, TypeScript (strict)
- Redux Toolkit
- MapLibre GL JS, Mapbox GL Draw
- Vite 4
- Vitest, ESLint
