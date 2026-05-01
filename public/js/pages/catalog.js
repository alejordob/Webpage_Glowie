/**
 * js/pages/catalog.js
 * Catálogo con:
 *   1. Scroll cinematográfico con GSAP ScrollTrigger
 *   2. 3D Tilt + Color Glow en tarjetas de producto
 */

import { formatPriceCOP } from '../cart.js';
import { getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { openModal } from './modal.js';
import { getQueryParams, pushFilterParams } from '../app.js';

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 80;
const FIREBASE_TIMEOUT_MS = 10000;

function withTimeout(promise, ms = FIREBASE_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), ms)),
  ]);
}

// --- CACHÉ ---
const CACHE_KEY = 'glowie_products_v1';
const CACHE_TTL = 30 * 60 * 1000;

function getCachedProducts() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}

function setCachedProducts(products) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: products, timestamp: Date.now() }));
  } catch { /* Safari privado o cuota llena */ }
}

// --- SLUG ---
function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// --- CLOUDINARY ---
function getOptimizedImageUrl(url, width = 400) {
  if (!url || !url.includes('cloudinary')) return url;
  if (url.includes('/f_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_90,w_${width}/`);
}

// ============================================================
// PRODUCTOS REGALO — DÍA DE LA MADRE
// ============================================================
const GIFT_KEYWORDS = ['trinidad', 'waxmelt', 'flama', 'jarron', 'lazo', 'kit'];
function isGiftProduct(product) {
  const name = (product.name || '').toLowerCase();
  return GIFT_KEYWORDS.some(kw => name.includes(kw));
}

// ============================================================
// COLOR GLOW POR PRODUCTO
// ============================================================
const CEMENTO_COLOR_MAP = {
  'amarillo': 'rgba(230,170,20,0.38)',
  'rojo': 'rgba(180,35,35,0.38)',
  'blanco': 'rgba(220,215,200,0.32)',
  'natural': 'rgba(195,165,110,0.35)',
  'azul': 'rgba(40,90,200,0.32)',
  'verde': 'rgba(40,140,75,0.32)',
  'negro': 'rgba(20,20,20,0.45)',
  'gris': 'rgba(110,110,110,0.32)',
  'naranja': 'rgba(215,95,25,0.38)',
  'morado': 'rgba(100,30,150,0.35)',
};

function getGlowColor(product) {
  const combs = product.combinaciones || [];
  for (const comb of combs) {
    const cemento = (comb.cemento || comb.label || '').toLowerCase();
    for (const [key, val] of Object.entries(CEMENTO_COLOR_MAP)) {
      if (cemento.includes(key)) return val;
    }
  }
  return 'rgba(83,22,29,0.32)';
}

// ============================================================
// 3D TILT + GLOW
// ============================================================
const isTouchDevice = () => window.matchMedia('(hover: none)').matches;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initTiltEffect() {
  if (isTouchDevice() || prefersReducedMotion()) return;

  document.querySelectorAll('.catalog-card-clickable[data-glow-color]').forEach(card => {
    const glowColor = card.dataset.glowColor;
    const shine = card.querySelector('.card-shine');

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -9;
      const rotY = ((x - cx) / cx) * 9;

      card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.035,1.035,1.035)`;
      card.style.boxShadow = `0 24px 60px -8px ${glowColor}, 0 0 28px -4px ${glowColor}`;
      card.style.zIndex = '10';

      if (shine) {
        const pctX = (x / rect.width) * 100;
        const pctY = (y / rect.height) * 100;
        shine.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, rgba(255,255,255,0.13) 0%, transparent 65%)`;
        shine.style.opacity = '1';
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.zIndex = '';
      if (shine) shine.style.opacity = '0';
      const flame = card.querySelector('.card-flame-glow');
      if (flame) flame.style.opacity = '0';
    });
  });
}


function animateNewCards() {
  const gsap = window.gsap;
  if (!gsap || prefersReducedMotion()) return;
  gsap.fromTo('.catalog-product-card',
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.45, stagger: 0.055, ease: 'power2.out', clearProps: 'opacity,transform' }
  );
}

