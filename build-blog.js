const fs = require('fs');
const path = require('path');

// Contentful Config
const CF_SPACE  = 'z32atf8l71ui';
const CF_TOKEN  = process.env.CF_TOKEN; // Set this in GitHub Secrets or locally
const CF_BASE   = `https://cdn.contentful.com/spaces/${CF_SPACE}`;

async function buildBlog() {
  console.log('Fetching posts from Contentful...');
  
  try {
    const url = `${CF_BASE}/entries?content_type=blogPost&order=-fields.date&limit=200&include=1&access_token=${CF_TOKEN}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Contentful fetch failed: ${resp.statusText}`);
    
    const data = await resp.json();
    
    // Build asset map
    const assets = {};
    if (data.includes && data.includes.Asset) {
      data.includes.Asset.forEach(a => {
        if (a.fields && a.fields.file) {
          assets[a.sys.id] = 'https:' + a.fields.file.url;
        }
      });
    }

    const posts = (data.items || []).map(item => {
      const f = item.fields;
      const imgId = f.coverImage && f.coverImage.sys && f.coverImage.sys.id;
      return {
        id: item.sys.id,
        slug: f.slug || item.sys.id,
        title: f.title || 'Untitled',
        date: f.date || null,
        excerpt: f.excerpt || 'Read this post on Terra by Shavindi.',
        category: f.category || '',
        coverUrl: imgId ? assets[imgId] : 'https://shavindi.lk/img/og-image.jpg',
        body: f.body || null
      };
    });

    console.log(`Found ${posts.length} posts. Generating HTML files...`);

    // Read the master template
    const templatePath = path.join(__dirname, 'blog.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    // Clean up old blog directory to remove deleted posts
    const blogDir = path.join(__dirname, 'blog');
    if (fs.existsSync(blogDir)) {
      fs.rmSync(blogDir, { recursive: true, force: true });
    }
    fs.mkdirSync(blogDir, { recursive: true });

    let generatedCount = 0;

    for (const post of posts) {
      const postDir = path.join(blogDir, post.slug);
      if (!fs.existsSync(postDir)) {
        fs.mkdirSync(postDir, { recursive: true });
      }

      let html = templateHtml;

      // 1. Inject preloaded slug
      html = html.replace(
        '<head>', 
        `<head>\n<script>window.PRELOADED_SLUG = "${post.slug}";</script>`
      );

      // 2. Replace Meta Tags
      // Title
      html = html.replace(
        /<title id="pageTitle">.*?<\/title>/s, 
        `<title id="pageTitle">${escapeHtml(post.title)} — Terra by Shavindi</title>`
      );
      
      // Description
      html = html.replace(
        /<meta name="description" id="pageDesc" content=".*?">/s,
        `<meta name="description" id="pageDesc" content="${escapeHtml(post.excerpt)}">`
      );

      // OG Title
      html = html.replace(
        /<meta property="og:title" id="ogTitle" content=".*?">/s,
        `<meta property="og:title" id="ogTitle" content="${escapeHtml(post.title)} — Terra by Shavindi">`
      );

      // OG Description
      html = html.replace(
        /<meta property="og:description" id="ogDesc" content=".*?">/s,
        `<meta property="og:description" id="ogDesc" content="${escapeHtml(post.excerpt)}">`
      );

      // Format OG Image for social sharing (WhatsApp/Facebook require < 300KB and standard formats)
      const ogImageUrl = post.coverUrl.includes('ctfassets.net')
        ? `${post.coverUrl}?w=1200&h=630&fit=fill&f=face&fm=jpg&q=80`
        : post.coverUrl;

      // OG Image
      html = html.replace(
        /<meta property="og:image" content=".*?">/s,
        `<meta property="og:image" content="${ogImageUrl}">`
      );

      // Twitter Image (just in case)
      html = html.replace(
        /<meta name="twitter:image" content=".*?">/s,
        `<meta name="twitter:image" content="${ogImageUrl}">`
      );

      // Canonical URL
      html = html.replace(
        /<link rel="canonical" id="canonical" href=".*?">/s,
        `<link rel="canonical" id="canonical" href="https://shavindi.lk/blog/${post.slug}/">`
      );

      // Write the file
      const outPath = path.join(postDir, 'index.html');
      fs.writeFileSync(outPath, html, 'utf8');
      generatedCount++;
    }

    console.log(`Successfully generated ${generatedCount} blog post pages.`);

    // Write blog-data.js for index.html and blog.html
    const blogDataPath = path.join(__dirname, 'blog-data.js');
    const safePostsForIndex = posts.map(p => {
      const { body, ...rest } = p;
      return rest;
    });
    const safeJson = JSON.stringify(safePostsForIndex).replace(/</g, '\\u003c');
    const blogDataContent = `window.BLOG_DATA = ${safeJson};`;
    fs.writeFileSync(blogDataPath, blogDataContent, 'utf8');
    console.log('Successfully generated blog-data.js');
    
    // Write sitemap.xml
    const sitemapPath = path.join(__dirname, 'sitemap.xml');
    const today = new Date().toISOString().split('T')[0];
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Add static pages
    const staticPages = [
      { url: 'https://shavindi.lk/', priority: '1.0' },
      { url: 'https://shavindi.lk/blog.html', priority: '0.9' }
    ];
    
    staticPages.forEach(page => {
      sitemapXml += `  <url>\n    <loc>${page.url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    });

    // Add blog posts
    posts.forEach(post => {
      const lastMod = post.date ? new Date(post.date).toISOString().split('T')[0] : today;
      sitemapXml += `  <url>\n    <loc>https://shavindi.lk/blog/${post.slug}/</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    sitemapXml += `</urlset>`;
    fs.writeFileSync(sitemapPath, sitemapXml, 'utf8');
    console.log('Successfully generated sitemap.xml');
    
  } catch (err) {
    console.error('Error building blog:', err);
    process.exit(1);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

buildBlog();
