#!/usr/bin/env node
/**
 * email-digest-generator.mjs — Generates email digest versions
 * Creates HTML email templates for subscription distribution
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const EMAIL_DIR = join(PUBLIC_DIR, 'email');

// Ensure email directory exists
mkdirSync(EMAIL_DIR, { recursive: true });

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
}

function generateEmailTemplate(data, templateType = 'full') {
  const date = formatDate(data.date);
  const totalArticles = data.articles ? data.articles.length : 
    (data.categories ? Object.values(data.categories).reduce((sum, cat) => sum + cat.count, 0) : 0);
  
  // Email-safe CSS (inline styles)
  const styles = {
    container: 'max-width: 600px; margin: 0 auto; font-family: Georgia, serif; background: #fdfcf7; padding: 20px; border: 1px solid #e0dbce;',
    masthead: 'text-align: center; border-bottom: 3px double #1a1a1a; margin-bottom: 20px; padding-bottom: 15px;',
    title: 'font-size: 36px; font-weight: 900; color: #1a1a1a; margin: 10px 0; text-transform: uppercase; letter-spacing: -1px;',
    subtitle: 'font-size: 14px; color: #4a4a4a; text-transform: uppercase; font-family: "Courier New", monospace;',
    section: 'margin-bottom: 25px; background: #ffffff; padding: 15px; border: 1px solid #e0dbce; border-radius: 4px;',
    sectionTitle: 'font-size: 20px; font-weight: bold; color: #1a1a1a; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #d3cec1;',
    article: 'margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0;',
    articleTitle: 'font-size: 16px; font-weight: bold; color: #8b0000; text-decoration: none; display: block; margin-bottom: 5px;',
    articleMeta: 'font-size: 12px; color: #4a4a4a; margin-bottom: 8px; font-style: italic;',
    articleSnippet: 'font-size: 14px; color: #1a1a1a; line-height: 1.5;',
    footer: 'text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #d3cec1; font-size: 12px; color: #4a4a4a;',
    button: 'display: inline-block; background: #8b0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 5px;'
  };
  
  let articlesContent = '';
  
  if (templateType === 'summary') {
    // Summary version - top 5 articles only
    if (data.articles) {
      const topArticles = data.articles.slice(0, 5);
      const groupedByCategory = {};
      
      topArticles.forEach(([category, title, link, source, time, snippet]) => {
        if (!groupedByCategory[category]) {
          groupedByCategory[category] = [];
        }
        groupedByCategory[category].push({ title, link, source, time, snippet });
      });
      
      Object.entries(groupedByCategory).forEach(([category, articles]) => {
        articlesContent += `
          <div style="${styles.section}">
            <h3 style="${styles.sectionTitle}">${escapeHtml(category)}</h3>
            ${articles.map(article => `
              <div style="${styles.article}">
                <a href="${escapeHtml(article.link)}" style="${styles.articleTitle}">${escapeHtml(article.title)}</a>
                <div style="${styles.articleMeta}">${escapeHtml(article.source)} • ${escapeHtml(article.time)}</div>
                <p style="${styles.articleSnippet}">${escapeHtml(article.snippet)}</p>
              </div>
            `).join('')}
          </div>
        `;
      });
    }
  } else {
    // Full version - all articles by category
    if (data.articles) {
      // Group articles by category
      const categoryGroups = {};
      data.articles.forEach(([category, title, link, source, time, snippet]) => {
        if (!categoryGroups[category]) {
          categoryGroups[category] = [];
        }
        categoryGroups[category].push({ title, link, source, time, snippet });
      });
      
      Object.entries(categoryGroups).forEach(([category, articles]) => {
        articlesContent += `
          <div style="${styles.section}">
            <h3 style="${styles.sectionTitle}">${escapeHtml(category)}</h3>
            ${articles.slice(0, 8).map(article => `
              <div style="${styles.article}">
                <a href="${escapeHtml(article.link)}" style="${styles.articleTitle}">${escapeHtml(article.title)}</a>
                <div style="${styles.articleMeta}">${escapeHtml(article.source)} • ${escapeHtml(article.time)}</div>
                <p style="${styles.articleSnippet}">${escapeHtml(article.snippet)}</p>
              </div>
            `).join('')}
            ${articles.length > 8 ? `<p style="text-align: center; margin-top: 10px;"><em>...and ${articles.length - 8} more ${category} articles</em></p>` : ''}
          </div>
        `;
      });
    } else if (data.categories) {
      // Legacy format support
      Object.values(data.categories).forEach(category => {
        if (category.count > 0) {
          articlesContent += `
            <div style="${styles.section}">
              <h3 style="${styles.sectionTitle}">${escapeHtml(category.label)}</h3>
              ${category.articles.slice(0, 8).map(article => `
                <div style="${styles.article}">
                  <a href="${escapeHtml(article.link)}" style="${styles.articleTitle}">${escapeHtml(article.title)}</a>
                  <div style="${styles.articleMeta}">${escapeHtml(article.source)} • ${escapeHtml(article.time || '')}</div>
                  <p style="${styles.articleSnippet}">${escapeHtml(article.snippet || '')}</p>
                </div>
              `).join('')}
              ${category.articles.length > 8 ? `<p style="text-align: center; margin-top: 10px;"><em>...and ${category.articles.length - 8} more articles</em></p>` : ''}
            </div>
          `;
        }
      });
    }
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Daily Briefing - ${date}</title>
  <meta name="description" content="Your daily tech news digest with ${totalArticles} curated articles">
  <!--[if mso]>
  <style type="text/css">
    .fallback-font { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 20px; background: #f4f1ea; font-family: Georgia, serif;">
  
  <div style="${styles.container}">
    <!-- Masthead -->
    <div style="${styles.masthead}">
      <div style="${styles.subtitle}">Vol. CXCIV • ${date}</div>
      <h1 style="${styles.title}">The Daily Briefing</h1>
      <div style="${styles.subtitle}">"${totalArticles} tech stories • AI curated • Newspaper style"</div>
    </div>
    
    <!-- Hero Stats -->
    <div style="text-align: center; margin-bottom: 25px; background: rgba(255,255,255,0.8); padding: 15px; border: 1px solid #e0dbce;">
      <div style="font-size: 24px; font-weight: bold; color: #8b0000; margin-bottom: 5px;">${totalArticles} Articles Today</div>
      <div style="font-size: 14px; color: #4a4a4a;">AI • DevOps • Security • Space • Marketing • More</div>
    </div>
    
    <!-- Articles Content -->
    ${articlesContent}
    
    <!-- Call to Action -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://bronathedruid.github.io/daily-briefing/" style="${styles.button}">Read Full Newspaper Online</a>
      <a href="https://bronathedruid.github.io/daily-briefing/email/unsubscribe" style="${styles.button}">Manage Subscription</a>
    </div>
    
    <!-- Footer -->
    <div style="${styles.footer}">
      <p><strong>The Daily Briefing</strong> • Tech News Curated with AI</p>
      <p>Generated ${new Date(data.generated || Date.now()).toLocaleString()}</p>
      <p>
        <a href="https://github.com/bronathedruid/daily-briefing" style="color: #8b0000; text-decoration: none;">Open Source</a> • 
        <a href="https://bronathedruid.github.io/daily-briefing/email/archive" style="color: #8b0000; text-decoration: none;">Archive</a> • 
        <a href="mailto:brona.the.druid@gmail.com" style="color: #8b0000; text-decoration: none;">Contact</a>
      </p>
      <p style="font-size: 11px; margin-top: 15px;">
        You're receiving this because you subscribed to The Daily Briefing. 
        <a href="https://bronathedruid.github.io/daily-briefing/email/unsubscribe" style="color: #8b0000;">Unsubscribe</a>
      </p>
    </div>
  </div>
  
  <!-- Email client compatibility -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Daily tech news digest: ${totalArticles} articles covering AI, DevOps, Security, Space technology, and more. Curated with artificial intelligence and presented in authentic newspaper style.
  </div>
  
</body>
</html>`;
}

/**
 * Generate mobile API JSON
 */
