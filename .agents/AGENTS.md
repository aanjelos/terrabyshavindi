# Terra by Shavindi - Agent Context & Brand Guidelines

This file serves as the single source of truth for AI agents working on this project. It outlines the visual identity, tone, technical architecture, and codebase rules for the "Terra by Shavindi" website.

## 1. Brand Identity & Tone
**Brand Name:** Terra by Shavindi
**Niche:** Sustainable, high-end terracotta products, eco-friendly living, and Sri Lankan architectural heritage.
**Vibe/Aesthetic:** Earthy, organic, elegant, minimalist, premium yet grounded. The visual language should feel natural and warm.

### 1.1 Color Palette
Use these exact CSS variables defined in `:root` inside `style.css`. Avoid hardcoding hex values in the CSS.
- `--burnt-sienna` (`#da8164`): Primary brand color. Represents raw clay and terracotta.
- `--hunter-green` (`#2f5b44`): Primary accent. Represents nature, indoor plants, and foliage.
- `--khaki` (`#9d9a87`): Secondary earthy accent (muted green/brown).
- `--eggshell` (`#f3f0df`): Primary background color. A warm, natural off-white.
- `--eggshell-dark` (`#e8e4cc`): Secondary background/border color. Used for slight contrast against the main eggshell.
- `--jet-black` (`#2e2d2c`): Primary text color. A soft black that reduces harsh eye strain compared to pure `#000`.

### 1.2 Typography
Both fonts are imported from Google Fonts. Do not use default browser fonts.
- **Headings & Titles:** `var(--font-title)` - *Instrument Serif* (Serif). Gives an elegant, editorial, and classic feel.
- **Body Text & UI Elements:** `var(--font-body)` - *Josefin Sans* (Sans-serif). Clean, geometric, and modern for high legibility.

## 2. Technical Architecture & Codebase Rules

### 2.1 Core Technology Stack
- **Strictly Vanilla:** The frontend is built entirely with Vanilla HTML, Vanilla CSS (`style.css`), and Vanilla JavaScript (`main.js`). 
- **NO Frameworks:** Do NOT use React, Vue, Svelte, or Tailwind CSS. Write clean, semantic HTML and custom CSS.

### 2.2 The Blog System & SPA Architecture
The blog operates as a hybrid static/Single Page Application (SPA).
1. **The Build Step (`build-blog.js`):** A Node.js script that fetches blog content from Contentful CMS. It generates:
   - Individual `data.json` files for each post (for the SPA to fetch).
   - Fully static `index.html` pages inside `/blog/[slug]/` directories for SEO and organic indexing.
   - A `sitemap.xml` file.
2. **The SPA Router (`main.js`):** When a user clicks a blog card from the UI, the page does *not* reload. The `main.js` script handles `history.pushState`, fetches the `data.json` file for the requested post, and dynamically updates the DOM.

### 2.3 Analytics & SEO
- **Google Analytics (`gtag.js`):** Initial page loads are tracked automatically via the standard HTML snippet. However, SPA route changes are tracked *manually* via a `gtag` configuration call inside the `renderPost` function in `main.js`. If you add new dynamic views, ensure they fire a `page_view` event.
- **SEO Metadata:** The SPA router dynamically updates the `<title>`, `<meta property="og:title">`, `<meta property="og:description">`, and `<link rel="canonical">` tags during route changes to maintain social sharing integrity.

### 2.4 Styling & Conventions
- **CSS Organization:** Keep `style.css` organized with clear comment blocks (e.g., `/* --- TOKENS --- */`, `/* --- NAV --- */`). 
- **Layouts:** Rely heavily on CSS Flexbox and CSS Grid for layouts. The `body` element uses a flex-column layout with `min-height: 100vh` and `<main>` using `flex: 1` to ensure the footer always sticks to the bottom of the screen.
- **Micro-interactions:** Use the CSS variable `var(--transition)` (`0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)`) for smooth, premium hover states and animations.

### 2.5 Asset Optimization
- **Image Compression:** Do not upload massive raw images. Run the `minify-images.js` Node script (which utilizes the `sharp` library) to compress and resize new catalogue images before deploying.
