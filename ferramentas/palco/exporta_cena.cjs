// Exporta do palco web as poses do público/elenco, luzes e o conteúdo do LED dos três universos,
// para montar os renders "foto" no Blender (render_cycles.py).
// uso: NODE_PATH=$(npm root -g) node exporta_cena.js <url-do-palco> <pasta-saida>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 1024, height: 512 } })).newPage();
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto(url, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__palco && document.getElementById('carregando').classList.contains('fim'), null, { timeout: 1800000 });
  for (const u of [0, 1, 2]) {
    await page.evaluate(u => { const P = window.__palco; P.pausa(true); P.instantaneo(u, 6); P.irCam('ponto', 0); }, u);
    for (let i = 0; i < 3; i++) await page.evaluate(() => new Promise(r => requestAnimationFrame(() => r())));
    const d = await page.evaluate(() => window.__palco.exportaCena());
    fs.writeFileSync(`${out}/cena-${u}.json`, JSON.stringify(d)); console.log('cena', u);
  }
  for (const u of [0, 1, 2]) {
    const d = await page.evaluate(u => window.__palco.quadroMidia(u, u === 0 ? 1.68 : 6), u);
    fs.writeFileSync(`${out}/led-${u}.png`, Buffer.from(d.split(',')[1], 'base64')); console.log('led', u);
  }
  await browser.close();
})();
