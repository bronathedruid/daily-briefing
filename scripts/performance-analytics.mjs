#!/usr/bin/env node
/**
 * performance-analytics.mjs — Performance monitoring and analytics
 * Tracks feed health, build times, content quality, and user engagement
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ANALYTICS_DIR = join(ROOT, 'analytics');

// Ensure analytics directory exists
mkdirSync(ANALYTICS_DIR, { recursive: true });

/**
 * Feed health monitoring
 */
class FeedMonitor {
  constructor() {
    this.metricsFile = join(ANALYTICS_DIR, 'feed-metrics.json');
    this.loadMetrics();
  }
  
  loadMetrics() {
    try {
      this.metrics = JSON.parse(readFileSync(this.metricsFile, 'utf8'));
    } catch {
      this.metrics = {
        feeds: {},
        dailyStats: {},
        created: new Date().toISOString()
      };
    }
  }
  
  saveMetrics() {
    writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
  }
  
  recordFeedHealth(feedName, status, responseTime, articlesCount, error = null) {
    const today = new Date().toISOString().slice(0, 10);
    
    if (!this.metrics.feeds[feedName]) {
      this.metrics.feeds[feedName] = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalArticles: 0,
        lastSuccess: null,
        lastError: null,
        daily: {}
      };
    }
    
    const feed = this.metrics.feeds[feedName];
    feed.totalRequests++;
    
    if (!feed.daily[today]) {
      feed.daily[today] = {
        requests: 0,
        successes: 0,
        failures: 0,
        articles: 0,
        avgResponseTime: 0,
        errors: []
      };
    }
    
    const dailyStats = feed.daily[today];
    dailyStats.requests++;
    
    if (status === 'success') {
      feed.successfulRequests++;
      feed.totalArticles += articlesCount;
      feed.lastSuccess = new Date().toISOString();
      feed.averageResponseTime = ((feed.averageResponseTime * (feed.successfulRequests - 1)) + responseTime) / feed.successfulRequests;
      
      dailyStats.successes++;
      dailyStats.articles += articlesCount;
      dailyStats.avgResponseTime = ((dailyStats.avgResponseTime * (dailyStats.successes - 1)) + responseTime) / dailyStats.successes;
    } else {
      feed.failedRequests++;
      feed.lastError = { timestamp: new Date().toISOString(), error };
      
      dailyStats.failures++;
      if (error) {
        dailyStats.errors.push({ timestamp: new Date().toISOString(), error });
      }
    }
    
    this.saveMetrics();
  }
  
  getHealthReport() {
    const report = {
      summary: {},
      feeds: {},
      recommendations: []
    };
    
    let totalFeeds = Object.keys(this.metrics.feeds).length;
    let healthyFeeds = 0;
    let avgResponseTime = 0;
    let totalArticles = 0;
    
    Object.entries(this.metrics.feeds).forEach(([feedName, stats]) => {
      const successRate = stats.totalRequests > 0 ? (stats.successfulRequests / stats.totalRequests) : 0;
      const isHealthy = successRate > 0.8 && stats.averageResponseTime < 5000;
      
      if (isHealthy) healthyFeeds++;
      avgResponseTime += stats.averageResponseTime;
      totalArticles += stats.totalArticles;
      
      report.feeds[feedName] = {
        successRate: Math.round(successRate * 100),
        averageResponseTime: Math.round(stats.averageResponseTime),
        totalArticles: stats.totalArticles,
        isHealthy,
        lastSuccess: stats.lastSuccess,
        lastError: stats.lastError
      };
      
      // Recommendations
      if (successRate < 0.5) {
        report.recommendations.push(`⚠️ Feed "${feedName}" has low success rate (${Math.round(successRate * 100)}%)`);
      }
      if (stats.averageResponseTime > 10000) {
        report.recommendations.push(`🐌 Feed "${feedName}" is slow (${Math.round(stats.averageResponseTime)}ms avg)`);
      }
    });
    
    report.summary = {
      totalFeeds,
      healthyFeeds,
      healthRate: Math.round((healthyFeeds / totalFeeds) * 100),
      averageResponseTime: Math.round(avgResponseTime / totalFeeds),
      totalArticles
    };
    
    return report;
  }
}

