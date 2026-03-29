#!/usr/bin/env node
/**
 * enhanced-fetch-news.mjs — Enhanced RSS fetcher with AI summarization
 * Generates newspaper-format data for the new design
 */
import Parser from 'rss-parser';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FEEDS_PATH = join(__dirname, 'feeds.json');
const OUTPUT_DIR = join(ROOT, 'data');

const MAX_AGE_HOURS = 48;
const MAX_ITEMS_PER_CATEGORY = 15;
const FETCH_TIMEOUT_MS = 15000;

const parser = new Parser({
  timeout: FETCH_TIMEOUT_MS,
  headers: { 'User-Agent': 'DailyBriefingBot/1.0 (+https://github.com/bronathedruid/daily-briefing)' },
});

// Simple summarization function - will be enhanced with AI
function summarizeContent(content, title) {
  if (!content) return '';
  
  // Clean HTML and excessive whitespace
  const cleaned = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extract first meaningful sentences up to reasonable length
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 20);
  let summary = '';
  
  for (const sentence of sentences) {
    if ((summary + sentence).length > 200) break;
    summary += sentence.trim() + '. ';
  }
  
  // Fallback to first 200 chars if no good sentences
  if (summary.length < 50) {
    summary = cleaned.slice(0, 200) + (cleaned.length > 200 ? '...' : '');
  }
  
  return summary.trim();
}

