
/* --- INDEX JS --- */

/* ═══════════════════════════════════════
   PRELOADER + WITTY MESSAGES
═══════════════════════════════════════ */
const wittyMessages = [
  'Sculpting the clay . . .',
  'Firing the kiln . . .',
  'Glazing the pots . . .',
  'Digging up the clay . . .',
  'Stacking the bricks . . .',
  'Almost there . . .',
];
(function(){
  const el = document.getElementById('preloaderText');
  if(el) el.textContent = wittyMessages[Math.floor(Math.random()*wittyMessages.length)];
  document.getElementById('footerYear').textContent = new Date().getFullYear();
})();
window.addEventListener('load', () => {
  setTimeout(() => { const p = document.getElementById('preloader'); if(p) p.classList.add('done'); }, 1400);
  if(typeof lucide !== 'undefined') lucide.createIcons();
});

/* ═══════════════════════════════════════
   HEADER SCROLL
═══════════════════════════════════════ */
const header = document.getElementById('mainHeader');
window.addEventListener('scroll', () => { header.classList.toggle('scrolled', window.scrollY > 60); });

/* ═══════════════════════════════════════
   NAV DRAWER
═══════════════════════════════════════ */
function openDrawer(){ document.getElementById('navDrawer').classList.add('open'); document.getElementById('drawerOverlay').classList.add('open'); }
function closeDrawer(){ document.getElementById('navDrawer').classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('open'); }

/* ═══════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ═══════════════════════════════════════
   TOAST
═══════════════════════════════════════ */
function showToast(msg, type='success'){
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  };
  t.innerHTML = `${icons[type]||icons.info}<span class="toast-msg">${msg}</span>`;
  c.appendChild(t);
  requestAnimationFrame(()=>{ t.classList.add('show'); });
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(), 500); }, 3000);
}

/* ═══════════════════════════════════════
   PRODUCT DATA & GOOGLE SHEETS
═══════════════════════════════════════ */
let allProducts = [];
let filteredProducts = [];
let currentFilter = 'all';
let currentSort = 'default';
let currentSearch = '';
let currentProduct = null;

let searchGaTimer = null;
function applySearch(val){
  currentSearch = val.trim().toLowerCase();
  const icon = document.getElementById('searchIcon');
  const clear = document.getElementById('searchClear');
  if(currentSearch){ icon && icon.classList.add('hidden'); clear && clear.classList.add('visible'); }
  else { icon && icon.classList.remove('hidden'); clear && clear.classList.remove('visible'); }
  rebuildFiltered(); renderGrid();
  if(typeof lucide !== 'undefined') lucide.createIcons();
  clearTimeout(searchGaTimer);
  if(currentSearch.length > 1){
    searchGaTimer = setTimeout(()=>{ gaEvent('catalogue_search', { search_term: currentSearch }); }, 1200);
  }
}

function clearSearch(){
  currentSearch = '';
  document.getElementById('catalogueSearch').value = '';
  document.getElementById('searchIcon').classList.remove('hidden');
  document.getElementById('searchClear').classList.remove('visible');
  rebuildFiltered(); renderGrid();
}

function rebuildFiltered(){
  let base = currentFilter === 'all' ? [...allProducts] : allProducts.filter(p => p.category === currentFilter);
  if(currentSearch) base = base.filter(p =>
    p.name.toLowerCase().includes(currentSearch) ||
    (p.nameSi && p.nameSi.includes(currentSearch)) ||
    p.sku.toLowerCase().includes(currentSearch) ||
    (p.descEn && p.descEn.toLowerCase().includes(currentSearch))
  );
  filteredProducts = base;
}

// GOOGLE SHEETS TSV URL
const SHEETS_TSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4rW5uj9gpFrrnvLk4Tc6WQFS37Of6Fhoy6MgsLqQ_WcnCoUFUV--0C9erkMkYpA/pub?gid=70284242&single=true&output=tsv';

