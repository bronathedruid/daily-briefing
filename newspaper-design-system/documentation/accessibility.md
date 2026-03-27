# Accessibility Guide - Newspaper Design System

This design system is built with accessibility as a core principle. Here's how to ensure your newspaper-style site meets WCAG 2.1 AA standards.

## Color & Contrast

### Contrast Ratios

All color combinations meet or exceed WCAG AA requirements:

**Light Theme:**
- Body text on white background: 12.6:1 (AA ✓, AAA ✓)
- Headlines on white background: 15.2:1 (AA ✓, AAA ✓)
- Red accent on white background: 7.1:1 (AA ✓, AAA ✓)
- Muted text on white background: 4.8:1 (AA ✓)

**Dark Theme:**
- Body text on dark background: 13.1:1 (AA ✓, AAA ✓)
- Headlines on dark background: 14.8:1 (AA ✓, AAA ✓)
- Red accent on dark background: 8.2:1 (AA ✓, AAA ✓)
- Muted text on dark background: 5.1:1 (AA ✓)

### High Contrast Mode

The system automatically adapts to `prefers-contrast: high`:

```css
@media (prefers-contrast: high) {
  :root {
    --newspaper-color-border: #000000;
    --newspaper-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  [data-theme="light"] {
    --newspaper-color-text: #000000;
    --newspaper-color-background: #ffffff;
    --newspaper-color-red: #cc0000;
  }
}
```

## Typography & Readability

### Font Choices

**Serif Headlines (Playfair Display/Georgia):**
- Excellent readability at large sizes
- Clear character distinction
- Dyslexia-friendly letter spacing

**Sans-serif Body (System fonts):**
- Optimized for screen reading
- Consistent across platforms
- High legibility at small sizes

### Typography Scale

All text sizes meet minimum requirements:
- Body text: 16px (1rem) minimum
- Caption text: 14px minimum
- Interactive elements: 16px minimum
- Large headlines scale with viewport

### Line Height & Spacing

```css
/* Optimal reading spacing */
--newspaper-leading-tight: 1.2;    /* Headlines */
--newspaper-leading-normal: 1.5;   /* Body text */
--newspaper-leading-loose: 1.7;    /* Dense content */
```

### Reading Flow

- Left-aligned text for optimal scanning
- Maximum line length: 75 characters
- Clear paragraph spacing
- Proper heading hierarchy (h1 → h6)

## Keyboard Navigation

### Focus Management

All interactive elements have clear focus indicators:

```css
*:focus {
  outline: 2px solid var(--newspaper-color-accent);
  outline-offset: 2px;
}
```

### Tab Order

Elements follow logical tab order:
1. Skip navigation link
2. Main navigation
3. Theme toggle
4. Article headlines (in reading order)
5. Secondary navigation
6. Footer links

### Keyboard Shortcuts

Implement these for power users:

```javascript
// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Skip to main content (Alt + M)
  if (e.altKey && e.key === 'm') {
    document.querySelector('main').focus();
  }
  
  // Toggle theme (Alt + T)
  if (e.altKey && e.key === 't') {
    toggleTheme();
  }
  
  // Print page (Alt + P)
  if (e.altKey && e.key === 'p') {
    window.print();
  }
});
```

## Screen Reader Support

### Semantic HTML

The design system uses proper semantic elements:

```html
<!-- Proper document structure -->
<header class="newspaper-masthead">
  <h1>The Daily Briefing</h1>
</header>

<nav class="newspaper-nav" aria-label="Article categories">
  <ul>
    <li><a href="#ai-models">AI Models <span class="sr-only">(12 articles)</span></a></li>
  </ul>
</nav>

<main class="newspaper-main">
  <article class="newspaper-article">
    <header>
      <h2>Article Headline</h2>
    </header>
  </article>
</main>
```

### ARIA Labels

Add descriptive labels for complex components:

```html
<!-- Navigation with counts -->
<a href="#cybersecurity" 
   aria-label="Cybersecurity section, 15 articles">
  🔐 Security <span class="newspaper-nav-count">15</span>
</a>

<!-- Theme toggle -->
<button class="newspaper-theme-toggle" 
        aria-label="Toggle between light and dark theme"
        aria-pressed="false">
  Theme
</button>

<!-- Score badges -->
<span class="newspaper-score-badge" 
      aria-label="Article relevance score: 8.7 out of 10">
  8.7
</span>
```

### Screen Reader Only Content

Add context for screen readers:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

```html
<span class="sr-only">Article published </span>
<time datetime="2026-03-27T14:30:00Z">2 hours ago</time>

<span class="sr-only">Article source: </span>
<span class="newspaper-source">TechCrunch</span>
```

