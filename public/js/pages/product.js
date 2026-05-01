/**
 * js/pages/product.js
 * Página de producto individual — /catalogo/:slug
 * Carga el producto desde cache o Firebase, renderiza inline con variantes + add-to-cart.
 */

import { formatPriceCOP, addToCart } from '../cart.js';
import { getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { renderReviewsSection } from '../reviews.js';

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

export function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
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
  } catch { /* Safari privado o cuota llena */ }
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

export function renderProductPage() {
  return `
    <style>
      .pd-chip {
        padding: 9px 16px; border-radius: 9999px;
        border: 2px solid #e5e7eb;
        font-size: 13px; font-weight: 600;
        background: white; color: #374151;
        cursor: pointer; transition: all 0.15s ease;
        white-space: nowrap; line-height: 1.2;
        -webkit-tap-highlight-color: transparent;
      }
      .pd-chip.selected {
        border-color: var(--color-cinna);
        background: var(--color-cinna); color: white;
        box-shadow: 0 2px 8px rgba(83,22,29,0.25);
      }
      .pd-chip.oos {
        opacity: 0.35; cursor: not-allowed;
        text-decoration: line-through;
      }
      .pd-chip:not(.oos):not(.selected):hover {
        border-color: var(--color-cinna); color: var(--color-cinna);
      }
    </style>
    <div id="product-detail-container">
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

let pageProduct = null;
let selectedPdAroma = '';
let selectedPdCombId = '';

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
    <div class="mb-5">
      <p class="text-xs font-bold uppercase tracking-wider mb-2.5" style="color: var(--color-cinna);">Elige tu aroma</p>
      <div id="pd-aroma-chips" class="flex flex-wrap gap-2"></div>
    </div>` : '';

  const combSelector = hasCombinaciones ? `
    <div id="pd-comb-group" class="${hasAromas ? 'hidden' : ''} mb-5">
      <p class="text-xs font-bold uppercase tracking-wider mb-2.5" style="color: var(--color-cinna);">Elige el diseño / base</p>
      <div id="pd-combinacion-chips" class="flex flex-wrap gap-2"></div>
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
    <nav class="text-sm text-gray-500 mb-8 flex items-center gap-2 flex-wrap">
      <a href="/catalogo" class="link-route hover:underline" style="color: var(--color-cinna);">Catálogo</a>
      <span>/</span>
      <span class="text-gray-800 font-medium">${pageProduct.name}</span>
    </nav>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 mb-16">
      <div>
        <div class="rounded-3xl overflow-hidden shadow-lg border border-gray-100 p-4 mb-4" style="background: var(--color-casi-blanco);">
          <img id="pd-main-image"
               src="${getOptimizedImageUrl(mainImage, 600)}"
               alt="${pageProduct.name}"
               class="w-full h-72 md:h-[420px] object-contain transition-opacity duration-300"
               onerror="this.src='https://placehold.co/600x500/fbf3e0/2e2e2e?text=Vela'">
        </div>
        ${thumbnailsHtml}
      </div>

      <div class="flex flex-col">
        <div class="flex items-start gap-3 mb-2 flex-wrap">
          ${pageProduct.is_new ? `<span class="px-3 py-1 text-xs font-extrabold rounded-full" style="background: linear-gradient(135deg,#FFD700,#FFA500); color: #000;">NEW</span>` : ''}
          ${isOnSale ? `<span class="px-3 py-1 text-xs font-extrabold rounded-full text-white" style="background: var(--color-cinna);">OFERTA</span>` : ''}
        </div>

        <h1 class="text-3xl md:text-4xl font-extrabold mb-3 leading-tight" style="color: #1a1a1a;">${pageProduct.name}</h1>
        <div class="mb-4">${displayPrice}</div>

        ${ceraInfo ? `<div class="mb-4">${ceraInfo}</div>` : ''}

        <p class="text-gray-600 text-sm leading-relaxed mb-6">${pageProduct.description || ''}</p>

        ${aromaSelector}
        ${combSelector}

        <p id="pd-stock-info" class="text-xs font-medium mb-4 hidden"></p>
        <p id="pd-error" class="text-xs font-medium text-red-500 mb-2 hidden">Por favor selecciona todas las opciones.</p>

        <button id="pd-add-cart"
                class="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style="background-color: var(--color-cinna);"
                ${pageProduct.stock <= 0 && !hasCombinaciones ? 'disabled' : ''}>
          ${pageProduct.stock <= 0 && !hasCombinaciones ? 'Agotado' : 'Añadir al Carrito'}
        </button>
        <p id="pd-success" class="text-center text-green-600 font-bold mt-3 hidden text-sm">¡Añadido al carrito! 🎉</p>

        <a href="https://wa.me/573017748623?text=Hola!%20Me%20interesa%20${encodeURIComponent(pageProduct.name)}"
           target="_blank"
           class="mt-3 w-full py-3 rounded-2xl font-bold text-center flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 text-sm"
           style="background: #25D366; color: white;">
          <i class="fab fa-whatsapp text-base"></i>
          Consultar por WhatsApp
        </a>

        <div class="mt-8 pt-6 border-t border-gray-100 space-y-2 text-xs text-gray-500">
          <div class="flex items-center gap-2"><i class="fas fa-seedling text-sm" style="color: var(--color-gris-crema);"></i> Cera de soja 100% natural</div>
          <div class="flex items-center gap-2"><i class="fas fa-hands text-sm" style="color: var(--color-gris-crema);"></i> Hecha a mano en Cali</div>
          <div class="flex items-center gap-2"><i class="fas fa-truck text-sm" style="color: var(--color-gris-crema);"></i> Envío gratis en Cali desde $60.000</div>
        </div>
      </div>
    </div>

    <div id="pd-reviews-section" class="mb-16"></div>

    <div class="mb-10">
      <h2 class="text-2xl font-extrabold mb-6" style="color: var(--color-cinna);">También te puede gustar</h2>
      <div id="pd-related" class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="col-span-full h-32 rounded-2xl animate-pulse" style="background: var(--color-fondo);"></div>
      </div>
    </div>
  `;

  document.getElementById('product-skeleton').classList.add('hidden');
  document.getElementById('product-detail').classList.remove('hidden');

  initProductVariantLogic();
}