async function loadProducts(){
  try {
    const resp = await fetch(SHEETS_TSV_URL);
    if(!resp.ok) throw new Error('Sheet fetch failed');
    const text = await resp.text();
    const rows = text.trim().split('\n');

    // Find the header row — first row that contains 'sku' (case-insensitive)
    const headerIdx = rows.findIndex(r => r.toLowerCase().includes('sku'));
    if(headerIdx < 0) throw new Error('No header row found');

    // Map exact header names to column indices
    const raw = rows[headerIdx].split('\t').map(h => h.trim());
    const idx = {
      sku:     raw.indexOf('SKU'),
      name:    raw.indexOf('Name (English)'),
      nameSi:  raw.indexOf('Name (Sinhala)'),
      cat:     raw.indexOf('Category'),
      descEn:  raw.indexOf('Description (English)'),
      descSi:  raw.indexOf('Description (Sinhala)'),
      img1:    raw.indexOf('Image URL 1'),
      img2:    raw.indexOf('Image URL 2'),
      img3:    raw.indexOf('Image URL 3'),
      img4:    raw.indexOf('Image URL 4'),
    };
    const c = (cols, i) => i >= 0 ? (cols[i] || '').trim() : '';

    allProducts = rows.slice(headerIdx + 1).filter(r => r.trim()).map(row => {
      const cols = row.split('\t');
      const imgs = [c(cols,idx.img1), c(cols,idx.img2), c(cols,idx.img3), c(cols,idx.img4)].filter(Boolean);
      return {
        sku:      c(cols, idx.sku),
        name:     c(cols, idx.name),
        nameSi:   c(cols, idx.nameSi),
        category: (c(cols, idx.cat) || 'building').toLowerCase(),
        descEn:   c(cols, idx.descEn),
        descSi:   c(cols, idx.descSi),
        images:   imgs,
      };
    }).filter(p => p.sku && p.name);

    rebuildFiltered();
    renderGrid();
  } catch(e){
    document.getElementById('productGrid').innerHTML = `
      <div class="catalogue-error">
        <i data-lucide="wifi-off" style="width:48px;height:48px;color:rgba(157,154,135,0.3);"></i>
        <p class="catalogue-error-title">Couldn't load products</p>
        <p class="catalogue-error-sub">Please check your connection and try again, or reach us directly on WhatsApp.</p>
        <a href="https://wa.me/94766604430" class="catalogue-error-wa">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.073.527 4.02 1.453 5.716L0 24l6.522-1.425A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.66-.503-5.187-1.381l-.373-.22-3.872.845.875-3.764-.242-.386A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          Chat on WhatsApp
        </a>
      </div>`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function renderGrid(){
  const grid = document.getElementById('productGrid');
  let prods = [...filteredProducts];
  if(currentSort==='az') prods.sort((a,b)=>a.name.localeCompare(b.name));
  else if(currentSort==='za') prods.sort((a,b)=>b.name.localeCompare(a.name));

  if(!prods.length){
    grid.innerHTML = `<div class="no-results"><i data-lucide="search-x" style="width:48px;height:48px;color:rgba(157,154,135,0.3);display:block;margin:0 auto 20px;"></i><p>No products found</p></div>`;
    return;
  }
  grid.innerHTML = prods.map(p=>{
    const imgHtml = p.images.length
      ? `<img src="${p.images[0]}" alt="${p.name}" loading="lazy" onload="this.parentElement.classList.add('loaded')">`
      : `<div class="no-img-placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>No Image</span></div>`;
    return `
    <div class="product-card" onclick="openProduct('${p.sku}')">
      <div class="product-card-img ${!p.images.length ? 'loaded' : ''}">
        ${imgHtml}
        <span class="product-badge ${p.category==='homeware'?'homeware':''}">${p.category==='homeware'?'Homeware':'Building'}</span>
        <div class="product-card-overlay">
          <div class="product-overlay-btn">View Details</div>
        </div>
      </div>
      <div class="product-card-body">
        <p class="product-sku">${p.sku}</p>
        <h3 class="product-name">${p.name}</h3>
        ${p.nameSi?`<p class="product-name-si">${p.nameSi}</p>`:''}
        <div class="product-footer">
          <div class="card-qty-ctrl" onclick="event.stopPropagation()">
            <button class="card-qty-btn" onclick="cardQtyChange('${p.sku}',-1)"><i data-lucide="minus" style="width:11px;height:11px;"></i></button>
            <input class="card-qty-input" id="cardqty-${p.sku}" type="number" value="1" min="1" onclick="this.select()" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
            <button class="card-qty-btn" onclick="cardQtyChange('${p.sku}',1)"><i data-lucide="plus" style="width:11px;height:11px;"></i></button>
          </div>
          <button class="add-to-cart-btn" onclick="event.stopPropagation();quickAdd('${p.sku}')">
            <i data-lucide="plus" style="width:15px;height:15px;"></i>
          </button>
        </div>
      </div>
    </div>
  `}).join('');
  // Re-observe newly added reveal elements
  document.querySelectorAll('.product-card').forEach((el,i)=>{
    el.style.opacity='0'; el.style.transform='translateY(20px)';
    setTimeout(()=>{ el.style.transition='opacity 0.5s ease, transform 0.5s ease'; el.style.opacity='1'; el.style.transform='translateY(0)'; }, i*60);
  });
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

function applyFilter(f, btn){
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  gaEvent('catalogue_filter', { filter: f });
  rebuildFiltered(); renderGrid();
}

function applySort(val){ currentSort=val; renderGrid(); }

function filterByCategory(cat){
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  const btn = document.querySelector(`.filter-btn[data-filter="${cat}"]`);
  if(btn) btn.classList.add('active');
  gaEvent('category_panel_clicked', { category: cat });
  rebuildFiltered(); renderGrid();
  setTimeout(()=>document.getElementById('catalogue').scrollIntoView({behavior:'smooth'}), 100);
}

/* ═══════════════════════════════════════
   MODAL
═══════════════════════════════════════ */
function gaEvent(name, params){
  if(typeof gtag === 'undefined') return;
  gtag('event', name, params || {});
}

function openProduct(sku){
  const p = allProducts.find(x=>x.sku===sku);
  if(!p) return;
  currentProduct = p;
  gaEvent('product_viewed', { sku: p.sku, product_name: p.name, category: p.category });
  document.getElementById('modalBadge').textContent = p.category==='homeware'?'Homeware':'Building';
  document.getElementById('modalBadge').className = 'modal-badge '+(p.category==='homeware'?'homeware':'');
  document.getElementById('modalSku').textContent = p.sku;
  document.getElementById('modalTitle').textContent = p.name;
  document.getElementById('modalTitleSi').textContent = p.nameSi||'';
  document.getElementById('modalDesc').textContent = p.descEn||'';
  document.getElementById('modalDescSi').textContent = p.descSi||'';
  document.getElementById('qtyInput').value = 1;
  // Gallery
  const mainImg = document.getElementById('modalMainImg');
  const thumbs = document.getElementById('modalThumbs');
  if(p.images.length){
    mainImg.src = p.images[0]; mainImg.style.display='block';
    thumbs.innerHTML = p.images.map((img,i)=>`<img src="${img}" class="modal-thumb${i===0?' active':''}" onclick="switchImg('${img}',this)" alt="">`).join('');
  } else {
    mainImg.style.display='none';
    thumbs.innerHTML = `<div class="no-img-placeholder" style="height:380px;width:100%;"><svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>No Image Available</span></div>`;
  }
  const notes = document.getElementById('modalNotes');
  if(p.notes){ notes.textContent = '⚠ '+p.notes; notes.style.display='block'; } else { notes.style.display='none'; }
  document.getElementById('productModal').classList.add('open');
  document.body.style.overflow='hidden';
  history.pushState({ modal: p.sku }, '', '');
  if(typeof lucide !== 'undefined') lucide.createIcons();
}
function switchImg(src, el){
  document.getElementById('modalMainImg').src=src;
  document.querySelectorAll('.modal-thumb').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
}
function closeModal(e){ if(e.target===document.getElementById('productModal')) closeProductModal(); }
function closeProductModal(){
  document.getElementById('productModal').classList.remove('open');
  document.body.style.overflow='';
  if(history.state && history.state.modal) history.back();
}
window.addEventListener('popstate', function(e){
  const modal = document.getElementById('productModal');
  if(modal.classList.contains('open')){
    modal.classList.remove('open');
    document.body.style.overflow='';
  }
});
function changeQty(d){
  const inp=document.getElementById('qtyInput');
  const v=Math.max(1,parseInt(inp.value||1)+d);
  inp.value=v;
}

/* ═══════════════════════════════════════
   CART
═══════════════════════════════════════ */
let cart = [];
try { cart = JSON.parse(localStorage.getItem('terra_cart')) || []; } catch(e){}

function addToCart(){
  if(!currentProduct) return;
  const qty = Math.max(1,parseInt(document.getElementById('qtyInput').value)||1);
  const idx = cart.findIndex(c=>c.sku===currentProduct.sku);
  if(idx>=0) cart[idx].qty+=qty;
  else cart.push({...currentProduct, qty});
  gaEvent('add_to_enquiry', { sku: currentProduct.sku, product_name: currentProduct.name, quantity: qty, source: 'modal' });
  updateCartUI();
  closeProductModal();
  showToast(`${currentProduct.name} added to enquiry`, 'success');
}

function cardQtyChange(sku, delta){
  const input = document.getElementById('cardqty-'+sku);
  if(!input) return;
  const val = Math.max(1, (parseInt(input.value)||1) + delta);
  input.value = val;
}

function quickAdd(sku){
  const p = allProducts.find(x=>x.sku===sku);
  if(!p) return;
  const input = document.getElementById('cardqty-'+sku);
  const qty = input ? Math.max(1, parseInt(input.value)||1) : 1;
  const idx = cart.findIndex(c=>c.sku===sku);
  if(idx>=0) cart[idx].qty += qty;
  else cart.push({...p, qty});
  if(input) input.value = 1;
  gaEvent('add_to_enquiry', { sku: p.sku, product_name: p.name, quantity: qty, source: 'card' });
  updateCartUI();
  showToast(`${p.name} added to enquiry`, 'success');
}

function updateCartUI(){
  localStorage.setItem('terra_cart', JSON.stringify(cart));
  updateCartBadge();
  const list = document.getElementById('cartItemsList');
  const footer = document.getElementById('cartFooter');
  if(!cart.length){
    list.innerHTML = `<div class="cart-empty"><i data-lucide="shopping-cart" style="width:48px;height:48px;color:rgba(157,154,135,0.25);"></i><p>Your enquiry list is empty</p></div>`;
    footer.style.display='none'; return;
  }
  footer.style.display='block';
  list.innerHTML = cart.map(item=>`
    <div class="cart-item">
      ${item.images[0] ? `<img class="cart-item-img" src="${item.images[0]}" alt="${item.name}">` : `<div class="cart-item-img" style="background:var(--eggshell-dark);flex-shrink:0;"></div>`}
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-sku">${item.sku}</p>
        <div class="cart-item-row">
          <div class="cart-item-qty">
            <button class="ciq-btn" onclick="cartChangeQty('${item.sku}',-1)"><i data-lucide="minus" style="width:12px;height:12px;"></i></button>
            <input class="ciq-val" type="number" id="ciq-${item.sku}" value="${item.qty}" min="1" onclick="this.select()" onchange="cartSetQty('${item.sku}',this.value)" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
            <button class="ciq-btn" onclick="cartChangeQty('${item.sku}',1)"><i data-lucide="plus" style="width:12px;height:12px;"></i></button>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart('${item.sku}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
        </div>
      </div>
    </div>
  `).join('');
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

function cartChangeQty(sku, d){
  const idx = cart.findIndex(c=>c.sku===sku);
  if(idx<0) return;
  cart[idx].qty = Math.max(1, cart[idx].qty + d);
  const input = document.getElementById('ciq-'+sku);
  if(input) input.value = cart[idx].qty;
  updateCartBadge();
}
function cartSetQty(sku, val){
  const idx = cart.findIndex(c=>c.sku===sku);
  if(idx<0) return;
  const q = Math.max(1, parseInt(val)||1);
  cart[idx].qty = q;
  const input = document.getElementById('ciq-'+sku);
  if(input) input.value = q;
  updateCartBadge();
}
function updateCartBadge(){
  const count = cart.reduce((s,c)=>s+c.qty,0);
  const badge = document.getElementById('cartBadge');
  const badgeMobile = document.getElementById('cartBadgeMobile');
  if(badge){
    badge.textContent = count;
    badge.classList.toggle('show', count>0);
  }
  if(badgeMobile){ badgeMobile.textContent = count; badgeMobile.classList.toggle('show', count>0); }
}
function removeFromCart(sku){
  cart = cart.filter(c=>c.sku!==sku);
  updateCartUI();
  showToast('Item removed from enquiry', 'info');
}
function openCart(){ document.getElementById('cartDrawer').classList.add('open'); document.getElementById('cartOverlay').classList.add('open'); updateCartUI(); document.body.style.overflow='hidden'; gaEvent('enquiry_drawer_opened', { item_count: cart.length }); }
function closeCart(){ document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('cartOverlay').classList.remove('open'); document.body.style.overflow=''; }

function buildOrderMsg(){
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  if(!name||!phone){ showToast('Please enter your name and phone number', 'error'); return null; }
  if(!cart.length){ showToast('Your enquiry list is empty', 'error'); return null; }
  const lines = cart.map(c=>`• ${c.sku} – ${c.name} × ${c.qty}`).join('\n');
  return `Hello Terra by Shavindi 🌿\n\nI would like to request a quotation for the following items:\n\n${lines}\n\nMy Details:\nName / Company: ${name}\nPhone: ${phone}\n\nPlease let me know the pricing and availability. Thank you!`;
}

function checkoutWhatsApp(){
  const msg = buildOrderMsg();
  if(!msg) return;
  gaEvent('enquiry_sent', { method: 'whatsapp', item_count: cart.length, total_qty: cart.reduce((s,c)=>s+c.qty,0) });
  window.open(`https://wa.me/94766604430?text=${encodeURIComponent(msg)}`, '_blank');
}
function checkoutSMS(){
  const msg = buildOrderMsg();
  if(!msg) return;
  gaEvent('enquiry_sent', { method: 'sms', item_count: cart.length, total_qty: cart.reduce((s,c)=>s+c.qty,0) });
  window.open(`sms:+94766604430?body=${encodeURIComponent(msg)}`, '_blank');
}

function copyOrderToClipboard(){
  const msg = buildOrderMsg();
  if(!msg) return;
  gaEvent('enquiry_sent', { method: 'clipboard', item_count: cart.length, total_qty: cart.reduce((s,c)=>s+c.qty,0) });
  navigator.clipboard.writeText(msg).then(()=>{ showToast('Enquiry copied to clipboard!', 'success'); }).catch(()=>{ showToast('Could not copy — please try WhatsApp or SMS', 'error'); });
}

/* ═══════════════════════════════════════
   BLOG PREVIEW (3 latest posts from Contentful)
═══════════════════════════════════════ */
async function loadBlogPreview(){
  const grid = document.getElementById('blogPreviewGrid');
  try {
    const posts = (window.BLOG_DATA || []).slice(0, 3);
    if(!posts.length){
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;font-family:var(--font-title);font-style:italic;color:var(--khaki);padding:40px;">No posts yet — check back soon.</p>`;
      return;
    }

    grid.innerHTML = posts.map(p => `
      <a class="blog-preview-card" href="/blog/${p.slug}/">
        <div class="blog-preview-img">
          ${p.coverUrl
            ? `<img src="${p.coverUrl}?w=680&h=400&fit=fill&f=face" alt="${p.title}" loading="lazy">`
            : `<div class="blog-preview-no-img"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.2;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`}
        </div>
        <div class="blog-preview-body">
          <div class="blog-preview-meta">
            ${p.date ? `<span class="blog-preview-date">${new Date(p.date).toLocaleDateString('en-LK',{day:'numeric',month:'long',year:'numeric'})}</span>` : ''}
            ${p.category ? `<span class="blog-preview-cat">${p.category}</span>` : ''}
          </div>
          <h3 class="blog-preview-title">${p.title}</h3>
          ${p.excerpt ? `<p class="blog-preview-excerpt">${p.excerpt}</p>` : ''}
        </div>
      </a>
    `).join('');
  } catch(e){
    console.error("Failed to load blog preview:", e);
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;font-size:0.75rem;color:var(--khaki);padding:40px;">Couldn't load posts right now.</p>`;
  }
}



/* --- BLOG JS --- */

/* ═══════════════════════════════════════
   CONFIG
═══════════════════════════════════════ */
const POSTS_PER_PAGE = 6;

/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
let allPosts   = [];
let assets     = {};  // id → url map for images
let currentPage = 1;
let currentSlug = null;

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
document.getElementById('footerYear').textContent = new Date().getFullYear();

/* ═══════════════════════════════════════
   NAV DRAWER
═══════════════════════════════════════ */
function openDrawer(){ document.getElementById('navDrawer').classList.add('open'); document.getElementById('drawerOverlay').classList.add('open'); }
function closeDrawer(){ document.getElementById('navDrawer').classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('open'); }

/* ═══════════════════════════════════════
   FETCH ALL POSTS (listing)
═══════════════════════════════════════ */
async function fetchPosts(){
  try {
    allPosts = window.BLOG_DATA || [];
    renderListing();
  } catch(e) {
    console.error("Failed to fetch posts:", e);
    document.getElementById('postsGrid').innerHTML = `
      <div class="state-screen" style="grid-column:1/-1;">
        <i data-lucide="wifi-off" style="width:48px;height:48px;color:rgba(157,154,135,0.3);"></i>
        <p class="state-screen-title">Couldn't load posts</p>
        <p class="state-screen-sub">Please check your connection and try again shortly.</p>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
    if(typeof lucide !== 'undefined') lucide.createIcons();
  }
}

/* ═══════════════════════════════════════
   RENDER LISTING WITH PAGINATION
═══════════════════════════════════════ */
function renderListing(){
  if(!allPosts.length){
    document.getElementById('postsGrid').innerHTML = `
      <div class="state-screen" style="grid-column:1/-1;">
        <p class="state-screen-title">No posts yet</p>
        <p class="state-screen-sub">We're still firing up the kiln. Check back soon.</p>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
    if(typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  currentPage = Math.max(1, Math.min(currentPage, totalPages));
  const start  = (currentPage - 1) * POSTS_PER_PAGE;
  const pagePosts = allPosts.slice(start, start + POSTS_PER_PAGE);

  document.getElementById('postsGrid').innerHTML = pagePosts.map(p => `
    <a href="blog/${p.slug}/" class="post-card" style="display:block; text-decoration:none; color:inherit;" onclick="navigateToPost(event, '${p.slug}')">
      <div class="post-card-img">
        ${p.coverUrl
          ? `<img src="${p.coverUrl}?w=680&h=440&fit=fill&f=face" alt="${p.title}" loading="lazy">`
          : `<div class="post-card-no-img"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.2;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`}
      </div>
      <div class="post-card-body">
        <div class="post-meta">
          ${p.date ? `<span class="post-date">${formatDate(p.date)}</span>` : ''}
          ${p.category ? `<span class="post-category">${p.category}</span>` : ''}
        </div>
        <h2 class="post-title">${p.title}</h2>
        ${p.excerpt ? `<p class="post-excerpt">${p.excerpt}</p>` : ''}
        <span class="post-read-more">Read more <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
      </div>
    </a>
  `).join('');

  // Pagination
  const pag = document.getElementById('pagination');
  if(totalPages <= 1){ pag.innerHTML = ''; return; }

  let html = `<button class="page-arrow" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}><i data-lucide="chevron-left" style="width:16px;height:16px;"></i></button>`;
  for(let i=1; i<=totalPages; i++){
    html += `<button class="page-btn ${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="page-arrow" onclick="goPage(${currentPage+1})" ${currentPage===totalPages?'disabled':''}><i data-lucide="chevron-right" style="width:16px;height:16px;"></i></button>`;
  pag.innerHTML = html;
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

function goPage(n){
  currentPage = n;
  renderListing();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════════════════════════════
   SHOW SINGLE POST
═══════════════════════════════════════ */
function navigateToPost(e, slug){
  if (e) e.preventDefault();
  // Update URL without reload
  history.pushState({}, '', `blog/${slug}/`);
  fetchAndShowPost(slug);
}

function showPost(slug){
  navigateToPost(null, slug);
}

async function fetchAndShowPost(slug){
  // Switch UI to post view
  document.getElementById('listingView').style.display = 'none';
  document.getElementById('journalHero').style.display = 'none';
  document.getElementById('postView').style.display = 'block';
  document.getElementById('postViewInner').innerHTML = `
    <div class="state-screen"><div class="skeleton-line" style="width:60%;height:14px;margin:0 auto 12px;"></div><div class="skeleton-line" style="width:40%;height:10px;margin:0 auto;"></div></div>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if(typeof lucide !== 'undefined') lucide.createIcons();

  try {
    const postData = window.BLOG_DATA || [];
    let post = postData.find(p => p.slug === slug);

    if(!post){
      throw new Error('Post not found');
    }

    if(!post.body){
      const res = await fetch(`/blog/${slug}/data.json`);
      if(!res.ok) throw new Error('Failed to fetch full post');
      const data = await res.json();
      post.body = data.body;
    }

    renderPost(post);
  } catch(e){
    console.error("Failed to fetch/show post:", e);
    document.getElementById('postViewInner').innerHTML = `
      <div class="state-screen">
        <p class="state-screen-title">Post not found</p>
        <p class="state-screen-sub">This post may have been removed or the link is incorrect.</p>
      </div>`;
  }
}

function renderPost(post){
  // Update page title for SEO
  document.title = `${post.title} — Terra by Shavindi`;
  const ogTitle = document.getElementById('ogTitle');
  const ogDesc = document.getElementById('ogDesc');
  const canonical = document.getElementById('canonical');
  if(ogTitle) ogTitle.content = `${post.title} — Terra by Shavindi`;
  if(ogDesc && post.excerpt) ogDesc.content = post.excerpt;
  if(canonical) canonical.href = `https://shavindi.lk/blog/${post.slug}/`;

  // Track SPA page view in Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('config', 'G-Y7N2EXY70B', {
      'page_path': `/blog/${post.slug}/`,
      'page_title': `${post.title} — Terra by Shavindi`
    });
  }

  const coverHtml = post.coverUrl
    ? `<div class="post-view-cover"><img src="${post.coverUrl}?w=1400&h=840&fit=fill" alt="${post.title}"></div>`
    : '';

  document.getElementById('postViewInner').innerHTML = `
    ${coverHtml}
    <div class="post-view-meta">
      ${post.date ? `<span class="post-date">${formatDate(post.date)}</span>` : ''}
      ${post.category ? `<span class="post-category">${post.category}</span>` : ''}
    </div>
    <h1 class="post-view-title">${post.title}</h1>
    <div class="post-divider"></div>
    <div class="post-view-body" id="postBody"></div>
  `;

  // Render rich text body
  if(post.body) {
    document.getElementById('postBody').innerHTML = renderRichText(post.body);
  } else {
    document.getElementById('postBody').innerHTML = '<p style="color:var(--khaki);font-style:italic;">No content yet.</p>';
  }
}

function showListing(){
  history.pushState({}, '', 'blog.html');
  document.getElementById('listingView').style.display = 'block';
  document.getElementById('journalHero').style.display = 'block';
  document.getElementById('postView').style.display = 'none';
  document.title = 'Journal — Terra by Shavindi';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if(!allPosts.length) fetchPosts();
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

// Handle browser back button
window.addEventListener('popstate', () => {
  let slug = null;
  const pathMatch = window.location.pathname.match(/\/blog\/([^/]+)\/?(?:index\.html)?$/);
  if (pathMatch) slug = pathMatch[1];
  else {
    const params = new URLSearchParams(window.location.search);
    slug = params.get('post');
  }
  
  if(slug){ fetchAndShowPost(slug); }
  else { showListing(); }
});

/* ═══════════════════════════════════════
   RICH TEXT RENDERER
   Converts Contentful's rich text JSON to HTML
═══════════════════════════════════════ */
function renderRichText(node){
  if(!node || !node.content) return '';
  return node.content.map(n => renderNode(n)).join('');
}

function renderNode(node){
  if(node.nodeType === 'text'){
    let text = escHtml(node.value);
    if(node.marks) node.marks.forEach(m => {
      if(m.type === 'bold')      text = `<strong>${text}</strong>`;
      if(m.type === 'italic')    text = `<em>${text}</em>`;
      if(m.type === 'underline') text = `<u>${text}</u>`;
      if(m.type === 'code')      text = `<code>${text}</code>`;
    });
    return text;
  }
  const inner = node.content ? node.content.map(renderNode).join('') : '';
  switch(node.nodeType){
    case 'paragraph':             return inner.trim() ? `<p>${inner}</p>` : '';
    case 'heading-1':             return `<h1>${inner}</h1>`;
    case 'heading-2':             return `<h2>${inner}</h2>`;
    case 'heading-3':             return `<h3>${inner}</h3>`;
    case 'heading-4':             return `<h3>${inner}</h3>`;
    case 'unordered-list':        return `<ul>${inner}</ul>`;
    case 'ordered-list':          return `<ol>${inner}</ol>`;
    case 'list-item':             return `<li>${inner}</li>`;
    case 'blockquote':            return `<blockquote>${inner}</blockquote>`;
    case 'hr':                    return `<hr>`;
    case 'hyperlink': {
      let uri = node.data && node.data.uri ? node.data.uri : '#';
      if (uri.toLowerCase().trim().startsWith('javascript:')) uri = '#';
      return `<a href="${uri}" target="_blank" rel="noopener">${inner}</a>`;
    }
    case 'embedded-asset-block': {
      const id = node.data && node.data.target && node.data.target.sys && node.data.target.sys.id;
      const src = id ? assets[id] : null;
      return src ? `<img src="${src}?w=1200" alt="">` : '';
    }
    default: return inner;
  }
}

function escHtml(str){
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function formatDate(dateStr){
  if(!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-LK', { day:'numeric', month:'long', year:'numeric' });
}


/* --- INIT --- */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('productGrid')) {
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
