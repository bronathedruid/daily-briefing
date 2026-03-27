#!/usr/bin/env node
/**
 * generate-newspaper.mjs — Generates the newspaper-style HTML page
 * Uses the new newspaper data format with embedded article array
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const PUBLIC_DIR = join(ROOT, 'public');

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

function generateVolumeNumber() {
  // Calculate a realistic volume number based on days since project start
  const startDate = new Date('2024-01-01'); // Adjust to your project start
  const today = new Date();
  const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  
  // Assuming daily publication, volume increments every year
  const volume = Math.floor(daysSinceStart / 365) + 194; // Start at a realistic newspaper volume
  const issue = (daysSinceStart % 365) + 1;
  
  return { volume, issue };
}

function formatDateForMasthead(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function generateNewspaperHtml(data) {
  const { volume, issue } = generateVolumeNumber();
  const formattedDate = formatDateForMasthead(data.date);
  
  // Convert articles array to JavaScript format for embedding
  const articlesJs = data.articles.map(([category, title, url, source, time, snippet]) => 
    `["${escapeJs(category)}", "${escapeJs(title)}", "${escapeJs(url)}", "${escapeJs(source)}", "${escapeJs(time)}", "${escapeJs(snippet)}"]`
  ).join(',\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Daily Briefing — ${data.date}</title>
  <style>
    /* --- NEWSPAPER STYLING --- */
    :root {
      --bg-paper: #f4f1ea;
      --bg-paper-light: #fdfcf7;
      --ink: #1a1a1a;
      --ink-light: #4a4a4a;
      --accent: #8b0000;
      --font-headline: 'Georgia', 'Times New Roman', serif;
      --font-body: 'Georgia', serif;
      --font-meta: 'Courier New', Courier, monospace;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body { 
      background-color: var(--bg-paper); 
      color: var(--ink); 
      font-family: var(--font-body); 
      line-height: 1.6; 
      padding: 2rem;
      overflow-x: hidden;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .newspaper-container {
      position: relative; 
      width: 100%;
      max-width: 1300px;
      background:
        radial-gradient(circle at top left, rgba(120, 96, 58, 0.05), transparent 18%),
        radial-gradient(circle at top right, rgba(120, 96, 58, 0.045), transparent 16%),
        radial-gradient(circle at bottom left, rgba(90, 72, 44, 0.055), transparent 18%),
        radial-gradient(circle at bottom right, rgba(90, 72, 44, 0.06), transparent 20%),
        linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.015)),
        var(--bg-paper-light);
      padding: 2rem 3rem 4rem 3rem; 
      box-shadow: 0 4px 15px rgba(0,0,0,0.05), inset 0 0 50px rgba(0,0,0,0.02), inset 0 0 0 1px rgba(124, 101, 65, 0.08);
      border: 1px solid #ddd5c6;
      perspective: 2500px;
      overflow: hidden;
      isolation: isolate;
    }

    .newspaper-container::before,
    .newspaper-container::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .newspaper-container::before {
      background:
        radial-gradient(120% 14px at 50% 0%, rgba(76, 55, 30, 0.14), transparent 70%),
        radial-gradient(120% 16px at 50% 100%, rgba(76, 55, 30, 0.16), transparent 72%),
        radial-gradient(16px 120% at 0% 50%, rgba(76, 55, 30, 0.13), transparent 68%),
        radial-gradient(18px 120% at 100% 50%, rgba(76, 55, 30, 0.14), transparent 70%);
      mix-blend-mode: multiply;
      opacity: 0.7;
    }

    .newspaper-container::after {
      inset: 6px;
      background:
        repeating-linear-gradient(90deg,
          transparent 0 22px,
          rgba(92, 72, 41, 0.018) 22px 23px,
          transparent 23px 47px,
          rgba(92, 72, 41, 0.012) 47px 48px),
        radial-gradient(circle at 8% 12%, rgba(92, 72, 41, 0.05) 0 1px, transparent 2px),
        radial-gradient(circle at 91% 18%, rgba(92, 72, 41, 0.045) 0 1.2px, transparent 2.2px),
        radial-gradient(circle at 14% 88%, rgba(92, 72, 41, 0.04) 0 1px, transparent 2px),
        radial-gradient(circle at 87% 84%, rgba(92, 72, 41, 0.05) 0 1.3px, transparent 2.3px);
      opacity: 0.45;
      mask: linear-gradient(to bottom, transparent, black 18px, black calc(100% - 18px), transparent),
            linear-gradient(to right, transparent, black 18px, black calc(100% - 18px), transparent);
      mask-composite: intersect;
      -webkit-mask: linear-gradient(to bottom, transparent, black 18px, black calc(100% - 18px), transparent),
                    linear-gradient(to right, transparent, black 18px, black calc(100% - 18px), transparent);
      -webkit-mask-composite: source-in;
    }

    /* Masthead & Hero Image */
    .masthead {
      text-align: center;
      border-bottom: 4px double var(--ink);
      margin-bottom: 2rem;
      padding-bottom: 1rem;
    }

    .masthead-meta {
      display: flex;
      justify-content: space-between;
      text-transform: uppercase;
      font-family: var(--font-meta);
      font-size: 0.8rem;
      border-top: 1px solid var(--ink);
      border-bottom: 1px solid var(--ink);
      padding: 0.5rem 0;
      margin-bottom: 1rem;
      color: var(--ink-light);
    }

    .masthead h1 {
      font-family: var(--font-headline);
      font-size: 4.5rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -2px;
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .hero-container {
      margin-top: 1.5rem;
      border-top: 2px solid var(--ink);
      border-bottom: 2px solid var(--ink);
      padding: 0.5rem 0;
    }

    .hero-image {
      width: 100%;
      height: 350px;
      object-fit: cover;
      filter: grayscale(100%) contrast(120%) brightness(0.9); 
      display: block;
    }

    .hero-caption {
      font-family: var(--font-meta);
      font-size: 0.75rem;
      text-align: right;
      margin-top: 0.25rem;
      color: var(--ink-light);
      text-transform: uppercase;
    }

    /* Pages & Columns */
    .page-content {
      column-count: 3;
      column-gap: 3rem;
      column-rule: 1px solid #d3cec1;
      min-height: 60vh; 
      transform-style: preserve-3d;
    }

    /* --- 3D PAGE TURN ANIMATIONS --- */
    .flip-next-out {
      animation: flipOutLeft 0.5s ease-in forwards;
      transform-origin: left center;
    }
    .flip-next-in {
      animation: flipInRight 0.5s ease-out forwards;
      transform-origin: right center;
    }
    .flip-prev-out {
      animation: flipOutRight 0.5s ease-in forwards;
      transform-origin: right center;
    }
    .flip-prev-in {
      animation: flipInLeft 0.5s ease-out forwards;
      transform-origin: left center;
    }

    @keyframes flipOutLeft {
      0% { transform: rotateY(0deg); opacity: 1; }
      100% { transform: rotateY(-90deg); opacity: 0; }
    }
    @keyframes flipInRight {
      0% { transform: rotateY(90deg); opacity: 0; }
      100% { transform: rotateY(0deg); opacity: 1; }
    }
    @keyframes flipOutRight {
      0% { transform: rotateY(0deg); opacity: 1; }
      100% { transform: rotateY(90deg); opacity: 0; }
    }
    @keyframes flipInLeft {
      0% { transform: rotateY(-90deg); opacity: 0; }
      100% { transform: rotateY(0deg); opacity: 1; }
    }

    /* Articles */
    .article {
      break-inside: avoid;
      margin-bottom: 2.5rem;
    }

    .article-category {
      font-family: var(--font-meta);
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: bold;
      margin-bottom: 0.3rem;
      display: block;
      border-bottom: 1px solid #d3cec1;
      padding-bottom: 0.2rem;
    }

    .article-title {
      font-family: var(--font-headline);
      font-size: 1.3rem;
      font-weight: bold;
      line-height: 1.2;
      margin-bottom: 0.5rem;
      margin-top: 0.5rem;
      color: var(--ink);
      text-decoration: none;
      display: block;
    }

    .article-title:hover {
      text-decoration: underline;
    }

    .article-snippet {
      font-size: 0.95rem;
      color: var(--ink-light);
      text-align: justify;
      display: -webkit-box;
      -webkit-line-clamp: 4; 
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }

    .article-meta-foot {
      display: flex;
      justify-content: space-between;
      font-style: italic;
      font-size: 0.8rem;
      color: var(--ink-light);
      margin-top: 0.5rem;
    }

    /* --- DOG-EAR PAGE FOLDS --- */
    .page-corner {
      position: absolute;
      bottom: 0;
      width: 0;
      height: 0;
      border-style: solid;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      z-index: 10;
    }

    .page-corner::before {
      content: '';
      position: absolute;
      opacity: 0;
      font-family: var(--font-meta);
      font-size: 0.8rem;
      font-weight: bold;
      color: var(--ink);
      white-space: nowrap;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    /* Bottom Right (Next Page) */
    .corner-right {
      right: 0;
      border-width: 0 0 60px 60px;
      border-color: transparent transparent #e0dbce #fdfcf7;
      box-shadow: -4px -4px 6px rgba(0,0,0,0.05);
    }

    .corner-right::before {
      content: 'Turn Page ➔';
      bottom: -40px;
      right: 10px;
    }

    .corner-right:hover {
      border-width: 0 0 90px 90px;
      box-shadow: -6px -6px 12px rgba(0,0,0,0.1);
    }

    .corner-right:hover::before { opacity: 1; }

    /* Bottom Left (Previous Page) */
    .corner-left {
      left: 0;
      bottom: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 0 60px 60px;
      border-color: transparent transparent #e0dbce transparent;
      filter: drop-shadow(4px -4px 6px rgba(0,0,0,0.08));
      transform: none;
      z-index: 12;
    }
    
    .corner-left::before {
      content: '⬅️ Back';
      bottom: -50px;
      left: -2px;
      transform: none;
      transform-origin: bottom left;
    }

    .corner-left:hover {
      border-width: 0 0 88px 88px;
      filter: drop-shadow(6px -6px 10px rgba(0,0,0,0.12));
    }

    .corner-left:hover::before { opacity: 1; }

    /* Hidden state for disabled corners */
    .corner-hidden {
      opacity: 0 !important;
      pointer-events: none;
    }

    .page-indicator {
      text-align: center;
      font-family: var(--font-meta);
      font-size: 0.85rem;
      margin-top: 2rem;
      color: var(--ink-light);
      border-top: 1px solid #d3cec1;
      padding-top: 1rem;
    }

    /* --- PRINTING ANIMATION STYLES --- */
    .reveal-title, .reveal-body { opacity: 0; }

    .is-printing-title {
      visibility: visible;
      opacity: 1;
      clip-path: inset(0 100% 0 0);
      animation: printWipe 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
    }

    .is-printing-body {
      visibility: visible;
      opacity: 1;
      clip-path: inset(0 0 100% 0);
      animation: printLines 1.2s steps(5, end) forwards;
    }

    @keyframes printWipe {
      0% { clip-path: inset(0 100% 0 0); opacity: 1; }
      100% { clip-path: inset(-10% -10% -10% -10%); opacity: 1; }
    }

    @keyframes printLines {
      0% { clip-path: inset(0 0 100% 0); opacity: 1; }
      100% { clip-path: inset(-10% -10% -10% -10%); opacity: 1; }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .page-content { column-count: 2; }
      .masthead h1 { font-size: 3.5rem; }
    }
    @media (max-width: 650px) {
      .page-content { column-count: 1; }
      .masthead h1 { font-size: 2.2rem; }
      .newspaper-container { padding: 1.5rem; padding-bottom: 4rem; }
      .masthead-meta { font-size: 0.65rem; }
      .hero-image { height: 200px; }
      .corner-right::before, .corner-left::before { display: none; }
    }
  </style>
</head>
<body>
  <div class="newspaper-container">
    <header class="masthead">
      <div class="masthead-meta reveal-title">
        <span>Vol. ${toRoman(volume)}, No. ${issue}</span>
        <span>Ormond Beach, FL</span>
        <span>${formattedDate}</span>
      </div>
      <h1 class="reveal-title">The Daily Briefing</h1>
      <div class="masthead-meta reveal-title" style="justify-content: center; border: none; font-style: italic;">
        "All ${data.totalCount} articles fit to print."
      </div>
      
      <div class="hero-container reveal-title" id="front-page-hero">
        <img src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop" alt="Vintage Typewriter" class="hero-image">
        <div class="hero-caption">Global Tech Infrastructure & News Updates</div>
      </div>
    </header>

    <main class="page-content" id="newspaper-grid">
    </main>

    <div class="page-indicator" id="pageIndicator">Page 1 of X</div>

    <div class="page-corner corner-left corner-hidden" id="cornerLeft" onclick="changePage(-1)"></div>
    <div class="page-corner corner-right" id="cornerRight" onclick="changePage(1)"></div>
  </div>

  <script>
    // --- DATA PAYLOAD ---
    const db = [
      ${articlesJs}
    ];

    const ARTICLES_PER_PAGE = 12; 
    const totalPages = Math.ceil(db.length / ARTICLES_PER_PAGE);
    let currentPage = 1;
    let isFlipping = false;

    function renderPage(pageNum) {
      const grid = document.getElementById('newspaper-grid');
      grid.innerHTML = ''; 

      // Toggle Hero Image visibility
      const hero = document.getElementById('front-page-hero');
      hero.style.display = pageNum === 1 ? 'block' : 'none';

      const startIndex = (pageNum - 1) * ARTICLES_PER_PAGE;
      const endIndex = startIndex + ARTICLES_PER_PAGE;
      const pageArticles = db.slice(startIndex, endIndex);

      pageArticles.forEach(item => {
        const [category, title, url, source, time, snippet] = item;
        
        const articleHTML = \`
        <article class="article">
          <span class="article-category reveal-title">\${category}</span>
          <a href="\${url}" target="_blank" class="article-title reveal-title">\${title}</a>
          <p class="article-snippet reveal-body">\${snippet}</p>
          <div class="article-meta-foot reveal-body">
            <span>\${source}</span>
            <span>\${time}</span>
          </div>
        </article>
        \`;
        grid.insertAdjacentHTML('beforeend', articleHTML);
      });

      // Update Pagination UI
      document.getElementById('pageIndicator').innerText = \`Page \${pageNum} of \${totalPages}\`;

      // Show/Hide Dog Ears
      const leftEar = document.getElementById('cornerLeft');
      const rightEar = document.getElementById('cornerRight');
      
      pageNum === 1 ? leftEar.classList.add('corner-hidden') : leftEar.classList.remove('corner-hidden');
      pageNum === totalPages ? rightEar.classList.add('corner-hidden') : rightEar.classList.remove('corner-hidden');
    }

    function triggerPrintAnimation(container) {
      const titles = container.querySelectorAll('.reveal-title');
      const bodies = container.querySelectorAll('.reveal-body');
      
      titles.forEach(el => { el.classList.remove('is-printing-title'); void el.offsetWidth; });
      bodies.forEach(el => { el.classList.remove('is-printing-body'); void el.offsetWidth; });

      let titleDelay = 50;
      titles.forEach((el) => {
        setTimeout(() => el.classList.add('is-printing-title'), titleDelay);
        titleDelay += 30; 
      });

      let bodyDelay = titleDelay + 200; 
      bodies.forEach((el) => {
        setTimeout(() => el.classList.add('is-printing-body'), bodyDelay);
        bodyDelay += 100; 
      });
    }

    function changePage(direction) {
      if (isFlipping) return;
      isFlipping = true;

      const grid = document.getElementById('newspaper-grid');
      
      const outClass = direction === 1 ? 'flip-next-out' : 'flip-prev-out';
      const inClass = direction === 1 ? 'flip-next-in' : 'flip-prev-in';

      grid.classList.add(outClass);

      setTimeout(() => {
        currentPage += direction;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        renderPage(currentPage);
        
        grid.classList.remove(outClass);
        grid.classList.add(inClass);

        setTimeout(() => {
          grid.classList.remove(inClass);
          isFlipping = false;
          
          triggerPrintAnimation(grid);
        }, 500);

      }, 500); 
    }

    // Initialize
    document.addEventListener("DOMContentLoaded", () => {
      const mastheadTitles = document.querySelectorAll('.masthead .reveal-title');
      let mDelay = 0;
      mastheadTitles.forEach(el => {
        setTimeout(() => el.classList.add('is-printing-title'), mDelay);
        mDelay += 100;
      });

      renderPage(currentPage);
      triggerPrintAnimation(document.getElementById('newspaper-grid'));
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && currentPage > 1) changePage(-1);
      if (e.key === 'ArrowRight' && currentPage < totalPages) changePage(1);
    });
  </script>
</body>
</html>`;
}

// Helper function to convert numbers to Roman numerals for volume
function toRoman(num) {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += numerals[i];
      num -= values[i];
    }
  }
  return result;
}

function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  
  const dataPath = join(DATA_DIR, 'newspaper-latest.json');
  let data;
  try {
    data = JSON.parse(readFileSync(dataPath, 'utf8'));
  } catch (err) {
    console.error('No newspaper-latest.json found. Run the enhanced fetch script first.');
    process.exit(1);
  }
  
  const html = generateNewspaperHtml(data);
  const outPath = join(PUBLIC_DIR, 'index.html');
  writeFileSync(outPath, html);
  console.log(`✅ Generated newspaper: ${outPath} (${(html.length / 1024).toFixed(1)}KB)`);
  
  // Copy data file for client-side access if needed
  writeFileSync(join(PUBLIC_DIR, 'data.json'), readFileSync(dataPath));
  console.log('✅ Copied data.json to public/');
}

main();