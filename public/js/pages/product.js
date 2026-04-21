/**
 * js/pages/product.js
 * Página de producto individual — /catalogo/:slug
 * Carga el producto desde cache o Firebase, renderiza inline con variantes + add-to-cart.
 */

import { formatPriceCOP, addToCart } from '../cart.js';
import { getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { renderReviewsSection, getProductReviews, getAverageRating } from '../reviews.js';

const CACHE_KEY = 'glowie_products_v1';
const CACHE_TTL = 30 * 60 * 1000;
const MAX_RETRIES = 10;
const BASE_DELAY_MS = 80;
const FIREBASE_TIMEOUT_MS = 10000;


function withTimeout(promise, ms = FIREBASE_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), ms)),
  ]);
}

// Genera slug URL-amigable desde nombre de producto
export function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getOptimizedImageUrl(url, width = 400) {
  if (!url || !url.includes('cloudinary')) return url;
  if (url.includes('/f_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_80,w_${width}/`);
}

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
  } catch { /* Safari privado o cuota llena — no crítico */ }
}

async function fetchAllProducts(retryCount = 0) {
  try {
    const app = getApp();
    const db = getFirestore(app);
    const snapshot = await withTimeout(getDocs(collection(db, 'products')));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      imageUrls: doc.data().imageUrls || doc.data().images || [],
      is_new: doc.data().is_new || false,
      stock: doc.data().stock || 0,
    }));
  } catch (e) {
    if ((e.code === 'app/no-app' || e.message?.includes('No Firebase App')) && retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
      await new Promise(r => setTimeout(r, delay));
      return fetchAllProducts(retryCount + 1);
    }
    throw e;
  }
}

// --- HTML del skeleton de carga ---
export function renderProductPage() {
  return `
    <div id="product-detail-container">
      <!-- Skeleton mientras carga -->
      <div id="product-skeleton" class="animate-pulse">
        <div class="h-5 w-48 rounded-full mb-8" style="background: var(--color-gris-crema); opacity: 0.3;"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div class="w-full h-96 rounded-3xl" style="background: var(--color-fondo);"></div>
          <div class="space-y-4 pt-4">
            <div class="h-8 w-3/4 rounded-full" style="background: var(--color-fondo);"></div>
            <div class="h-6 w-1/3 rounded-full" style="background: var(--color-fondo);"></div>
            <div class="h-4 w-full rounded-full" style="background: var(--color-fondo);"></div>
            <div class="h-4 w-full rounded-full" style="background: var(--color-fondo);"></div>
            <div class="h-4 w-2/3 rounded-full" style="background: var(--color-fondo);"></div>
          </div>
        </div>
      </div>
      <div id="product-detail" class="hidden"></div>
    </div>
  `;
}

// --- Estado local del producto en la página ---
let pageProduct = null;