function generateMobileAPI(data) {
  let processedArticles = [];
  
  if (data.articles) {
    // Newspaper format
    processedArticles = data.articles.map(([category, title, link, source, time, snippet], index) => ({
      id: index + 1,
      category: category.replace(/^.{1,2}\s*/, ''),
      categoryEmoji: '📰',
      title,
      url: link,
      source,
      publishedTime: time,
      summary: snippet,
      readTime: Math.ceil(snippet.length / 200), // Rough reading time in minutes
      importance: index < 10 ? 'high' : index < 30 ? 'medium' : 'low'
    }));
  } else if (data.categories) {
    // Legacy format
    let articleId = 1;
    Object.values(data.categories).forEach(category => {
      const categoryEmoji = category.emoji || '📰';
      const categoryName = category.label.replace(/^.{1,2}\s*/, '');
      
      category.articles.forEach((article, index) => {
        processedArticles.push({
          id: articleId++,
          category: categoryName,
          categoryEmoji,
          title: article.title,
          url: article.link,
          source: article.source,
          publishedTime: article.time || '',
          summary: article.snippet || '',
          readTime: Math.ceil((article.snippet || '').length / 200),
          importance: index < 3 ? 'high' : index < 8 ? 'medium' : 'low',
          score: article.score || 10
        });
      });
    });
  }
  
  // Group by category for the API
  const categories = {};
  processedArticles.forEach(article => {
    if (!categories[article.category]) {
      categories[article.category] = {
        name: article.category,
        emoji: article.categoryEmoji,
        articles: []
      };
    }
    categories[article.category].articles.push(article);
  });
  
  return {
    meta: {
      date: data.date,
      generated: data.generated || new Date().toISOString(),
      version: '2.0',
      totalArticles: processedArticles.length,
      categoriesCount: Object.keys(categories).length
    },
    categories: Object.values(categories),
    articles: processedArticles,
    trending: {
      topics: extractTrendingTopics(processedArticles),
      categories: Object.values(categories)
        .sort((a, b) => b.articles.length - a.articles.length)
        .slice(0, 5)
        .map(cat => ({ name: cat.name, emoji: cat.emoji, count: cat.articles.length }))
    }
  };
}

