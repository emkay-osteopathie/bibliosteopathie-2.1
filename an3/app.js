/* ── Accordions (phase / tech / test cards) ── */
function togglePhase(id) { var el = document.getElementById(id); if (el) el.classList.toggle('open'); }
function toggleTest(id)  { var el = document.getElementById(id); if (el) el.classList.toggle('open'); }

/* ── Accent-insensitive helpers ── */
var ACCENT_MAP = { 'à':'a','â':'a','ä':'a','á':'a','é':'e','è':'e','ê':'e','ë':'e','î':'i','ï':'i','ì':'i','í':'i',
  'ô':'o','ö':'o','ò':'o','ó':'o','ù':'u','û':'u','ü':'u','ú':'u','ç':'c','ñ':'n',
  'À':'a','Â':'a','Ä':'a','Á':'a','É':'e','È':'e','Ê':'e','Ë':'e','Î':'i','Ï':'i','Ì':'i','Í':'i',
  'Ô':'o','Ö':'o','Ò':'o','Ó':'o','Ù':'u','Û':'u','Ü':'u','Ú':'u','Ç':'c','Ñ':'n' };
function foldText(s) {
  var out = '';
  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    out += (ACCENT_MAP[c] || c).toLowerCase();
  }
  return out;
}

/* ── Search index (search-data.json, shared by hub + all category pages) ── */
var _searchIndex = null;
function loadSearchIndex(basePath, cb) {
  if (_searchIndex) { cb(_searchIndex); return; }
  fetch(basePath + 'search-data.json').then(function (r) { return r.json(); }).then(function (data) {
    data.forEach(function (e) { e.folded = foldText(e.text); });
    _searchIndex = data;
    cb(data);
  }).catch(function () { cb([]); });
}

function runSearch(query, index, limit) {
  var q = foldText(query.trim());
  if (!q) return [];
  var results = [];
  for (var i = 0; i < index.length; i++) {
    var entry = index[i];
    var pos = entry.folded.indexOf(q);
    if (pos !== -1) {
      var start = Math.max(0, pos - 40);
      var end = Math.min(entry.text.length, pos + q.length + 70);
      var snippet = (start > 0 ? '…' : '') + entry.text.slice(start, end) + (end < entry.text.length ? '…' : '');
      results.push({ entry: entry, pos: pos, snippet: snippet });
    }
  }
  results.sort(function (a, b) { return a.pos - b.pos; });
  return results.slice(0, limit || 30);
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}

function boldTerm(snippet, term) {
  var folded = foldText(snippet);
  var q = foldText(term);
  var idx = folded.indexOf(q);
  if (idx === -1) return escapeHtml(snippet);
  return escapeHtml(snippet.slice(0, idx)) + '<mark>' + escapeHtml(snippet.slice(idx, idx + term.length)) + '</mark>' + escapeHtml(snippet.slice(idx + term.length));
}

/* ── Wire a search input + dropdown panel to the shared index ── */
function initSiteSearch(inputEl, panelEl, basePath) {
  if (!inputEl || !panelEl) return;
  var currentQuery = '';

  inputEl.addEventListener('input', function () {
    var q = inputEl.value;
    currentQuery = q;
    if (!q.trim()) { panelEl.classList.remove('open'); panelEl.innerHTML = ''; return; }
    loadSearchIndex(basePath, function (index) {
      if (currentQuery !== q) return;
      renderResults(runSearch(q, index, 30), q);
    });
  });
  inputEl.addEventListener('focus', function () {
    if (inputEl.value.trim() && panelEl.innerHTML) panelEl.classList.add('open');
  });
  document.addEventListener('click', function (e) {
    if (e.target !== inputEl && !panelEl.contains(e.target)) panelEl.classList.remove('open');
  });

  function renderResults(results, q) {
    if (!results.length) {
      panelEl.innerHTML = '<div class="ssr-empty">Aucun résultat pour « ' + escapeHtml(q) + ' ».</div>';
      panelEl.classList.add('open');
      return;
    }
    panelEl.innerHTML = results.map(function (r) {
      var e = r.entry;
      var href = basePath + e.file + '?highlight=' + encodeURIComponent(q) + '#' + (e.anchor || e.id);
      return '<a class="ssr-item" href="' + href + '">' +
        '<div class="ssr-crumb">' + escapeHtml(e.catLabel) + ' › ' + escapeHtml(e.subLabel) + '</div>' +
        '<div class="ssr-snippet">' + boldTerm(r.snippet, q) + '</div>' +
        '</a>';
    }).join('');
    panelEl.classList.add('open');
  }
}

/* ── Highlight the searched term in-page + scroll to it (after landing via a search result) ── */
function applyHighlightFromURL(scopeEl) {
  var params = new URLSearchParams(location.search);
  var term = params.get('highlight');
  if (!term) return;
  var root = scopeEl || document.body;
  var foldedTerm = foldText(term);
  if (!foldedTerm) return;

  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  var textNodes = [];
  var n;
  while ((n = walker.nextNode())) {
    var p = n.parentNode;
    if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE' || p.tagName === 'MARK')) continue;
    if (n.nodeValue && n.nodeValue.trim()) textNodes.push(n);
  }

  var firstMark = null;
  textNodes.forEach(function (node) {
    var text = node.nodeValue;
    var folded = foldText(text);
    if (folded.indexOf(foldedTerm) === -1) return;

    var frag = document.createDocumentFragment();
    var remaining = text;
    var remFolded = folded;
    while (true) {
      var i = remFolded.indexOf(foldedTerm);
      if (i === -1) { frag.appendChild(document.createTextNode(remaining)); break; }
      frag.appendChild(document.createTextNode(remaining.slice(0, i)));
      var mark = document.createElement('mark');
      mark.className = 'search-hit';
      mark.textContent = remaining.slice(i, i + term.length);
      frag.appendChild(mark);
      if (!firstMark) firstMark = mark;
      remaining = remaining.slice(i + term.length);
      remFolded = remFolded.slice(i + term.length);
    }
    node.parentNode.replaceChild(frag, node);
  });

  if (firstMark) {
    setTimeout(function () {
      firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstMark.classList.add('current');
    }, 200);
  }
}
