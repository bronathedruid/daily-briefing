# Font Selection Guide - Newspaper Typography

The newspaper design system uses a carefully curated selection of typefaces that balance authenticity, readability, and web performance.

## Primary Typography Stack

### Headlines & Display Text

**Primary: Playfair Display**
- **Use for:** Banner headlines, main headlines, pull quotes
- **Characteristics:** Classic serif with high contrast, excellent for large sizes
- **Web font:** Google Fonts
- **License:** Open Font License
- **Fallbacks:** Georgia, 'Times New Roman', Times, serif

```css
--newspaper-font-serif: 'Playfair Display', Georgia, 'Times New Roman', Times, serif;
```

**Alternative: Source Serif Pro**
- **Use for:** Body text, article content when serif is preferred
- **Characteristics:** Readable serif optimized for screens
- **Web font:** Google Fonts
- **License:** Open Font License

### Body Text & UI

**Primary: System Font Stack**
- **Use for:** Body text, navigation, UI elements
- **Characteristics:** Optimal performance and native appearance
- **Benefits:** Zero loading time, familiar to users

```css
--newspaper-font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Monospace

**System Monospace Stack**
- **Use for:** Code, technical data, article scores
- **Performance:** No additional font loading required

```css
--newspaper-font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
```

## Font Loading Strategy

### Performance-First Approach

```html
<!-- Critical fonts with font-display: swap -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Serif+Pro:wght@400;600;700&display=swap" rel="stylesheet">
```

### CSS Font Loading

```css
@font-face {
  font-family: 'Playfair Display';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/playfairdisplay/v29/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgEM86eDmg.woff2') format('woff2');
}
```

## Font Weights & Usage

### Playfair Display Weights

- **400 (Regular):** Pull quotes, decorative elements
- **700 (Bold):** Main headlines, section headers
- **900 (Black):** Banner headlines, breaking news

### Source Serif Pro Weights

- **400 (Regular):** Body text, article content
- **600 (Semibold):** Subheadings, emphasis
- **700 (Bold):** Lead paragraphs, bylines

### System Font Weights

- **400 (Regular):** UI text, captions
- **500 (Medium):** Navigation, labels
- **600 (Semibold):** Button text, important UI
- **700 (Bold):** Section titles, metadata
- **800 (Extrabold):** Category headers

## Typography Hierarchy

### Size Scale

```css
/* Display Sizes */
--newspaper-text-banner: 3.5rem;      /* 56px - Breaking news */
--newspaper-text-headline: 2.5rem;    /* 40px - Main stories */
--newspaper-text-subhead: 1.75rem;    /* 28px - Secondary stories */
--newspaper-text-section: 1.25rem;    /* 20px - Category headers */

/* Body Sizes */
--newspaper-text-body: 1rem;          /* 16px - Standard body */
--newspaper-text-caption: 0.875rem;   /* 14px - Captions, metadata */
--newspaper-text-fine: 0.75rem;       /* 12px - Fine print */
--newspaper-text-quote: 1.5rem;       /* 24px - Pull quotes */
```

### Line Heights

```css
--newspaper-leading-tight: 1.2;       /* Headlines, tight spacing */
--newspaper-leading-normal: 1.5;      /* Body text, balanced */
--newspaper-leading-loose: 1.7;       /* Dense content, easy reading */
```

### Letter Spacing

```css
--newspaper-tracking-tight: -0.025em; /* Large headlines */
--newspaper-tracking-normal: 0;       /* Body text */
--newspaper-tracking-wide: 0.05em;    /* UI elements */
--newspaper-tracking-wider: 0.1em;    /* All-caps text */
```

## Responsive Typography

### Mobile Optimizations

```css
@media (max-width: 768px) {
  :root {
    --newspaper-text-banner: 2.5rem;    /* Scale down for mobile */
    --newspaper-text-headline: 1.75rem;
    --newspaper-text-subhead: 1.25rem;
  }
}