// ============================================================
// SCHEMA.ORG
// ============================================================
function generateProductSchema(product, rating = null) {
  const images = Array.isArray(product.imageUrls) ? product.imageUrls : product.images || [];
  const isOnSale = product.on_sale === true && product.on_sale_price < product.price;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || 'Vela artesanal de cera de soja natural',
    image: images,
    brand: { '@type': 'Brand', name: 'Glowie' },
    offers: {
      '@type': 'Offer',
      price: String(isOnSale ? product.on_sale_price : product.price),
      priceCurrency: 'COP',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://velasglowie.com/catalogo/${slugify(product.name)}`,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Glowie',
        '@id': 'https://velasglowie.com/#organization'
      }
    },
  };

  if (rating && rating.ratingValue > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(rating.ratingValue),
      reviewCount: String(rating.reviewCount),
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

async function fetchAndApplyRatings() {
  try {
    const app = getApp();
    const db = getFirestore(app);
    const snapshot = await withTimeout(
      getDocs(query(collection(db, 'reviews'), where('approved', '==', true))),
      FIREBASE_TIMEOUT_MS
    );

    const ratingsMap = {};
    snapshot.docs.forEach(doc => {
      const { productId, rating } = doc.data();
      if (!productId || !rating) return;
      if (!ratingsMap[productId]) ratingsMap[productId] = { sum: 0, count: 0 };
      ratingsMap[productId].sum += Number(rating);
      ratingsMap[productId].count += 1;
    });

    // Convert to averages
    Object.keys(ratingsMap).forEach(productId => {
      const entry = ratingsMap[productId];
      ratingsMap[productId].ratingValue = Math.round((entry.sum / entry.count) * 10) / 10;
      ratingsMap[productId].reviewCount = entry.count;
    });

    // Update DOM card rating displays
    document.querySelectorAll('.catalog-product-card[data-product-id]').forEach(card => {
      const entry = ratingsMap[card.dataset.productId];
      if (!entry || entry.count === 0) return;
      const avg = entry.ratingValue;
      const slot = card.querySelector('.card-ratings');
      if (slot) {
        slot.innerHTML = `<span class="text-xs font-semibold" style="color:#FFD700;">★ ${avg}</span><span class="text-xs ml-1" style="color:rgba(255,255,255,0.65);">· ${entry.count}</span>`;
      }
    });

    return { ratingsMap, success: true };
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return { ratingsMap: {}, success: false };
  }
}

function injectProductSchemas(products, ratingsMap = {}) {
  document.querySelectorAll('script[data-glowie-schema="catalog"]').forEach(el => el.remove());
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Catálogo de Velas Glowie',
    description: 'Colección de velas artesanales de cera de soja natural, hechas a mano en Cali',
    url: 'https://velasglowie.com/catalogo',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 12).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: generateProductSchema(p, ratingsMap[p.id]),
      })),
    },
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-glowie-schema', 'catalog');
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

// ============================================================
// SKELETON
// ============================================================
function renderSkeletons(count = 8) {
  const container = document.getElementById('product-list');
  if (!container) return;
  container.innerHTML = Array.from({ length: count }, () => `
    <div style="background:linear-gradient(135deg,#130508,#1a0810);border-radius:16px;overflow:hidden;border:1px solid rgba(251,243,224,0.05);">
      <div style="aspect-ratio:3/4;background:rgba(251,243,224,0.05);animation:cat-skeleton-pulse 1.8s ease-in-out infinite;"></div>
      <div style="padding:12px 14px;">
        <div style="height:16px;border-radius:4px;background:rgba(251,243,224,0.07);margin-bottom:8px;width:70%;animation:cat-skeleton-pulse 1.8s ease-in-out infinite;"></div>
        <div style="height:11px;border-radius:4px;background:rgba(251,243,224,0.05);margin-bottom:12px;width:50%;animation:cat-skeleton-pulse 1.8s ease-in-out infinite;"></div>
        <div style="height:32px;border-radius:8px;background:rgba(251,243,224,0.06);animation:cat-skeleton-pulse 1.8s ease-in-out infinite;"></div>
      </div>
    </div>
  `).join('');
}

let allProducts = [];
let activeChipFilter = 'todas';

const CHIP_FILTERS = {
  'todas':       () => true,
  'mama':        p => isGiftProduct(p),
  'velas':       p => Array.isArray(p.aroma) && p.aroma.length > 0,
  'bases':       p => (p.name || '').toLowerCase().includes('base'),
  'waxmelts':    p => (p.name || '').toLowerCase().includes('wax'),
  'ofertas':     p => p.on_sale === true && p.on_sale_price < p.price,
  'disponibles': p => p.stock > 0,
};

export function setAllProducts(products) {
  allProducts = [...products];
}

// ============================================================
// FILTROS POR AROMA Y CATEGORÍA
// ============================================================

/**
 * Debounce utility to delay function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Aplica filtros desde parámetros (usados al restaurar desde URL)
 * @param {Object} filters - Objeto con aroma y categoria
 */
export function applyFiltersFromUrl(filters) {
  const aromaFilter = document.getElementById('aroma-filter');

  // Restaurar el valor del filtro de aroma desde la URL
  if (filters.aroma && aromaFilter) {
    aromaFilter.value = filters.aroma;
  }

  // Aplicar los filtros
  filterByAromaAndCategory(filters);
}

/**
 * Filtra productos por aroma y categoría
 * @param {Object} filters - Objeto con aroma y categoria (opcional)
 */
