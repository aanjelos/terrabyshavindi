
/* --- INDEX JS --- */

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-Y7N2EXY70B');


/* --- BLOG JS --- */

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-Y7N2EXY70B');


/* --- INIT --- */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('productsGrid')) {
    if (typeof loadProducts === 'function') loadProducts();
  }
  if (document.getElementById('blogPreviewGrid')) {
    if (typeof loadBlogPreview === 'function') loadBlogPreview();
  }
  if (typeof updateCartBadge === 'function') updateCartBadge();
  
  if (document.getElementById('postsGrid')) {
    if (typeof fetchPosts === 'function') {
      fetchPosts();
    }
  }
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

window.addEventListener('popstate', () => {
  if (window.location.pathname.includes('/blog')) {
    let slug = null;
    const pathMatch = window.location.pathname.match(/\/blog\/([^/]+)\/?(?:index\.html)?$/);
    if (pathMatch) slug = pathMatch[1];
    else {
      const params = new URLSearchParams(window.location.search);
      slug = params.get('post');
    }
    if(slug && typeof fetchAndShowPost === 'function') { fetchAndShowPost(slug); }
    else if (typeof showListing === 'function') { showListing(); }
  }
});

document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    const inp = document.getElementById('catalogueSearch');
    if(inp && inp.value){ if(typeof clearSearch==='function')clearSearch(); inp.blur(); }
  }
});

// Blog specific on-load logic that we stripped
window.addEventListener('load', () => {
  if (document.getElementById('journalHero')) {
    let slug = null;
    if (typeof window !== 'undefined' && window.PRELOADED_SLUG) {
      slug = window.PRELOADED_SLUG;
    } else {
      const pathMatch = window.location.pathname.match(/\/blog\/([^/]+)\/?(?:index\.html)?$/);
      if (pathMatch) slug = pathMatch[1];
      else {
        const params = new URLSearchParams(window.location.search);
        slug = params.get('post');
      }
    }
    if(slug){ currentSlug = slug; if(typeof fetchAndShowPost==='function') fetchAndShowPost(slug); }
    else { if(typeof fetchPosts==='function') fetchPosts(); }
  }
});
