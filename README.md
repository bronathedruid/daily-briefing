# The Daily Briefing 📰

A beautiful, AI-powered newspaper that automatically aggregates and summarizes tech news from across the web. Built with authentic newspaper design and modern web technologies.

![Daily Briefing Screenshot](https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop)

## ✨ Features

### 🗞️ Authentic Newspaper Experience
- **Traditional newspaper layout** with proper typography and column design
- **3D page flip animations** with realistic physics and shadows
- **Dog-ear page corners** for intuitive navigation
- **Typewriter printing effects** that reveal content progressively
- **Responsive design** adapts from 3-column to mobile-friendly layout

### 🤖 AI-Powered Content
- **Smart summarization** using OpenClaw or OpenAI for concise, readable summaries
- **Intelligent scoring** prioritizes the most relevant articles
- **Automatic categorization** across 8 key technology sectors
- **Deduplication** removes duplicate stories across sources

### 📊 Comprehensive Coverage
- **🤖 AI Models & Releases** - Latest ML models, research, and AI company news
- **🏛️ Government & Policy** - Tech regulation, privacy laws, and policy changes  
- **🔐 Cybersecurity** - Threats, vulnerabilities, and security research
- **🛠️ Coding Agents & AI Tools** - Development tools, frameworks, and coding assistance
- **📈 Marketing & SEO** - Digital marketing trends and search optimization
- **🚀 Space & Rockets** - Space technology, launches, and aerospace innovation
- **⚙️ DevOps & Platform Engineering** - Infrastructure, cloud, and deployment tools
- **💠 PowerShell & Automation** - Automation tools and scripting

### 🚀 Modern Infrastructure
- **Automated RSS aggregation** from 60+ high-quality sources
- **GitHub Actions deployment** with 3 daily editions (Morning, Afternoon, Evening)
- **Static site generation** for blazing-fast loading
- **Progressive Web App** features for mobile experience
- **Archive system** maintains historical editions

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RSS Sources   │───▶│  AI Processing  │───▶│   Static Site   │
│                 │    │                 │    │                 │
│ • 60+ Feeds     │    │ • Summarization │    │ • Newspaper CSS │
│ • Real-time     │    │ • Scoring       │    │ • 3D Animations │  
│ • Deduplication │    │ • Categorization│    │ • Pagination    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **RSS Aggregation** - Fetch articles from curated sources
2. **AI Summarization** - Generate concise, newspaper-style summaries
3. **Content Scoring** - Rank articles by relevance and quality
4. **Static Generation** - Build newspaper layout with embedded data
5. **GitHub Pages Deployment** - Serve via fast CDN

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- npm or yarn
- (Optional) OpenClaw gateway for AI summarization

### Installation

```bash
# Clone the repository
git clone https://github.com/bronathedruid/daily-briefing.git
cd daily-briefing

# Install dependencies
npm install

# Fetch latest news and build newspaper
npm run update

# Start development server
npm run dev
```

The newspaper will be available at `http://localhost:3001`

### Configuration

The system supports multiple AI providers for summarization:

```bash
# OpenClaw Gateway (recommended)
export OPENCLAW_GATEWAY_URL=http://localhost:18789

# OpenAI API (alternative)
export OPENAI_API_KEY=your_openai_key

# ACE Music API (for daily songs)
export ACE_MUSIC_API_KEY=your_ace_key
```

## 📜 Scripts

### Core Scripts
- `npm run fetch` - Aggregate RSS feeds with AI summarization
- `npm run build` - Generate the newspaper website
- `npm run update` - Full pipeline (fetch + build)
- `npm run dev` - Development server with auto-rebuild

### Legacy Scripts
- `npm run fetch:legacy` - Basic RSS aggregation (no AI)
- `npm run build:legacy` - Generate original GitHub-style layout

### AI Tools
- `npm run summarize` - Enhanced AI summarization of existing data
- `node scripts/ai-summarize.mjs --help` - CLI options for summarization

## 🎨 Design System

### Typography
- **Headlines**: Georgia serif for traditional newspaper feel
- **Body text**: Georgia with justified alignment
- **Metadata**: Courier New for authentic typewriter aesthetic

### Color Palette
```css
--bg-paper: #f4f1ea;        /* Aged newspaper background */
--bg-paper-light: #fdfcf7;  /* Fresh paper highlight */
--ink: #1a1a1a;             /* Traditional newspaper ink */
--accent: #8b0000;          /* Classic newspaper red */
```

