# Solar Drift

A browser remake of the 1993 shareware space opera **Solar Winds** (James Schmalz / Epic MegaGames): top-down flight, directional shields, waveform combat, reactor allocation, cargo, comms, and a hyperdrive jump to the edge of a caged star system.

This is an original episode — *The Breakout* — with new writing and art. Gameplay systems follow the original. Not affiliated with Epic Games.

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
6. Confirm [https://your-app.up.railway.app/health](https://your-app.up.railway.app/health) returns `{"ok":true,...}`.

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
| C | Hail nearest ship or world |
| V | Scan |
| T | Transport cargo |
| H / F10 | Hyperdrive (needs the Core, clear of planets) |
| + - | Hyperdrive throttle |
| Esc | Pause / save |

Dump reactor gigawatts into **engines** before a jump. Matched shield/weapon waveforms blunt damage; mismatched waveforms punch through. **Do not** carry Voidseed through the Vortex Gate — transport it into the aperture first.

## Campaign

You are bounty hunter Ryn Vale, hired by Governor Hale to crush a forbidden hyperdrive cell. A cloaked informant, a wrecked scanner, a convoy, a moon lab, and a lock in the cage wall tell a different story.

Use **Lock Objective** on the nav computer if you lose the plot.