@media (max-width: 480px) {
  :root {
    --newspaper-text-banner: 2rem;      /* Further scale for small screens */
    --newspaper-text-headline: 1.5rem;
  }
}
```

### Fluid Typography

Use `clamp()` for responsive headlines:

```css
.newspaper-banner {
  font-size: clamp(2rem, 6vw, 3.5rem);
  line-height: clamp(1.1, 1.2, 1.3);
}

.newspaper-headline {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}
```

## Alternative Font Stacks

### Conservative Stack (No Web Fonts)

For maximum performance or when web fonts fail:

```css
/* Serif stack without web fonts */
--newspaper-font-serif: Georgia, 'Times New Roman', Times, serif;

/* Enhanced system stack */
--newspaper-font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Premium Font Stack

For sites with budget for premium typography:

**Headlines:** Minion Pro, Adobe Garamond Pro
**Body:** Source Sans Pro, Proxima Nova
**Load via Adobe Fonts or self-hosted**

### Newspaper-Specific Alternatives

#### Classic Newspaper Fonts

- **Times New Roman:** Classic but less distinctive
- **Georgia:** Excellent web serif, very readable
- **Minion:** Professional, elegant
- **Trajan:** For mastheads (display only)

#### Modern Newspaper Fonts

- **Chronicle Text:** Used by major newspapers
- **Miller:** Popular in editorial design
- **Publico:** Modern newspaper serif
- **Lyon:** Contemporary serif with character

## Print Font Considerations

### Print-Specific Typography

```css
@media print {
  body {
    font-family: 'Times New Roman', Times, serif !important;
    font-size: 11pt;
  }
  
  .newspaper-headline {
    font-family: 'Times New Roman', serif !important;
    font-size: 18pt !important;
  }
  
  .newspaper-body {
    font-size: 10pt !important;
    line-height: 1.4 !important;
  }
}
```

## Font Loading Best Practices

### 1. Preload Critical Fonts

```html
<link rel="preload" href="/fonts/playfair-display-bold.woff2" as="font" type="font/woff2" crossorigin>
```

### 2. Font Display Strategy

```css
@font-face {
  font-family: 'Playfair Display';
  font-display: swap; /* Shows fallback immediately, swaps when loaded */
}
```

### 3. Subset Fonts

Only load needed characters:
```
?family=Playfair+Display:wght@400;700;900&text=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789
```

### 4. Font Loading Detection

```javascript
// Optional: Detect when fonts are loaded
if ('fonts' in document) {
  Promise.all([
    document.fonts.load('400 1em "Playfair Display"'),
    document.fonts.load('700 1em "Playfair Display"'),
  ]).then(() => {
    document.body.classList.add('fonts-loaded');
  });
}
```

## Accessibility Considerations

### Font Size Minimums

- Body text: Never below 16px (1rem)
- Interactive elements: Minimum 16px
- Fine print: Never below 12px

### Dyslexia-Friendly Features

- Adequate letter spacing
- Clear character distinction
- No all-caps for long text
- Sufficient line height (1.5+)

### High Contrast Support

Fonts maintain readability in high contrast mode:
- Simple, clean letterforms
- No decorative fonts for body text
- Clear weight distinctions

## Performance Metrics

### Font Loading Budget

- **Critical fonts:** 100KB max
- **Total font weight:** 300KB max
- **Loading time:** < 3 seconds on 3G

### Testing Tools

- Google PageSpeed Insights
- WebPageTest font waterfall
- Chrome DevTools Network tab
- Lighthouse font audit

## Fallback Strategy

### FOUT vs FOIT

The design system uses **FOUT** (Flash of Unstyled Text) strategy:
- Shows content immediately with system fonts
- Swaps to web fonts when loaded
- Maintains layout stability

### Graceful Degradation

1. **System fonts load instantly**
2. **Web fonts enhance when available**
3. **No broken layout if fonts fail**
4. **Print styles use reliable fonts**

This font strategy ensures excellent performance while maintaining the authentic newspaper aesthetic across all devices and loading conditions.