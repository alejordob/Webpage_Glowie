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
  return url.replace('/upload/', `/upload/f_auto,q_80,w_${width}/`);
}

// ============================================================
// COLOR GLOW POR PRODUCTO
// ============================================================
const CEMENTO_COLOR_MAP = {
  'amarillo':  'rgba(230,170,20,0.38)',
  'rojo':      'rgba(180,35,35,0.38)',
  'blanco':    'rgba(220,215,200,0.32)',
  'natural':   'rgba(195,165,110,0.35)',
  'azul':      'rgba(40,90,200,0.32)',
  'verde':     'rgba(40,140,75,0.32)',
  'negro':     'rgba(20,20,20,0.45)',
  'gris':      'rgba(110,110,110,0.32)',
  'naranja':   'rgba(215,95,25,0.38)',
  'morado':    'rgba(100,30,150,0.35)',
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
    });
  });
}

// ============================================================
// SCROLL ANIMATIONS (GSAP)
// ============================================================
function initScrollAnimations() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;
  if (prefersReducedMotion()) return;

  gsap.registerPlugin(ScrollTrigger);

  // Hero — texto de entrada
  gsap.fromTo('.hero-eyebrow',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.1 }
  );
  gsap.fromTo('.hero-title',
    { opacity: 0, y: 35 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.25 }
  );
  gsap.fromTo('.hero-subtitle',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.45 }
  );
  gsap.fromTo('.hero-cta',
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)', delay: 0.6 }
  );

  // Trust strip — stagger al entrar en viewport
  gsap.fromTo('.trust-item',
    { opacity: 0, y: 28 },
    {
      opacity: 1, y: 0, duration: 0.55, stagger: 0.1, ease: 'power2.out',
      scrollTrigger: { trigger: '#trust-strip', start: 'top 82%', once: true },
    }
  );

  // Título sección catálogo
  gsap.fromTo('.catalog-section-title',
    { opacity: 0, y: 22 },
    {
      opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: '.catalog-section-title', start: 'top 85%', once: true },
    }
  );

  // Tarjetas: se animan desde animateNewCards() después de que existen en el DOM
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
    <div class="shadow-xl rounded-2xl p-4 animate-pulse" style="background-color: var(--color-cinna);">
      <div class="w-full h-64 rounded-xl mb-4 bg-white opacity-20"></div>
      <div class="h-5 rounded-full mb-2 w-3/4 mx-auto bg-white opacity-20"></div>
      <div class="h-4 rounded-full mb-1 w-full bg-white opacity-20"></div>
      <div class="h-4 rounded-full mb-4 w-2/3 mx-auto bg-white opacity-20"></div>
      <div class="h-9 rounded-xl w-full bg-white opacity-15"></div>
    </div>
  `).join('');
}

let allProducts = [];

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
  return function(...args) {
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

  // Filtrar por aroma
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

  container.innerHTML = '';

  products.forEach(product => {
    const isOnSale     = product.on_sale === true && product.on_sale_price < product.price;
    const isNew        = product.is_new === true;
    const stock        = product.stock || 0;
    const isOutOfStock = stock === 0;

    const originalPrice   = formatPriceCOP(product.price);
    const salePrice       = formatPriceCOP(product.on_sale_price || product.price);
    const discountPercent = isOnSale ? Math.round(((product.price - product.on_sale_price) / product.price) * 100) : 0;

    const images    = Array.isArray(product.imageUrls) ? product.imageUrls : product.images || [];
    const mainImage = images[0] || 'https://placehold.co/400x300/fbf3e0/2e2e2e?text=Vela';
    const imgSm     = getOptimizedImageUrl(mainImage, 250);
    const imgMd     = getOptimizedImageUrl(mainImage, 400);
    const imgLg     = getOptimizedImageUrl(mainImage, 600);
    const glowColor = getGlowColor(product);

    // Etiquetas
    let tagsHtml = '';
    if (isOutOfStock) {
      tagsHtml = `<span class="absolute top-3 right-3 px-5 py-2 text-sm font-extrabold text-white rounded-full shadow-lg z-30"
                        style="background-color: #ef4444;">AGOTADO</span>`;
    } else {
      if (isNew) {
        tagsHtml += `<span class="absolute top-3 right-3 px-4 py-1.5 text-xs font-extrabold text-black rounded-full shadow-lg z-30"
                           style="background: linear-gradient(135deg,#FFD700,#FFA500); border: 2px solid #B8860B;">NEW</span>`;
      }
      if (isOnSale && discountPercent > 0) {
        const topPos = isNew ? 'top-12' : 'top-3';
        tagsHtml += `<span class="absolute ${topPos} right-3 px-3 py-1 text-sm font-extrabold text-black rounded-full shadow-md z-30"
                           style="background-color: var(--color-fondo);">${discountPercent}% OFF</span>`;
      }
    }

    // Botón
    const buttonHtml = isOutOfStock
      ? `<button class="w-full px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-200 cursor-not-allowed">Agotado</button>`
      : `<button class="open-modal-btn w-full px-4 py-2 rounded-xl font-medium transition duration-200 z-20"
                 data-product-id="${product.id}"
                 style="background-color: var(--color-fondo); color: var(--color-cinna);"
                 onmouseover="this.style.backgroundColor='var(--color-gris-crema)'"
                 onmouseout="this.style.backgroundColor='var(--color-fondo)'">
           Ver Detalles
         </button>`;

    container.insertAdjacentHTML('beforeend', `
      <div class="catalog-card-clickable catalog-product-card shadow-xl rounded-2xl p-4 text-center border-2 border-transparent hover:shadow-2xl transition-all duration-300 relative overflow-hidden cursor-pointer"
           style="background-color: var(--color-cinna);"
           data-product-id="${product.id}"
           data-glow-color="${glowColor}">
        <div class="card-shine rounded-2xl"></div>
        ${tagsHtml}
        <img src="${imgMd}"
             srcset="${imgSm} 250w, ${imgMd} 400w, ${imgLg} 600w"
             sizes="(max-width: 640px) 250px, (max-width: 1024px) 400px, 600px"
             alt="${product.name}"
             loading="lazy"
             class="w-full h-64 object-contain rounded-xl mb-4 opacity-95 hover:opacity-100 transition-opacity relative z-10"
             onerror="this.src='https://placehold.co/400x300/fbf3e0/2e2e2e?text=Vela'">
        <a href="/catalogo/${slugify(product.name)}"
           class="link-route block text-xl font-semibold text-white mb-1 line-clamp-1 hover:underline relative z-10">${product.name}</a>
        <div class="card-ratings relative z-10 h-4 mb-1"></div>
        <p class="text-white text-sm mb-2 line-clamp-2 relative z-10">${product.description || ''}</p>
        <div class="mb-4 relative z-10">
          ${isOnSale
            ? `<span class="text-sm text-white line-through mr-2">${originalPrice}</span>
               <span class="font-extrabold text-2xl" style="color: var(--color-fondo);">${salePrice}</span>`
            : `<p class="text-2xl font-extrabold text-white">${originalPrice}</p>`}
        </div>
        <div class="relative z-20">${buttonHtml}</div>
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
    const db  = getFirestore(app);
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

  <!-- HERO BANNER -->
  <div class="relative w-full h-[62vh] min-h-[440px] bg-cover bg-center flex items-end justify-center overflow-hidden rounded-2xl shadow-2xl"
       style="background-image: url('img/hero4.jpg'); background-position: center top;">
    <div class="absolute inset-0" style="background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(83,22,29,0.88) 100%);"></div>
    <div class="relative z-10 text-center px-4 pb-12 max-w-3xl mx-auto w-full">
      <span class="hero-eyebrow inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style="background-color: rgba(239,223,187,0.18); color: var(--color-fondo); border: 1px solid rgba(239,223,187,0.35);">
        Hecho a mano en Cali &nbsp;·&nbsp; Cera de Soja Natural
      </span>
      <h2 class="hero-title text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-5 leading-tight drop-shadow-lg">
        Ilumina tu Espacio<br class="hidden sm:block"> con Esencia
      </h2>
      <p class="hero-subtitle text-base md:text-xl text-white/85 mb-8 hidden sm:block">
        Velas artesanales diseñadas para transformar momentos cotidianos en experiencias sensoriales únicas.
      </p>
      <a href="#product-list"
         onclick="event.preventDefault(); document.getElementById('product-list').scrollIntoView({behavior:'smooth'})"
         class="hero-cta inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
         style="background-color: var(--color-fondo); color: var(--color-cinna);">
        Ver Colección
        <i class="fas fa-arrow-down text-sm"></i>
      </a>
    </div>
  </div>

  <!-- TRUST STRIP -->
  <div id="trust-strip" class="py-10 px-4">
    <div class="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
      ${[
        { icon: 'fa-seedling', title: 'Cera de Soja 100% Natural',  sub: 'Sin parafina ni ingredientes tóxicos' },
        { icon: 'fa-hands',    title: 'Hechas a Mano en Cali',       sub: 'Producción artesanal con cariño local' },
        { icon: 'fa-wind',     title: 'Aromas Premium',              sub: 'Fragancias exclusivas y duraderas' },
        { icon: 'fa-truck',    title: 'Envío Gratis en Cali',        sub: 'En compras desde $60.000' },
      ].map(item => `
        <div class="trust-item flex flex-col items-center text-center gap-2 p-5 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div class="w-12 h-12 rounded-full flex items-center justify-center mb-1 flex-shrink-0" style="background-color: var(--color-fondo);">
            <i class="fas ${item.icon} text-lg" style="color: var(--color-cinna);"></i>
          </div>
          <h3 class="font-bold text-gray-800 text-sm leading-snug">${item.title}</h3>
          <p class="text-xs text-gray-500 leading-relaxed">${item.sub}</p>
        </div>`).join('')}
    </div>
  </div>

  <!-- CATÁLOGO -->
  <section class="pt-8 pb-16">
    <div class="catalog-section-title text-center max-w-3xl mx-auto mb-10 px-4">
      <p class="text-xs font-bold uppercase tracking-widest mb-3" style="color: var(--color-gris-crema);">Catálogo Completo</p>
      <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight" style="color: var(--color-cinna);">Nuestra Colección</h1>
      <div class="mx-auto w-20 h-1 rounded-full my-4" style="background-color: var(--color-fondo);"></div>
      <p class="text-base md:text-lg text-gray-500">Encuentra la fragancia perfecta para iluminar tu hogar y crear el ambiente ideal.</p>
    </div>

    <!-- Buscador -->
    <div class="max-w-xl mx-auto mb-10 px-4">
      <div class="relative">
        <input type="text" id="aroma-filter"
               placeholder="Busca por aroma: coco, vainilla, bambú, café..."
               class="w-full px-5 py-3.5 pl-12 rounded-full border-2 focus:outline-none text-base transition-all duration-300 shadow-sm"
               style="background-color: var(--color-fondo); border-color: transparent;"
               onfocus="this.style.borderColor='var(--color-cinna)'"
               onblur="this.style.borderColor='transparent'"/>
        <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-sm" style="color: var(--color-cinna); opacity: 0.45;"></i>
      </div>
    </div>

    <div id="product-list" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
      <div class="col-span-full text-center p-10 text-gray-400">Cargando productos...</div>
    </div>
  </section>

  <!-- CTA PERSONALIZACIÓN -->
  <section class="relative w-full py-20 px-4 mt-8 overflow-hidden" style="background-color: var(--color-cinna);">
    <div class="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[0.04] bg-white transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-[0.04] bg-white transform -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 shadow-lg" style="background-color: var(--color-fondo);">
        <i class="fab fa-whatsapp text-3xl" style="color: var(--color-cinna);"></i>
      </div>
      <h2 class="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">¿Velas personalizadas o para eventos?</h2>
      <p class="text-lg text-white/80 mb-8 max-w-xl mx-auto">Dale un toque único a tus celebraciones y regalos. Estamos listos para hacer tu idea realidad.</p>
      <a href="https://wa.me/3156265846?text=Hola,%20me%20gustaría%20información%20sobre%20velas%20personalizadas."
         target="_blank"
         class="inline-flex items-center gap-3 px-10 py-4 text-lg font-bold rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105"
         style="background-color: var(--color-fondo); color: var(--color-cinna);">
        <i class="fab fa-whatsapp text-xl"></i>
        Contáctanos aquí
      </a>
      <p class="text-sm mt-5" style="color: rgba(239,223,187,0.5);">Respondemos en menos de 24 horas.</p>
    </div>
  </section>
`;

// ============================================================
// INICIALIZACIÓN
// ============================================================
export const initializeCatalogListeners = async () => {
  initScrollAnimations();
  await loadProducts();

  // Restaurar filtros desde la URL al cargar la página
  const filters = getQueryParams();
  if (filters.aroma || filters.categoria) {
    applyFiltersFromUrl(filters);
  }

  // Adjuntar listeners para cambios futuros de filtros
  // Debounce aroma input (text field) to reduce overhead on each keystroke
  const debouncedFilterByAroma = debounce(filterByAroma, 300);
  document.getElementById('aroma-filter')?.addEventListener('input', debouncedFilterByAroma);

  // Add listener for categoria filter (dropdown)
  document.getElementById('categoria-filter')?.addEventListener('change', filterByAroma);
};