### Animations
- **Page flips**: 3D rotateY transforms with realistic physics
- **Text reveals**: Clip-path animations simulating ink spreading
- **Corner interactions**: Hover effects for page navigation

## 📱 Mobile Experience

The newspaper gracefully adapts across devices:

- **Desktop** (1024px+): Full 3-column traditional layout
- **Tablet** (650px-1024px): 2-column responsive layout  
- **Mobile** (650px-): Single column with optimized typography

Touch gestures and keyboard navigation (←/→ arrow keys) supported.

## 🔧 Customization

### Adding News Sources

Edit `scripts/feeds.json` to add new RSS feeds:

```json
{
  "categories": {
    "ai-models": {
      "label": "🤖 AI Models & Releases",
      "keywords": ["ai", "model", "llm", "machine learning"],
      "feeds": [
        {
          "name": "Your Source",
          "url": "https://example.com/rss",
          "priority": 5
        }
      ]
    }
  }
}
```

### Styling Modifications

The newspaper design is highly customizable via CSS custom properties:

```css
:root {
  --font-headline: 'Your Serif Font', Georgia, serif;
  --accent: #your-color;
  --bg-paper: #your-background;
}
```

### AI Model Configuration

Switch between AI providers in `scripts/enhanced-fetch-news.mjs`:

```javascript
// OpenClaw (local)
model: 'anthropic/claude-haiku-3-5-20241022'

// OpenAI (API)
model: 'gpt-4o-mini'
```

## 🚀 Deployment

### GitHub Pages (Recommended)

1. Fork this repository
2. Enable GitHub Actions in your repository settings
3. Configure GitHub Pages to deploy from Actions
4. The workflow will run automatically 3x daily

### Manual Deployment

```bash
# Build the newspaper
npm run update

# Deploy the public/ directory to your hosting platform
rsync -av public/ user@server:/var/www/html/
```

### Environment Variables

For production deployment, configure:

```bash
# Required for AI summarization
OPENCLAW_GATEWAY_URL=your_openclaw_url
# OR
OPENAI_API_KEY=your_openai_key

# Optional for daily music generation
ACE_MUSIC_API_KEY=your_ace_key
```

## 🎵 Daily Features

### AI-Generated Music
Each edition includes a daily AI-generated song themed around tech news, created using ACE Music API.

### Edition Schedule
- **Morning Edition**: 6 AM EST (11:00 UTC)
- **Afternoon Edition**: 12 PM EST (17:00 UTC)  
- **Evening Edition**: 6 PM EST (23:00 UTC)

## 🤝 Contributing

Contributions welcome! Areas of interest:

- **New data sources** - Quality RSS feeds for tech news
- **Design improvements** - Enhanced newspaper authenticity
- **Performance optimizations** - Faster loading and rendering
- **Mobile enhancements** - Better touch interactions
- **Accessibility** - Screen reader support, keyboard navigation

### Development Workflow

```bash
# 1. Fork and clone
git clone https://github.com/yourusername/daily-briefing.git

# 2. Create feature branch
git checkout -b feature/your-enhancement

# 3. Make changes and test
npm run dev

# 4. Submit pull request
```

## 📊 Technical Stats

- **60+ RSS sources** across 8 categories
- **~750 articles processed** per update cycle  
- **109 articles featured** in each edition
- **<60KB total size** for fast loading
- **<500ms page transitions** with 3D animations
- **Progressive enhancement** works without JavaScript

## 🐛 Troubleshooting

### Common Issues

**RSS feeds failing:**
```bash
# Check feed configuration
node scripts/enhanced-fetch-news.mjs | grep "Failed"

# Test individual feed
curl -H "User-Agent: DailyBriefingBot/1.0" https://feed-url.com/rss
```

**AI summarization not working:**
```bash
# Verify OpenClaw connection
curl http://localhost:18789/health

# Check API keys
echo $OPENAI_API_KEY | wc -c  # Should be >0
```

**Build errors:**
```bash
# Clear cache and rebuild
rm -rf data/ public/
npm run update
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- **RSS Sources** - Thanks to all the publishers providing quality tech journalism
- **OpenClaw** - For the AI gateway infrastructure
- **GitHub Pages** - For free, reliable hosting
- **Traditional Newspapers** - For design inspiration and typography guidance

---

Built with ❤️ by [bronathedruid](https://github.com/bronathedruid) • [Live Demo](https://bronathedruid.github.io/daily-briefing/)