/**
 * js/pages/modal.js
 * -------------------------------------------------------------
 * MODAL FINAL: AROMA PRIMERO + DISEÑO AUTOMÁTICO (FIXED STOCK)
 * -------------------------------------------------------------
 */

import { formatPriceCOP, addToCart } from '../cart.js';
import { renderReviewsSection } from '../reviews.js';

function optimizeThumb(url) {
  if (!url || !url.includes('cloudinary')) return url;
  if (url.includes('/f_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_80,w_120/');
}

// --- ESTRUCTURA DEL MODAL ---
const modal = document.createElement('div');
modal.id = 'product-modal';
modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[1002] hidden p-0 md:p-4 overflow-hidden';
modal.setAttribute('role', 'dialog');
modal.setAttribute('aria-modal', 'true');
modal.setAttribute('aria-labelledby', 'modal-name');

const buttonStyles = `
  #add-to-cart-modal {
    position: relative;
    overflow: hidden;
    background-color: var(--color-cinna);
    color: white;
    transition: all 0.3s ease-out;
  }
  #add-to-cart-modal .hover-bar {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 0;
    background-color: rgba(255, 255, 255, 0.2);
    transition: width 0.4s ease-out;
    z-index: 0;
    pointer-events: none;
    border-radius: 10px;
  }
  #add-to-cart-modal:hover .hover-bar { width: 100%; }
  #add-to-cart-modal > * { position: relative; z-index: 1; }
  body.modal-open { overflow: hidden !important; position: fixed; width: 100%; top: 0; }
  #close-modal { transition: all 0.3s ease-in-out; }
  #close-modal:hover { transform: rotate(180deg) scale(1.1); background-color: rgba(0,0,0,0.05) !important; }
  #modal-description { overflow: hidden; line-height: 1.5; transition: all 0.3s ease; }
  select {
    font-size: 16px;
    min-height: 44px;
  }
  select option:disabled { color: #9ca3af !important; font-style: italic; background-color: #f9fafb !important; }
  select:disabled { opacity: 0.7; cursor: not-allowed; background-color: #f3f4f6; }
  select.is-auto-selected:disabled {
    opacity: 1;
    cursor: default;
    background-color: var(--color-gris-crema);
    border-color: var(--color-cinna);
    font-weight: 600;
  }
`;

modal.innerHTML = `
  <style>${buttonStyles}</style>
  <div class="relative rounded-xl shadow-2xl w-full max-w-full h-[90vh] md:h-auto md:max-w-5xl transform transition-all duration-300 md:max-h-[95vh] overflow-hidden p-4 md:p-8"
       style="background-color: var(--color-casi-blanco);">

    <!-- Close Button -->
    <button id="close-modal" class="absolute top-4 right-4 text-xl font-black z-50 transition-all shadow-lg duration-300 rounded-full flex items-center justify-center w-9 h-9 cursor-pointer" style="color: var(--color-cinna); background-color: var(--color-gris-crema);">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>

    <!-- Mobile-First Single Scroll Container -->
    <div class="flex flex-col md:flex-row md:space-x-8 h-full">

      <!-- Left Column: Image + Thumbnails (Mobile: Full, Desktop: 1/2) -->
      <div id="modal-image-container" class="w-full md:w-1/2 flex flex-col items-center justify-start pt-0 md:pt-4">

        <!-- Image - Fullwidth on Mobile, Vertical on Desktop -->
        <img id="modal-image" src="" alt="Producto" class="w-full md:w-60 h-72 md:h-[420px] object-contain rounded-xl shadow-xl border-2 mb-4" style="border-color: var(--color-casi-blanco);">

        <!-- Thumbnails -->
        <div id="modal-thumbnails" class="hidden flex-row gap-2 justify-center flex-wrap w-full md:w-auto"></div>
      </div>

      <!-- Right Column: Content (Mobile: Full with scroll, Desktop: 1/2 with scroll) -->
      <div class="w-full md:w-1/2 relative pt-4 md:pt-0 flex flex-col overflow-y-auto">

        <!-- Product Info (scrolls up on mobile) -->
        <div class="flex-shrink-0">
          <h2 id="modal-name" class="text-2xl md:text-4xl font-extrabold mb-1 md:mb-2 text-gray-800"></h2>
          <p id="modal-price" class="text-xl md:text-3xl font-black mb-2 md:mb-6" style="color: var(--color-cinna);"></p>
          <p id="cera-info" class="text-sm text-gray-600 font-medium mb-3 italic hidden"></p>
          <div class="mb-4">
            <p id="modal-description" class="text-gray-600 text-xs md:text-sm line-clamp-2"></p>
            <button id="toggle-description" class="text-xs md:text-sm font-medium text-amber-600 mt-1">Ver más</button>
          </div>
        </div>

        <!-- Variations (selectors) -->
        <div class="space-y-4 mb-4 flex-grow">
          <div id="aroma-variation-group" class="hidden">
            <label class="block text-xs md:text-sm font-semibold mb-2" style="color: var(--color-cinna);">Aroma</label>
            <select id="aroma" class="w-full p-3 md:p-2 text-sm md:text-base border rounded-xl shadow-inner appearance-none" style="font-size: 16px;"></select>
          </div>
          <div id="combinacion-variation-group" class="hidden">
            <label class="block text-xs md:text-sm font-semibold mb-2" style="color: var(--color-cinna);">Diseño</label>
            <select id="combinacion" class="w-full p-3 md:p-2 text-sm md:text-base border rounded-xl shadow-inner appearance-none" style="font-size: 16px;"></select>
          </div>
          <p id="selection-status" class="mt-2 text-xs font-medium text-gray-500 hidden">Selecciona un aroma.</p>
          <p id="stock-info" class="mt-2 text-xs font-medium hidden"></p>
        </div>

        <!-- Add to Cart Button -->
        <div class="flex-shrink-0 pt-4 border-t" style="border-color: var(--color-gris-crema);">
          <button id="add-to-cart-modal" class="w-full py-3 md:py-2 mt-2 text-base md:text-sm rounded-xl font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
            <span class="hover-bar"></span> Añadir al Carrito
          </button>
          <div id="modal-success-message" class="mt-2 text-center text-green-600 font-bold hidden text-sm">¡Producto añadido al carrito!</div>
          <div id="modal-error-message" class="mt-2 text-center text-red-600 font-bold hidden text-sm">¡Selecciona un aroma!</div>
        </div>

        <!-- Reviews Section -->
        <div class="flex-shrink-0 mt-4">
          <button id="toggle-reviews-btn"
                  class="w-full py-2 text-xs md:text-sm font-semibold rounded-xl border transition-colors duration-200 flex items-center justify-between px-4"
                  style="border-color: var(--color-fondo); color: var(--color-cinna); background: transparent;">
            <span id="reviews-btn-label">Ver reseñas</span>
            <i id="reviews-chevron" class="fas fa-chevron-down text-xs transition-transform duration-200"></i>
          </button>
          <div id="modal-reviews-container" class="hidden mt-3 max-h-64 overflow-y-auto text-sm"></div>
        </div>
      </div>
    </div>
  </div>
`;
document.body.appendChild(modal);

// --- INTERSECTION OBSERVER FOR LAZY-LOADED THUMBNAILS ---
function initLazyLoadThumbnails() {
  const thumbnailImages = document.querySelectorAll('#modal-thumbnails img');
  if (thumbnailImages.length === 0) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '50px' });

    thumbnailImages.forEach(img => observer.observe(img));
  } else {
    // Fallback: load all immediately on older browsers
    thumbnailImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });
  }
}

