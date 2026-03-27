#!/usr/bin/env node
/**
 * ai-summarize.mjs — AI-powered article summarization for the newspaper
 * Integrates with OpenClaw or OpenAI to generate high-quality summaries
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');

// Configuration
const MAX_SUMMARY_LENGTH = 200;
const SUMMARY_STYLE = 'newspaper'; // 'newspaper', 'technical', 'casual'

/**
 * Simple rule-based summarization as fallback
 */
function simpleSummarize(content, title) {
  if (!content) return '';
  
  // Clean and normalize content
  const cleaned = content
    .replace(/<[^>]*>/g, ' ')          // Remove HTML
    .replace(/\s+/g, ' ')               // Normalize whitespace
    .replace(/[\r\n]+/g, ' ')          // Remove line breaks
    .trim();
  
  if (cleaned.length < 50) return cleaned;
  
  // Try to extract meaningful sentences
  const sentences = cleaned.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);
  
  let summary = '';
  for (const sentence of sentences) {
    const potential = summary + sentence + '. ';
    if (potential.length > MAX_SUMMARY_LENGTH) break;
    summary = potential;
  }
  
  // Fallback to character limit if no good sentences
  if (summary.length < 50) {
    summary = cleaned.slice(0, MAX_SUMMARY_LENGTH);
    if (cleaned.length > MAX_SUMMARY_LENGTH) summary += '...';
  }
  
  return summary.trim();
}

/**
 * AI-powered summarization using OpenClaw
 * Falls back to simple summarization if AI is unavailable
 */
async function aiSummarize(content, title, source = '') {
  try {
    // Check if we're in an OpenClaw environment
    const isOpenClaw = process.env.OPENCLAW_GATEWAY_URL || process.env.OPENCLAW_API_URL;
    
    if (isOpenClaw) {
      return await openClawSummarize(content, title, source);
    }
    
    // Check for OpenAI API key
    if (process.env.OPENAI_API_KEY) {
      return await openAISummarize(content, title, source);
    }
    
    console.log('ℹ️  No AI service available, using simple summarization');
    return simpleSummarize(content, title);
    
  } catch (error) {
    console.warn(`⚠️  AI summarization failed: ${error.message}, falling back to simple method`);
    return simpleSummarize(content, title);
  }
}

/**
 * Summarization using OpenClaw gateway
 */