function filterByAromaAndCategory(filters = {}) {
  // Validate products are loaded
  if (!allProducts || allProducts.length === 0) {
    console.warn('No products loaded yet');
    renderProducts([]);
    return;
  }

  const aroma = filters.aroma || document.getElementById('aroma-filter')?.value.trim().toLowerCase() || '';
  const categoria = filters.categoria || document.getElementById('categoria-filter')?.value.trim().toLowerCase() || '';

  let filtered = allProducts;

  // Filtrar por chip activo
  const chipFn = CHIP_FILTERS[activeChipFilter];
  if (chipFn) filtered = filtered.filter(chipFn);

  // Filtrar por aroma (texto)
  if (aroma) {
    filtered = filtered.filter(product => {
      if (Array.isArray(product.aroma))
        return product.aroma.some(a => typeof a === 'string' && a.toLowerCase().includes(aroma));
      return typeof product.aroma === 'string' && product.aroma.toLowerCase().includes(aroma);
    });
  }

  // Filtrar por categoría
  if (categoria) {
    filtered = filtered.filter(product => {
      const productCategories = product.categoria || [];
      return productCategories.some(c => c.toLowerCase().includes(categoria));
    });
  }

  renderProducts(filtered);
}

/**
 * Filtra por aroma (desde input del usuario)
 * Actualiza la URL con los parámetros de filtro actuales
 */
function filterByAroma() {
  const aroma = document.getElementById('aroma-filter')?.value.trim().toLowerCase() || '';
  const categoria = document.getElementById('categoria-filter')?.value.trim().toLowerCase() || '';

  // Track filter click event
  if (aroma || categoria) {
    if (typeof gtag === 'function') {
      gtag('event', 'click_filter', {
        filter_type: aroma ? 'aroma' : 'categoria',
        filter_value: aroma || categoria,
        event_category: 'engagement'
      });
    }
  }

  // Actualizar la URL con el estado actual de filtros
  const filters = { aroma, categoria };
  pushFilterParams(filters);

  // Aplicar los filtros
  filterByAromaAndCategory(filters);
}