/**
 * Content quality analyzer
 */
class ContentAnalyzer {
  constructor() {
    this.qualityFile = join(ANALYTICS_DIR, 'content-quality.json');
    this.loadQualityMetrics();
  }
  
  loadQualityMetrics() {
    try {
      this.metrics = JSON.parse(readFileSync(this.qualityFile, 'utf8'));
    } catch {
      this.metrics = {
        dailyAnalysis: {},
        trends: {},
        created: new Date().toISOString()
      };
    }
  }
  
  saveQualityMetrics() {
    writeFileSync(this.qualityFile, JSON.stringify(this.metrics, null, 2));
  }
  
  analyzeContent(data) {
    const today = new Date().toISOString().slice(0, 10);
    let articles = [];
    
    if (data.articles) {
      articles = data.articles.map(([category, title, link, source, time, snippet]) => ({
        category, title, link, source, time, snippet
      }));
    } else if (data.categories) {
      Object.values(data.categories).forEach(cat => {
        articles.push(...cat.articles.map(a => ({ ...a, category: cat.label })));
      });
    }
    
    const analysis = {
      totalArticles: articles.length,
      averageSnippetLength: 0,
      categoriesDistribution: {},
      sourceDistribution: {},
      qualityScores: {
        hasSnippet: 0,
        hasValidUrl: 0,
        hasSource: 0,
        hasTimestamp: 0
      },
      keywordDensity: {},
      sentiment: { positive: 0, neutral: 0, negative: 0 }
    };
    
    articles.forEach(article => {
      // Category distribution
      const cleanCategory = article.category.replace(/^[🤖🏛️🔐🛠️📈🚀⚙️💠🧬]\s*/, '');
      analysis.categoriesDistribution[cleanCategory] = (analysis.categoriesDistribution[cleanCategory] || 0) + 1;
      
      // Source distribution
      analysis.sourceDistribution[article.source] = (analysis.sourceDistribution[article.source] || 0) + 1;
      
      // Quality scores
      if (article.snippet && article.snippet.length > 20) analysis.qualityScores.hasSnippet++;
      if (article.link && article.link.startsWith('http')) analysis.qualityScores.hasValidUrl++;
      if (article.source) analysis.qualityScores.hasSource++;
      if (article.time) analysis.qualityScores.hasTimestamp++;
      
      // Snippet analysis
      if (article.snippet) {
        analysis.averageSnippetLength += article.snippet.length;
        
        // Extract keywords
        const words = article.snippet.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        words.forEach(word => {
          analysis.keywordDensity[word] = (analysis.keywordDensity[word] || 0) + 1;
        });
        
        // Basic sentiment (very simple)
        const positive = /\b(success|launch|improve|better|good|great|excellent|breakthrough|innovation)\b/i;
        const negative = /\b(fail|error|breach|attack|vulnerability|problem|issue|concern)\b/i;
        
        if (positive.test(article.snippet)) {
          analysis.sentiment.positive++;
        } else if (negative.test(article.snippet)) {
          analysis.sentiment.negative++;
        } else {
          analysis.sentiment.neutral++;
        }
      }
    });
    
    analysis.averageSnippetLength = articles.length > 0 ? Math.round(analysis.averageSnippetLength / articles.length) : 0;
    
    // Convert quality scores to percentages
    Object.keys(analysis.qualityScores).forEach(metric => {
      analysis.qualityScores[metric] = Math.round((analysis.qualityScores[metric] / articles.length) * 100);
    });
    
    // Top keywords
    analysis.topKeywords = Object.entries(analysis.keywordDensity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
    
    // Store daily analysis
    this.metrics.dailyAnalysis[today] = {
      ...analysis,
      timestamp: new Date().toISOString()
    };
    
    this.saveQualityMetrics();
    return analysis;
  }
  
  getTrendAnalysis(days = 7) {
    const dates = Object.keys(this.metrics.dailyAnalysis)
      .sort()
      .slice(-days);
    
    if (dates.length === 0) return null;
    
    const trends = {
      articleCount: [],
      qualityTrends: {},
      categoryTrends: {},
      keywordTrends: {}
    };
    
    dates.forEach(date => {
      const day = this.metrics.dailyAnalysis[date];
      trends.articleCount.push({ date, count: day.totalArticles });
      
      // Quality trends
      Object.entries(day.qualityScores).forEach(([metric, score]) => {
        if (!trends.qualityTrends[metric]) trends.qualityTrends[metric] = [];
        trends.qualityTrends[metric].push({ date, score });
      });
      
      // Category trends
      Object.entries(day.categoriesDistribution).forEach(([category, count]) => {
        if (!trends.categoryTrends[category]) trends.categoryTrends[category] = [];
        trends.categoryTrends[category].push({ date, count });
      });
    });
    
    return trends;
  }
}

/**
 * Build performance tracker
 */
class BuildTracker {
  constructor() {
    this.buildFile = join(ANALYTICS_DIR, 'build-performance.json');
    this.loadBuildMetrics();
  }
  
