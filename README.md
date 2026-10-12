# TouchGrass

Checks the weather and what is nearby, then suggests one outdoor outing, or a small indoor activity when the weather says stay in.
Static site: no server, no build step, no API keys. Preferences and history stay in the browser.

```
public/index.html   the whole app
test-site.js        end-to-end test in a simulated browser (npm test)
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

## Notes
- Weather: Open-Meteo. Places: OpenStreetMap Overpass. Routes: routing.openstreetmap.de. Tiles: openstreetmap.org. All free and key-less; the public servers are rate-limited, so self-host them for heavy traffic.
- Leaflet loads from cdnjs. For a stricter setup, download it into `public/` and change the two tags in `index.html`.
- "Quiet" and "scenic" are inferred from place type (OpenStreetMap has no such flags).