async function openClawSummarize(content, title, source) {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
  
  const prompt = createSummarizationPrompt(content, title, source);
  
  const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-3-5-20241022', // Fast and efficient for summarization
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenClaw API error: ${response.status}`);
  }
  
  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content?.trim();
  
  if (!summary) {
    throw new Error('No summary returned from OpenClaw');
  }
  
  return summary.length > MAX_SUMMARY_LENGTH 
    ? summary.slice(0, MAX_SUMMARY_LENGTH - 3) + '...'
    : summary;
}

/**
 * Summarization using OpenAI directly
 */
async function openAISummarize(content, title, source) {
  const prompt = createSummarizationPrompt(content, title, source);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Cost-effective for summarization
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content?.trim();
  
  if (!summary) {
    throw new Error('No summary returned from OpenAI');
  }
  
  return summary.length > MAX_SUMMARY_LENGTH 
    ? summary.slice(0, MAX_SUMMARY_LENGTH - 3) + '...'
    : summary;
}

/**
 * Create a summarization prompt based on style
 */
function createSummarizationPrompt(content, title, source) {
  const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  let styleGuide = '';
  switch (SUMMARY_STYLE) {
    case 'newspaper':
      styleGuide = 'Write in traditional newspaper style: factual, concise, and engaging. Use active voice and focus on the most newsworthy aspects.';
      break;
    case 'technical':
      styleGuide = 'Write in technical style: precise, detailed, and focused on implementation details and technical impact.';
      break;
    case 'casual':
      styleGuide = 'Write in casual, accessible language that anyone can understand.';
      break;
  }
  
  return `Summarize this article in 1-2 sentences (max ${MAX_SUMMARY_LENGTH} characters). ${styleGuide}

Title: ${title}
Source: ${source}
Content: ${cleanContent.slice(0, 2000)}

Summary:`;
}

/**
 * Process a batch of articles for summarization
 */
async function processArticles(articles, maxConcurrent = 5) {
  const results = [];
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < articles.length; i += maxConcurrent) {
    const batch = articles.slice(i, i + maxConcurrent);
    
    console.log(`📝 Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(articles.length / maxConcurrent)}...`);
    
    const batchPromises = batch.map(async (article, index) => {
      try {
        const summary = await aiSummarize(
          article.content || article.snippet,
          article.title,
          article.source
        );
        
        return {
          ...article,
          summary,
          originalSnippet: article.snippet
        };
      } catch (error) {
        console.warn(`⚠️  Failed to summarize article ${i + index + 1}: ${error.message}`);
        return {
          ...article,
          summary: simpleSummarize(article.content || article.snippet, article.title),
          originalSnippet: article.snippet
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to be respectful
    if (i + maxConcurrent < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Main function for CLI usage
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
AI Article Summarizer for Daily Briefing

Usage:
  node ai-summarize.mjs [options]

Options:
  --input <file>     Input JSON file (default: data/latest.json)
  --output <file>    Output JSON file (default: overwrites input)
  --style <style>    Summary style: newspaper|technical|casual (default: newspaper)
  --dry-run          Show summaries without saving
  --help, -h         Show this help

Environment Variables:
  OPENCLAW_GATEWAY_URL   OpenClaw gateway URL (default: http://localhost:18789)
  OPENAI_API_KEY        OpenAI API key for direct API access
`);
    return;
  }
  
  const inputFile = args[args.indexOf('--input') + 1] || join(DATA_DIR, 'latest.json');
  const outputFile = args[args.indexOf('--output') + 1] || inputFile;
  const isDryRun = args.includes('--dry-run');
  
  try {
    console.log(`📖 Reading articles from ${inputFile}...`);
    const data = JSON.parse(readFileSync(inputFile, 'utf8'));
    
    // Extract articles from the data structure
    let allArticles = [];
    if (data.articles) {
      // Newspaper format
      allArticles = data.articles.map(([category, title, link, source, time, snippet]) => ({
        category, title, link, source, time, 
        snippet, content: snippet
      }));
    } else if (data.categories) {
      // Legacy format
      for (const category of Object.values(data.categories)) {
        allArticles.push(...category.articles.map(article => ({
          ...article,
          category: category.label
        })));
      }
    }
    
    console.log(`🔍 Found ${allArticles.length} articles to process`);
    
    if (allArticles.length === 0) {
      console.log('ℹ️  No articles found to summarize');
      return;
    }
    
    // Process articles
    const processedArticles = await processArticles(allArticles);
    
    if (isDryRun) {
      console.log('\n📋 Sample summaries (dry run):');
      processedArticles.slice(0, 5).forEach((article, i) => {
        console.log(`\n${i + 1}. ${article.title}`);
        console.log(`   Original: ${(article.originalSnippet || '').slice(0, 100)}...`);
        console.log(`   Summary:  ${article.summary}`);
      });
      return;
    }
    
    // Update the data structure with summaries
    if (data.articles) {
      // Newspaper format - update with summaries
      data.articles = processedArticles.map(article => [
        article.category,
        article.title,
        article.link,
        article.source,
        article.time,
        article.summary
      ]);
    } else if (data.categories) {
      // Legacy format - update categories
      const articlesByCategory = {};
      processedArticles.forEach(article => {
        if (!articlesByCategory[article.category]) {
          articlesByCategory[article.category] = [];
        }
        articlesByCategory[article.category].push(article);
      });
      
      for (const [catId, category] of Object.entries(data.categories)) {
        const categoryLabel = category.label;
        if (articlesByCategory[categoryLabel]) {
          category.articles = articlesByCategory[categoryLabel].map(article => ({
            title: article.title,
            link: article.link,
            source: article.source,
            time: article.time,
            snippet: article.summary,
            score: article.score || 10
          }));
        }
      }
    }
    
    // Save the updated data
    writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`✅ Saved summarized articles to ${outputFile}`);
    console.log(`📊 Processed ${processedArticles.length} articles`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Export functions for use in other scripts
export { aiSummarize, simpleSummarize, processArticles };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}