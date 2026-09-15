# Solar Drift

A browser space miner inspired by the 1993 shareware space opera **Solar Winds** (James Schmalz / Epic MegaGames): top-down flight, a linear claim, comms, and a system you can actually work.

This is an original episode — *The Claim*. You cut asteroids with a mining laser, sell ore for **Credits**, and file enough of a book that Helios Anchorage will talk jump cores. Combat loadouts come later. Not affiliated with Epic Games.

Graphics come from **Stellar Sprites**, which now lives in this repo (`public/stellar/`). Edit those generators here; the old standalone StellarSprites project is no longer the source of truth.

## Play locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) for the game and [http://localhost:3000/stellar/](http://localhost:3000/stellar/) for the sprite lab. Railway and other hosts inject `PORT`; the server binds `0.0.0.0` and serves `/health`.

```bash
npm test
```

## How to fly

| Control | Action |
| --- | --- |
| W A S D / arrows | Thrust and rotate |
| Click space | Plot a course (autopilot) |
| Shift | Boost |
| X | Brake |
| Space (hold) | Mining laser |
| V | Scan nearest rock |
| C | Hail Anchorage (or PIP) |
| T | Sell the hold at dock |
| Esc | Pause / save |

The laser is the only hardpoint. It strips the first asteroid in the beam. Scan to assay the vein. Sell at **Helios Anchorage** over Drift.

## Minerals & Credits

Asteroids in the Helios belt carry a posted mineral. The Anchorage pays **Credits (CR)** per tonne at a public board:

**Common** — Water Ice (4), Silicates (3), Carbonaceous (6), Iron (8)

**Uncommon** — Nickel (14), Sulfur (11), Copper (18), Magnesium (16), Aluminum (15), Titanium (32)

**Rare** — Gold (90), Platinum (120), Palladium (110), Iridium (150), Lanthanides (95)

**Exotic** — Helium-3 (220), Aetherite (400, Ghost Vein)

Hold capacity is 24 tonnes. Ice is the tutorial cut. Iron pays the yard. Titanium fights back. Platinum-family ore feeds the assay. The magenta Ghost Vein is the story rock.

## Campaign

You are Captain (self-proclaimed) Scott. PIP is the AI who will not let you mine the station. File the claim, then the lanes.

Use **Lock Objective** if you lose the plot. Hail empty space to talk to PIP.

## Deploy on Railway

1. Push this repo to GitHub.
2. In [Railway](https://railway.app): **New Project → Deploy from GitHub repo**.
3. Railway detects Node, installs with `npm ci`, and starts `npm start` (`node server.js`).
4. A `Dockerfile` is included if you prefer image builds.
5. Under **Settings → Networking**, generate a public domain.
6. Confirm `/health` returns `"version": "2.0.0"`.

The process **must** listen on `process.env.PORT` (already wired). No other environment variables are required.

## Art

Helios (star, Drift, Cinder, Bruise, Nys, moons, belt, Anchorage, hauler) is generated on boot from `public/stellar/js`. Tweak a planet or asteroid there, refresh the game. See `public/assets/ATTRIBUTION.md`.
