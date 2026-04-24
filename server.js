'use strict';

const express = require('express');
const path = require('path');
const validUrl = require('valid-url');
const { customAlphabet } = require('nanoid');
const { stmts } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Build the base URL from the request (supports reverse-proxied deployments).
// Falls back to BASE_URL env var, then to localhost.
function getBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host  = req.headers['x-forwarded-host']  || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

// Nanoid with URL-safe alphabet, 7 characters
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 7);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ──────────────────────────────────────────────
// API: shorten a URL
// POST /api/shorten  { url: "https://..." }
// ──────────────────────────────────────────────
app.post('/api/shorten', (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'La URL es obligatoria.' });
  }

  const trimmed = url.trim();

  if (!validUrl.isWebUri(trimmed)) {
    return res.status(400).json({ error: 'Por favor, introduce una URL válida (incluyendo http:// o https://).' });
  }

  // Re-use an existing short code for the same original URL
  const existing = stmts.findByOriginal.get(trimmed);
  if (existing) {
    return res.json({
      short_url: `${getBaseUrl(req)}/${existing.code}`,
      code: existing.code,
      original: existing.original,
      clicks: existing.clicks,
    });
  }

  // Generate a unique code
  let code;
  let attempts = 0;
  do {
    code = nanoid();
    attempts++;
    if (attempts > 10) {
      return res.status(500).json({ error: 'No se pudo generar un código único. Inténtalo de nuevo.' });
    }
  } while (stmts.findByCode.get(code));

  stmts.insert.run(code, trimmed);

  return res.status(201).json({
    short_url: `${getBaseUrl(req)}/${code}`,
    code,
    original: trimmed,
    clicks: 0,
  });
});

// ──────────────────────────────────────────────
// API: get stats for a code
// GET /api/stats/:code
// ──────────────────────────────────────────────
app.get('/api/stats/:code', (req, res) => {
  const row = stmts.findByCode.get(req.params.code);
  if (!row) {
    return res.status(404).json({ error: 'Enlace corto no encontrado.' });
  }
  return res.json({
    code: row.code,
    original: row.original,
    clicks: row.clicks,
    created_at: row.created_at,
  });
});

// ──────────────────────────────────────────────
// API: global stats
// GET /api/stats
// ──────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const row = stmts.stats.get();
  return res.json({
    total_urls: row.total_urls || 0,
    total_clicks: row.total_clicks || 0,
  });
});

// ──────────────────────────────────────────────
// Redirect: /:code  →  original URL
// ──────────────────────────────────────────────
app.get('/:code', (req, res) => {
  const { code } = req.params;

  // Ignore requests for common browser/tool files
  if (code === 'favicon.ico' || code === 'robots.txt') {
    return res.status(204).end();
  }

  const row = stmts.findByCode.get(code);
  if (!row) {
    return res.redirect(`/?error=not_found&code=${encodeURIComponent(code)}`);
  }

  stmts.incrementClicks.run(code);
  return res.redirect(301, row.original);
});

if (require.main === module) {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  app.listen(PORT, () => {
    console.log(`MentaCut running at ${baseUrl}`);
  });
}

module.exports = app; // for testing
