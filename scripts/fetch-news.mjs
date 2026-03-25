#!/usr/bin/env node
/**
 * fetch-news.mjs — Fetches RSS feeds, scores & deduplicates articles,
 * outputs a JSON file for the site generator.
 */
import Parser from 'rss-parser';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FEEDS_PATH = join(__dirname, 'feeds.json');
const OUTPUT_DIR = join(ROOT, 'data');

const MAX_AGE_HOURS = 48; // include articles from last 48h
const MAX_ITEMS_PER_CATEGORY = 15;
const FETCH_TIMEOUT_MS = 10000;

const parser = new Parser({
  timeout: FETCH_TIMEOUT_MS,
  headers: { 'User-Agent': 'DailyBriefingBot/1.0 (+https://github.com/bronathedruid/daily-briefing)' },
});

function isRecent(dateStr) {
  if (!dateStr) return true; // include if no date
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const ageMs = Date.now() - d.getTime();
  return ageMs < MAX_AGE_HOURS * 60 * 60 * 1000;
}

function scoreArticle(item, keywords, feedPriority) {
  let score = feedPriority * 2;
  const text = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`.toLowerCase();

  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) score += 2;
  }

  // Boost for titles with strong signals
  const title = (item.title || '').toLowerCase();
  if (title.includes('breaking') || title.includes('announce') || title.includes('launch')) score += 3;
  if (title.includes('release') || title.includes('new')) score += 1;

  return score;
}

function deduplicate(articles) {
  const seen = new Set();
  return articles.filter(a => {
    // Normalize title for dedup
    const key = (a.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  // Handle Algolia HN API (returns JSON, not RSS)
  if (feedConfig.url.includes('hn.algolia.com')) {
    return fetchHNAlgolia(feedConfig);
  }
  try {
    const feed = await parser.parseURL(feedConfig.url);
    return (feed.items || []).map(item => ({
      title: item.title?.trim() || 'Untitled',
      link: item.link || '',
      date: item.isoDate || item.pubDate || null,
      snippet: (item.contentSnippet || item.content || '').slice(0, 300).replace(/<[^>]*>/g, '').trim(),
      source: feedConfig.name,
      feedPriority: feedConfig.priority || 3,
    }));
  } catch (err) {
    console.warn(`  ⚠ Failed: ${feedConfig.name} — ${err.message}`);
    return [];
  }
}

async function main() {
  const config = JSON.parse(readFileSync(FEEDS_PATH, 'utf8'));
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const result = { date: today, generated: new Date().toISOString(), categories: {} };

  for (const [catId, cat] of Object.entries(config.categories)) {
    console.log(`\n📡 ${cat.label}`);
    let allArticles = [];

    // Fetch all feeds in parallel per category
    const feedResults = await Promise.allSettled(
      cat.feeds.map(f => {
        console.log(`  → ${f.name}`);
        return fetchFeed(f);
      })
    );

    for (const r of feedResults) {
      if (r.status === 'fulfilled') allArticles.push(...r.value);
    }

    // Filter recent
    allArticles = allArticles.filter(a => isRecent(a.date));

    // Score
    allArticles = allArticles.map(a => ({
      ...a,
      score: scoreArticle(a, cat.keywords || [], a.feedPriority),
    }));

    // Sort by score desc, then date desc
    allArticles.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    // Dedup and limit
    allArticles = deduplicate(allArticles).slice(0, MAX_ITEMS_PER_CATEGORY);

    result.categories[catId] = {
      label: cat.label,
      emoji: cat.emoji,
      count: allArticles.length,
      articles: allArticles.map(({ title, link, date, snippet, source, score }) => ({
        title, link, date, snippet, source, score,
      })),
    };

    console.log(`  ✓ ${allArticles.length} articles`);
  }

  const outPath = join(OUTPUT_DIR, `${today}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  // Also write as latest.json for the site
  writeFileSync(join(OUTPUT_DIR, 'latest.json'), JSON.stringify(result, null, 2));

  console.log(`\n✅ Saved ${outPath}`);
  console.log(`✅ Saved data/latest.json`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
