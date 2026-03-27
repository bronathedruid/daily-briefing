#!/usr/bin/env node
/**
 * visual-content-generator.mjs — Generates visual content for the newspaper
 * Creates hero images, charts, and social media cards
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createCanvas, loadImage, registerFont } from 'canvas';
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
 * Generate daily hero image with statistics
 */
async function generateHeroImage(data, outputPath) {
  const canvas = createCanvas(1200, 400);
  const ctx = canvas.getContext('2d');
  
  // Background gradient (aged paper effect)
  const gradient = ctx.createLinearGradient(0, 0, 1200, 400);
  gradient.addColorStop(0, COLORS.paperLight);
  gradient.addColorStop(0.5, COLORS.paper);
  gradient.addColorStop(1, '#f0ede6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 400);
  
  // Paper texture overlay
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)';
    ctx.fillRect(Math.random() * 1200, Math.random() * 400, 2, 2);
  }
  ctx.globalAlpha = 1;
  
  // Main title
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 48px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE DAILY BRIEFING', 600, 80);
  
  // Date line
  ctx.font = '20px "Courier New", monospace';
  const date = new Date(data.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  });
  ctx.fillText(date.toUpperCase(), 600, 120);
  
  // Decorative line
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 140);
  ctx.lineTo(900, 140);
  ctx.stroke();
  
  // Statistics section
  const totalArticles = data.articles ? data.articles.length : 0;
  const categories = data.categories ? Object.keys(data.categories).length : 9;
  
  ctx.font = '24px Georgia, serif';
  ctx.fillStyle = COLORS.inkLight;
  ctx.textAlign = 'left';
  
  // Stats boxes
  const stats = [
    { label: 'Articles Today', value: totalArticles },
    { label: 'Tech Categories', value: categories },
    { label: 'AI Powered', value: '✓' },
    { label: 'Updated', value: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
  ];
  
  let x = 150;
  stats.forEach((stat, i) => {
    // Box background
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(x, 180, 200, 100);
    
    // Box border
    ctx.strokeStyle = COLORS.inkLight;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, 180, 200, 100);
    
    // Value
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 32px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(stat.value, x + 100, 220);
    
    // Label
    ctx.fillStyle = COLORS.ink;
    ctx.font = '16px Georgia, serif';
    ctx.fillText(stat.label, x + 100, 250);
    
    x += 220;
  });
  
  // Tagline
  ctx.font = 'italic 18px Georgia, serif';
  ctx.fillStyle = COLORS.inkLight;
  ctx.textAlign = 'center';
  ctx.fillText('"All the tech news that\'s fit to print"', 600, 350);
  
  // Save image
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(outputPath, buffer);
  
  console.log(`📸 Generated hero image: ${outputPath}`);
  return outputPath;
}

/**
 * Generate category distribution chart
 */
async function generateCategoryChart(data, outputPath) {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = COLORS.paperLight;
  ctx.fillRect(0, 0, 800, 600);
  
  // Title
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Today\'s Coverage by Category', 400, 40);
  
  // Get category data
  let categoryData = [];
  if (data.articles) {
    // Count articles by category
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
  
  // Simple bar chart
  const maxCount = Math.max(...categoryData.map(d => d.count));
  const barHeight = 30;
  const barSpacing = 45;
  const startY = 100;
  const maxBarWidth = 500;
  
  categoryData.forEach((item, i) => {
    const y = startY + (i * barSpacing);
    const barWidth = (item.count / maxCount) * maxBarWidth;
    
    // Bar background
    ctx.fillStyle = 'rgba(139, 0, 0, 0.1)';
    ctx.fillRect(200, y, maxBarWidth, barHeight);
    
    // Actual bar
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(200, y, barWidth, barHeight);
    
    // Category label
    ctx.fillStyle = COLORS.ink;
    ctx.font = '16px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(item.name, 190, y + 20);
    
    // Count label
    ctx.textAlign = 'left';
    ctx.fillText(item.count.toString(), 210 + barWidth, y + 20);
  });
  
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(outputPath, buffer);
  
  console.log(`📊 Generated category chart: ${outputPath}`);
  return outputPath;
}