// Escape cierra el modal — comportamiento estándar esperado
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

let currentProduct = null;
let scrollPosition = 0;
let triggerElement = null;

const aromaSelect = document.getElementById('aroma');
const combinacionSelect = document.getElementById('combinacion');
const combinacionGroup = document.getElementById('combinacion-variation-group');
const aromaGroup = document.getElementById('aroma-variation-group');
const stockInfoEl = document.getElementById('stock-info');
const selectionStatusEl = document.getElementById('selection-status');
const addToCartBtn = document.getElementById('add-to-cart-modal');
const modalErrorMsg = document.getElementById('modal-error-message');

export function openModal(product) {
  if (!product) return;

  triggerElement = document.activeElement;

  // Normalizar campos antes de asignar a currentProduct
  // Firestore puede guardar las imágenes como 'images' o 'imageUrls' — soportar ambos
  currentProduct = {
    ...product,
    images: product.images || product.imageUrls || [],
    combinaciones: product.combinaciones || [],
    stock_variations: product.stock_variations || {},
  };

  document.getElementById('modal-name').textContent = currentProduct.name;
  updatePrice(currentProduct);
  updateImage(currentProduct.images[0]);
  renderModalThumbnails(currentProduct.images);

  const ceraInfo = document.getElementById('cera-info');
  ceraInfo.classList.toggle('hidden', !(product.cantidad_cera > 0));
  if (product.cantidad_cera > 0) ceraInfo.innerHTML = `Contiene <strong>${product.cantidad_cera} g</strong> de cera de soya`;

  const desc = document.getElementById('modal-description');
  desc.textContent = currentProduct.description || 'Sin descripción.';
  desc.classList.add('line-clamp-2'); // resetear al estado colapsado en cada apertura

  const toggleBtn = document.getElementById('toggle-description');
  toggleBtn.textContent = 'Ver más';
  toggleBtn.onclick = () => {
    desc.classList.toggle('line-clamp-2');
    toggleBtn.textContent = desc.classList.contains('line-clamp-2') ? 'Ver más' : 'Ver menos';
  };

  const hasAromas = Array.isArray(product.aroma) && product.aroma.length > 0;

  if (hasAromas) {
    aromaGroup.classList.remove('hidden');
    combinacionGroup.classList.add('hidden');
    populateAromas(currentProduct);
    selectionStatusEl.classList.remove('hidden');
    selectionStatusEl.textContent = 'Selecciona un aroma.';
    updateStockInfo(false);
  } else {
    aromaGroup.classList.add('hidden');
    combinacionGroup.classList.remove('hidden');
    selectionStatusEl.classList.add('hidden');
    populateDesignsForBases(currentProduct);
  }

  scrollPosition = window.pageYOffset;
  document.body.classList.add('modal-open');
  document.body.style.top = `-${scrollPosition}px`;
  modal.classList.remove('hidden');
  document.getElementById('modal-success-message').classList.add('hidden');
  modalErrorMsg.classList.add('hidden');

  // Initialize lazy loading for thumbnails after DOM is ready
  setTimeout(() => initLazyLoadThumbnails(), 0);

  document.getElementById('close-modal').onclick = closeModal;
  addToCartBtn.onclick = addToCartFromModal;

  // Reseñas colapsables — cargar al abrir, toggle al hacer click
  const reviewsContainer = document.getElementById('modal-reviews-container');
  const reviewsToggleBtn = document.getElementById('toggle-reviews-btn');
  const reviewsLabel = document.getElementById('reviews-btn-label');
  const chevron = document.getElementById('reviews-chevron');
  let reviewsLoaded = false;
  reviewsContainer.classList.add('hidden');
  reviewsLabel.textContent = 'Ver reseñas';
  chevron.style.transform = 'rotate(0deg)';

  reviewsToggleBtn.onclick = async () => {
    const isOpen = !reviewsContainer.classList.contains('hidden');
    if (isOpen) {
      reviewsContainer.classList.add('hidden');
      reviewsLabel.textContent = 'Ver reseñas';
      chevron.style.transform = 'rotate(0deg)';
    } else {
      reviewsContainer.classList.remove('hidden');
      reviewsLabel.textContent = 'Ocultar reseñas';
      chevron.style.transform = 'rotate(180deg)';
      if (!reviewsLoaded) {
        reviewsLoaded = true;
        await renderReviewsSection(currentProduct.id, '#modal-reviews-container');
      }
    }
  };

  modal.addEventListener('keydown', trapFocus);
  document.getElementById('close-modal').focus();
}

