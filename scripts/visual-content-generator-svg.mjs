#!/usr/bin/env node
/**
 * visual-content-generator-svg.mjs — SVG-based visual content generation
 * Creates hero images, charts, and social media cards using pure SVG
 * No Canvas dependency required
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const ASSETS_DIR = join(PUBLIC_DIR, 'assets');

// Ensure assets directory exists
mkdirSync(ASSETS_DIR, { recursive: true });

// Newspaper color scheme
const COLORS = {
  paper: '#f4f1ea',
  paperLight: '#fdfcf7', 
  ink: '#1a1a1a',
  inkLight: '#4a4a4a',
  accent: '#8b0000',
  shadow: 'rgba(0,0,0,0.1)'
};

/**
 * Generate SVG hero image with statistics
 */
async function generateHeroImageSVG(data, outputPath) {
  const width = 1200;
  const height = 400;
  
  const totalArticles = data.articles ? data.articles.length : 0;
  const categories = data.categories ? Object.keys(data.categories).length : 9;
  
  const date = new Date(data.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  });
  
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.paperLight};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${COLORS.paper};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f0ede6;stop-opacity:1" />
    </linearGradient>
    
    <pattern id="paperTexture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="transparent"/>
      <circle cx="2" cy="2" r="0.5" fill="rgba(0,0,0,0.02)"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#paperGrad)"/>
  <rect width="${width}" height="${height}" fill="url(#paperTexture)"/>
  
  <!-- Main Title -->
  <text x="600" y="80" text-anchor="middle" 
        font-family="Georgia, serif" font-size="48" font-weight="900" 
        fill="${COLORS.ink}" letter-spacing="-2px">THE DAILY BRIEFING</text>
  
  <!-- Date -->
  <text x="600" y="120" text-anchor="middle" 
        font-family="'Courier New', monospace" font-size="20" 
        fill="${COLORS.ink}">${date.toUpperCase()}</text>
  
  <!-- Decorative line -->
  <line x1="300" y1="140" x2="900" y2="140" stroke="${COLORS.ink}" stroke-width="2"/>
  
  <!-- Stats boxes -->
  ${generateStatsBoxes(totalArticles, categories)}
  
  <!-- Tagline -->
  <text x="600" y="350" text-anchor="middle" 
        font-family="Georgia, serif" font-size="18" font-style="italic"
        fill="${COLORS.inkLight}">"All the tech news that's fit to print"</text>
