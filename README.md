# Ackee Ops mock application

Static, front-end prototype of the three Ackee Ops roles. All workflow data is stored in the browser with `localStorage`, so Staff, Farmer WhatsApp, and Driver status updates remain connected while you test the mock.

## Open the portals

- `staff.html` — management dashboard
- `farmer.html` — WhatsApp farmer request simulation
- `driver.html` — driver dashboard

## Mock accounts

| Role | Account | Password / identity |
| --- | --- | --- |
| Staff | `staff@ackeeops.local` | `staff123` |
| Driver — Kojo Mensah | Select in Driver Login | `1234` |
| Driver — Dennis Asare | Select in Driver Login | `1234` |
| Driver — Samuel Owusu | Select in Driver Login | `1234` |
| Farmer — Abena Owusu | WhatsApp number | `+233 24 611 8432` |

The Farmer portal deliberately has no web login: it simulates the WhatsApp-only experience specified for farmers.
