'use strict';

/**
 * Basic integration tests for the MentaCut API.
 * Runs against a temporary in-memory database.
 */

process.env.DB_PATH = ':memory:';
process.env.PORT = '0'; // let OS pick a free port

const http = require('http');
const assert = require('assert');

// Patch listen to get the actual port
const app = require('../server');

// The server is already listening – find the port from the test-server
// We re-create a fresh server for isolation
const testServer = http.createServer(app);

function request(opts, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  await new Promise((res) => testServer.listen(0, '127.0.0.1', res));
  const { port } = testServer.address();
  const base = { host: '127.0.0.1', port };

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅  ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌  ${name}`);
      console.error('     ', err.message);
      failed++;
    }
  }

  console.log('\nMentaCut API Tests\n');

  // ── POST /api/shorten ───────────────────────────────────
  await test('POST /api/shorten – valid URL returns 201 with short_url', async () => {
    const r = await request(
      { ...base, path: '/api/shorten', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { url: 'https://www.example.com/some/long/path?q=1' }
    );
    assert.strictEqual(r.status, 201);
    assert.ok(r.body.short_url, 'should have short_url');
    assert.ok(r.body.code, 'should have code');
    assert.strictEqual(r.body.original, 'https://www.example.com/some/long/path?q=1');
    assert.strictEqual(r.body.clicks, 0);
  });

  await test('POST /api/shorten – same URL returns existing code (200)', async () => {
    const url = 'https://www.example.com/dedup-test';
    const r1 = await request(
      { ...base, path: '/api/shorten', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { url }
    );
    const r2 = await request(
      { ...base, path: '/api/shorten', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { url }
    );
    assert.strictEqual(r1.body.code, r2.body.code, 'should reuse the same code');
  });

  await test('POST /api/shorten – missing URL returns 400', async () => {
    const r = await request(
      { ...base, path: '/api/shorten', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      {}
    );
    assert.strictEqual(r.status, 400);
    assert.ok(r.body.error);
  });

  await test('POST /api/shorten – invalid URL returns 400', async () => {
    const r = await request(
      { ...base, path: '/api/shorten', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { url: 'not-a-url' }
    );
    assert.strictEqual(r.status, 400);
    assert.ok(r.body.error);
  });

  // ── GET /api/stats/:code ────────────────────────────────
  await test('GET /api/stats/:code – returns stats for known code', async () => {
    const r1 = await request(
      { ...base, path: '/api/shorten', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { url: 'https://stats-test.example.com/' }
    );
    const { code } = r1.body;
    const r2 = await request({ ...base, path: `/api/stats/${code}`, method: 'GET' });
    assert.strictEqual(r2.status, 200);
    assert.strictEqual(r2.body.code, code);
    assert.strictEqual(r2.body.clicks, 0);
  });

  await test('GET /api/stats/:code – unknown code returns 404', async () => {
    const r = await request({ ...base, path: '/api/stats/UNKNOWN1', method: 'GET' });
    assert.strictEqual(r.status, 404);
  });

  // ── GET /api/stats ──────────────────────────────────────
  await test('GET /api/stats – returns global counts', async () => {
    const r = await request({ ...base, path: '/api/stats', method: 'GET' });
    assert.strictEqual(r.status, 200);
    assert.ok(typeof r.body.total_urls === 'number');
    assert.ok(typeof r.body.total_clicks === 'number');
  });

  // ── Redirect ────────────────────────────────────────────
  await test('GET /:code – redirects to original URL', async () => {
    const r1 = await request(
      { ...base, path: '/api/shorten', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { url: 'https://redirect-test.example.com/' }
    );
    const { code } = r1.body;
    const r2 = await request({ ...base, path: `/${code}`, method: 'GET' });
    assert.strictEqual(r2.status, 301);
    assert.strictEqual(r2.headers.location, 'https://redirect-test.example.com/');
  });

  await test('GET /:code – increments click count on redirect', async () => {
    const r1 = await request(
      { ...base, path: '/api/shorten', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { url: 'https://clicks-test.example.com/' }
    );
    const { code } = r1.body;
    // First redirect
    await request({ ...base, path: `/${code}`, method: 'GET' });
    // Second redirect
    await request({ ...base, path: `/${code}`, method: 'GET' });
    const stats = await request({ ...base, path: `/api/stats/${code}`, method: 'GET' });
    assert.strictEqual(stats.body.clicks, 2);
  });

  await test('GET /unknown – redirects to /?error=not_found', async () => {
    const r = await request({ ...base, path: '/AAAAAAA', method: 'GET' });
    assert.ok(r.headers.location.includes('error=not_found'));
  });

  // ── Summary ─────────────────────────────────────────────
  console.log(`\n${passed} passed, ${failed} failed\n`);
  testServer.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
