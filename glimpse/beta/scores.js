// Glimpse scores client. Never throws; every call degrades to local/estimated data.
// Usage: GlimpseScores.init({ api: 'https://glimpse-scores.<sub>.workers.dev' })
(function (g) {
  const KEY_ID = 'glimpse.clientId'; let KEY_Q = 'glimpse.scoreQueue';
  const TIERS = [[0.6, 'Common', 50], [0.35, 'Uncommon', 80], [0.15, 'Rare', 120], [0, 'Epic', 180]];
  let API = null, MIN = 30, TIMEOUT = 4000, NS = null;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  function clientId() {
    let id = ls.get(KEY_ID);
    if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
      const a = new Uint8Array(16); crypto.getRandomValues(a);
      id = [...a].map(x => x.toString(16).padStart(2, '0')).join(''); ls.set(KEY_ID, id);
    }
    return id;
  }
  async function req(path, opts) {
    if (!API || (typeof navigator !== 'undefined' && navigator.onLine === false)) throw new Error('offline');
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), TIMEOUT);
    try { return await fetch(API + path, { ...opts, signal: ctl.signal }); } finally { clearTimeout(t); }
  }
  function queue() { try { return JSON.parse(ls.get(KEY_Q) || '[]'); } catch { return []; } }
  async function send(item) {
    const r = await req('/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    return r.status === 201 || r.status === 409 || r.status === 400; // 400/409: never retry
  }
  async function flush() {
    const q = queue(), keep = [];
    for (const it of q) { try { if (!(await send(it))) keep.push(it); } catch { keep.push(it); } }
    ls.set(KEY_Q, JSON.stringify(keep.slice(-12)));
  }
  const S = {
    init(o = {}) { API = o.api ? o.api.replace(/\/$/, '') : null; MIN = o.minPlayers || 30; TIMEOUT = o.timeoutMs || 4000; NS = o.ns === 'beta' ? 'beta' : null; KEY_Q = NS ? 'glimpse.scoreQueue.beta' : 'glimpse.scoreQueue'; flush(); if (g.addEventListener) g.addEventListener('online', flush); },
    async submit({ day, sceneId, found, score }) {
      const item = { day, sceneId, found: [...new Set(found)], score: Math.round(score), clientId: clientId() }; if (NS) item.ns = NS;
      try { if (await send(item)) return { ok: true }; } catch {}
      const q = queue(); q.push(item); ls.set(KEY_Q, JSON.stringify(q.slice(-12))); return { ok: false, queued: true };
    },
    async stats(day) {
      try { const r = await req('/stats?day=' + encodeURIComponent(day) + (NS ? '&ns=' + NS : '')); if (r.ok) return await r.json(); } catch {}
      return null;
    },
    // Rarity for one prop: real share if enough players, else the estimated tier from the scene data.
    rarity(stats, sceneId, propId, estimatedTier) {
      const s = stats && stats.scenes && stats.scenes[sceneId];
      if (!s || s.players < MIN) return { tier: estimatedTier, source: 'estimated' };
      const share = s.foundShare[propId] || 0;
      const [, tier, pts] = TIERS.find(([t]) => share >= t);
      return { tier, points: pts, share, source: 'players' };
    },
    // "You beat X% of players" or null when not enough data.
    percentile(stats, sceneId, score) {
      const s = stats && stats.scenes && stats.scenes[sceneId];
      if (!s || s.players < MIN) return null;
      let below = 0; for (const b of s.histogram.bins) { if (b.from + s.histogram.binSize <= score) below += b.count; else if (b.from <= score) below += b.count / 2; }
      return Math.round(100 * below / s.players);
    },
    // Full histogram for drawing a curve, or null when too few players.
    curve(stats, sceneId) { const s = stats && stats.scenes && stats.scenes[sceneId]; return s && s.players >= MIN ? s.histogram : null; },
    _clientId: clientId,
  };
  g.GlimpseScores = S;
  if (typeof module !== 'undefined') module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