  loadBuildMetrics() {
    try {
      this.metrics = JSON.parse(readFileSync(this.buildFile, 'utf8'));
    } catch {
      this.metrics = {
        builds: [],
        averages: {},
        created: new Date().toISOString()
      };
    }
  }
  
  saveBuildMetrics() {
    writeFileSync(this.buildFile, JSON.stringify(this.metrics, null, 2));
  }
  
  recordBuild(stage, duration, success = true, details = {}) {
    const build = {
      stage,
      duration,
      success,
      timestamp: new Date().toISOString(),
      details
    };
    
    this.metrics.builds.push(build);
    
    // Keep only last 100 builds
    if (this.metrics.builds.length > 100) {
      this.metrics.builds = this.metrics.builds.slice(-100);
    }
    
    // Update averages
    const successfulBuilds = this.metrics.builds.filter(b => b.success && b.stage === stage);
    if (successfulBuilds.length > 0) {
      this.metrics.averages[stage] = {
        averageDuration: Math.round(successfulBuilds.reduce((sum, b) => sum + b.duration, 0) / successfulBuilds.length),
        successRate: Math.round((successfulBuilds.length / this.metrics.builds.filter(b => b.stage === stage).length) * 100),
        lastBuild: new Date().toISOString()
      };
    }
    
    this.saveBuildMetrics();
  }
  
  getPerformanceReport() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentBuilds = this.metrics.builds.filter(b => b.timestamp > last24h);
    
    const report = {
      summary: {
        totalBuilds: this.metrics.builds.length,
        recentBuilds: recentBuilds.length,
        averageBuildTime: 0,
        successRate: 0
      },
      stages: {},
      recentActivity: recentBuilds.slice(-10),
      recommendations: []
    };
    
    // Calculate overall stats
    const successfulBuilds = this.metrics.builds.filter(b => b.success);
    if (this.metrics.builds.length > 0) {
      report.summary.averageBuildTime = Math.round(
        successfulBuilds.reduce((sum, b) => sum + b.duration, 0) / successfulBuilds.length
      );
      report.summary.successRate = Math.round((successfulBuilds.length / this.metrics.builds.length) * 100);
    }
    
    // Stage-specific stats
    report.stages = { ...this.metrics.averages };
    
    // Recommendations
    Object.entries(this.metrics.averages).forEach(([stage, stats]) => {
      if (stats.successRate < 90) {
        report.recommendations.push(`⚠️ Stage "${stage}" has low success rate: ${stats.successRate}%`);
      }
      if (stats.averageDuration > 300000) { // 5 minutes
        report.recommendations.push(`🐌 Stage "${stage}" is slow: ${Math.round(stats.averageDuration / 1000)}s avg`);
      }
    });
    
    return report;
  }
}

/**
 * Main analytics function
 */