// ============================================================
// RENDER DE TARJETAS
// ============================================================
function renderProducts(products) {
  const container = document.getElementById('product-list');
  if (!container) return;

  if (products.length === 0) {
    const query = document.getElementById('aroma-filter')?.value || '';
    container.innerHTML = `
      <div class="col-span-full text-center p-10 text-gray-600">
        <i class="fas fa-search text-4xl mb-4 text-gray-400"></i>
        <p class="text-lg">No encontramos velas con aroma "<strong>${query}</strong>"</p>
        <p class="text-sm mt-2">Prueba con: coco, vainilla, bambú, café...</p>
      </div>`;
    return;
  }

  // Preservar scroll al reemplazar skeletons con productos reales
  const savedScroll = window.scrollY;
  container.innerHTML = '';

  products.forEach(product => {
    const isOnSale = product.on_sale === true && product.on_sale_price < product.price;
    const isNew = product.is_new === true;
    const stock = product.stock || 0;
    const isOutOfStock = stock === 0;
    const isGift = isGiftProduct(product);

    const originalPrice = formatPriceCOP(product.price);
    const salePrice = formatPriceCOP(product.on_sale_price || product.price);
    const discountPercent = isOnSale ? Math.round(((product.price - product.on_sale_price) / product.price) * 100) : 0;

    const images = Array.isArray(product.imageUrls) ? product.imageUrls : product.images || [];
    const mainImage = images[0] || 'https://placehold.co/400x300/130508/fbf3e0?text=Vela';
    const imgSm = getOptimizedImageUrl(mainImage, 400);
    const imgMd = getOptimizedImageUrl(mainImage, 700);
    const imgLg = getOptimizedImageUrl(mainImage, 900);
    const glowColor = getGlowColor(product);

    // Badge top-right
    let badgeHtml = '';
    if (isOutOfStock) {
      badgeHtml = `<span style="position:absolute;top:8px;right:8px;background:rgba(10,2,3,0.8);backdrop-filter:blur(8px);border:1px solid rgba(239,68,68,0.3);color:rgba(239,68,68,0.8);padding:3px 8px;border-radius:20px;font-size:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;z-index:20;">Agotado</span>`;
    } else {
      if (isNew) badgeHtml += `<span style="position:absolute;top:8px;right:8px;background:linear-gradient(135deg,#e8a87c,#c9956a);color:#2d0a10;padding:3px 10px;border-radius:20px;font-size:8px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;z-index:20;">NEW</span>`;
      if (isOnSale && discountPercent > 0) {
        const topOffset = isNew ? '34px' : '8px';
        badgeHtml += `<span style="position:absolute;top:${topOffset};right:8px;background:rgba(10,2,3,0.8);backdrop-filter:blur(8px);border:1px solid rgba(232,168,124,0.3);color:#e8a87c;padding:3px 8px;border-radius:20px;font-size:8px;font-weight:700;z-index:20;">${discountPercent}% OFF</span>`;
      }
    }

    // Gift ribbon
    const ribbonHtml = isGift
      ? `<div style="position:absolute;top:0;left:0;background:linear-gradient(90deg,#c9956a,#e8a87c);color:#2d0a10;font-size:7px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;padding:5px 14px 5px 10px;clip-path:polygon(0 0,100% 0,88% 100%,0% 100%);z-index:20;">🌹 Regalo</div>`
      : '';

    // Aroma chips
    const aromas = Array.isArray(product.aroma) ? product.aroma.slice(0, 3) : (product.aroma ? [product.aroma] : []);
    const aromasHtml = aromas.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">${aromas.map(a => `<span style="font-size:8px;color:rgba(251,243,224,0.35);background:rgba(251,243,224,0.05);border:1px solid rgba(251,243,224,0.07);padding:2px 7px;border-radius:20px;">${a}</span>`).join('')}</div>`
      : `<div style="height:22px;margin-bottom:10px;"></div>`;

    // Botón
    const buttonHtml = isOutOfStock
      ? `<button style="width:100%;padding:9px;border-radius:8px;font-size:11px;font-weight:600;color:rgba(251,243,224,0.25);background:rgba(251,243,224,0.04);border:1px solid rgba(251,243,224,0.06);cursor:not-allowed;">Agotado</button>`
      : `<button class="open-modal-btn" data-product-id="${product.id}"
           style="width:100%;padding:9px;border-radius:8px;font-size:11px;font-weight:600;color:#53161d;background:#fbf3e0;border:none;cursor:pointer;transition:opacity 0.2s;letter-spacing:0.04em;"
           onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">
           Agregar →
         </button>`;

    // Warm candlelight accent on card left edge (only for gift items)
    const giftAccent = isGift
      ? `<div style="position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,transparent,rgba(232,168,124,0.4),transparent);border-radius:16px 0 0 16px;"></div>`
      : '';

    container.insertAdjacentHTML('beforeend', `
      <div class="catalog-card-clickable catalog-product-card"
           style="position:relative;background:#130508;border-radius:16px;overflow:hidden;border:1px solid rgba(251,243,224,0.06);cursor:pointer;transition:transform 0.3s ease,box-shadow 0.3s ease,border-color 0.3s ease;"
           data-product-id="${product.id}"
           data-glow-color="${glowColor}"
           ${isOutOfStock ? 'style="opacity:0.55;"' : ''}>
        <div class="card-shine" style="position:absolute;inset:0;border-radius:16px;pointer-events:none;z-index:5;opacity:0;"></div>
        ${giftAccent}
        <div style="position:relative;overflow:hidden;">
          ${ribbonHtml}
          ${badgeHtml}
          <img src="${imgMd}"
               srcset="${imgSm} 400w, ${imgMd} 700w, ${imgLg} 900w"
               sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
               alt="${product.name}"
               loading="lazy" width="400" height="400"
               class="w-full aspect-[3/4] object-cover"
               style="filter:saturate(0.88);transition:transform 0.5s ease,filter 0.3s ease;"
               onerror="this.src='https://placehold.co/400x400/130508/fbf3e0?text=Vela'">
          <!-- Luz de llama: warm glow desde abajo al hover -->
          <div class="card-flame-glow" style="position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(to top,rgba(180,70,10,0.18),transparent);opacity:0;transition:opacity 0.4s ease;pointer-events:none;"></div>
        </div>
        <div style="padding:12px 14px;">
          <a href="/catalogo/${slugify(product.name)}" class="link-route" style="display:block;font-family:'DM Serif Display',serif;font-size:15px;color:#fbf3e0;margin-bottom:4px;line-height:1.2;text-decoration:none;">${product.name}</a>
          <div class="card-ratings" style="min-height:16px;margin-bottom:6px;"></div>
          ${aromasHtml}
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="font-size:15px;color:#e8a87c;font-weight:500;">
              ${isOnSale
                ? `<span style="font-size:11px;color:rgba(251,243,224,0.3);text-decoration:line-through;margin-right:6px;">${originalPrice}</span>${salePrice}`
                : originalPrice}
            </div>
          </div>
          <div style="margin-top:10px;">${buttonHtml}</div>
        </div>
      </div>
    `);
  });

  // Event listeners
  container.querySelectorAll('.catalog-card-clickable').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('a')) return;
      const product = products.find(p => p.id === card.dataset.productId);
      if (product && product.stock > 0) openModal(product);
    });
  });
  container.querySelectorAll('.open-modal-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const product = products.find(p => p.id === btn.dataset.productId);
      if (product) openModal(product);
    });
  });

  initTiltEffect();
  animateNewCards();

  // Restaurar posición de scroll (evita el salto al top al reemplazar skeletons)
  if (savedScroll > 0) window.scrollTo({ top: savedScroll, behavior: 'instant' });
}

