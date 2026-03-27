# Implementation Guide - Newspaper Visual Identity

This guide explains how to integrate the newspaper design system with the existing daily briefing site.

## Quick Integration

### 1. CSS Files Integration

Replace the current styles in `generate-site.mjs` with imports to the newspaper system:

```html
<link rel="stylesheet" href="css/newspaper-core.css">
<link rel="stylesheet" href="css/newspaper-layout.css">
<link rel="stylesheet" href="css/newspaper-typography.css">
<link rel="stylesheet" href="css/newspaper-components.css">
<link rel="stylesheet" href="css/newspaper-themes.css">
<link rel="stylesheet" href="css/newspaper-print.css" media="print">
```

### 2. HTML Structure Updates

Update the HTML generation in `generate-site.mjs` to use newspaper classes:

#### Current Structure → Newspaper Structure

```javascript
// Replace current header with masthead
function generateMasthead(data) {
  return `
    <header class="newspaper-masthead">
      <h1 class="newspaper-masthead-title">THE DAILY BRIEFING</h1>
      <p class="newspaper-masthead-subtitle">Your Comprehensive Technology & Security Digest</p>
      <div class="newspaper-masthead-ornament"><span>★</span></div>
      <p class="newspaper-masthead-date">${formatMastheadDate(data.date)}</p>
    </header>
  `;
}

// Replace current navigation
function generateNav(categories) {
  const navLinks = Object.entries(categories)
    .map(([key, { emoji, name, articles }]) => `
      <li class="newspaper-nav-item">
        <a href="#${key}" class="newspaper-nav-link">
          ${emoji} ${name}
          <span class="newspaper-nav-count">${articles.length}</span>
        </a>
      </li>
    `).join('');
  
  return `
    <nav class="newspaper-nav">
      <div class="newspaper-container">
        <ul class="newspaper-nav-list">
          ${navLinks}
          <li class="newspaper-nav-item">
            <div class="newspaper-theme-toggle" onclick="toggleTheme()">
              <span class="newspaper-theme-toggle-label">Theme</span>
              <div class="newspaper-theme-toggle-switch"></div>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  `;
}

// Replace article generation
function generateArticle(article, isLead = false) {
  if (isLead) {
    return `
      <article class="newspaper-lead-story">
        <div class="newspaper-lead-content">
          <span class="newspaper-kicker">🚨 Breaking News</span>
          <h1 class="newspaper-banner">${escapeHtml(article.title)}</h1>
          <p class="newspaper-deck">${escapeHtml(article.description || article.snippet)}</p>
          
          <div class="newspaper-article-meta">
            <span class="newspaper-byline">By ${escapeHtml(article.source)}</span>
            <span class="newspaper-dateline">${formatDate(article.pubDate)}</span>
            <span class="newspaper-score-badge">${article.score}</span>
          </div>
          
          <p class="newspaper-lead">
            ${escapeHtml(article.snippet)}
          </p>
        </div>
      </article>
    `;
  } else {
    return `
      <article class="newspaper-article">
        <header class="newspaper-article-header">
          <h3 class="newspaper-headline">
            <a href="${article.link}">${escapeHtml(article.title)}</a>
          </h3>
          <div class="newspaper-article-meta">
            <span class="newspaper-byline">${escapeHtml(article.source)}</span>
            <span class="newspaper-dateline">${relativeTime(article.pubDate)}</span>
            <span class="newspaper-score-badge">${article.score}</span>
          </div>
        </header>
        
        <p class="newspaper-body">
          ${escapeHtml(article.snippet)}
        </p>
      </article>
    `;
  }
}
```

### 3. JavaScript Updates

Add theme toggle functionality:

