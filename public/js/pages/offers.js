/**
 * js/pages/offers.js
 * Página de Ofertas Exclusivas
 * - Cache localStorage 30 min
 * - Skeleton loading
 * - Imágenes Cloudinary optimizadas con srcset
 * - Abre modal para selección de variación (sin add-to-cart directo)
 * - Schema.org CollectionPage + ItemList
 */

import { formatPriceCOP } from '../cart.js';
import { openModal } from './modal.js';
import { db, collection, query, where, getDocs } from '../firebase.js';

// --- GLOW POR COLOR ---
const CEMENTO_COLOR_MAP = {
  'amarillo': 'rgba(230,170,20,0.38)',  'rojo':     'rgba(180,35,35,0.38)',
  'blanco':   'rgba(220,215,200,0.32)', 'natural':  'rgba(195,165,110,0.35)',
  'azul':     'rgba(40,90,200,0.32)',   'verde':    'rgba(40,140,75,0.32)',
  'negro':    'rgba(20,20,20,0.45)',    'gris':     'rgba(110,110,110,0.32)',
  'naranja':  'rgba(215,95,25,0.38)',   'morado':   'rgba(100,30,150,0.35)',
};
function getGlowColor(product) {
  for (const comb of (product.combinaciones || [])) {
    const key = (comb.cemento || comb.label || '').toLowerCase();
    for (const [k, v] of Object.entries(CEMENTO_COLOR_MAP)) {
      if (key.includes(k)) return v;
    }
  }
  return 'rgba(83,22,29,0.32)';
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

function initTiltEffect() {
  if (isTouchDevice() || prefersReducedMotion()) return;
  document.querySelectorAll('.offer-card-clickable[data-glow-color]').forEach(card => {
    const glowColor = card.dataset.glowColor;
    const shine = card.querySelector('.card-shine');
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const cx = rect.width / 2, cy = rect.height / 2;
      card.style.transform = `perspective(900px) rotateX(${((y - cy) / cy) * -9}deg) rotateY(${((x - cx) / cx) * 9}deg) scale3d(1.035,1.035,1.035)`;
      card.style.boxShadow = `0 24px 60px -8px ${glowColor}, 0 0 28px -4px ${glowColor}`;
      card.style.zIndex = '10';
      if (shine) {
        shine.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255,255,255,0.13) 0%, transparent 65%)`;
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

function initOffersAnimations() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || prefersReducedMotion()) return;
  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  gsap.fromTo('.offers-hero-title',  { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.1 });
  gsap.fromTo('.offers-hero-sub',    { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.3 });
  gsap.fromTo('.offers-hero-badges', { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.45 });
}

function animateOfferCards() {
  const gsap = window.gsap;
  if (!gsap || prefersReducedMotion()) return;
  gsap.fromTo('.offer-product-card',
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out', clearProps: 'opacity,transform' }
  );
}

// --- CACHÉ ---
const CACHE_KEY = 'glowie_offers_v1';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

function getCachedOffers() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    console.log('✅ Usando ofertas desde caché local');
    return data;
  } catch {
    return null;
  }
}

function setCachedOffers(products) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: products, timestamp: Date.now() }));
  } catch {
    // localStorage bloqueado (Safari privado, cuota llena) — no es crítico
  }
}

// --- IMÁGENES CLOUDINARY ---
function getOptimizedImageUrl(url, width = 400) {
  if (!url || !url.includes('cloudinary')) return url;
  if (url.includes('/f_auto')) return url; // ya tiene transformaciones, no duplicar
  return url.replace('/upload/', `/upload/f_auto,q_80,w_${width}/`);
}

// --- SCHEMA.ORG ---
function injectOffersSchema(products) {
  // Limpiar solo el schema de ofertas anterior — no tocar breadcrumb ni otros
  document.querySelectorAll('script[data-glowie-schema="offers"]').forEach(el => el.remove());

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Ofertas Exclusivas - Velas Glowie',
    description: 'Ofertas especiales en velas artesanales de cera de soja natural, hechas a mano en Cali',
    url: 'https://velasglowie.com/ofertas',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 12).map((p, i) => {
        const images = Array.isArray(p.imageUrls) ? p.imageUrls : p.images || [];
        const isOnSale = p.on_sale === true && p.on_sale_price < p.price;
        const finalPrice = isOnSale ? p.on_sale_price : p.price;
        return {
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: p.name,
            description: p.description || 'Vela artesanal de cera de soja natural',
            image: images,
            brand: { '@type': 'Brand', name: 'Glowie' },
            offers: {
              '@type': 'Offer',
              price: String(finalPrice),
              priceCurrency: 'COP',
              availability: p.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              url: `https://velasglowie.com/ofertas#${p.id}`,
              priceValidUntil: '2027-12-31',
              itemCondition: 'https://schema.org/NewCondition',
              seller: {
                '@type': 'Organization',
                name: 'Glowie',
                '@id': 'https://velasglowie.com/#organization'
              }
            },
          },
        };
      }),
    },
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-glowie-schema', 'offers');
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