</svg>`;
  
  writeFileSync(outputPath, svg);
  console.log(`📸 Generated SVG hero image: ${outputPath}`);
  return outputPath;
}

function generateStatsBoxes(totalArticles, categories) {
  const stats = [
    { label: 'Articles Today', value: totalArticles.toString() },
    { label: 'Tech Categories', value: categories.toString() },
    { label: 'AI Powered', value: '✓' },
    { label: 'Updated', value: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
  ];
  
  return stats.map((stat, i) => {
    const x = 150 + (i * 220);
    const y = 180;
    
    return `
    <!-- Stats box ${i + 1} -->
    <rect x="${x}" y="${y}" width="200" height="100" 
          fill="rgba(255,255,255,0.8)" stroke="${COLORS.inkLight}" stroke-width="1"/>
    
    <text x="${x + 100}" y="${y + 45}" text-anchor="middle" 
          font-family="Georgia, serif" font-size="32" font-weight="bold" 
          fill="${COLORS.accent}">${stat.value}</text>
    
    <text x="${x + 100}" y="${y + 75}" text-anchor="middle" 
          font-family="Georgia, serif" font-size="16" 
          fill="${COLORS.ink}">${stat.label}</text>
    `;
  }).join('');
}

/**
 * Generate SVG category chart
 */
async function generateCategoryChartSVG(data, outputPath) {
  const width = 800;
  const height = 600;
  
  // Get category data
  let categoryData = [];
  if (data.articles) {
    const categoryCounts = {};
    data.articles.forEach(([category]) => {
      const cleanCategory = category.replace(/^[🤖🏛️🔐🛠️📈🚀⚙️💠🧬]\s*/, '');
      categoryCounts[cleanCategory] = (categoryCounts[cleanCategory] || 0) + 1;
    });
    
    categoryData = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  } else if (data.categories) {
    categoryData = Object.values(data.categories)
      .map(cat => ({ 
        name: cat.label.replace(/^[🤖🏛️🔐🛠️📈🚀⚙️💠🧬]\s*/, ''),
        count: cat.count 
      }))
      .sort((a, b) => b.count - a.count);
  }
  
  const maxCount = Math.max(...categoryData.map(d => d.count));
  const barHeight = 30;
  const barSpacing = 45;
  const startY = 100;
  const maxBarWidth = 500;
  
  const bars = categoryData.map((item, i) => {
    const y = startY + (i * barSpacing);
    const barWidth = (item.count / maxCount) * maxBarWidth;
    
    return `
    <!-- Category bar ${i + 1} -->
    <rect x="200" y="${y}" width="${maxBarWidth}" height="${barHeight}" 
          fill="rgba(139, 0, 0, 0.1)" stroke="none"/>
    
    <rect x="200" y="${y}" width="${barWidth}" height="${barHeight}" 
          fill="${COLORS.accent}" stroke="none"/>
    
    <text x="190" y="${y + 20}" text-anchor="end" 
          font-family="Georgia, serif" font-size="16" 
          fill="${COLORS.ink}">${item.name}</text>
    
    <text x="${210 + barWidth}" y="${y + 20}" text-anchor="start" 
          font-family="Georgia, serif" font-size="16" 
          fill="${COLORS.ink}">${item.count}</text>
    `;
  }).join('');
  
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${COLORS.paperLight}"/>
  
  <text x="400" y="40" text-anchor="middle" 
        font-family="Georgia, serif" font-size="28" font-weight="bold" 
        fill="${COLORS.ink}">Today's Coverage by Category</text>
  
  ${bars}
</svg>`;
  
  writeFileSync(outputPath, svg);
  console.log(`📊 Generated SVG category chart: ${outputPath}`);
  return outputPath;
}

/**
 * Generate SVG social media card
 */
