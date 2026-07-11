# Terra by Shavindi — Full Project Context
> This document is intended to brief an AI assistant (or any new developer) taking over this project. It covers brand, business, technical stack, file structure, and the current state of everything built so far.

---

## 1. The Business

**Brand name:** Terra by Shavindi  
**Tagline:** From Earth To You  
**Nature:** Sri Lankan terracotta and earth products brand — two product lines under one roof:
- **Building Materials** (wholesale) — roofing tiles, bricks, hollow blocks, paving stones, wall tiles, ridge tiles
- **Homeware** (aesthetic/retail) — terracotta mugs, pots, plates, vases, bowls, water filters, planters

**Physical location:** Shavindi Building Material & Roofing Tiles Suppliers, Thambaravilla, Waikkal-Dankotuwa 61110, Sri Lanka  
**Phone / WhatsApp:** +94766604430 (formatted as 076 660 4430)  
**Google Maps:** https://maps.app.goo.gl/HQBCGMJ6eqzMQUsV7  
**Hours:** Mon–Sat, 8am–6pm  
**Live website:** https://shavindi.lk  
**Hosted on:** GitHub Pages  
**Developer credit:** Aanjelo S. — https://aanjelos.github.io/

---

## 2. Brand Guidelines

### Colours
| Name | Hex |
|---|---|
| Burnt Sienna | `#da8164` |
| Khaki | `#9d9a87` |
| Eggshell | `#f3f0df` |
| Hunter Green | `#2f5b44` |
| Jet Black | `#2e2d2c` |
| Eggshell Dark | `#e8e4cc` |

### Typography
- **Titles / Display:** Instrument Serif (including italic variant) — Google Fonts
- **Body / UI:** Josefin Sans (weights 300, 400, 600) — Google Fonts
- **Aesthetic:** Minimal boho, earthy, warm

### Logo
- File: `img/logo.svg`
- Always referenced as a relative path (`img/logo.svg`), never as an absolute URL
- Used in: preloader, header, footer, 404 page
- In the header it sits next to the text "by Shavindi" (the SVG itself contains "Terra")
- No tagline in the header — tagline only appears in hero section

### CSS Variables (used throughout all files)
```css
--burnt-sienna: #da8164;
--khaki: #9d9a87;
--eggshell: #f3f0df;
--hunter-green: #2f5b44;
--jet-black: #2e2d2c;
--eggshell-dark: #e8e4cc;
--font-title: 'Instrument Serif', serif;
--font-body: 'Josefin Sans', sans-serif;
--transition: 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

---

## 3. File Structure

```
/ (root)
├── index.html              ← main site (formerly terra-by-shavindi.html)
├── blog.html               ← journal/blog page (Contentful-powered)
├── 404.html                ← custom 404 page
├── favicon.png             ← site favicon (PNG, root level)
└── img/
    ├── logo.svg
    ├── og-image.jpg        ← 1200×630px social share image
    ├── hero-pot.jpg        ← hero section right-side circular image (~600×600px)
    ├── about-1.jpg         ← about section left/back image (~800×900px portrait)
    ├── about-2.jpg         ← about section right/front image (~700×800px portrait)
    ├── cat-building.jpg    ← Building Materials category panel (~1200×960px)
    └── cat-homeware.jpg    ← Homeware category panel (~1200×960px)
```

**Product catalogue images** are in a separate folder (not inside `img/`), structured as:
```
catalogue/
└── [category]/
    └── [SKU]/
        ├── [SKU]-01.jpg
        ├── [SKU]-02.jpg
        └── ...
```
Referenced in the Google Sheet as relative paths e.g. `catalogue/BM/BR001/BR001-01.jpg`

---

## 4. Product Catalogue (Google Sheets / TSV)

The catalogue is powered by a Google Sheet published as a TSV. The site fetches it live on load.

**TSV URL:**
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4rW5uj9gpFrrnvLk4Tc6WQFS37Of6Fhoy6MgsLqQ_WcnCoUFUV--0C9erkMkYpA/pub?gid=70284242&single=true&output=tsv
```

**Sheet structure — headers start at row 3 (A3):**
| Column | Header (exact) |
|---|---|
| A | SKU |
| B | Name (English) |
| C | Name (Sinhala) |
| D | Category |
| E | Description (English) |
| F | Description (Sinhala) |
| G | Image URL 1 |
| H | Image URL 2 |
| I | Image URL 3 |
| J | Image URL 4 |
| K | In Stock (Y/N) |
| L | Notes (Internal - not shown on site) |