// --- SKELETON LOADING ---
function renderSkeletons() {
  const container = document.getElementById('offers-list');
  if (!container) return;
  container.innerHTML = Array.from({ length: 4 }, () => `
    <div class="shadow-xl rounded-2xl p-4 animate-pulse" style="background-color: var(--color-cinna);">
      <div class="w-full h-48 rounded-xl mb-4 bg-white opacity-20"></div>
      <div class="h-5 rounded-full mb-2 w-3/4 mx-auto bg-white opacity-20"></div>
      <div class="h-4 rounded-full mb-1 w-full bg-white opacity-20"></div>
      <div class="h-4 rounded-full mb-4 w-2/3 mx-auto bg-white opacity-20"></div>
      <div class="h-9 rounded-xl w-full bg-white opacity-15"></div>
    </div>
  `).join('');
}

// --- RENDER DE TARJETAS ---
function renderOfferCards(products) {
  const container = document.getElementById('offers-list');
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <p class="col-span-full text-center text-gray-500 py-10">
        No hay ofertas activas en este momento. Vuelve pronto para nuevas promociones.
      </p>`;
    return;
  }

  container.innerHTML = '';

  products.forEach(product => {
    const isOnSale = product.on_sale === true && product.on_sale_price < product.price;
    const stock = product.stock || 0;
    const isOutOfStock = stock === 0;

    const originalPrice = formatPriceCOP(product.price);
    const salePrice = formatPriceCOP(product.on_sale_price || product.price);
    const discountPercent = isOnSale
      ? Math.round(((product.price - product.on_sale_price) / product.price) * 100)
      : 0;

    const images = Array.isArray(product.imageUrls) ? product.imageUrls : product.images || [];
    const mainImage = images[0] || 'https://placehold.co/400x300/fbf3e0/2e2e2e?text=Vela';
    const imgSm = getOptimizedImageUrl(mainImage, 250);
    const imgMd = getOptimizedImageUrl(mainImage, 400);
    const imgLg = getOptimizedImageUrl(mainImage, 600);

    // === ETIQUETAS ===
    let tagsHtml = '';
    if (isOutOfStock) {
      tagsHtml = `
        <span class="absolute top-3 right-3 px-5 py-2 text-sm font-extrabold text-white rounded-full shadow-lg z-30"
              style="background-color: #ef4444;">
          AGOTADO
        </span>`;
    } else if (discountPercent > 0) {
      tagsHtml = `
        <span class="absolute top-3 right-3 px-3 py-1 text-sm font-extrabold text-black rounded-full shadow-md z-30"
              style="background-color: var(--color-fondo);">
          -${discountPercent}% OFF
        </span>`;
    }

    // === BOTÓN ===
    const buttonHtml = isOutOfStock
      ? `<button class="w-full px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-200 cursor-not-allowed" disabled>
           Agotado
         </button>`
      : `<button class="open-offer-modal-btn w-full px-4 py-2 rounded-xl font-medium transition duration-200 z-20"
               data-product-id="${product.id}"
               style="background-color: var(--color-fondo); color: var(--color-cinna);"
               onmouseover="this.style.backgroundColor='var(--color-gris-crema)'"
               onmouseout="this.style.backgroundColor='var(--color-fondo)'">
           Ver Detalles
         </button>`;

    // === PRECIOS ===
    const pricesHtml = isOnSale
      ? `<span class="text-sm text-white line-through mr-2">${originalPrice}</span>
         <span class="font-extrabold text-2xl" style="color: var(--color-fondo);">${salePrice}</span>`
      : `<span class="text-2xl font-extrabold text-white">${originalPrice}</span>`;

    const glowColor = getGlowColor(product);

    const cardHTML = `
      <div class="offer-card-clickable offer-product-card shadow-xl rounded-2xl p-4 text-center border-2 border-transparent hover:shadow-2xl transition-all duration-300 relative overflow-hidden cursor-pointer"
           style="background-color: var(--color-cinna); transform-style: preserve-3d; will-change: transform;"
           data-product-id="${product.id}"
           data-glow-color="${glowColor}">
        <div class="card-shine absolute inset-0 rounded-2xl pointer-events-none z-[4]" style="opacity:0; transition: opacity 0.35s ease;"></div>
        ${tagsHtml}
        <img src="${imgMd}"
             srcset="${imgSm} 250w, ${imgMd} 400w, ${imgLg} 600w"
             sizes="(max-width: 640px) 250px, (max-width: 1024px) 400px, 600px"
             alt="${product.name}"
             loading="lazy"
             class="w-full h-48 object-cover rounded-xl mb-4 opacity-95 hover:opacity-100 transition-opacity relative z-10"
             onerror="this.src='https://placehold.co/400x300/fbf3e0/2e2e2e?text=Vela'">
        <h3 class="text-xl font-semibold text-white mb-1 line-clamp-1 relative z-10">${product.name}</h3>
        <p class="text-white text-sm mb-2 line-clamp-2 relative z-10" style="opacity: 0.85;">${product.description || ''}</p>
        <div class="mb-4 relative z-10">
          ${pricesHtml}
        </div>
        <div class="relative z-20">${buttonHtml}</div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHTML);
  });

  // === LISTENERS: clic en tarjeta ===
  container.querySelectorAll('.offer-card-clickable').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') return;
      const id = card.dataset.productId;
      const product = products.find(p => p.id === id);
      if (product && product.stock > 0) openModal(product);
    });
  });

  // === LISTENERS: botón "Ver Detalles" ===
  container.querySelectorAll('.open-offer-modal-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.productId;
      const product = products.find(p => p.id === id);
      if (product) openModal(product);
    });
  });
}