// ============================================================
// CARGA DE PRODUCTOS DESDE FIREBASE
// ============================================================
async function loadProducts(retryCount = 0) {
  const container = document.getElementById('product-list');
  if (!container) return;

  const cached = getCachedProducts();
  if (cached) {
    setAllProducts(cached);
    renderProducts(cached);
    const { ratingsMap } = await fetchAndApplyRatings();
    injectProductSchemas(cached, ratingsMap);
    return;
  }

  renderSkeletons();

  try {
    const app = getApp();
    const db = getFirestore(app);
    const snapshot = await withTimeout(getDocs(collection(db, 'products')));
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      imageUrls: doc.data().imageUrls || doc.data().images || [],
      is_new: doc.data().is_new || false,
      stock: doc.data().stock || 0,
    }));

    setAllProducts(products);
    setCachedProducts(products);
    renderProducts(products);
    const { ratingsMap } = await fetchAndApplyRatings();
    injectProductSchemas(products, ratingsMap);

  } catch (error) {
    if ((error.code === 'app/no-app' || error.message?.includes('No Firebase App')) && retryCount < MAX_RETRIES) {
      setTimeout(() => loadProducts(retryCount + 1), BASE_DELAY_MS * Math.pow(2, retryCount));
      return;
    }
    console.error('Error cargando catálogo:', error);
    container.innerHTML = `<div class="col-span-full text-center p-10 text-red-600">Error al cargar productos. Intenta de nuevo.</div>`;
  }
}


