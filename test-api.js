// Tests the Vercel function with a mocked fetch. Usage: node test-api.js
const handler = require('./api/places.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const mkRes = () => ({ code: 200, headers: {}, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; }, setHeader(k, v) { this.headers[k] = v; } });
const run = async (query, fetchImpl) => { global.fetch = fetchImpl; const res = mkRes(); await handler({ query }, res); return res; };

(async () => {
  let calls = [];
  let r = await run({ lat: '12.9716', lon: '77.5946', r: '5000' }, async (url, o) => {
    calls.push(url);
    if (url.includes('overpass-api.de')) throw new TypeError('fetch failed');
    if (url.includes('kumi')) return { ok: false, status: 429 };
    return { ok: true, json: async () => ({ elements: [{ id: 1 }] }) };
  });
  ok(r.code === 200 && r.body.server === 'overpass.private.coffee' && r.body.elements.length === 1, 'falls through failing servers to a working one');
  ok(/s-maxage=3600/.test(r.headers['Cache-Control']), 'sets an edge cache header');
  ok(calls.length === 3, 'stops after the first success');

  r = await run({ lat: '12.9716', lon: '77.5946', r: '5000' }, async (url, o) => { const q = o.body.get('data'); ok(q.includes('12.972,77.595'), 'coordinates rounded to 3 decimals before leaving'); return { ok: true, json: async () => ({ elements: [] }) }; });

  r = await run({ lat: '1', lon: '1', r: '5000' }, async () => { throw new TypeError('down'); });
  ok(r.code === 502 && r.body.failures.length === 4, 'reports 502 with each failure when every server is down');

  for (const bad of [{ lat: 'x', lon: '1', r: '1000' }, { lat: '95', lon: '1', r: '1000' }, { lat: '1', lon: '1', r: '999999' }, {}]) {
    r = await run(bad, async () => { throw new Error('must not be called'); });
    ok(r.code === 400, 'rejects invalid input ' + JSON.stringify(bad));
  }
  console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
})();