// Enhanced summarization with AI 
async function aiSummarize(content, title) {
  try {
    // Check if we're in OpenClaw environment
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
    
    if (process.env.OPENCLAW_GATEWAY_URL || process.env.NODE_ENV !== 'production') {
      // Try OpenClaw summarization
      const prompt = `Write a compelling 1-2 sentence summary of this tech news article for a daily briefing newsletter. Focus on the IMPACT and WHY IT MATTERS, not technical jargon. Make it accessible to a smart business reader who isn't deeply technical. Max 180 characters.

Title: ${title}
Content: ${content.slice(0, 2000)}

Examples of good summaries:
- "OpenAI released GPT-5 with significantly better reasoning capabilities, potentially reshaping how businesses automate complex decision-making."
- "Google's new quantum chip achieved a breakthrough in error correction, bringing practical quantum computing closer to reality."
- "Meta's latest AI model can generate full video games from text descriptions, opening new possibilities for content creation."

Write your summary:`;
      
      const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'anthropic/claude-haiku-3-5-20241022',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.3
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const summary = data.choices?.[0]?.message?.content?.trim();
        if (summary && summary.length > 20) {
          return summary.length > 200 ? summary.slice(0, 197) + '...' : summary;
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ AI summarization failed: ${error.message}`);
  }
  
  // Fallback to simple summarization
  return summarizeContent(content, title);
}

function isRecent(dateStr) {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const ageMs = Date.now() - d.getTime();
  return ageMs < MAX_AGE_HOURS * 60 * 60 * 1000;
}

function scoreArticle(item, keywords, feedPriority) {
  let score = feedPriority * 2;
  const text = `${item.title || ''} ${item.content || ''} ${item.snippet || ''}`.toLowerCase();

  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) score += 2;
  }

  const title = (item.title || '').toLowerCase();
  if (title.includes('breaking') || title.includes('announce') || title.includes('launch')) score += 3;
  if (title.includes('release') || title.includes('new')) score += 1;
  if (title.includes('api') || title.includes('sdk') || title.includes('framework')) score += 1;

  return score;
}

function deduplicate(articles) {
  const seen = new Set();
  return articles.filter(a => {
    const key = (a.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getEmojiForCategory(catId) {
  const emojiMap = {
    'ai-models': '🤖',
    'government-policy': '🏛️',
    'security': '🔐',
    'coding-agents': '🛠️',
    'marketing-seo': '📈',
    'space-rockets': '🚀',
    'devops': '⚙️',
    'powershell': '💠'
  };
  return emojiMap[catId] || '📰';
}

async function fetchJson(url) {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'DailyBriefingBot/1.0' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!resp.ok) throw new Error(`Status ${resp.status}`);
  return resp.json();
}

async function fetchHNAlgolia(feedConfig) {
  try {
    const data = await fetchJson(feedConfig.url);
    return (data.hits || []).map(hit => ({
      title: hit.title?.trim() || 'Untitled',
      link: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      date: hit.created_at || null,
      content: hit.story_text || '',
      snippet: '',
      source: feedConfig.name,
      feedPriority: feedConfig.priority || 3,
    }));
  } catch (err) {
    console.warn(`  ⚠ Failed: ${feedConfig.name} — ${err.message}`);
    return [];
  }
}

async function fetchFeed(feedConfig) {
  if (feedConfig.url.includes('hn.algolia.com')) {
    return fetchHNAlgolia(feedConfig);
  }
  
  try {
    const feed = await parser.parseURL(feedConfig.url);
    return (feed.items || []).map(item => ({
      title: item.title?.trim() || 'Untitled',
      link: item.link || '',
      date: item.isoDate || item.pubDate || null,
      content: item.content || item.contentSnippet || '',
      snippet: '',
      source: feedConfig.name,
      feedPriority: feedConfig.priority || 3,
    }));
  } catch (err) {
    console.warn(`  ⚠ Failed: ${feedConfig.name} — ${err.message}`);
    return [];
  }
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'just now';
  if (diffHours === 1) return '1h ago';
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return d.toLocaleDateString();
}

async function main() {
  const config = JSON.parse(readFileSync(FEEDS_PATH, 'utf8'));
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  
  // Newspaper format data structure
  const newspaperData = [];
  let totalProcessed = 0;

  for (const [catId, cat] of Object.entries(config.categories)) {
    console.log(`\n📡 ${cat.label}`);
    let allArticles = [];

    // Fetch all feeds for this category
    const feedResults = await Promise.allSettled(
      cat.feeds.map(f => {
        console.log(`  → ${f.name}`);
        return fetchFeed(f);
      })
    );

    for (const r of feedResults) {
      if (r.status === 'fulfilled') allArticles.push(...r.value);
    }

    // Filter recent articles
    allArticles = allArticles.filter(a => isRecent(a.date));

    // Process each article for newspaper format
    for (const article of allArticles) {
      // Generate AI summary
      const summary = await aiSummarize(article.content, article.title);
      
      // Score the article
      const score = scoreArticle(article, cat.keywords || [], article.feedPriority);
      
      // Add to newspaper data array in the exact format expected by the frontend
      newspaperData.push([
        `${getEmojiForCategory(catId)} ${cat.label.replace(getEmojiForCategory(catId), '').trim()}`,
        article.title,
        article.link,
        article.source,
        formatTimeAgo(article.date),
        summary
      ]);
      
      totalProcessed++;
    }

    console.log(`  ✓ ${allArticles.length} articles processed`);
  }

  // Sort by quality/recency and limit total
  // For now, just take first 109 to match the newspaper format
  const finalArticles = newspaperData.slice(0, 109);

  // Save in the format expected by the newspaper website
  const newspaperOutput = {
    date: today,
    generated: new Date().toISOString(),
    articles: finalArticles,
    totalCount: finalArticles.length
  };

  // Save newspaper format
  const newspaperPath = join(OUTPUT_DIR, `newspaper-${today}.json`);
  writeFileSync(newspaperPath, JSON.stringify(newspaperOutput, null, 2));
  writeFileSync(join(OUTPUT_DIR, 'newspaper-latest.json'), JSON.stringify(newspaperOutput, null, 2));

  // Also maintain compatibility with old format
  const categorizedData = {
    date: today,
    generated: new Date().toISOString(),
    categories: {}
  };

  // Group articles back into categories for the old format
  for (const [catId, cat] of Object.entries(config.categories)) {
    const catEmoji = getEmojiForCategory(catId);
    const catLabel = `${catEmoji} ${cat.label.replace(catEmoji, '').trim()}`;
    
    const catArticles = finalArticles.filter(([category]) => category === catLabel);
    
    categorizedData.categories[catId] = {
      label: catLabel,
      emoji: catEmoji,
      count: catArticles.length,
      articles: catArticles.map(([, title, link, source, time, snippet]) => ({
        title, link, source, time, snippet, score: 10 // default score
      }))
    };
  }

  // Save old format for compatibility
  const legacyPath = join(OUTPUT_DIR, `${today}.json`);
  writeFileSync(legacyPath, JSON.stringify(categorizedData, null, 2));
  writeFileSync(join(OUTPUT_DIR, 'latest.json'), JSON.stringify(categorizedData, null, 2));

  console.log(`\n✅ Generated newspaper format: ${newspaperPath} (${finalArticles.length} articles)`);
  console.log(`✅ Generated legacy format: ${legacyPath}`);
  console.log(`✅ Total articles processed: ${totalProcessed}`);
}

main().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});