// ============================================================
// RENDER DE LA PÁGINA
// ============================================================
export const renderCatalogPage = () => `
<style id="catalog-styles">
@keyframes cat-skeleton-pulse { 0%,100%{opacity:0.5} 50%{opacity:0.85} }
/* Override app-content para tema oscuro */
#app-content { max-width:none !important; padding:0 !important; margin:0 !important; background:#0a0203 !important; }
/* Luz de llama: hover en cards */
.catalog-product-card:hover {
  transform: translateY(-8px) !important;
  border-color: rgba(232,168,124,0.2) !important;
  box-shadow: 0 20px 56px rgba(83,22,29,0.55), 0 0 32px rgba(180,70,10,0.12) !important;
}
.catalog-product-card:hover .card-flame-glow { opacity: 1 !important; }
.catalog-product-card:hover img { filter: saturate(1) !important; }
/* Chips */
#catalog-chips { scrollbar-width:none; -ms-overflow-style:none; }
#catalog-chips::-webkit-scrollbar { display:none; }
#catalog-chips-wrapper {
  position:sticky; top:56px; z-index:30;
  background:rgba(10,2,3,0.94); backdrop-filter:blur(16px);
  padding:12px 16px; border-bottom:1px solid rgba(251,243,224,0.06);
}
@media(min-width:768px){ #catalog-chips-wrapper { top:81px; padding:12px 48px; } }
/* Grid */
#product-list { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:20px 16px 32px; max-width:1400px; margin:0 auto; }
@media(min-width:768px){ #product-list { grid-template-columns:repeat(3,1fr); gap:16px; padding:24px 32px 48px; } }
@media(min-width:1280px){ #product-list { grid-template-columns:repeat(4,1fr); padding:24px 48px 48px; } }
</style>

<div style="background:#0a0203;min-height:100vh;">

  <!-- ── HEADER CINEMÁTICO ── -->
  <div style="position:relative;overflow:hidden;padding:clamp(40px,6vw,72px) clamp(16px,5vw,48px) clamp(28px,4vw,44px);">
    <!-- Candlelight orb top-right -->
    <div style="position:absolute;top:-100px;right:-80px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(200,90,15,0.09) 0%,transparent 65%);filter:blur(50px);pointer-events:none;"></div>
    <div style="position:absolute;top:0;right:140px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(83,22,29,0.2) 0%,transparent 65%);filter:blur(40px);pointer-events:none;"></div>
    <!-- Warm top line -->
    <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.25),transparent);"></div>

    <div style="position:relative;z-index:1;">
      <p style="font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(251,243,224,0.28);margin-bottom:16px;display:flex;align-items:center;gap:10px;">
        <span style="display:inline-block;width:28px;height:1px;background:rgba(232,168,124,0.4);"></span>Colección completa · Glowie
      </p>
      <h1 style="font-family:'DM Serif Display',serif;font-size:clamp(52px,9vw,96px);line-height:0.9;color:#fbf3e0;margin-bottom:18px;">
        Nuestra<br><em style="color:#e8a87c;font-style:italic;">Colección</em>
      </h1>
      <p style="font-size:14px;color:rgba(251,243,224,0.38);line-height:1.7;max-width:420px;margin-bottom:28px;">
        Velas de cera de soja 100% natural, hechas a mano en Cali.<br>Cada pieza diseñada para transformar tu espacio.
      </p>
      <a href="#product-list"
         onclick="event.preventDefault();document.getElementById('product-list').scrollIntoView({behavior:'smooth'});"
         style="display:inline-flex;align-items:center;gap:10px;background:#fbf3e0;color:#53161d;padding:13px 24px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;text-decoration:none;transition:opacity 0.2s;"
         onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">
        Ver productos
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </a>
    </div>
  </div>

  <!-- ── TRUST STRIP — tarjetas individuales 1×4 ── -->
  <div id="trust-strip" style="padding:clamp(16px,3vw,24px) clamp(16px,5vw,48px);overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;">
    <style>#trust-strip::-webkit-scrollbar{display:none;}</style>
    <div style="display:flex;gap:12px;min-width:max-content;">
      ${[
        { icon: '🌿', title: 'Cera de Soja 100%', sub: 'Natural · Sin parafina' },
        { icon: '🤲', title: 'Hecho a Mano', sub: 'Artesanal desde Cali' },
        { icon: '✨', title: 'Aromas Premium', sub: 'Fragancias duraderas' },
        { icon: '🚚', title: 'Envío Gratis', sub: 'En Cali desde $60.000' },
      ].map(item => `
        <div class="trust-item" style="flex:1;min-width:180px;background:#130508;border:1px solid rgba(251,243,224,0.07);border-radius:16px;padding:20px 18px;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.25),transparent);"></div>
          <span style="font-size:22px;flex-shrink:0;filter:drop-shadow(0 0 6px rgba(232,168,124,0.25));">${item.icon}</span>
          <div>
            <div style="font-size:12px;font-weight:700;color:#fbf3e0;margin-bottom:2px;">${item.title}</div>
            <div style="font-size:10px;color:rgba(251,243,224,0.32);">${item.sub}</div>
          </div>
        </div>`).join('')}
    </div>
  </div>

  <!-- ── BANNER DÍA DE LA MADRE + COUNTDOWN ── -->
  <div style="padding:24px clamp(16px,5vw,48px) 0;">
    <div style="background:linear-gradient(135deg,#2d0a10 0%,#1a0508 55%,#200c05 100%);border-radius:20px;overflow:hidden;border:1px solid rgba(232,168,124,0.18);position:relative;box-shadow:0 0 40px rgba(139,26,42,0.12),inset 0 1px 0 rgba(232,168,124,0.08);">
      <div style="position:absolute;right:-10px;top:50%;transform:translateY(-50%);font-size:110px;opacity:0.05;pointer-events:none;user-select:none;">🌹</div>
      <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(to bottom,transparent,#e8a87c,transparent);"></div>

      <!-- Top: info + botón -->
      <div style="display:flex;align-items:center;gap:clamp(12px,2vw,20px);flex-wrap:wrap;padding:clamp(16px,3vw,22px) clamp(18px,3vw,28px);border-bottom:1px solid rgba(251,243,224,0.06);">
        <div style="font-size:clamp(26px,4vw,34px);flex-shrink:0;filter:drop-shadow(0 0 8px rgba(232,168,124,0.35));">🌹</div>
        <div style="flex:1;min-width:160px;">
          <div style="font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:#e8a87c;margin-bottom:4px;">Día de la Madre · 10 de Mayo 2026</div>
          <div style="font-family:'DM Serif Display',serif;font-size:clamp(20px,2.5vw,25px);color:#fbf3e0;margin-bottom:2px;">El regalo que no olvidará</div>
          <div style="font-size:10px;color:rgba(251,243,224,0.35);">Velas · Pebeteros · Kits — Hechos con amor en Cali</div>
        </div>
        <button id="mama-chip-btn" style="flex-shrink:0;background:rgba(232,168,124,0.1);border:1px solid rgba(232,168,124,0.35);color:#e8a87c;padding:10px 18px;border-radius:10px;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:all 0.2s;">
          Ver regalos →
        </button>
      </div>

      <!-- Countdown -->
      <div id="cat-mothers-countdown" style="display:flex;gap:0;">
        ${['days','hours','mins','secs'].map((id, i) => `
          <div style="flex:1;padding:12px 8px;display:flex;flex-direction:column;align-items:center;gap:3px;border-right:${i<3?'1px solid rgba(251,243,224,0.06)':'none'};">
            <span id="cmd-${id}" style="font-family:'DM Serif Display',serif;font-size:clamp(20px,3.5vw,32px);color:#e8a87c;line-height:1;">00</span>
            <span style="font-size:7px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(251,243,224,0.25);">${['Días','Horas','Min','Seg'][i]}</span>
          </div>`).join('')}
      </div>
    </div>
  </div>

  <!-- ── CHIPS + BUSCADOR ── -->
  <div id="catalog-chips-wrapper">
    <div id="catalog-chips" style="display:flex;gap:8px;overflow-x:auto;">
      <button data-chip="todas"       class="cat-chip" style="flex-shrink:0;padding:7px 16px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(251,243,224,0.3);background:rgba(251,243,224,0.12);color:#fbf3e0;cursor:pointer;white-space:nowrap;transition:all 0.2s;">Todas</button>
      <button data-chip="mama"        class="cat-chip" style="flex-shrink:0;padding:7px 16px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(232,168,124,0.35);background:rgba(139,26,42,0.25);color:#e8a87c;cursor:pointer;white-space:nowrap;transition:all 0.2s;">🌹 Para mamá</button>
      <button data-chip="velas"       class="cat-chip" style="flex-shrink:0;padding:7px 16px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(251,243,224,0.08);background:rgba(251,243,224,0.04);color:rgba(251,243,224,0.45);cursor:pointer;white-space:nowrap;transition:all 0.2s;">Velas</button>
      <button data-chip="bases"       class="cat-chip" style="flex-shrink:0;padding:7px 16px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(251,243,224,0.08);background:rgba(251,243,224,0.04);color:rgba(251,243,224,0.45);cursor:pointer;white-space:nowrap;transition:all 0.2s;">Bases</button>
      <button data-chip="waxmelts"    class="cat-chip" style="flex-shrink:0;padding:7px 16px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(251,243,224,0.08);background:rgba(251,243,224,0.04);color:rgba(251,243,224,0.45);cursor:pointer;white-space:nowrap;transition:all 0.2s;">Waxmelts</button>
      <button data-chip="ofertas"     class="cat-chip" style="flex-shrink:0;padding:7px 16px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(251,243,224,0.08);background:rgba(251,243,224,0.04);color:rgba(251,243,224,0.45);cursor:pointer;white-space:nowrap;transition:all 0.2s;">En oferta</button>
      <button data-chip="disponibles" class="cat-chip" style="flex-shrink:0;padding:7px 16px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(251,243,224,0.08);background:rgba(251,243,224,0.04);color:rgba(251,243,224,0.45);cursor:pointer;white-space:nowrap;transition:all 0.2s;">Disponibles</button>
    </div>
    <div style="margin-top:10px;position:relative;max-width:480px;">
      <input type="text" id="aroma-filter"
             placeholder="Busca por aroma: coco, vainilla, bambú..."
             style="width:100%;padding:9px 16px 9px 36px;border-radius:20px;border:1px solid rgba(251,243,224,0.1);background:rgba(251,243,224,0.05);color:#fbf3e0;font-size:12px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.2s;"
             onfocus="this.style.borderColor='rgba(232,168,124,0.4)'"
             onblur="this.style.borderColor='rgba(251,243,224,0.1)'" />
      <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;opacity:0.3;pointer-events:none;">🔍</span>
    </div>
  </div>

  <!-- ── PRODUCT GRID ── -->
  <div id="product-list">
    <div style="grid-column:1/-1;text-align:center;padding:40px;color:rgba(251,243,224,0.25);">Cargando productos...</div>
  </div>

  <!-- ── CTA PERSONALIZACIÓN ── -->
  <div style="padding:0 clamp(16px,4vw,48px) 48px;">
    <div style="border-radius:24px;overflow:hidden;position:relative;background:linear-gradient(135deg,#1a0508 0%,#0d0305 50%,#160608 100%);border:1px solid rgba(83,22,29,0.3);">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(83,22,29,0.3) 0%,transparent 60%);pointer-events:none;"></div>
      <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.3),transparent);"></div>
      <div style="position:relative;z-index:1;padding:clamp(32px,5vw,56px) clamp(20px,5vw,48px);text-align:center;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:rgba(232,168,124,0.08);border:1px solid rgba(232,168,124,0.2);margin-bottom:18px;font-size:20px;filter:drop-shadow(0 0 10px rgba(232,168,124,0.25));">💬</div>
        <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(22px,4vw,36px);color:#fbf3e0;margin-bottom:8px;">¿Velas para <em style="color:#e8a87c;font-style:italic;">eventos</em>?</h2>
        <p style="font-size:13px;color:rgba(251,243,224,0.38);max-width:400px;margin:0 auto 22px;line-height:1.7;">Personalizamos para bodas, baby showers y regalos corporativos. Cuéntanos tu idea.</p>
        <a href="https://wa.me/573017748623?text=%C2%A1Hola%21%20Vi%20la%20secci%C3%B3n%20de%20velas%20para%20eventos%20y%20me%20encantar%C3%ADa%20personalizar%20unas%20piezas%20para%20una%20fecha%20especial.%20%C2%BFQu%C3%A9%20opciones%20de%20dise%C3%B1o%20manejan%3F" target="_blank"
           onclick="if(typeof gtag==='function')gtag('event','whatsapp_click',{event_category:'catalog',event_label:'eventos_personalizados'});if(typeof fbq==='function')fbq('track','Contact');"
           style="display:inline-flex;align-items:center;gap:10px;background:#fbf3e0;color:#53161d;padding:13px 26px;border-radius:8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;transition:opacity 0.2s;box-shadow:0 8px 24px rgba(251,243,224,0.1);"
           onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">
          💬 Escribir por WhatsApp
        </a>
        <p style="font-size:10px;color:rgba(251,243,224,0.18);margin-top:14px;font-style:italic;">Respondemos en menos de 24 horas.</p>
      </div>
    </div>
  </div>

</div>
`;