function renderProductDetail(product) {
  pageProduct = {
    ...product,
    images: product.images || product.imageUrls || [],
    combinaciones: product.combinaciones || [],
    stock_variations: product.stock_variations || {},
  };

  const images = pageProduct.images;
  const mainImage = images[0] || 'https://placehold.co/600x500/fbf3e0/2e2e2e?text=Vela';

  const isOnSale = pageProduct.on_sale === true && pageProduct.on_sale_price < pageProduct.price;
  const displayPrice = isOnSale
    ? `<span class="text-3xl font-black" style="color: var(--color-cinna);">${formatPriceCOP(pageProduct.on_sale_price)}</span>
       <span class="text-lg text-gray-400 line-through ml-2">${formatPriceCOP(pageProduct.price)}</span>`
    : `<span class="text-3xl font-black" style="color: var(--color-cinna);">${formatPriceCOP(pageProduct.price)}</span>`;

  const hasAromas = Array.isArray(pageProduct.aroma) && pageProduct.aroma.length > 0;
  const hasCombinaciones = pageProduct.combinaciones.length > 0;

  const aromaSelector = hasAromas ? `
    <div class="mb-4">
      <label class="block text-xs font-bold uppercase tracking-wider mb-2" style="color: var(--color-cinna);">Aroma</label>
      <select id="pd-aroma" class="w-full p-3 text-sm border-2 rounded-xl appearance-none focus:outline-none transition-colors"
              style="border-color: var(--color-fondo);"
              onfocus="this.style.borderColor='var(--color-cinna)'"
              onblur="this.style.borderColor='var(--color-fondo)'">
        <option value="">Selecciona un aroma...</option>
        ${pageProduct.aroma.map(a => `<option value="${a}">${a}</option>`).join('')}
      </select>
    </div>` : '';

  const combSelector = hasCombinaciones ? `
    <div id="pd-comb-group" class="${hasAromas ? 'hidden' : ''} mb-4">
      <label class="block text-xs font-bold uppercase tracking-wider mb-2" style="color: var(--color-cinna);">Diseño / Base</label>
      <select id="pd-combinacion" class="w-full p-3 text-sm border-2 rounded-xl appearance-none focus:outline-none transition-colors"
              style="border-color: var(--color-fondo);"
              onfocus="this.style.borderColor='var(--color-cinna)'"
              onblur="this.style.borderColor='var(--color-fondo)'">
        <option value="">Selecciona un diseño...</option>
      </select>
    </div>` : '';

  const thumbnailsHtml = images.length > 1 ? `
    <div id="pd-thumbnails" class="flex flex-row gap-2 flex-wrap mt-3">
      ${images.map((img, i) => `
        <img src="${getOptimizedImageUrl(img, 120)}"
             alt=""
             data-full="${img}"
             class="pd-thumb w-16 h-16 object-contain rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${i === 0 ? 'border-amber-500' : 'border-gray-200'}"
             style="background: var(--color-casi-blanco);">
      `).join('')}
    </div>` : '';

  const ceraInfo = pageProduct.cantidad_cera > 0
    ? `<div class="flex items-center gap-2 text-sm text-gray-600">
         <i class="fas fa-weight-hanging" style="color: var(--color-gris-crema);"></i>
         <span>Contiene <strong>${pageProduct.cantidad_cera} g</strong> de cera de soya</span>
       </div>` : '';

  const container = document.getElementById('product-detail');
  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="text-sm text-gray-500 mb-8 flex items-center gap-2 flex-wrap">
      <a href="/catalogo" class="link-route hover:underline" style="color: var(--color-cinna);">Catálogo</a>
      <span>/</span>
      <span class="text-gray-800 font-medium">${pageProduct.name}</span>
    </nav>

    <!-- Grid principal -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 mb-16">
      <!-- Galería -->
      <div>
        <div class="rounded-3xl overflow-hidden shadow-lg border border-gray-100 p-4 mb-4"
             style="background: var(--color-casi-blanco);">
          <img id="pd-main-image"
               src="${getOptimizedImageUrl(mainImage, 600)}"
               alt="${pageProduct.name}"
               class="w-full h-72 md:h-[420px] object-contain transition-opacity duration-300"
               onerror="this.src='https://placehold.co/600x500/fbf3e0/2e2e2e?text=Vela'">
        </div>
        ${thumbnailsHtml}
      </div>

      <!-- Info + Variantes -->
      <div class="flex flex-col">
        <div class="flex items-start gap-3 mb-2 flex-wrap">
          ${pageProduct.is_new ? `<span class="px-3 py-1 text-xs font-extrabold rounded-full" style="background: linear-gradient(135deg,#FFD700,#FFA500); color: #000;">NEW</span>` : ''}
          ${isOnSale ? `<span class="px-3 py-1 text-xs font-extrabold rounded-full text-white" style="background: var(--color-cinna);">OFERTA</span>` : ''}
        </div>

        <h1 class="text-3xl md:text-4xl font-extrabold mb-3 leading-tight" style="color: #1a1a1a;">${pageProduct.name}</h1>
        <div class="mb-4">${displayPrice}</div>

        ${ceraInfo ? `<div class="mb-4">${ceraInfo}</div>` : ''}

        <p class="text-gray-600 text-sm leading-relaxed mb-6">${pageProduct.description || ''}</p>

        <!-- Selectores de variante -->
        ${aromaSelector}
        ${combSelector}

        <!-- Estado y stock -->
        <p id="pd-stock-info" class="text-xs font-medium mb-4 hidden"></p>
        <p id="pd-error" class="text-xs font-medium text-red-500 mb-2 hidden">Por favor selecciona todas las opciones.</p>

        <!-- Botón -->
        <button id="pd-add-cart"
                class="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style="background-color: var(--color-cinna);"
                ${pageProduct.stock <= 0 && !hasCombinaciones ? 'disabled' : ''}>
          ${pageProduct.stock <= 0 && !hasCombinaciones ? 'Agotado' : 'Añadir al Carrito'}
        </button>
        <p id="pd-success" class="text-center text-green-600 font-bold mt-3 hidden text-sm">¡Añadido al carrito!</p>

        <!-- WhatsApp directo -->
        <a href="https://wa.me/573017748623?text=Hola!%20Me%20interesa%20${encodeURIComponent(pageProduct.name)}"
           target="_blank"
           class="mt-3 w-full py-3 rounded-2xl font-bold text-center flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 text-sm"
           style="background: #25D366; color: white;">
          <i class="fab fa-whatsapp text-base"></i>
          Consultar por WhatsApp
        </a>

        <!-- Specs -->
        <div class="mt-8 pt-6 border-t border-gray-100 space-y-2 text-xs text-gray-500">
          <div class="flex items-center gap-2"><i class="fas fa-seedling text-sm" style="color: var(--color-gris-crema);"></i> Cera de soja 100% natural</div>
          <div class="flex items-center gap-2"><i class="fas fa-hands text-sm" style="color: var(--color-gris-crema);"></i> Hecha a mano en Cali</div>
          <div class="flex items-center gap-2"><i class="fas fa-truck text-sm" style="color: var(--color-gris-crema);"></i> Envío gratis en Cali desde $60.000</div>
        </div>
      </div>
    </div>

    <!-- Sección de reseñas (placeholder para Feature 3) -->
    <div id="pd-reviews-section" class="mb-16">
      <!-- Las reseñas se inyectarán aquí por reviews.js -->
    </div>

    <!-- También te puede gustar -->
    <div class="mb-10">
      <h2 class="text-2xl font-extrabold mb-6" style="color: var(--color-cinna);">También te puede gustar</h2>
      <div id="pd-related" class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="col-span-full h-32 rounded-2xl animate-pulse" style="background: var(--color-fondo);"></div>
      </div>
    </div>
  `;

  // Activar skeleton → mostrar detail
  document.getElementById('product-skeleton').classList.add('hidden');
  document.getElementById('product-detail').classList.remove('hidden');

  // Inicializar lógica de variantes
  initProductVariantLogic();
}

function initProductVariantLogic() {
  const hasAromas = Array.isArray(pageProduct.aroma) && pageProduct.aroma.length > 0;
  const aromaSelect = document.getElementById('pd-aroma');
  const combSelect = document.getElementById('pd-combinacion');
  const combGroup = document.getElementById('pd-comb-group');
  const stockInfo = document.getElementById('pd-stock-info');
  const addBtn = document.getElementById('pd-add-cart');
  const errorMsg = document.getElementById('pd-error');
  const successMsg = document.getElementById('pd-success');

  function updateMainImageByComb(comb) {
    if (!comb?.image) return;
    const match = pageProduct.images.find(url => url.includes(comb.image));
    if (match) {
      const mainImg = document.getElementById('pd-main-image');
      if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = getOptimizedImageUrl(match, 600);
          mainImg.style.opacity = '1';
        }, 150);
      }
    }
  }

  // Thumbnails
  document.querySelectorAll('.pd-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.getElementById('pd-main-image').src = getOptimizedImageUrl(thumb.dataset.full, 600);
      document.querySelectorAll('.pd-thumb').forEach(t => t.className = t.className.replace('border-amber-500', 'border-gray-200'));
      thumb.className = thumb.className.replace('border-gray-200', 'border-amber-500');
    });
  });

  function setStock(hasStock, qty = 0, msg = '') {
    stockInfo.classList.remove('hidden');
    addBtn.disabled = !hasStock;
    if (hasStock && qty > 0) {
      stockInfo.textContent = `¡En stock! Quedan ${qty} unidades.`;
      stockInfo.className = 'text-xs font-medium mb-4 text-green-600';
      addBtn.textContent = 'Añadir al Carrito';
    } else {
      stockInfo.textContent = msg || 'Sin stock para esta selección.';
      stockInfo.className = 'text-xs font-medium mb-4 text-red-500';
      addBtn.textContent = msg || 'Sin stock';
      addBtn.disabled = true;
    }
  }

  function populateDesigns(availableCombinations) {
    combSelect.innerHTML = '';
    if (availableCombinations.length === 0) {
      combSelect.innerHTML = '<option value="">Sin stock</option>';
      combSelect.disabled = true;
      return;
    }
    combSelect.disabled = false;
    if (availableCombinations.length > 1) {
      combSelect.innerHTML = '<option value="">Selecciona un diseño...</option>';
    }
    availableCombinations.forEach(comb => {
      const opt = document.createElement('option');
      opt.value = comb.id;
      opt.textContent = comb.label;
      combSelect.appendChild(opt);
    });
    // Si solo hay uno, preseleccionar
    if (availableCombinations.length === 1) {
      combSelect.value = availableCombinations[0].id;
      const key = hasAromas
        ? `${availableCombinations[0].id}-${aromaSelect.value}`
        : availableCombinations[0].id;
      setStock(true, pageProduct.stock_variations[key] || 0);
      updateMainImageByComb(availableCombinations[0]);
    }
  }

  if (hasAromas) {
    addBtn.disabled = true;
    aromaSelect.addEventListener('change', () => {
      const aroma = aromaSelect.value;
      if (!aroma) { combGroup.classList.add('hidden'); addBtn.disabled = true; return; }
      const available = pageProduct.combinaciones.filter(c => (pageProduct.stock_variations[`${c.id}-${aroma}`] || 0) > 0);
      combGroup.classList.remove('hidden');
      populateDesigns(available);
      if (combSelect.value) {
        const key = `${combSelect.value}-${aroma}`;
        setStock(true, pageProduct.stock_variations[key] || 0);
      } else {
        addBtn.disabled = true;
      }
    });
    combSelect.addEventListener('change', () => {
      const aroma = aromaSelect.value;
      const combId = combSelect.value;
      if (!combId) return;
      setStock(true, pageProduct.stock_variations[`${combId}-${aroma}`] || 0);
      const comb = pageProduct.combinaciones.find(c => c.id === combId);
      updateMainImageByComb(comb);
    });
  } else if (pageProduct.combinaciones.length > 0) {
    // Solo diseños, sin aromas
    const available = pageProduct.combinaciones.filter(c => (pageProduct.stock_variations[c.id] || 0) > 0);
    combGroup.classList.remove('hidden');
    populateDesigns(available);
    addBtn.disabled = !combSelect.value;
    combSelect.addEventListener('change', () => {
      if (!combSelect.value) { addBtn.disabled = true; return; }
      setStock(true, pageProduct.stock_variations[combSelect.value] || 0);
      const comb = pageProduct.combinaciones.find(c => c.id === combSelect.value);
      updateMainImageByComb(comb);
    });
  } else {
    // Sin variantes
    setStock(pageProduct.stock > 0, pageProduct.stock);
  }

  // Add to cart
  addBtn.addEventListener('click', () => {
    errorMsg.classList.add('hidden');
    const hasAromas = Array.isArray(pageProduct.aroma) && pageProduct.aroma.length > 0;
    const hasComb = pageProduct.combinaciones.length > 0;
    const aroma = aromaSelect?.value;
    const combId = combSelect?.value;

    if ((hasAromas && !aroma) || (hasComb && !combId)) {
      errorMsg.classList.remove('hidden');
      return;
    }

    const key = hasAromas ? `${combId}-${aroma}` : (hasComb ? combId : null);
    const stock = key ? pageProduct.stock_variations[key] : pageProduct.stock;
    if (!stock || stock <= 0) return;

    const comb = hasComb ? pageProduct.combinaciones.find(c => c.id === combId) : null;
    const price = pageProduct.on_sale ? pageProduct.on_sale_price : pageProduct.price;

    addToCart({
      id: `${pageProduct.id}-${(key || pageProduct.id).replace(/ /g, '')}`,
      productId: pageProduct.id,
      name: pageProduct.name,
      price,
      image: document.getElementById('pd-main-image').src,
      quantity: 1,
      variation: {
        aroma: aroma || null,
        diseño: comb?.label || null,
      }
    });

    successMsg.classList.remove('hidden');
    setTimeout(() => successMsg.classList.add('hidden'), 2500);
  });
}

function renderRelated(allProducts, currentId) {
  const container = document.getElementById('pd-related');
  if (!container) return;
  const others = allProducts.filter(p => p.id !== currentId && p.stock > 0);
  const picks = others.sort(() => 0.5 - Math.random()).slice(0, 3);
  if (picks.length === 0) { container.parentElement.classList.add('hidden'); return; }

  container.innerHTML = picks.map(p => {
    const imgs = p.imageUrls || p.images || [];
    const img = getOptimizedImageUrl(imgs[0] || '', 300);
    const price = p.on_sale && p.on_sale_price < p.price ? formatPriceCOP(p.on_sale_price) : formatPriceCOP(p.price);
    const slug = slugify(p.name);
    return `
      <a href="/catalogo/${slug}" class="link-route block rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200"
         style="background: var(--color-casi-blanco);">
        <img src="${img}" alt="${p.name}" class="w-full h-40 object-contain p-4" style="background: var(--color-fondo);"
             onerror="this.src='https://placehold.co/300x240/fbf3e0/2e2e2e?text=Vela'">
        <div class="p-4">
          <p class="font-semibold text-gray-800 text-sm line-clamp-1">${p.name}</p>
          <p class="text-sm font-bold mt-1" style="color: var(--color-cinna);">${price}</p>
        </div>
      </a>`;
  }).join('');
}

function injectProductPageSchema(product, rating = null) {
  document.querySelectorAll('script[data-glowie-schema="product-page"]').forEach(el => el.remove());
  const images = product.images || product.imageUrls || [];
  const isOnSale = product.on_sale === true && product.on_sale_price < product.price;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || 'Vela artesanal de cera de soja natural, hecha a mano en Cali, Colombia.',
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
    ...(rating && rating.count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(rating.avg),
        reviewCount: String(rating.count),
        bestRating: '5',
        worstRating: '1',
      }
    } : {}),
  };
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.setAttribute('data-glowie-schema', 'product-page');
  s.textContent = JSON.stringify(schema);
  document.head.appendChild(s);
}

// --- INICIALIZADOR PRINCIPAL ---
export async function initializeProductListeners() {
  // Extraer slug de la URL actual
  const pathParts = window.location.pathname.split('/');
  const slug = pathParts[pathParts.length - 1];
  if (!slug) { window.navigate('/catalogo'); return; }

  // Buscar en cache primero
  let products = getCachedProducts();

  if (!products) {
    try {
      products = await fetchAllProducts();
      setCachedProducts(products);
    } catch (e) {
      console.error('Error cargando producto:', e);
      const skeleton = document.getElementById('product-skeleton');
      if (skeleton) skeleton.innerHTML = `
        <div class="text-center py-20">
          <p class="text-lg text-gray-400 mb-4">No se pudo cargar el producto.</p>
          <a href="/catalogo" class="link-route font-bold" style="color: var(--color-cinna);">← Volver al catálogo</a>
        </div>`;
      return;
    }
  }

  // Encontrar producto: primero por slug de nombre, luego por ID
  const product = products.find(p => slugify(p.name) === slug) || products.find(p => p.id === slug);

  if (!product) {
    document.getElementById('product-detail-container').innerHTML = `
      <div class="flex flex-col items-center justify-center text-center py-24 px-4">
        <div class="w-24 h-24 rounded-full flex items-center justify-center mb-6"
             style="background: var(--color-fondo);">
          <i class="fas fa-search text-4xl" style="color: var(--color-cinna); opacity: 0.35;"></i>
        </div>
        <h1 class="text-3xl font-extrabold mb-2" style="color: var(--color-cinna);">Producto no encontrado</h1>
        <p class="text-gray-500 text-sm mb-8 max-w-sm">
          Es posible que este producto ya no esté disponible o que la URL sea incorrecta.
        </p>
        <a href="/catalogo" class="link-route px-8 py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90"
           style="background: var(--color-cinna);">
          Ver catálogo completo
        </a>
      </div>`;
    return;
  }

  // Actualizar meta de la página dinámicamente
  const productImages = product.images || product.imageUrls || [];
  const isOnSale = product.on_sale === true && product.on_sale_price < product.price;
  const displayPriceText = isOnSale ? `${formatPriceCOP(product.on_sale_price)}` : `${formatPriceCOP(product.price)}`;
  document.title = `${product.name} | Glowie — Velas Artesanales Cali`;
  document.querySelector('meta[name="description"]')?.setAttribute('content',
    `${product.name} — ${product.description || 'Vela artesanal de cera de soja natural, hecha a mano en Cali'}. Precio: ${displayPriceText}. Envío gratis en Cali desde $60.000.`
  );
  if (productImages[0]) {
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', productImages[0]);
    document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', productImages[0]);
  }
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${product.name} | Glowie`);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://velasglowie.com/catalogo/${slug}`);

  // Inyectar breadcrumb específico del producto
  const existingBc = document.querySelector('script[data-glowie-schema="breadcrumb"]');
  if (existingBc) existingBc.remove();
  const bc = document.createElement('script');
  bc.type = 'application/ld+json';
  bc.setAttribute('data-glowie-schema', 'breadcrumb');
  bc.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://velasglowie.com' },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: 'https://velasglowie.com/catalogo' },
      { '@type': 'ListItem', position: 3, name: product.name, item: `https://velasglowie.com/catalogo/${slug}` },
    ],
  });
  document.head.appendChild(bc);

  // Schema.org Product
  injectProductPageSchema({ ...product, images: productImages });

  // Renderizar la página
  renderProductDetail(product);

  // Reseñas (async, no bloquea el render)
  renderReviewsSection(product.id, '#pd-reviews-section');
  // Actualizar schema con aggregateRating una vez cargadas las reseñas (caché en memoria — sin doble fetch)
  getProductReviews(product.id).then(reviews => {
    const { avg, count } = getAverageRating(reviews);
    if (count > 0) injectProductPageSchema({ ...product, images: productImages }, { avg, count });
  });

  // Productos relacionados
  renderRelated(products, product.id);
}