export function closeModal() {
  modal.classList.add('hidden');
  modal.removeEventListener('keydown', trapFocus);
  triggerElement?.focus();
  triggerElement = null;
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, scrollPosition);
  currentProduct = null;
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const focusable = Array.from(
    modal.querySelectorAll('button:not([disabled]), select:not([disabled]), input:not([disabled])')
  ).filter(el => !el.closest('.hidden'));
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function updatePrice(product) {
  const priceEl = document.getElementById('modal-price');
  if (product.on_sale && product.on_sale_price < product.price) {
    priceEl.innerHTML = `<span style="color: var(--color-cinna);">${formatPriceCOP(product.on_sale_price)}</span> <span class="text-sm text-gray-500 line-through font-normal ml-2">${formatPriceCOP(product.price)}</span>`;
  } else {
    priceEl.textContent = formatPriceCOP(product.price);
  }
}

function populateAromas(product) {
  aromaSelect.innerHTML = '<option value="">Selecciona aroma</option>';
  product.aroma.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    aromaSelect.appendChild(opt);
  });
  aromaSelect.onchange = updateFromAroma;
}

function populateDesignsForBases(product) {
  const available = product.combinaciones.filter(comb => (product.stock_variations[comb.id] ?? 0) > 0);
  combinacionSelect.innerHTML = '';
  combinacionSelect.disabled = false;
  combinacionSelect.classList.remove('is-auto-selected');

  if (available.length === 0) {
    combinacionSelect.innerHTML = '<option value="">Sin stock</option>';
    combinacionSelect.disabled = true;
    updateStockInfo(false, 0, 'Sin stock disponible.');
    return;
  }

  available.forEach(comb => {
    const opt = document.createElement('option');
    opt.value = comb.id;
    opt.textContent = comb.label;
    combinacionSelect.appendChild(opt);
  });

  if (available.length === 1) {
    const comb = available[0];
    combinacionSelect.disabled = true;
    combinacionSelect.classList.add('is-auto-selected');
    updateImageByComb(comb);
    updateStockInfo(true, product.stock_variations[comb.id]);
  } else {
    const placeholder = document.createElement('option');
    placeholder.value = ''; placeholder.textContent = 'Elige diseño'; placeholder.disabled = true; placeholder.selected = true;
    combinacionSelect.prepend(placeholder);
    combinacionSelect.onchange = () => {
      const comb = available.find(c => c.id === combinacionSelect.value);
      if (comb) { updateImageByComb(comb); updateStockInfo(true, product.stock_variations[comb.id]); }
    };
  }
}

