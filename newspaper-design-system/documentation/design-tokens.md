# Design Tokens - Newspaper Visual Identity

## Color Palette

### Light Theme (Traditional Newspaper)
```css
--newspaper-ink: #1a1a1a;           /* Deep ink black */
--newspaper-paper: #fefefe;         /* Off-white paper */
--newspaper-red: #d32f2f;          /* Traditional newspaper red */
--newspaper-gray-100: #f8f8f8;     /* Light gray background */
--newspaper-gray-200: #e8e8e8;     /* Section dividers */
--newspaper-gray-300: #d0d0d0;     /* Borders */
--newspaper-gray-400: #999999;     /* Secondary text */
--newspaper-gray-500: #666666;     /* Bylines, metadata */
--newspaper-gray-600: #4a4a4a;     /* Headlines */
```

### Dark Theme (Night Edition)
```css
--newspaper-ink: #f0f0f0;           /* Light ink on dark */
--newspaper-paper: #1e1e1e;        /* Dark paper */
--newspaper-red: #ff5252;          /* Brighter red for dark */
--newspaper-gray-100: #2a2a2a;     /* Dark background */
--newspaper-gray-200: #363636;     /* Section dividers */
--newspaper-gray-300: #4a4a4a;     /* Borders */
--newspaper-gray-400: #888888;     /* Secondary text */
--newspaper-gray-500: #aaaaaa;     /* Bylines, metadata */
--newspaper-gray-600: #e0e0e0;     /* Headlines */
```

## Typography Scale

### Headlines (Serif - Georgia/Times)
- **Banner**: 3.5rem / 56px (Major breaking news)
- **Headline**: 2.5rem / 40px (Main stories)
- **Sub-headline**: 1.75rem / 28px (Secondary stories)
- **Section**: 1.25rem / 20px (Category headers)

### Body Text (Sans-serif - System fonts)
- **Body**: 1rem / 16px (Article text)
- **Caption**: 0.875rem / 14px (Photo captions, bylines)
- **Fine Print**: 0.75rem / 12px (Metadata, disclaimers)

### Special Typography
- **Byline**: 0.875rem / 14px (All caps, letter-spacing: 0.05em)
- **Dateline**: 0.75rem / 12px (Location, time)
- **Pull Quote**: 1.5rem / 24px (Serif italic)

## Spacing System

Based on 8px grid:
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px
- **xxxl**: 64px

## Layout Grid

### Column System
- **1 column**: Mobile (< 768px)
- **2 columns**: Tablet (768px - 1024px)
- **3-4 columns**: Desktop (1024px+)
- **5-6 columns**: Large desktop (1440px+)

### Breakpoints
- **Mobile**: 0 - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Large**: 1440px+

## Component Tokens

### Buttons
- **Primary**: Red background, white text
- **Secondary**: White background, red border
- **Ghost**: No background, red text

### Cards (Articles)
- **Border**: 1px solid gray-300
- **Shadow**: 0 2px 8px rgba(0,0,0,0.1)
- **Radius**: 4px (subtle, newspaper-like)

### Navigation
- **Height**: 48px
- **Background**: Gray-100
- **Border**: Bottom 2px solid gray-300

### Masthead
- **Height**: Auto (content-based)
- **Background**: Newspaper red
- **Text**: White/cream