```javascript
function generateThemeScript() {
  return `
    <script>
      function toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('newspaper-theme', newTheme);
      }

      // Load saved theme
      document.addEventListener('DOMContentLoaded', function() {
        const savedTheme = localStorage.getItem('newspaper-theme') || 
                          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
      });

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('newspaper-theme')) {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
    </script>
  `;
}
```

## Complete File Updates

### Update `scripts/generate-site.mjs`

1. **Copy CSS files** to the public directory:
```javascript
// Add to the top of generate-site.mjs
import { cpSync } from 'fs';

// Copy newspaper CSS to public directory
cpSync(join(ROOT, 'newspaper-design-system/css'), join(PUBLIC_DIR, 'css'), { recursive: true });
```

2. **Update HTML template**:
Replace the inline styles with newspaper design system imports and update the HTML structure to use newspaper classes as shown above.

### File Structure After Integration

```
daily-briefing/
├── newspaper-design-system/     # Design system (keep for maintenance)
│   ├── css/
│   ├── documentation/
│   └── examples/
├── public/
│   ├── css/                     # Copied from design system
│   │   ├── newspaper-core.css
│   │   ├── newspaper-layout.css
│   │   ├── newspaper-typography.css
│   │   ├── newspaper-components.css
│   │   ├── newspaper-themes.css
│   │   └── newspaper-print.css
│   ├── index.html              # Generated with newspaper styles
│   ├── latest.json
│   └── daily-song.mp3
└── scripts/
    ├── generate-site.mjs       # Updated to use newspaper system
    └── ...
```

## Advanced Features

### 1. Lead Story Detection

Automatically promote high-scoring articles to lead story format:

```javascript
function generateContent(data) {
  // Find the highest scoring article
  const allArticles = Object.values(data.categories).flat();
  const leadStory = allArticles.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  // Generate lead story
  const leadHtml = generateArticle(leadStory, true);
  
  // Generate other articles (excluding lead)
  const otherArticles = allArticles.filter(a => a !== leadStory);
  // ... rest of content generation
}
```

### 2. Breaking News Alerts

Add breaking news detection based on keywords:

```javascript
const BREAKING_KEYWORDS = ['critical', 'zero-day', 'breach', 'ransomware', 'emergency'];

function isBreakingNews(article) {
  const text = (article.title + ' ' + article.snippet).toLowerCase();
  return BREAKING_KEYWORDS.some(keyword => text.includes(keyword));
}

function generateArticle(article, isLead = false) {
  const breaking = isBreakingNews(article) ? '<span class="newspaper-breaking">Breaking</span>' : '';
  // ... rest of generation with breaking flag
}
```

### 3. Pull Quotes

Extract compelling quotes from article text:

```javascript
function extractPullQuote(snippet) {
  // Look for quoted text
  const quoteMatch = snippet.match(/"([^"]{50,150})"/);
  if (quoteMatch) {
    return `
      <div class="newspaper-pullquote">
        ${escapeHtml(quoteMatch[1])}
      </div>
    `;
  }
  return '';
}
```

### 4. Image Integration

Add newspaper-style image processing:

```javascript
function generateImageSection(article) {
  if (article.image) {
    return `
      <div class="newspaper-lead-image">
        <img src="${article.image}" alt="${escapeHtml(article.title)}" 
             style="filter: grayscale(100%) contrast(1.2);">
        <p class="newspaper-caption">
          ${escapeHtml(article.imageCaption || article.source)}
        </p>
      </div>
    `;
  }
  return '';
}
```

## Print Optimization

The newspaper design system includes comprehensive print styles. To enable proper printing:

1. **Add print button**:
```javascript
function addPrintButton() {
  return `
    <button class="newspaper-btn newspaper-btn-secondary print-show" 
            onclick="window.print()">
      📄 Print Edition
    </button>
  `;
}
```

2. **Print-specific metadata**:
```javascript
function generatePrintFooter(data) {
  return `
    <footer class="newspaper-print-footer" style="display: none;">
      The Daily Briefing — Technology & Security Digest — Page 1 of 1 — ${formatDate(data.date)}
    </footer>
  `;
}
```

## Performance Considerations

1. **CSS Loading**: The modular CSS approach allows for progressive loading
2. **Font Loading**: Use font-display: swap for Google Fonts
3. **Image Optimization**: Implement lazy loading for article images
4. **JavaScript**: Theme toggle is lightweight and doesn't require frameworks

## Accessibility Features

The newspaper design system includes:
- Proper heading hierarchy
- High contrast support
- Focus indicators
- Screen reader friendly markup
- Reduced motion support
- Keyboard navigation

## Maintenance

Keep the design system updated by:
1. Monitoring `newspaper-design-system/` directory for updates
2. Copying updated CSS files to `public/css/` when needed
3. Testing print output regularly
4. Validating accessibility with tools like axe-core

This implementation maintains the existing functionality while providing an authentic newspaper aesthetic with modern web standards.