async function generateSocialCardSVG(data, outputPath) {
  const width = 1200;
  const height = 630; // Twitter card size
  
  const date = new Date(data.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  const totalArticles = data.articles ? data.articles.length : 
                        data.categories ? Object.values(data.categories).reduce((sum, cat) => sum + cat.count, 0) : 0;
  
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="socialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.paperLight};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${COLORS.paper};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#socialGrad)"/>
  
  <!-- Main title -->
  <text x="600" y="150" text-anchor="middle" 
        font-family="Georgia, serif" font-size="60" font-weight="900" 
        fill="${COLORS.ink}">THE DAILY BRIEFING</text>
  
  <!-- Date -->
  <text x="600" y="200" text-anchor="middle" 
        font-family="'Courier New', monospace" font-size="28" 
        fill="${COLORS.ink}">${date}</text>
  
  <!-- Key stats -->
  <text x="600" y="280" text-anchor="middle" 
        font-family="Georgia, serif" font-size="36" font-weight="bold" 
        fill="${COLORS.accent}">${totalArticles} Tech Stories Today</text>
  
  <!-- Feature highlights -->
  <text x="600" y="330" text-anchor="middle" 
        font-family="Georgia, serif" font-size="24" 
        fill="${COLORS.inkLight}">AI Models • Security • DevOps • Space • More</text>
  
  <!-- Tagline -->
  <text x="600" y="450" text-anchor="middle" 
        font-family="Georgia, serif" font-size="20" font-style="italic" 
        fill="${COLORS.inkLight}">Curated tech news with AI-powered summaries</text>
  
  <!-- Website -->
  <text x="600" y="500" text-anchor="middle" 
        font-family="'Courier New', monospace" font-size="18" 
        fill="${COLORS.ink}">bronathedruid.github.io/daily-briefing</text>
</svg>`;
  
  writeFileSync(outputPath, svg);
  console.log(`📱 Generated SVG social card: ${outputPath}`);
  return outputPath;
}

/**
 * Generate SVG trending topics visualization
 */
async function generateTrendingTopicsSVG(data, outputPath) {
  const width = 600;
  const height = 400;
  
  // Extract keywords from articles
  const keywords = new Map();
  const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among']);
  
  if (data.articles) {
    data.articles.forEach(([category, title, , , , snippet]) => {
      const text = `${title} ${snippet}`.toLowerCase();
      const words = text.match(/\b[a-z]{3,}\b/g) || [];
      
      words.forEach(word => {
        if (!commonWords.has(word)) {
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      });
    });
  }
  
  const topKeywords = Array.from(keywords.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20);
  
  const centerX = 300;
  const centerY = 200;
  
  const wordElements = topKeywords.map(([word, count], i) => {
    const fontSize = Math.max(12, Math.min(32, count * 3));
    const angle = (i / topKeywords.length) * Math.PI * 2;
    const radius = 80 + (i % 3) * 40;
    
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    const color = count > 5 ? COLORS.accent : COLORS.inkLight;
    
    return `
    <text x="${x}" y="${y}" text-anchor="middle" 
          font-family="Georgia, serif" font-size="${fontSize}" 
          fill="${color}">${word}</text>
    `;
  }).join('');
  
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${COLORS.paperLight}"/>
  
  <text x="300" y="40" text-anchor="middle" 
        font-family="Georgia, serif" font-size="24" font-weight="bold" 
        fill="${COLORS.ink}">Trending Keywords Today</text>
  
  ${wordElements}
</svg>`;
  
  writeFileSync(outputPath, svg);
  console.log(`☁️ Generated SVG trending topics: ${outputPath}`);
  return outputPath;
}

/**
 * Main generation function
 */
async function generateAllVisualsES(dataFile = null) {
  let data;
  
  try {
    const newspaperPath = join(ROOT, 'data', 'newspaper-latest.json');
    const legacyPath = join(ROOT, 'data', 'latest.json');
    
    try {
      data = JSON.parse(readFileSync(dataFile || newspaperPath, 'utf8'));
    } catch {
      data = JSON.parse(readFileSync(legacyPath, 'utf8'));
    }
  } catch (error) {
    console.error('❌ No data file found. Run the fetch script first.');
    process.exit(1);
  }
  
  console.log('🎨 Generating SVG visual content...');
  
  const date = data.date || new Date().toISOString().slice(0, 10);
  const results = {};
  
  try {
    // Generate all SVG assets
    results.hero = await generateHeroImageSVG(data, join(ASSETS_DIR, 'hero-image.svg'));
    results.chart = await generateCategoryChartSVG(data, join(ASSETS_DIR, 'category-chart.svg'));
    results.social = await generateSocialCardSVG(data, join(ASSETS_DIR, 'social-card.svg'));
    results.trending = await generateTrendingTopicsSVG(data, join(ASSETS_DIR, 'trending-topics.svg'));
    
    // Generate manifest for the HTML generator
    const manifest = {
      generated: new Date().toISOString(),
      date,
      assets: results,
      format: 'svg'
    };
    
    writeFileSync(join(ASSETS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
    
    console.log('✅ SVG visual content generation complete!');
    console.log(`📁 Assets saved to: ${ASSETS_DIR}`);
    
    return results;
  } catch (error) {
    console.error('❌ Error generating SVG visuals:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
export { generateAllVisualsES, generateHeroImageSVG, generateCategoryChartSVG, generateSocialCardSVG, generateTrendingTopicsSVG };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dataFile = args.includes('--input') ? args[args.indexOf('--input') + 1] : null;
  
  generateAllVisualsES(dataFile).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}