/**
 * Generate social media preview card
 */
async function generateSocialCard(data, outputPath) {
  const canvas = createCanvas(1200, 630); // Twitter card size
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, COLORS.paperLight);
  gradient.addColorStop(1, COLORS.paper);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);
  
  // Large title
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 60px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE DAILY BRIEFING', 600, 150);
  
  // Date
  ctx.font = '28px "Courier New", monospace';
  const date = new Date(data.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  ctx.fillText(date, 600, 200);
  
  // Key stats
  const totalArticles = data.articles ? data.articles.length : 
                        data.categories ? Object.values(data.categories).reduce((sum, cat) => sum + cat.count, 0) : 0;
  
  ctx.font = 'bold 36px Georgia, serif';
  ctx.fillStyle = COLORS.accent;
  ctx.fillText(`${totalArticles} Tech Stories Today`, 600, 280);
  
  // Feature highlights
  ctx.font = '24px Georgia, serif';
  ctx.fillStyle = COLORS.inkLight;
  ctx.fillText('AI Models • Security • DevOps • Space • More', 600, 330);
  
  // Bottom tagline
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText('Curated tech news with AI-powered summaries', 600, 450);
  
  // Website
  ctx.font = '18px "Courier New", monospace';
  ctx.fillStyle = COLORS.ink;
  ctx.fillText('bronathedruid.github.io/daily-briefing', 600, 500);
  
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(outputPath, buffer);
  
  console.log(`📱 Generated social card: ${outputPath}`);
  return outputPath;
}

/**
 * Generate trending topics visualization
 */
async function generateTrendingTopics(data, outputPath) {
  const canvas = createCanvas(600, 400);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = COLORS.paperLight;
  ctx.fillRect(0, 0, 600, 400);
  
  // Title
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Trending Keywords Today', 300, 40);
  
  // Extract keywords from articles
  const keywords = new Map();
  const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'through', 'during', 'before', 'after', 'above', 'below', 'between']);
  
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
  
  // Get top keywords
  const topKeywords = Array.from(keywords.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20);
  
  // Simple word cloud layout
  const centerX = 300;
  const centerY = 200;
  
  topKeywords.forEach(([word, count], i) => {
    const fontSize = Math.max(12, Math.min(32, count * 3));
    const angle = (i / topKeywords.length) * Math.PI * 2;
    const radius = 80 + (i % 3) * 40;
    
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    ctx.font = `${fontSize}px Georgia, serif`;
    ctx.fillStyle = count > 5 ? COLORS.accent : COLORS.inkLight;
    ctx.textAlign = 'center';
    ctx.fillText(word, x, y);
  });
  
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(outputPath, buffer);
  
  console.log(`☁️ Generated trending topics: ${outputPath}`);
  return outputPath;
}

/**
 * Main generation function
 */
async function generateAllVisuals(dataFile = null) {
  let data;
  
  try {
    // Try newspaper format first, then legacy format
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
  
  console.log('🎨 Generating visual content...');
  
  const date = data.date || new Date().toISOString().slice(0, 10);
  const results = {};
  
  try {
    // Generate all visual assets
    results.hero = await generateHeroImage(data, join(ASSETS_DIR, 'hero-image.png'));
    results.chart = await generateCategoryChart(data, join(ASSETS_DIR, 'category-chart.png'));
    results.social = await generateSocialCard(data, join(ASSETS_DIR, 'social-card.png'));
    results.trending = await generateTrendingTopics(data, join(ASSETS_DIR, 'trending-topics.png'));
    
    // Generate manifest for the HTML generator
    const manifest = {
      generated: new Date().toISOString(),
      date,
      assets: results
    };
    
    writeFileSync(join(ASSETS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
    
    console.log('✅ Visual content generation complete!');
    console.log(`📁 Assets saved to: ${ASSETS_DIR}`);
    
    return results;
  } catch (error) {
    console.error('❌ Error generating visuals:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
export { generateAllVisuals, generateHeroImage, generateCategoryChart, generateSocialCard, generateTrendingTopics };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dataFile = args.includes('--input') ? args[args.indexOf('--input') + 1] : null;
  
  generateAllVisuals(dataFile).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}