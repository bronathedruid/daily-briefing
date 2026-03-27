#!/usr/bin/env node
/**
 * generate-site.mjs — Renders the daily briefing as a static HTML site.
 * Reads data/latest.json and outputs public/index.html
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const PUBLIC_DIR = join(ROOT, 'public');

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function relativeTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffH = Math.round((now - d) / (1000 * 60 * 60));
  if (diffH < 1) return 'just now';
  if (diffH === 1) return '1h ago';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}

function getArchiveDates() {
  try {
    return readdirSync(DATA_DIR)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map(f => f.replace('.json', ''))
      .sort()
      .reverse()
      .slice(0, 14); // last 14 days
  } catch { return []; }
}

function generateHtml(data) {
  const archiveDates = getArchiveDates();
  const totalArticles = Object.values(data.categories).reduce((s, c) => s + c.count, 0);

  const categoryCards = Object.entries(data.categories).map(([id, cat]) => {
    const articles = cat.articles.map(a => `
      <div class="article">
        <div class="article-header">
          <a href="${escapeHtml(a.link)}" target="_blank" rel="noopener" class="article-title">${escapeHtml(a.title)}</a>
          <span class="score" title="Relevance score">${a.score}</span>
        </div>
        <div class="article-meta">
          <span class="source">${escapeHtml(a.source)}</span>
          <span class="time">${relativeTime(a.date)}</span>
        </div>
        ${a.snippet ? `<p class="snippet">${escapeHtml(a.snippet.slice(0, 200))}${a.snippet.length > 200 ? '…' : ''}</p>` : ''}
      </div>
    `).join('');

    return `
      <section class="category" id="${id}">
        <h2>${cat.emoji} ${escapeHtml(cat.label.replace(cat.emoji, '').trim())} <span class="count">${cat.count}</span></h2>
        <div class="articles">${articles}</div>
      </section>
    `;
  }).join('');

  const navLinks = Object.entries(data.categories).map(([id, cat]) =>
    `<a href="#${id}" class="nav-link">${cat.emoji}<span class="nav-label">${escapeHtml(cat.label.replace(cat.emoji, '').trim())}</span><span class="nav-count">${cat.count}</span></a>`
  ).join('');

  const archiveLinks = archiveDates.map(d =>
    `<a href="?date=${d}" class="archive-link">${d}</a>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Briefing — ${data.date}</title>
  <style>
    :root {
      --bg: #0d1117; --bg2: #161b22; --bg3: #21262d;
      --fg: #e6edf3; --fg2: #8b949e; --fg3: #484f58;
      --accent: #58a6ff; --accent2: #3fb950; --accent3: #d29922;
      --border: #30363d; --radius: 8px;
      --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      --mono: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
    }
    [data-theme="light"] {
      --bg: #ffffff; --bg2: #f6f8fa; --bg3: #eaeef2;
      --fg: #1f2328; --fg2: #656d76; --fg3: #8b949e;
      --accent: #0969da; --accent2: #1a7f37; --accent3: #9a6700;
      --border: #d0d7de;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--bg); color: var(--fg); font-family: var(--font); line-height: 1.5; }
    
    .header {
      background: var(--bg2); border-bottom: 1px solid var(--border);
      padding: 1.5rem 2rem; position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    }
    .header-inner { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .header h1 { font-size: 1.4rem; font-weight: 700; }
    .header h1 span { color: var(--accent); }
    .header-meta { color: var(--fg2); font-size: 0.85rem; display: flex; gap: 1.5rem; align-items: center; }
    .header-meta .stat { font-weight: 600; color: var(--accent2); }
    
    .theme-toggle {
      background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius);
      color: var(--fg); padding: 0.4rem 0.8rem; cursor: pointer; font-size: 0.85rem;
    }
    
    .nav {
      background: var(--bg2); border-bottom: 1px solid var(--border);
      padding: 0.75rem 2rem; overflow-x: auto; white-space: nowrap;
      position: fixed; top: var(--header-h, 64px); left: 0; right: 0; z-index: 99;
    }
    .nav-inner { max-width: 1400px; margin: 0 auto; display: flex; gap: 0.5rem; }
    .nav-link {
      display: inline-flex; align-items: center; gap: 0.3rem;
      padding: 0.4rem 0.8rem; border-radius: var(--radius);
      background: var(--bg3); color: var(--fg2); text-decoration: none;
      font-size: 0.8rem; transition: all 0.2s;
    }
    .nav-link:hover { color: var(--fg); background: var(--border); }
    .nav-count { background: var(--bg); padding: 0.1rem 0.4rem; border-radius: 10px; font-size: 0.7rem; font-weight: 600; }
    
    .main { max-width: 1400px; margin: 0 auto; padding: 1.5rem 2rem; }
    
    .category {
      margin-bottom: 2rem; background: var(--bg2); border: 1px solid var(--border);
      border-radius: var(--radius); overflow: hidden;
    }
    .category h2 {
      padding: 1rem 1.25rem; background: var(--bg3); border-bottom: 1px solid var(--border);
      font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;
    }
    .count {
      background: var(--accent); color: var(--bg); padding: 0.1rem 0.5rem;
      border-radius: 10px; font-size: 0.75rem; margin-left: auto;
    }
    
    .articles { padding: 0.5rem; }
    .article {
      padding: 0.75rem; border-radius: 6px; transition: background 0.15s;
    }
    .article:hover { background: var(--bg3); }
    .article + .article { border-top: 1px solid var(--border); }
    .article-header { display: flex; align-items: flex-start; gap: 0.5rem; }
    .article-title { color: var(--accent); text-decoration: none; font-weight: 500; font-size: 0.95rem; flex: 1; }
    .article-title:hover { text-decoration: underline; }
    .score {
      background: var(--bg3); color: var(--fg2); padding: 0.1rem 0.4rem;
      border-radius: 4px; font-size: 0.7rem; font-family: var(--mono); flex-shrink: 0;
    }
    .article-meta { display: flex; gap: 1rem; margin-top: 0.25rem; font-size: 0.8rem; color: var(--fg2); }
    .source { font-weight: 500; }
    .snippet { color: var(--fg2); font-size: 0.85rem; margin-top: 0.3rem; line-height: 1.4; }
    
    .archive {
      margin-top: 2rem; padding: 1.5rem; background: var(--bg2);
      border: 1px solid var(--border); border-radius: var(--radius);
    }
    .archive h3 { margin-bottom: 0.75rem; font-size: 0.95rem; color: var(--fg2); }
    .archive-links { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .archive-link {
      padding: 0.3rem 0.7rem; background: var(--bg3); color: var(--fg2);
      border-radius: var(--radius); text-decoration: none; font-size: 0.8rem;
      font-family: var(--mono);
    }
    .archive-link:hover { color: var(--accent); }
    
    .footer {
      text-align: center; padding: 2rem; color: var(--fg3); font-size: 0.8rem;
      border-top: 1px solid var(--border); margin-top: 2rem;
    }
    .footer a { color: var(--fg2); }
    
    @media (max-width: 768px) {
      .header { padding: 1rem; }
      .nav { padding: 0.5rem 1rem; }
      .main { padding: 1rem; }
      .nav-label { display: none; }
      .header-meta { font-size: 0.75rem; gap: 0.75rem; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <h1>📰 Daily <span>Briefing</span></h1>
      <div class="header-meta">
        <span>${data.date}</span>
        <span><span class="stat">${totalArticles}</span> articles</span>
        <span>Updated ${formatDate(data.generated)}</span>
        <button class="theme-toggle" onclick="toggleTheme()">🌓 Theme</button>
      </div>
    </div>
  </header>
  
  <nav class="nav"><div class="nav-inner">${navLinks}</div></nav>
  <div class="toolbar-spacer"></div>
  
  <main class="main">
    ${categoryCards}
    
    ${archiveDates.length > 1 ? `
    <div class="archive">
      <h3>📅 Archive</h3>
      <div class="archive-links">${archiveLinks}</div>
    </div>` : ''}
  </main>
  
  <footer class="footer">
    <p>Auto-generated by <a href="https://github.com/bronathedruid/daily-briefing">daily-briefing</a> · 
    Powered by RSS feeds & GitHub Actions · Built for Alan</p>
  </footer>
  
  <script>
    function toggleTheme() {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
    // Restore theme preference
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    
    // Measure header+nav and set spacer height
    function fixLayout() {
      const header = document.querySelector('.header');
      const nav = document.querySelector('.nav');
      const spacer = document.querySelector('.toolbar-spacer');
      if (header && nav && spacer) {
        const hh = header.offsetHeight;
        document.documentElement.style.setProperty('--header-h', hh + 'px');
        spacer.style.height = (hh + nav.offsetHeight) + 'px';
        document.documentElement.style.scrollPaddingTop = (hh + nav.offsetHeight + 16) + 'px';
      }
    }
    fixLayout();
    window.addEventListener('resize', fixLayout);
    
    // Handle archive date param
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      // Could fetch historical data if needed
      console.log('Viewing archive:', dateParam);
    }
  </script>
</body>
</html>`;
}

function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  
  const latestPath = join(DATA_DIR, 'latest.json');
  let data;
  try {
    data = JSON.parse(readFileSync(latestPath, 'utf8'));
  } catch (err) {
    console.error('No data/latest.json found. Run `npm run fetch` first.');
    process.exit(1);
  }
  
  const html = generateHtml(data);
  const outPath = join(PUBLIC_DIR, 'index.html');
  writeFileSync(outPath, html);
  console.log(`✅ Generated ${outPath} (${(html.length / 1024).toFixed(1)}KB)`);
  
  // Copy latest.json to public for client-side archive access
  writeFileSync(join(PUBLIC_DIR, 'latest.json'), readFileSync(latestPath));
  console.log('✅ Copied latest.json to public/');
}

main();
