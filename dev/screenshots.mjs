// Onboards the dev Home Assistant (if needed), logs in, applies the EcoVolt theme,
// checks the theme really took effect, and writes light/dark screenshots to /out.
// Run with `make screenshots` (inside the compose network).
import { chromium } from 'playwright';

const HA = process.env.HA_URL ?? 'http://localhost:8123';
const OUT = process.env.OUT_DIR ?? '/out';
const CLIENT_ID = `${HA}/`;
const USER = { name: 'Dev', username: 'dev', password: 'dev-password', language: 'en' };

let failed = 0;
const check = (ok, msg) => { console.log(`  ${ok ? '✓' : '✗'} ${msg}`); if (!ok) failed++; };

async function json(path, opts = {}) {
  const res = await fetch(`${HA}${path}`, opts);
  if (!res.ok) throw new Error(`${opts.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}
const form = (o) => ({ method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(o) });
const post = (path, body, token) => json(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
  body: JSON.stringify(body),
});

async function getTokens() {
  const steps = await json('/api/onboarding');
  if (!steps.find((s) => s.step === 'user')?.done) {
    console.log('Onboarding fresh instance…');
    const { auth_code } = await post('/api/onboarding/users', { client_id: CLIENT_ID, ...USER });
    const t = await json('/auth/token', form({ grant_type: 'authorization_code', code: auth_code, client_id: CLIENT_ID }));
    await post('/api/onboarding/core_config', {}, t.access_token);
    await post('/api/onboarding/analytics', {}, t.access_token);
    await post('/api/onboarding/integration', { client_id: CLIENT_ID, redirect_uri: `${CLIENT_ID}?auth_callback=1` }, t.access_token);
  }
  const flow = await post('/auth/login_flow', { client_id: CLIENT_ID, handler: ['homeassistant', null], redirect_uri: `${CLIENT_ID}?auth_callback=1` });
  const done = await post(`/auth/login_flow/${flow.flow_id}`, { client_id: CLIENT_ID, username: USER.username, password: USER.password });
  return json('/auth/token', form({ grant_type: 'authorization_code', code: done.result, client_id: CLIENT_ID }));
}

const tokens = await getTokens();
await post('/api/services/frontend/set_theme', { name: 'EcoVolt' }, tokens.access_token);
await post('/api/services/frontend/set_theme', { name: 'EcoVolt', mode: 'dark' }, tokens.access_token);

const browser = await chromium.launch();

async function shoot(mode, viewport, pages) {
  const ctx = await browser.newContext({ viewport, colorScheme: mode, deviceScaleFactor: 1 });
  await ctx.addInitScript(([t, url, cid]) => {
    localStorage.setItem('hassTokens', JSON.stringify({ ...t, hassUrl: url, clientId: cid, expires: Date.now() + t.expires_in * 1000 }));
  }, [tokens, HA, CLIENT_ID]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('  [pageerror]', e.message));
  for (const [name, path] of pages) {
    await page.goto(`${HA}${path}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${name}-${mode}.png` });
  }
  return { ctx, page };
}

const DESKTOP = { width: 1440, height: 1000 };
for (const mode of ['light', 'dark']) {
  console.log(`\n${mode} mode:`);
  const { ctx, page } = await shoot(mode, DESKTOP, [['settings', '/config/dashboard'], ['demo', '/ecovolt-demo/home']]);
  const r = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    const v = (n) => css.getPropertyValue(n).trim();
    const deep = (root, sel) => { // find first match through shadow roots
      const hit = root.querySelector(sel); if (hit) return hit;
      for (const el of root.querySelectorAll('*')) if (el.shadowRoot) { const f = deep(el.shadowRoot, sel); if (f) return f; }
      return null;
    };
    const img = deep(document, 'img[src*="/local/ecovolt/"]');
    const gauge = deep(document, 'paul-gauge-card');
    return {
      primary: v('--primary-color'), body: v('--ha-font-family-body'), solar: v('--energy-solar-color'),
      fontLoaded: document.fonts.check('16px Montserrat'),
      fontStyle: !!document.getElementById('ecovolt-fonts'),
      bodyFont: getComputedStyle(document.body).fontFamily,
      logo: img?.getAttribute('src') ?? null,
      gaugeBg: gauge?.shadowRoot?.querySelector('ha-card')?.style.backgroundColor ?? null,
    };
  });
  check(r.primary === '#009f17', `--primary-color is brand green (got ${r.primary})`);
  check(r.body.startsWith('Montserrat'), `--ha-font-family-body starts with Montserrat (got ${r.body})`);
  check(r.fontStyle, 'ecovolt-fonts.js registered @font-face');
  check(r.fontLoaded, 'Montserrat font file loaded');
  check(r.bodyFont.includes('Montserrat'), `body renders in Montserrat (got ${r.bodyFont})`);
  check(r.solar === '#ffbb00', `--energy-solar-color is amber (got ${r.solar})`);
  const wantLogo = mode === 'dark' ? 'ecovolt-banner-white.svg' : 'ecovolt-banner.svg';
  check(r.logo?.endsWith(wantLogo), `logo card shows ${wantLogo} (got ${r.logo})`);
  check(r.gaugeBg !== null && r.gaugeBg !== '', `gauge card resolved a theme colour (got ${r.gaugeBg})`);
  await ctx.close();
}

console.log('\nmobile:');
for (const mode of ['light', 'dark']) {
  const { ctx } = await shoot(mode, { width: 390, height: 844 }, [['mobile', '/ecovolt-demo/home']]);
  await ctx.close();
}
console.log(`  screenshots written to ${OUT}`);

await browser.close();
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll theme checks passed.');
process.exit(failed ? 1 : 0);
