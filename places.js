// Vercel serverless function: fetches nearby places from OpenStreetMap's Overpass API on the server,
// so visitors whose networks block or throttle the public Overpass servers still get results.
// Same-origin for the site (no CORS), cached at the edge, and it only accepts this one query shape.
const SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Keep in sync with fetchPlaces() in public/index.html (used there as the direct fallback).
const buildQuery = (lat, lon, r) => {
  const a = `(around:${r},${lat},${lon})`;
  return `[out:json][timeout:15];(nwr["leisure"~"^(park|nature_reserve|garden)$"]["name"]${a};nwr["tourism"="viewpoint"]${a};nwr["natural"~"^(water|beach|peak)$"]["name"]${a};nwr["waterway"="waterfall"]${a};);out center 60;`;
};

module.exports = async function handler(req, res) {
  const lat = Number(req.query.lat), lon = Number(req.query.lon), r = Number(req.query.r);
  if (![lat, lon, r].every(Number.isFinite) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || r < 100 || r > 30000) {
    return res.status(400).json({ error: 'invalid lat, lon or r' });
  }
  // Rounded to ~110 m: more cache hits and no more precision than needed.
  const query = buildQuery(lat.toFixed(3), lon.toFixed(3), Math.round(r));
  const failures = [];
  for (const ep of SERVERS) {
    const host = new URL(ep).host, ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 7000);
    try {
      const resp = await fetch(ep, { method: 'POST', body: new URLSearchParams({ data: query }), headers: { 'User-Agent': 'TouchGrass/0.1' }, signal: ctl.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({ server: host, elements: data.elements || [] });
    } catch (e) {
      failures.push(`${host}: ${e.name === 'AbortError' ? 'timed out' : e.message}`);
    } finally { clearTimeout(timer); }
  }
  return res.status(502).json({ error: 'all places servers failed', failures });
};