function initProductVariantLogic() {
  const hasAromas = Array.isArray(pageProduct.aroma) && pageProduct.aroma.length > 0;
  const hasCombinaciones = pageProduct.combinaciones.length > 0;
  const combGroup = document.getElementById('pd-comb-group');
  const stockInfo = document.getElementById('pd-stock-info');
  const addBtn = document.getElementById('pd-add-cart');
  const errorMsg = document.getElementById('pd-error');
  const successMsg = document.getElementById('pd-success');

  selectedPdAroma = '';
  selectedPdCombId = '';

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
      if (qty <= 3) {
        stockInfo.textContent = `¡Solo quedan ${qty}!`;
        stockInfo.className = 'text-xs font-semibold mb-4 text-amber-600';
      } else {
        stockInfo.textContent = `En stock (${qty} disponibles)`;
        stockInfo.className = 'text-xs font-semibold mb-4 text-green-600';
      }
      addBtn.textContent = 'Añadir al Carrito';
    } else {
      stockInfo.textContent = msg || 'Sin stock para esta selección.';
      stockInfo.className = 'text-xs font-semibold mb-4 text-red-500';
      addBtn.textContent = msg || 'Sin stock';
      addBtn.disabled = true;
    }
  }

  function renderAromaChips() {
    const container = document.getElementById('pd-aroma-chips');
    container.innerHTML = '';
    pageProduct.aroma.forEach(a => {
      const hasStock = pageProduct.combinaciones.some(c => (pageProduct.stock_variations[`${c.id}-${a}`] ?? 0) > 0);
      const btn = document.createElement('button');
      btn.type = 'button';
      if (hasStock) {
        btn.className = 'pd-chip';
        btn.onclick = () => {
          selectedPdAroma = a;
          container.querySelectorAll('.pd-chip').forEach(c => c.classList.remove('selected'));
          btn.classList.add('selected');
          updateDesignsFromAroma();
        };
      } else {
        btn.className = 'pd-chip oos';
        btn.disabled = true;
        btn.title = 'Sin stock actualmente';
      }
      btn.textContent = a;
      container.appendChild(btn);
    });
  }

  function updateDesignsFromAroma() {
    const available = pageProduct.combinaciones.filter(c => (pageProduct.stock_variations[`${c.id}-${selectedPdAroma}`] ?? 0) > 0);
    combGroup?.classList.remove('hidden');
    selectedPdCombId = '';
    addBtn.disabled = true;

    if (available.length === 0) {
      const container = document.getElementById('pd-combinacion-chips');
      container.innerHTML = '<span class="text-sm text-gray-400 italic">Sin stock para este aroma.</span>';
      setStock(false, 0);
      return;
    }

    renderDesignChips(available);

    if (available.length === 1) {
      const comb = available[0];
      selectedPdCombId = comb.id;
      const chip = document.querySelector('#pd-combinacion-chips .pd-chip');
      if (chip) chip.classList.add('selected');
      updateMainImageByComb(comb);
      setStock(true, pageProduct.stock_variations[`${comb.id}-${selectedPdAroma}`]);
      addBtn.disabled = false;
    }
  }

  function renderDesignChips(available) {
    const container = document.getElementById('pd-combinacion-chips');
    container.innerHTML = '';

    if (!available.length) {
      container.innerHTML = '<span class="text-sm text-gray-400 italic">Sin stock disponible.</span>';
      addBtn.disabled = true;
      return;
    }

    available.forEach(comb => {
      const btn = document.createElement('button');
      btn.className = 'pd-chip';
      btn.textContent = comb.label;
      btn.type = 'button';
      btn.onclick = () => {
        selectedPdCombId = comb.id;
        container.querySelectorAll('.pd-chip').forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
        updateMainImageByComb(comb);
        const key = hasAromas ? `${comb.id}-${selectedPdAroma}` : comb.id;
        const stock = pageProduct.stock_variations[key] ?? 0;
        setStock(stock > 0, stock);
        addBtn.disabled = stock <= 0;
      };
      container.appendChild(btn);
    });

    if (available.length === 1) {
      const comb = available[0];
      selectedPdCombId = comb.id;
      container.querySelector('.pd-chip').classList.add('selected');
      updateMainImageByComb(comb);
      const key = hasAromas ? `${comb.id}-${selectedPdAroma}` : comb.id;
      const stock = pageProduct.stock_variations[key] ?? 0;
      setStock(stock > 0, stock);
      addBtn.disabled = stock <= 0;
    }
  }

  if (hasAromas) {
    addBtn.disabled = true;
    renderAromaChips();
  } else if (pageProduct.combinaciones.length > 0) {
    const available = pageProduct.combinaciones.filter(c => (pageProduct.stock_variations[c.id] ?? 0) > 0);
    combGroup?.classList.remove('hidden');
    renderDesignChips(available);
  } else {
    setStock(pageProduct.stock > 0, pageProduct.stock);
  }

  addBtn.addEventListener('click', () => {
    errorMsg.classList.add('hidden');
    const aroma = hasAromas ? selectedPdAroma : 'N/A';
    const combId = selectedPdCombId;

    if ((hasAromas && !aroma) || (hasCombinaciones && !combId)) {
      errorMsg.classList.remove('hidden');
      return;
    }

    const key = hasAromas ? `${combId}-${aroma}` : (hasCombinaciones ? combId : null);
    const stock = key ? pageProduct.stock_variations[key] : pageProduct.stock;
    if (!stock || stock <= 0) return;

    const comb = hasCombinaciones ? pageProduct.combinaciones.find(c => c.id === combId) : null;
    const price = pageProduct.on_sale ? pageProduct.on_sale_price : pageProduct.price;

    addToCart({
      id: `${pageProduct.id}-${(key || pageProduct.id).replace(/ /g, '')}`,
      productId: pageProduct.id,
      name: pageProduct.name,
      price,
      image: document.getElementById('pd-main-image').src,
      quantity: 1,
      variation: { aroma: aroma === 'N/A' ? null : aroma, diseño: comb?.label }
    });

    if (key) pageProduct.stock_variations[key]--;
    else pageProduct.stock--;

    successMsg.classList.remove('hidden');
    setTimeout(() => {
      const container = document.getElementById('product-detail-container');
      if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  });

  // Reviews
  (async () => {
    try {
      await renderReviewsSection(pageProduct.id, '#pd-reviews-section');
    } catch (e) {
      console.warn('Reviews failed:', e);
    }
  })();
}

export const initializeProductListeners = async () => {
  // obtener slug de la URL
  const path = window.location.pathname;
  const slug = path.split('/').pop();

  let products = getCachedProducts();
  if (!products) {
    try {
      products = await fetchAllProducts();
      setCachedProducts(products);
    } catch (e) {
      console.error('No products:', e);
      document.getElementById('product-detail').innerHTML = '<p class="text-red-600">Error cargando producto.</p>';
      return;
    }
  }

  const product = products.find(p => slugify(p.name) === slug);
  if (!product) {
    document.getElementById('product-detail').innerHTML = '<p class="text-red-600">Producto no encontrado.</p>';
    return;
  }

  renderProductDetail(product);
};