// === LÓGICA DE CLAVES CORREGIDA ===
function updateFromAroma() {
  const aroma = aromaSelect.value;
  if (!aroma) {
    combinacionGroup.classList.add('hidden');
    selectionStatusEl.classList.remove('hidden');
    updateStockInfo(false);
    return;
  }

  // Filtrar combinaciones usando la clave "IDDISEÑO-AROMA"
  const available = currentProduct.combinaciones.filter(comb => {
    const key = `${comb.id}-${aroma}`;
    return (currentProduct.stock_variations[key] ?? 0) > 0;
  });

  combinacionGroup.classList.remove('hidden');
  selectionStatusEl.classList.add('hidden');

  if (available.length === 0) {
    combinacionSelect.innerHTML = '<option value="">Sin stock</option>';
    combinacionSelect.disabled = true;
    updateStockInfo(false, 0, 'Sin stock para este aroma.');
    return;
  }

  combinacionSelect.innerHTML = '';
  combinacionSelect.disabled = false;
  combinacionSelect.classList.remove('is-auto-selected');

  available.forEach(comb => {
    const opt = document.createElement('option');
    opt.value = comb.id;
    opt.textContent = comb.label;
    combinacionSelect.appendChild(opt);
  });

  if (available.length === 1) {
    const comb = available[0];
    const key = `${comb.id}-${aroma}`;
    combinacionSelect.disabled = true;
    combinacionSelect.classList.add('is-auto-selected');
    updateImageByComb(comb);
    updateStockInfo(true, currentProduct.stock_variations[key]);
  } else {
    const placeholder = document.createElement('option');
    placeholder.value = ''; placeholder.textContent = 'Elige diseño'; placeholder.disabled = true; placeholder.selected = true;
    combinacionSelect.prepend(placeholder);
    combinacionSelect.onchange = () => {
      const key = `${combinacionSelect.value}-${aroma}`;
      const comb = available.find(c => c.id === combinacionSelect.value);
      if (comb) { updateImageByComb(comb); updateStockInfo(true, currentProduct.stock_variations[key]); }
    };
  }
}