**Important notes:**
- **No price column** — pricing was deliberately removed. This is an enquiry/quotation model, not a shopping site
- **Category values** must be exactly `building` or `homeware` (lowercase) to match JS filter logic
- Image URLs should be relative paths (e.g. `catalogue/BM/BR001/BR001-01.jpg`), not absolute URLs
- The Notes column (L) is parsed but never shown to customers — internal use only
- The parser dynamically finds the header row by scanning for a row containing 'sku'
- All product images are **3:4 portrait orientation** — the card and modal image areas are set to `aspect-ratio: 3/4`

---

## 5. Business Model — Enquiry/Quotation (NOT e-commerce)

This is critical context. **There are no prices shown anywhere on the site.** The model is:
1. Customer browses catalogue and adds items to enquiry list (qty input on each card + modal)
2. Fills in Name/Company and phone number
3. Sends enquiry via WhatsApp (primary), SMS, or copies to clipboard

**WhatsApp number:** `+94766604430`  
**WhatsApp message format:**
```
Hello Terra by Shavindi 🌿

I would like to request a quotation for the following items:

• SKU – Product Name × Qty
• SKU – Product Name × Qty

My Details:
Name / Company: [name]
Phone: [phone]

Please let me know the pricing and availability. Thank you!
```

**Checkout button layout in the enquiry drawer:**
- WhatsApp: full-width green primary button (top)
- SMS + Copy to Clipboard: split 50/50 below (secondary)

**Do not mention delivery** anywhere in copy — products are available both for delivery and in-shop/pickup. The site intentionally avoids committing to either.

---

## 6. Google Analytics (GA4)

**Tracking ID:** `G-Y7N2EXY70B`  
**Tag:** Standard gtag.js — added to `<head>` of both `index.html` and `blog.html`

**Custom events wired up:**
| Event name | Fires when | Parameters |
|---|---|---|
| `product_viewed` | Product modal opened | `sku`, `product_name`, `category` |
| `add_to_enquiry` | Added from card or modal | `sku`, `product_name`, `quantity`, `source` |
| `enquiry_drawer_opened` | Cart icon clicked | `item_count` |
| `enquiry_sent` | WA/SMS/Copy sent | `method`, `item_count`, `total_qty` |
| `catalogue_filter` | Filter button clicked | `filter` |
| `category_panel_clicked` | Building/Homeware panel clicked | `category` |
| `catalogue_search` | Search typed (fires 1.2s after typing stops) | `search_term` |
| `contact_whatsapp_clicked` | WA button in contact section | — |

`enquiry_sent` should be marked as a **Key Event** in GA4 (Admin → Data display → Events → mark as key event). It's the primary conversion for this site.

---

## 7. Blog / Journal (Contentful CMS)

The blog page (`blog.html`) pulls content from Contentful's API.

**Contentful credentials (read-only, safe to embed in HTML):**
- Space ID: `z32atf8l71ui`
- Content Delivery API token: `txrrnyjFpY5IgyUgV4k4GQT1r-9Zwscw5cpy148lZv0`
- Content type: `blogPost`

**Blog Post fields in Contentful:**
| Field | Type | Notes |
|---|---|---|
| Title | Short text | Entry title |
| Slug | Short text | Unique, lowercase-hyphen e.g. `our-terracotta-story` |
| Date | Date only | |
| Excerpt | Short text | Used on listing cards |
| Cover Image | Media | 1400×900px recommended (3:2 ratio), subject centred |
| Body | Rich text | Full article content |
| Category | Short text | Not created yet — handled gracefully if missing |

**Blog page behaviour:**
- Lists posts 6 per page, ordered by date descending
- Single post view triggered by `blog.html?post=slug`
- History API handles browser back/forward navigation
- Rich text renderer handles: h1–h4, p, ul, ol, blockquote, hr, hyperlinks, embedded images
- Skeleton loading states and error states included

**SEO note on Contentful:** Google does index content rendered by JavaScript, so Contentful-powered blog posts do contribute to shavindi.lk's SEO. However social share cards (OG tags) won't show article-specific images/titles because crawlers don't run JS — this would require server-side rendering to fix properly, which isn't possible on GitHub Pages.

---

## 8. SEO / Meta

All meta tags are in `index.html` and `blog.html`. Key ones:

```html
<meta name="description" content="Terra by Shavindi offers handcrafted terracotta homeware and quality building materials from Waikkal, Sri Lanka. Artisan pots, mugs, roofing tiles, bricks and more — visit us or enquire online.">
<meta property="og:image" content="https://shavindi.lk/img/og-image.jpg">
<link rel="canonical" href="https://shavindi.lk/">
<link rel="icon" type="image/png" href="favicon.png">
```