// --- PÁGINA HTML ---
export function renderOffersPage() {
  return `
    <!-- HERO CON URGENCIA -->
    <section class="relative overflow-hidden rounded-2xl mx-4 mt-8 mb-0 py-16 px-6 text-center"
             style="background-color: var(--color-cinna);">
      <!-- Círculos decorativos de fondo -->
      <div class="absolute top-0 left-0 w-full h-full pointer-events-none" aria-hidden="true">
        <div class="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white" style="opacity: 0.04;"></div>
        <div class="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-white" style="opacity: 0.04;"></div>
        <div class="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white" style="opacity: 0.04;"></div>
      </div>

      <!-- Badge -->
      <div class="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
           style="background-color: rgba(255,255,255,0.12); color: var(--color-fondo);">
        <i class="fas fa-tag text-xs"></i>
        Descuentos Exclusivos
      </div>

      <!-- H1 -->
      <h1 class="offers-hero-title relative text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-white">
        Ofertas Exclusivas
      </h1>

      <!-- Subtítulo -->
      <p class="offers-hero-sub relative text-base md:text-lg mb-8 max-w-xl mx-auto" style="color: rgba(239,223,187,0.85);">
        Velas artesanales a precios que no durarán. Stock real, sin restock garantizado.
      </p>

      <!-- Stat badges -->
      <div class="offers-hero-badges relative flex flex-wrap justify-center gap-3 mb-8">
        <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
              style="background-color: rgba(255,255,255,0.10); color: var(--color-fondo);">
          <i class="fas fa-bolt text-xs"></i> Stock Limitado
        </span>
        <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
              style="background-color: rgba(255,255,255,0.10); color: var(--color-fondo);">
          <i class="fas fa-check text-xs"></i> Calidad Intacta
        </span>
        <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
              style="background-color: rgba(255,255,255,0.10); color: var(--color-fondo);">
          <i class="fas fa-truck text-xs"></i> Envío Gratis Aplica
        </span>
      </div>

      <!-- CTA -->
      <a href="#offers-list"
         class="relative inline-block px-8 py-3 rounded-xl font-bold text-base transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 shadow-md"
         style="background-color: var(--color-fondo); color: var(--color-cinna);"
         onclick="event.preventDefault(); document.getElementById('offers-list').scrollIntoView({behavior:'smooth'})">
        Ver Todas las Ofertas
      </a>
    </section>

    <!-- TRUST STRIP -->
    <div class="py-10 px-4" style="background-color: var(--color-casi-blanco);">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">

        <div class="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
               style="background-color: var(--color-fondo);">
            <i class="fas fa-percent" style="color: var(--color-cinna);"></i>
          </div>
          <h3 class="text-sm font-bold mb-1" style="color: var(--color-cinna);">Descuentos Reales</h3>
          <p class="text-xs text-gray-500">Calculados sobre precio de lista</p>
        </div>

        <div class="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
               style="background-color: var(--color-fondo);">
            <i class="fas fa-boxes" style="color: var(--color-cinna);"></i>
          </div>
          <h3 class="text-sm font-bold mb-1" style="color: var(--color-cinna);">Stock Verificado</h3>
          <p class="text-xs text-gray-500">Solo ofertamos lo que tenemos</p>
        </div>

        <div class="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
               style="background-color: var(--color-fondo);">
            <i class="fas fa-star" style="color: var(--color-cinna);"></i>
          </div>
          <h3 class="text-sm font-bold mb-1" style="color: var(--color-cinna);">Calidad Intacta</h3>
          <p class="text-xs text-gray-500">Precio bajo, estándar Glowie igual</p>
        </div>

        <div class="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
               style="background-color: var(--color-fondo);">
            <i class="fas fa-truck" style="color: var(--color-cinna);"></i>
          </div>
          <h3 class="text-sm font-bold mb-1" style="color: var(--color-cinna);">Envío Gratis</h3>
          <p class="text-xs text-gray-500">Desde $60.000 en Cali</p>
        </div>

      </div>
    </div>

    <!-- GRID DE PRODUCTOS -->
    <section class="py-10">
      <div id="offers-list"
           class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
        <p class="col-span-full text-center text-gray-400">Cargando ofertas...</p>
      </div>
    </section>
  `;
}

// --- INICIALIZACIÓN ---
export async function initializeOffersListeners() {
  const container = document.getElementById('offers-list');
  if (!container) return;

  initOffersAnimations();

  // Intentar caché primero — evita round-trip a Firebase en visitas repetidas
  const cached = getCachedOffers();
  if (cached) {
    renderOfferCards(cached);
    injectOffersSchema(cached);
    initTiltEffect();
    animateOfferCards();
    return;
  }

  renderSkeletons();

  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('on_sale', '==', true));
    const querySnapshot = await getDocs(q);

    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      imageUrls: doc.data().imageUrls || doc.data().images || [],
      stock: doc.data().stock || 0,
    }));

    setCachedOffers(products);
    renderOfferCards(products);
    injectOffersSchema(products);
    initTiltEffect();
    animateOfferCards();

  } catch (error) {
    console.error('Error al cargar ofertas:', error);
    const c = document.getElementById('offers-list');
    if (c) {
      c.innerHTML = `
        <p class="col-span-full text-center text-red-600 py-10">
          Error al cargar las ofertas. Por favor, revisa tu conexión e intenta de nuevo.
        </p>`;
    }
  }
}