async function runAnalytics(dataFile = null) {
  console.log('📊 Running performance analytics...');
  
  const feedMonitor = new FeedMonitor();
  const contentAnalyzer = new ContentAnalyzer();
  const buildTracker = new BuildTracker();
  
  let data = null;
  
  // Load data if available
  try {
    const newspaperPath = join(ROOT, 'data', 'newspaper-latest.json');
    const legacyPath = join(ROOT, 'data', 'latest.json');
    
    try {
      data = JSON.parse(readFileSync(dataFile || newspaperPath, 'utf8'));
    } catch {
      data = JSON.parse(readFileSync(legacyPath, 'utf8'));
    }
    
    // Analyze content quality
    const contentAnalysis = contentAnalyzer.analyzeContent(data);
    console.log(`📝 Content analysis: ${contentAnalysis.totalArticles} articles, ${contentAnalysis.averageSnippetLength} avg snippet length`);
  } catch (error) {
    console.warn('⚠️ No data file available for content analysis');
  }
  
  // Generate reports
  const reports = {
    feedHealth: feedMonitor.getHealthReport(),
    contentQuality: data ? contentAnalyzer.getTrendAnalysis() : null,
    buildPerformance: buildTracker.getPerformanceReport(),
    generated: new Date().toISOString()
  };
  
  // Save combined report
  const reportPath = join(ANALYTICS_DIR, 'daily-report.json');
  writeFileSync(reportPath, JSON.stringify(reports, null, 2));
  
  // Generate human-readable summary
  const summary = generateSummary(reports);
  const summaryPath = join(ANALYTICS_DIR, 'summary.md');
  writeFileSync(summaryPath, summary);
  
  console.log('✅ Analytics complete!');
  console.log(`📊 Report: ${reportPath}`);
  console.log(`📄 Summary: ${summaryPath}`);
  
  return reports;
}

function generateSummary(reports) {
  const date = new Date().toLocaleDateString();
  
  let summary = `# Daily Briefing Analytics - ${date}\n\n`;
  
  // Feed Health
  if (reports.feedHealth.summary) {
    const fh = reports.feedHealth.summary;
    summary += `## 📡 Feed Health\n`;
    summary += `- **Total Feeds**: ${fh.totalFeeds}\n`;
    summary += `- **Healthy Feeds**: ${fh.healthyFeeds} (${fh.healthRate}%)\n`;
    summary += `- **Average Response Time**: ${fh.averageResponseTime}ms\n`;
    summary += `- **Total Articles**: ${fh.totalArticles}\n\n`;
    
    if (reports.feedHealth.recommendations.length > 0) {
      summary += `### Recommendations\n`;
      reports.feedHealth.recommendations.forEach(rec => {
        summary += `- ${rec}\n`;
      });
      summary += `\n`;
    }
  }
  
  // Build Performance
  if (reports.buildPerformance.summary) {
    const bp = reports.buildPerformance.summary;
    summary += `## 🏗️ Build Performance\n`;
    summary += `- **Total Builds**: ${bp.totalBuilds}\n`;
    summary += `- **Recent Builds (24h)**: ${bp.recentBuilds}\n`;
    summary += `- **Average Build Time**: ${bp.averageBuildTime}ms\n`;
    summary += `- **Success Rate**: ${bp.successRate}%\n\n`;
    
    if (reports.buildPerformance.recommendations.length > 0) {
      summary += `### Recommendations\n`;
      reports.buildPerformance.recommendations.forEach(rec => {
        summary += `- ${rec}\n`;
      });
      summary += `\n`;
    }
  }
  
  // Content Trends
  if (reports.contentQuality) {
    summary += `## 📈 Content Trends (7 days)\n`;
    summary += `- Article count trends and quality metrics available in JSON report\n`;
    summary += `- Category distribution and keyword analysis included\n\n`;
  }
  
  summary += `---\n*Generated: ${reports.generated}*\n`;
  
  return summary;
}

// Export classes and functions
export { FeedMonitor, ContentAnalyzer, BuildTracker, runAnalytics };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dataFile = args.includes('--input') ? args[args.indexOf('--input') + 1] : null;
  
  runAnalytics(dataFile).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}