function extractTrendingTopics(articles) {
  const keywords = new Map();
  const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among']);
  
  articles.forEach(article => {
    const text = `${article.title} ${article.summary}`.toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    
    words.forEach(word => {
      if (!commonWords.has(word)) {
        keywords.set(word, (keywords.get(word) || 0) + 1);
      }
    });
  });
  
  return Array.from(keywords.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([word, count]) => ({ word, count, weight: Math.min(1, count / 10) }));
}

/**
 * Main function
 */
async function generateEmailDigest(inputFile = null) {
  let data;
  
  try {
    // Try to read data file
    const newspaperPath = join(ROOT, 'data', 'newspaper-latest.json');
    const legacyPath = join(ROOT, 'data', 'latest.json');
    
    try {
      data = JSON.parse(readFileSync(inputFile || newspaperPath, 'utf8'));
    } catch {
      data = JSON.parse(readFileSync(legacyPath, 'utf8'));
    }
  } catch (error) {
    console.error('❌ No data file found. Run the fetch script first.');
    process.exit(1);
  }
  
  console.log('📧 Generating email digest and mobile API...');
  
  const date = data.date || new Date().toISOString().slice(0, 10);
  
  try {
    // Generate email templates
    const fullEmail = generateEmailTemplate(data, 'full');
    const summaryEmail = generateEmailTemplate(data, 'summary');
    
    // Generate mobile API
    const mobileAPI = generateMobileAPI(data);
    
    // Write files
    writeFileSync(join(EMAIL_DIR, 'digest-full.html'), fullEmail);
    writeFileSync(join(EMAIL_DIR, 'digest-summary.html'), summaryEmail);
    writeFileSync(join(EMAIL_DIR, 'latest-digest.html'), summaryEmail); // Default to summary
    
    writeFileSync(join(PUBLIC_DIR, 'api.json'), JSON.stringify(mobileAPI, null, 2));
    writeFileSync(join(PUBLIC_DIR, `api-${date}.json`), JSON.stringify(mobileAPI, null, 2));
    
    console.log('✅ Email digest generation complete!');
    console.log(`📧 Full email: ${join(EMAIL_DIR, 'digest-full.html')}`);
    console.log(`📧 Summary email: ${join(EMAIL_DIR, 'digest-summary.html')}`);
    console.log(`📱 Mobile API: ${join(PUBLIC_DIR, 'api.json')}`);
    
    return {
      fullEmail: join(EMAIL_DIR, 'digest-full.html'),
      summaryEmail: join(EMAIL_DIR, 'digest-summary.html'),
      mobileAPI: join(PUBLIC_DIR, 'api.json')
    };
  } catch (error) {
    console.error('❌ Error generating email digest:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
export { generateEmailDigest, generateEmailTemplate, generateMobileAPI };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const inputFile = args.includes('--input') ? args[args.indexOf('--input') + 1] : null;
  
  generateEmailDigest(inputFile).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}