// ============================================================
// INICIALIZACIÓN
// ============================================================
export const initializeCatalogListeners = async () => {
  await loadProducts();

  // Restaurar filtros desde la URL al cargar la página
  const filters = getQueryParams();
  if (filters.aroma || filters.categoria) {
    applyFiltersFromUrl(filters);
  }

  // Chips de categoría — tema oscuro
  function updateChipStyles(activeChip) {
    document.querySelectorAll('.cat-chip').forEach(c => {
      const isActive = c === activeChip;
      const isMama = c.dataset.chip === 'mama';
      if (isActive && isMama) {
        c.style.background = 'rgba(139,26,42,0.55)';
        c.style.borderColor = 'rgba(232,168,124,0.55)';
        c.style.color = '#e8a87c';
      } else if (isActive) {
        c.style.background = 'rgba(251,243,224,0.14)';
        c.style.borderColor = 'rgba(251,243,224,0.35)';
        c.style.color = '#fbf3e0';
      } else if (isMama) {
        c.style.background = 'rgba(139,26,42,0.25)';
        c.style.borderColor = 'rgba(232,168,124,0.35)';
        c.style.color = '#e8a87c';
      } else {
        c.style.background = 'rgba(251,243,224,0.04)';
        c.style.borderColor = 'rgba(251,243,224,0.08)';
        c.style.color = 'rgba(251,243,224,0.45)';
      }
    });
  }

  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeChipFilter = chip.dataset.chip;
      updateChipStyles(chip);
      const aromaInput = document.getElementById('aroma-filter');
      if (aromaInput) aromaInput.value = '';
      filterByAromaAndCategory();
    });
  });

  // Countdown Día de la Madre
  (function initCatCountdown() {
    const target = new Date('2026-05-10T23:59:59');
    const els = {
      days:  document.getElementById('cmd-days'),
      hours: document.getElementById('cmd-hours'),
      mins:  document.getElementById('cmd-mins'),
      secs:  document.getElementById('cmd-secs'),
    };
    if (!els.days) return;
    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) { Object.values(els).forEach(el => { if (el) el.textContent = '00'; }); return; }
      if (els.days)  els.days.textContent  = pad(Math.floor(diff / 86400000));
      if (els.hours) els.hours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
      if (els.mins)  els.mins.textContent  = pad(Math.floor((diff % 3600000) / 60000));
      if (els.secs)  els.secs.textContent  = pad(Math.floor((diff % 60000) / 1000));
    }
    tick();
    setInterval(tick, 1000);
  })();

  // Botón del banner Día de la Madre → activa chip "mama"
  document.getElementById('mama-chip-btn')?.addEventListener('click', () => {
    const mamaChip = document.querySelector('.cat-chip[data-chip="mama"]');
    if (mamaChip) {
      activeChipFilter = 'mama';
      updateChipStyles(mamaChip);
      document.getElementById('aroma-filter').value = '';
      filterByAromaAndCategory();
      document.getElementById('catalog-chips-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Buscador de aroma (texto)
  const debouncedFilterByAroma = debounce(filterByAroma, 300);
  document.getElementById('aroma-filter')?.addEventListener('input', debouncedFilterByAroma);

  // Add listener for categoria filter (dropdown)
  document.getElementById('categoria-filter')?.addEventListener('change', filterByAroma);

  // Track scroll depth in catalog
  const scrollDepthThresholds = { 25: false, 50: false, 75: false, 100: false };
  window.addEventListener('scroll', () => {
    const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

    [25, 50, 75, 100].forEach(threshold => {
      if (scrollPercentage >= threshold && !scrollDepthThresholds[threshold]) {
        scrollDepthThresholds[threshold] = true;
        if (typeof gtag === 'function') {
          gtag('event', 'scroll_depth', {
            depth: `${threshold}%`,
            event_category: 'engagement'
          });
        }
      }
    });
  });
};
