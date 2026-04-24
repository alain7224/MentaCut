'use strict';

const express = require('express');
const path = require('path');
const validUrl = require('valid-url');
const { customAlphabet } = require('nanoid');
const { stmts } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

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
    return res.status(400).json({ error: 'URL is required.' });
  }

  const trimmed = url.trim();

  if (!validUrl.isWebUri(trimmed)) {
    return res.status(400).json({ error: 'Please enter a valid URL (including http:// or https://).' });
  }

  // Re-use an existing short code for the same original URL
  const existing = stmts.findByOriginal.get(trimmed);
  if (existing) {
    return res.json({
      short_url: `${BASE_URL}/${existing.code}`,
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
      return res.status(500).json({ error: 'Could not generate a unique code. Please try again.' });
    }
  } while (stmts.findByCode.get(code));

  stmts.insert.run(code, trimmed);

  return res.status(201).json({
    short_url: `${BASE_URL}/${code}`,
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
    return res.status(404).json({ error: 'Short URL not found.' });
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

app.listen(PORT, () => {
  console.log(`MentaCut running at ${BASE_URL}`);
});

module.exports = app; // for testing
