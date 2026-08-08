# Tallawah Ops — Farmer Orders & Shipments (demo prototype)

An interactive, front-end-only prototype of Tallawah Foods Ghana's ackee farmer-to-factory
operations flow, covering the three roles from the PRD: **Order Intake**, **Dispatch &
Shipment Planning**, **In-Transit Tracking**, **Arrival & Receiving**, and **Exceptions**.

No backend — everything runs client-side in a [Zustand](https://github.com/pmndrs/zustand)
store, persisted to `localStorage` and synced live across browser tabs via
`BroadcastChannel`, so the Farmer, Staff, and Driver views stay in sync whether they're
panels on one screen or separate tabs/windows.

## Roles

- **Farmer** — a WhatsApp-style chat. No login (matches how WhatsApp actually works):
  tap *Ackee Ready*, pick a bag count, choose team pickup or self-drop, share farm
  location, and watch live status pushes as staff dispatch a route and a driver collects.
- **Staff** — an ops dashboard: live map, KPIs, intake queue, dispatch planner (with the
  120-bag/vehicle and 600-bag/fleet capacity checks from the PRD), in-transit tracking
  with a Swiggy/Zomato-style live delivery tracker, receiving + stock ledger with a
  freshness countdown, and exception handling.
- **Driver** — a mobile field app: job notifications, route detail, per-stop
  arrive/confirm-pickup flow with an actual bag-count entry, and history/profile.

Demo credentials (Staff and Driver are gated behind a login screen; Farmer isn't):

| Role | Username | Password |
| --- | --- | --- |
| Staff | `adjoa@tallawahfoods.com` | `demo1234` |
| Driver | `driver@tallawahfoods.com` | `demo1234` |

## Present mode

The Home screen's **Present all three** entry opens all three roles side by side, and
includes a **Play demo** control that scripts the full loop end to end — a farmer texts
in a request, staff builds and dispatches a route, a driver runs it stop by stop, and
staff receives the shipment — by driving the same store actions a real user would.

## Stack

React 18 + TypeScript + Vite, Zustand for state, Leaflet (CARTO basemaps) for the maps.
No component library — every UI primitive (buttons, cards, sheets, charts) is hand-built
in `src/components/ui` and `src/components/charts`.

## Running it

```bash
npm install
npm run dev
```

```bash
npm run build   # production build to dist/
```