function updateImageByComb(comb) {
  if (comb.image) {
    const img = currentProduct.images.find(i => i.includes(comb.image));
    if (img) updateImage(img);
  }
}

function updateImage(src) {
  const img = document.getElementById('modal-image');
  const targetSrc = src || currentProduct.images[0];

  // Only animate if changing to a different image
  if (img.src === targetSrc) return;

  img.style.opacity = '0';
  img.style.transition = 'opacity 0.15s ease';
  setTimeout(() => {
    img.src = targetSrc;
    img.style.opacity = '1';
  }, 150);
}

function renderModalThumbnails(images) {
  const container = document.getElementById('modal-thumbnails');
  if (images.length <= 1) {
    container.classList.add('hidden');
    container.classList.remove('flex');
    return;
  }
  container.innerHTML = '';
  container.classList.remove('hidden');
  container.classList.add('flex');

  images.forEach((img, i) => {
    const thumb = document.createElement('img');
    const optimizedUrl = optimizeThumb(img);

    // Use data-src for lazy loading; first thumbnail loads immediately
    if (i === 0) {
      thumb.src = optimizedUrl;
    } else {
      thumb.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3C/svg%3E';
      thumb.dataset.src = optimizedUrl;
    }

    thumb.alt = '';
    thumb.className = `w-14 h-14 object-contain rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${i === 0 ? 'border-amber-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`;
    thumb.style.backgroundColor = 'var(--color-casi-blanco)';
    thumb.onclick = () => {
      updateImage(img);
      container.querySelectorAll('img').forEach(t => {
        t.className = t.className.replace('border-amber-500', 'border-transparent').replace('opacity-100', 'opacity-60');
      });
      thumb.className = thumb.className.replace('border-transparent', 'border-amber-500').replace('opacity-60', 'opacity-100');
    };
    container.appendChild(thumb);
  });
}

function updateStockInfo(hasStock, stock = 0, msg = '') {
  stockInfoEl.classList.remove('hidden');
  addToCartBtn.disabled = !hasStock;
  if (hasStock && stock > 0) {
    stockInfoEl.textContent = `¡En stock! Queda ${stock} ${stock === 1 ? 'unidad' : 'unidades'}.`;
    stockInfoEl.className = 'mt-2 text-xs font-medium text-green-600';
  } else {
    stockInfoEl.textContent = msg || 'Selecciona una opción.';
    stockInfoEl.className = 'mt-2 text-xs font-medium text-red-600';
  }
}

function addToCartFromModal() {
  const hasAromas = Array.isArray(currentProduct.aroma) && currentProduct.aroma.length > 0;
  let aroma = hasAromas ? aromaSelect.value : 'N/A';
  let combId = combinacionSelect.value;

  if (!combId || (hasAromas && aroma === '')) {
    modalErrorMsg.textContent = '¡Selecciona las opciones!';
    modalErrorMsg.classList.remove('hidden');
    return;
  }

  const key = hasAromas ? `${combId}-${aroma}` : combId;
  const stock = currentProduct.stock_variations[key];

  if (!stock || stock <= 0) return;

  const comb = currentProduct.combinaciones.find(c => c.id === combId);
  const price = currentProduct.on_sale ? currentProduct.on_sale_price : currentProduct.price;

  addToCart({
    id: `${currentProduct.id}-${key.replace(/ /g, '')}`,
    productId: currentProduct.id,
    name: currentProduct.name,
    price,
    image: document.getElementById('modal-image').src,
    quantity: 1,
    variation: {
      aroma: aroma === 'N/A' ? null : aroma,
      diseño: comb.label
    }
  });

  currentProduct.stock_variations[key]--;
  hasAromas ? updateFromAroma() : populateDesignsForBases(currentProduct);

  document.getElementById('modal-success-message').classList.remove('hidden');
  setTimeout(closeModal, 800);
}