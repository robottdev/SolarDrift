# Solar Drift

A browser remake of the 1993 shareware space opera **Solar Winds** (James Schmalz / Epic MegaGames): top-down flight, directional shields, waveform combat, reactor allocation, cargo, comms, and a hyperdrive jump onto the galactic lanes.

This is an original episode — *The Setup* — with new writing and art. Gameplay systems follow the original. Not affiliated with Epic Games.

## Play locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Railway and other hosts inject `PORT`; the server binds `0.0.0.0` and serves `/health`.

```bash
npm test
```

## Deploy on Railway

1. Push this repo to GitHub.
2. In [Railway](https://railway.app): **New Project → Deploy from GitHub repo**.
3. Railway detects Node, installs with `npm ci`, and starts `npm start` (`node server.js`).
4. A `Dockerfile` is included if you prefer image builds (Railway uses it automatically when present).
5. Under **Settings → Networking**, generate a public domain.
6. Confirm `/health` returns `"version": "1.2.0"` and a `commit` SHA. If `commit` is missing or old, Railway is not on the latest GitHub `main`.

Railway **Redeploy** rebuilds the *same old commit*. It does not pull GitHub. After new pushes:

1. Service → **Settings → Source** — repo `robottdev/SolarDrift`, branch **`main`**, autodeploy **on**.
2. Command Palette (`Ctrl+K` / `Cmd+K`) → **Deploy Latest Commit**.
3. Hard-refresh the game (`Ctrl+Shift+R`).

The process **must** listen on `process.env.PORT` (already wired). No other environment variables are required.

## How to fly

| Control | Action |
| --- | --- |
| W A S D / arrows | Thrust and rotate |
| Click space | Plot a course (autopilot) |
| Space | Lasers |
| M | Missile |
| 1 2 3 | Laser banks |
| [ ] | Weapon waveform |
| ; ' | Shield waveform |
| C | Hail nearest ship or world (or PIP, if nobody's close) |
| V | Scan |
| T | Transport cargo |
| H / F10 | Hyperdrive (needs the Core, clear of planets) |
| + - | Hyperdrive throttle |
| Esc | Pause / save |

Dump reactor gigawatts into **engines** before a jump. Matched shield/weapon waveforms blunt damage; mismatched waveforms punch through. **Do not** carry Jump Juice through the Old Jump Ring — transport it into the aperture first.

## Campaign

You are Captain (self-proclaimed) Scott. You and your AI companion PIP were left drifting in a junk system after a "simple salvage job" turned out to be an ambush. Banter, find parts, repair the Maybe, and get back to exploring the galaxy.

Use **Lock Objective** on the nav computer if you lose the plot. Hail empty space to talk to PIP.

## Art

Combat view uses [Kenney Space Shooter Redux](https://kenney.nl/assets/space-shooter-redux) (CC0, via OpenGameArt) for ships, lasers, and asteroids, plus a public-domain [NASA/Hubble](https://www.nasa.gov/nasa-brand-center/images-and-media/) nebula. See `public/assets/ATTRIBUTION.md`.
