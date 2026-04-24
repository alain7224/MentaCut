/* ─────────────────────────────────────────────────────────
   MentaCut – app.js
   ───────────────────────────────────────────────────────── */
'use strict';

(function () {
  // ── DOM refs ────────────────────────────────────────────
  var form       = document.getElementById('shortenForm');
  var urlInput   = document.getElementById('urlInput');
  var submitBtn  = document.getElementById('submitBtn');
  var btnText    = submitBtn.querySelector('.btn-text');
  var btnSpinner = submitBtn.querySelector('.btn-spinner');
  var formError  = document.getElementById('formError');

  var resultCard     = document.getElementById('resultCard');
  var resultShortUrl = document.getElementById('resultShortUrl');
  var resultOriginal = document.getElementById('resultOriginal');
  var resultClicks   = document.getElementById('resultClicks');
  var resultStatsLink = document.getElementById('resultStatsLink');
  var copyBtn        = document.getElementById('copyBtn');
  var copyText       = document.getElementById('copyText');
  var copyIcon       = document.getElementById('copyIcon');
  var qrCanvas       = document.getElementById('qrCanvas');

  var statUrls   = document.getElementById('statUrls');
  var statClicks = document.getElementById('statClicks');

  document.getElementById('footerYear').textContent = new Date().getFullYear();

  // ── Show URL-not-found error from redirect ──────────────
  var params = new URLSearchParams(window.location.search);
  if (params.get('error') === 'not_found') {
    var missing = params.get('code') || '';
    showError('El enlace corto "' + missing + '" no existe o ha expirado.');
    history.replaceState(null, '', '/');
  }

  // ── Load global stats ───────────────────────────────────
  function loadGlobalStats() {
    fetch('/api/stats')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        statUrls.textContent   = formatNumber(data.total_urls);
        statClicks.textContent = formatNumber(data.total_clicks);
      })
      .catch(function () { /* silently ignore */ });
  }
  loadGlobalStats();

  // ── Form submit ─────────────────────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var url = urlInput.value.trim();

    hideError();
    hideResult();

    if (!url) {
      showError('Por favor, introduce una URL.');
      urlInput.focus();
      return;
    }

    // Basic client-side prefix check
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
      urlInput.value = url;
    }

    setLoading(true);

    fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        setLoading(false);
        if (!res.ok) {
          showError(res.data.error || 'Error al acortar el enlace.');
          return;
        }
        showResult(res.data);
        loadGlobalStats();
      })
      .catch(function () {
        setLoading(false);
        showError('Error de conexión. Inténtalo de nuevo.');
      });
  });

  // ── Copy button ─────────────────────────────────────────
  copyBtn.addEventListener('click', function () {
    var shortUrl = resultShortUrl.href;
    if (!shortUrl) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shortUrl).then(showCopied).catch(fallbackCopy.bind(null, shortUrl));
    } else {
      fallbackCopy(shortUrl);
    }
  });

  function showCopied() {
    copyIcon.textContent = '✅';
    copyText.textContent = '¡Copiado!';
    copyBtn.classList.add('copied');
    setTimeout(function () {
      copyIcon.textContent = '📋';
      copyText.textContent = 'Copiar';
      copyBtn.classList.remove('copied');
    }, 2000);
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); showCopied(); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  // ── Helpers ─────────────────────────────────────────────
  function showResult(data) {
    resultShortUrl.href        = data.short_url;
    resultShortUrl.textContent = data.short_url;
    resultOriginal.textContent = '↗ ' + data.original;
    resultClicks.textContent   = data.clicks;
    resultStatsLink.href       = '/api/stats/' + data.code;

    try {
      QRCode.toCanvas(qrCanvas, data.short_url, { width: 128, margin: 4 });
    } catch (e) {
      qrCanvas.style.display = 'none';
    }

    resultCard.hidden = false;
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideResult() {
    resultCard.hidden = true;
  }

  function showError(msg) {
    formError.textContent = msg;
    formError.hidden = false;
  }

  function hideError() {
    formError.hidden = true;
    formError.textContent = '';
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.hidden     = loading;
    btnSpinner.hidden  = !loading;
  }

  function formatNumber(n) {
    if (n == null) return '0';
    return Number(n).toLocaleString('es');
  }
})();
