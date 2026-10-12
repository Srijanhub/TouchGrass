# TouchGrass

Checks the weather and what is nearby, then suggests one outdoor outing, or a small indoor activity when the weather says stay in.
Static site: no server, no build step, no API keys. Preferences and history stay in the browser.

```
public/index.html   the whole app
api/places.js       Vercel serverless proxy for nearby places (Vercel only)
test-site.js        end-to-end test in a simulated browser
test-api.js         tests for the proxy function (npm test runs both)
vercel.json         Vercel config (serves /public, adds security headers)
.github/workflows/  GitHub Pages deploy (tests first, then publish)
```

## Run locally
```bash
npm install     # only needed for tests
npm start       # http://localhost:8080  (location works on localhost)
npm test
```

## Deploy on Vercel
1. Push this folder to a GitHub repo.
2. vercel.com > Add New > Project > import the repo. Leave every setting as detected (no framework, no build command). Deploy.
Or from a terminal: `npx vercel --prod`.
Every push to `main` redeploys automatically.

## Deploy on GitHub Pages
1. Push to a repo with `main` as the default branch.
2. Repo > Settings > Pages > Build and deployment > Source: **GitHub Actions**.
3. Push again (or run the workflow from the Actions tab). The site appears at `https://<user>.github.io/<repo>/`.

Both are HTTPS, which browsers require for location. If a visitor blocks location they can search for a place in Settings.

## Why there is a places proxy
The free Overpass servers that supply nearby places are shared, rate-limited, and unreachable from some networks.
On Vercel the site asks `/api/places` first: the server fetches places (trying four Overpass servers), caches the answer for an hour, and the browser only talks to your own domain.
On GitHub Pages or localhost there is no `/api`, so the browser falls back to calling the Overpass servers directly. If your network blocks them, use Vercel.
Press **Check services** on the error screen to see which part is failing.

## Notes
- Weather: Open-Meteo. Places: OpenStreetMap Overpass. Routes: routing.openstreetmap.de. Tiles: openstreetmap.org. All free and key-less; the public servers are rate-limited, so self-host them for heavy traffic.
- Leaflet loads from cdnjs. For a stricter setup, download it into `public/` and change the two tags in `index.html`.
- "Quiet" and "scenic" are inferred from place type (OpenStreetMap has no such flags).
