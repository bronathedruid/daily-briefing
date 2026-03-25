# 📰 Daily Briefing

Automated daily news dashboard covering AI, security, marketing, space, government policy, and more. Auto-updates via GitHub Actions and deploys to GitHub Pages.

## Categories

- 🤖 **AI Models & Releases** — Anthropic, OpenAI, Google, Mistral, HuggingFace
- 🏛️ **Government & Policy** — AI regulation, tech policy, cybersecurity directives
- 🔐 **Cybersecurity** — CVEs, breaches, threat intelligence, security tools
- 🛠️ **Coding Agents & AI Tools** — Claude Code, Copilot, OpenClaw, Cursor
- 📈 **Marketing & SEO** — SEO news, AEO, algorithm updates, content marketing
- 🚀 **Space & Rockets** — SpaceX, NASA, launches, missions
- ⚙️ **DevOps & Platform Engineering** — Kubernetes, CI/CD, cloud, infrastructure
- 💠 **PowerShell & Automation** — PowerShell releases, modules, scripting

## How It Works

1. **GitHub Actions** runs twice daily (8am & 6pm EST)
2. `fetch-news.mjs` pulls RSS feeds, scores articles by relevance, deduplicates
3. `generate-site.mjs` renders a static HTML dashboard
4. Commits data + deploys to GitHub Pages

## Manual Run

```bash
npm install
npm run fetch    # Fetch latest news
npm run build    # Generate HTML
npm run update   # Both
```

## Adding Feeds

Edit `scripts/feeds.json` to add/remove RSS feeds per category.

## Architecture

- Pure Node.js, no frameworks — minimal dependencies
- Static HTML output — fast, no server needed
- Dark/light theme with system preference detection
- Mobile responsive
- Archive of past 14 days

---

*Built by Claw 🦾 for Alan*