Schema.org `LocalBusiness` JSON-LD is included in `index.html` with address, phone, and image. `priceRange` is deliberately omitted.

---

## 9. Key Technical Details

### External libraries (CDN, no npm)
- **Lucide Icons:** `https://unpkg.com/lucide@latest/dist/umd/lucide.js` — called via `lucide.createIcons()`
- **Google Fonts:** Instrument Serif + Josefin Sans

### Navigation
- Desktop: horizontal nav in header (Home, About, Catalogue, Journal, Contact)
- Mobile: hamburger menu
- Enquiry drawer icon sits left of hamburger on mobile

### Preloader
- Shows on page load with a random witty message from a list of 6 (kiln/clay themed)
- Dismisses 1400ms after `window.load`

### Hero section
- `min-height: 100vh` with content centred
- Two floating tag badges: **Homeware** / *From earth* and **Building Materials** / *Built to last* — title (`<strong>`) is on top, subtitle label below
- Animated CSS orbs (desktop only — disabled on mobile `max-width: 900px`)
- Marquee ribbon (black bar with scrolling product categories) pinned inside the hero at `position: absolute; bottom: 0` — so it's visible at the bottom of the viewport on first load
- Right side: circular hero image (`img/hero-pot.jpg`)

### Product cards
- Grid layout, `aspect-ratio: 3/4` portrait image area (no cropping)
- Shows: product image (lazy loaded), category badge, SKU, English name, Sinhala name
- Card footer: `−` qty input `+` controls + add button
- Qty input is editable by typing directly (click to select all)
- After quick-add, qty resets to 1

### Product modal
- `aspect-ratio: 3/4` portrait image panel
- Multi-image gallery with thumbnails
- Shows: EN name, Sinhala name, EN desc, Sinhala desc, qty input, Add to Enquiry button
- No price shown anywhere
- Back gesture / swipe closes modal (History API pushState)
- Mobile: close button is `position: fixed` top-right so it stays visible while scrolling

### Enquiry drawer (cart)
- Cart qty inputs are editable by typing directly
- Resets to 1 after adding
- Customer fields: Name/Company + phone
- Checkout: WA (full width) / SMS + Copy (split row)

### About section copy (current)
> "Nestled in Waikkal-Dankotuwa, Terra by Shavindi brings together two worlds — the sturdy reliability of building materials and the quiet beauty of handcrafted terracotta homeware. Every piece carries the warmth of Sri Lankan earth."
>
> "We serve builders, architects, and home decorators alike, offering genuine quality with the personal touch only a family business with more than 25 years of experience can provide."

### Contact section
Order of items: Address first, phone second, hours third.

### Footer
Centered on both pages — logo + "Terra by Shavindi" + "From Earth To You · Waikkal, Sri Lanka". No nav links. Developer credit: "Web Design by Aanjelo S." linking to `https://aanjelos.github.io/`

### 404 page
- Fully on-brand, same fonts/colours/orbs
- Displays a terracotta pot SVG illustration
- Tagline: "This page got lost in the kiln."
- Single CTA: Back to Home
- GitHub Pages automatically serves `404.html` from root — no config needed

---

## 10. Spelling / Naming — Important

These were corrected during the build — make sure they stay consistent:

| Wrong | Correct |
|---|---|
| Homewear | **Homeware** |
| cat-homewear.jpg | **cat-homeware.jpg** |
| homewear (category value in sheet) | **homeware** |
| Waikkal | **Waikkal-Dankotuwa** |

---

## 11. Things Deliberately Not Done / Out of Scope

- **No prices shown** — enquiry model only
- **No delivery mentions** — available both in-shop and delivery, site doesn't specify
- **No custom cursor** — was removed by client preference
- **No clear search button tooltip** — the `×` is already visible
- **No separate company field** — just "Name / Company" placeholder in one field
- **No server-side rendering** — static GitHub Pages; clean URLs (`/blog` instead of `/blog.html`) not possible without moving to Netlify
- **Notes column** in the sheet is internal only — never rendered on site

---

## 12. Potential Future Work

- **Move to Netlify** for clean URLs (`/blog` instead of `/blog.html`), a `_redirects` file would handle it
- **Social share meta per blog post** — requires server-side rendering or a Netlify Edge Function to inject OG tags per slug
- **Product images** — still being added to the Google Sheet (catalogue folder structure: `catalogue/[category]/[SKU]/[SKU]-01.jpg`)
- **Contentful Category field** — not yet created in Contentful; code handles it gracefully if missing
- **GA Internal traffic filter** — client's own visits can be filtered under Admin → Data collection → Data filters → Define internal traffic