## Motion & Animation

### Reduced Motion

Respect user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .newspaper-theme-transition {
    transition-duration: 0.05s !important;
  }
}
```

### Safe Animations

All animations are subtle and functional:
- Theme transitions: 0.25s
- Hover effects: 0.15s
- No auto-playing animations
- No flashing content

## Images & Media

### Alt Text Guidelines

```html
<!-- Descriptive alt text -->
<img src="openai-headquarters.jpg" 
     alt="Modern glass building with OpenAI logo, surrounded by San Francisco skyline">

<!-- Decorative images -->
<img src="newspaper-ornament.svg" 
     alt="" 
     role="presentation">

<!-- Complex images need longer descriptions -->
<img src="ai-performance-chart.png" 
     alt="Bar chart showing GPT-5 scoring 98% on MMLU benchmark, compared to GPT-4 at 86% and human expert baseline at 89%">
```

### Figure Captions

Proper figure markup for images with captions:

```html
<figure class="newspaper-lead-image">
  <img src="..." alt="...">
  <figcaption class="newspaper-caption">
    OpenAI's headquarters in San Francisco, where GPT-5 was developed 
    over 18 months by a team of 200+ researchers and engineers.
  </figcaption>
</figure>
```

## Forms & Interactive Elements

### Form Labels

All form elements have proper labels:

```html
<div class="newspaper-form-group">
  <label for="search-input" class="newspaper-label">
    Search Articles
  </label>
  <input type="search" 
         id="search-input" 
         class="newspaper-input"
         placeholder="Enter keywords..."
         aria-describedby="search-help">
  <div id="search-help" class="newspaper-caption">
    Search across all categories and dates
  </div>
</div>
```

### Button States

Clear button states for all interactions:

```css
.newspaper-btn {
  /* Base state already defined */
}

.newspaper-btn:hover {
  /* Hover feedback */
}

.newspaper-btn:focus {
  /* Focus indicator */
}

.newspaper-btn:active {
  /* Active state */
}

.newspaper-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.newspaper-btn[aria-pressed="true"] {
  /* Toggle button pressed state */
  background: var(--newspaper-color-red);
  color: white;
}
```

## Error Handling & Feedback

### Error Messages

Clear, actionable error messages:

```html
<div class="newspaper-alert newspaper-alert-error" role="alert">
  <div class="newspaper-alert-title">Loading Error</div>
  Unable to load latest articles. <a href="#" onclick="retryLoad()">Try again</a> 
  or <a href="/archive">view archived content</a>.
</div>
```

### Loading States

Accessible loading indicators:

```html
<div class="newspaper-spinner" 
     role="status" 
     aria-label="Loading articles">
  <span class="sr-only">Loading...</span>
</div>
```

## Testing Checklist

### Automated Testing

Run these tools regularly:
- **axe-core**: `npm install @axe-core/cli`
- **Lighthouse**: Built into Chrome DevTools
- **WAVE**: Browser extension
- **Pa11y**: Command-line tool

### Manual Testing

1. **Keyboard Navigation**
   - [ ] Tab through all interactive elements
   - [ ] All elements have visible focus
   - [ ] Skip navigation works
   - [ ] No keyboard traps

2. **Screen Reader Testing**
   - [ ] Test with NVDA (Windows) or VoiceOver (Mac)
   - [ ] All content is announced correctly
   - [ ] Navigation makes sense
   - [ ] Form labels are read properly

3. **Visual Testing**
   - [ ] Test at 200% zoom
   - [ ] Test with high contrast mode
   - [ ] Check color combinations
   - [ ] Verify in different browsers

4. **Cognitive Testing**
   - [ ] Content structure is logical
   - [ ] Language is clear and concise
   - [ ] Error messages are helpful
   - [ ] User can complete tasks easily

### Accessibility Statement

Include an accessibility statement on your site:

```html
<footer class="newspaper-footer">
  <p>
    This site is designed to meet WCAG 2.1 AA accessibility standards. 
    If you encounter any accessibility issues, please 
    <a href="mailto:accessibility@example.com">contact us</a>.
  </p>
</footer>
```

## Regular Maintenance

1. **Monthly audits** with automated tools
2. **Quarterly manual testing** with real users
3. **Annual review** of accessibility guidelines
4. **User feedback** collection and response
5. **Staff training** on accessibility best practices

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Screen Reader Survey](https://webaim.org/projects/screenreadersurvey9/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)
- [A11y Color Palette](https://colorpalettes.colorion.co/)

The newspaper design system prioritizes accessibility without compromising visual design, ensuring all users can access and enjoy the content regardless of their abilities or assistive technologies.