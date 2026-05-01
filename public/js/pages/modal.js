/**
 * js/pages/modal.js
 * Mobile-first bottom sheet — header fijo / scroll / CTA fijo
 */

import { formatPriceCOP, addToCart } from '../cart.js';
import { renderReviewsSection } from '../reviews.js';

function optimizeThumb(url) {
  if (!url || !url.includes('cloudinary')) return url;
  if (url.includes('/f_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_80,w_120/');
}

const modal = document.createElement('div');
modal.id = 'product-modal';
modal.className = 'fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-[1002] hidden';
modal.setAttribute('role', 'dialog');
modal.setAttribute('aria-modal', 'true');
modal.setAttribute('aria-labelledby', 'modal-name-m');

const styles = `
  body.modal-open { overflow: hidden !important; position: fixed; width: 100%; top: 0; }

  /* Chips — dark theme */
  .glowie-chip {
    padding: 9px 16px; border-radius: 9999px;
    border: 1px solid rgba(251,243,224,0.12);
    font-size: 12px; font-weight: 600;
    background: rgba(251,243,224,0.05); color: rgba(251,243,224,0.55);
    cursor: pointer; transition: all 0.15s ease;
    white-space: nowrap; line-height: 1.2;
    -webkit-tap-highlight-color: transparent;
  }
  .glowie-chip.selected {
    border-color: #e8a87c;
    background: rgba(232,168,124,0.12); color: #e8a87c;
    box-shadow: 0 0 12px rgba(232,168,124,0.15);
  }
  .glowie-chip:not(.oos):not(.selected):hover {
    border-color: rgba(251,243,224,0.25); color: #fbf3e0;
  }
  .glowie-chip.oos { opacity: 0.3; cursor: not-allowed; text-decoration: line-through; }

  /* Botón carrito */
  #add-to-cart-modal {
    position: relative; overflow: hidden;
    background: #fbf3e0; color: #53161d;
    transition: opacity 0.2s;
  }
  #add-to-cart-modal:disabled { background: rgba(251,243,224,0.1); color: rgba(251,243,224,0.25); }
  #add-to-cart-modal .hover-bar {
    content:''; position:absolute; top:0; left:0;
    height:100%; width:0;
    background:rgba(83,22,29,0.08);
    transition:width 0.4s ease-out; z-index:0;
    pointer-events:none; border-radius:10px;
  }
  #add-to-cart-modal:hover .hover-bar { width:100%; }
  #add-to-cart-modal > * { position:relative; z-index:1; }

  /* MOBILE: bottom sheet */
  #modal-box {
    position: relative;
    width: 100%;
    height: 93vh; height: 93dvh;
    max-height: 93vh; max-height: 93dvh;
    display: flex; flex-direction: column;
    border-radius: 1.25rem 1.25rem 0 0;
    background: #130508;
    border-top: 1px solid rgba(232,168,124,0.12);
    overflow: hidden;
  }
  /* Botón X */
  #close-modal {
    position: absolute; top: 16px; right: 16px; z-index: 60;
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: rgba(251,243,224,0.6);
    background: rgba(251,243,224,0.07);
    border: 1px solid rgba(251,243,224,0.1);
    transition: transform 0.2s, background 0.2s;
  }
  #close-modal:hover { transform: rotate(90deg); background: rgba(251,243,224,0.12); color: #fbf3e0; }
  /* DESKTOP */
  @media (min-width: 768px) {
    #product-modal { align-items: center !important; }
    #modal-box {
      width: 100%; max-width: 56rem;
      height: auto; max-height: 90vh;
      border-radius: 16px;
      display: block; overflow-y: auto;
      border: 1px solid rgba(251,243,224,0.08);
      box-shadow: 0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,168,124,0.08);
    }
    #modal-mobile-header { display: none !important; }
    #modal-footer-m { display: none !important; }
    #modal-inner-layout { flex-direction: row !important; gap: 32px !important; padding: 32px !important; align-items: flex-start; }
    #modal-image-container { width: 50% !important; margin-bottom: 0 !important; position: sticky; top: 0; align-self: flex-start; }
    #modal-image { height: 400px !important; }
    #modal-content-col { width: 50% !important; }
    #modal-desktop-info { display: block !important; }
    #modal-cta-desktop { display: block !important; }
  }
`;

modal.innerHTML = `
  <style>${styles}</style>
  <div id="modal-box">

    <!-- Botón X — hijo directo de modal-box, siempre visible (mobile y desktop) -->
    <button id="close-modal" aria-label="Cerrar">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width:18px;height:18px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>

    <!-- ═══════════════════════════════════════════ -->
    <!-- MOBILE HEADER (flex-none, oculto en desktop) -->
    <!-- ═══════════════════════════════════════════ -->
    <div id="modal-mobile-header" style="flex-shrink:0; background:#130508; border-radius:1.25rem 1.25rem 0 0;">
      <div style="display:flex; justify-content:center; padding:16px 52px 10px;">
        <div style="width:40px; height:4px; border-radius:9999px; background:rgba(251,243,224,0.15);"></div>
      </div>
      <div style="padding:0 52px 12px 16px;">
        <h2 id="modal-name-m" style="font-size:18px; font-weight:400; color:#fbf3e0; line-height:1.3; margin:0 0 4px;"></h2>
        <p id="modal-price-m" style="font-size:22px; font-weight:500; margin:0; color:#e8a87c;"></p>
        <p id="cera-info-m" style="font-size:11px; color:rgba(251,243,224,0.35); font-style:italic; display:none; margin-top:3px;"></p>
      </div>
      <div style="margin:0 16px; height:1px; background:rgba(251,243,224,0.07);"></div>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- SCROLL AREA (flex-1, todo lo que se mueve) -->
    <!-- ═══════════════════════════════════════════ -->
    <div id="modal-scroll" class="flex-1 overflow-y-auto" style="-webkit-overflow-scrolling: touch;">

      <!-- Layout: columna mobile / 2 cols desktop (controlado por CSS, no Tailwind) -->
      <div id="modal-inner-layout" style="display:flex; flex-direction:column; padding:16px; gap:0;">

        <!-- Imagen + Thumbnails -->
        <div id="modal-image-container" style="width:100%; display:flex; flex-direction:column; align-items:center; margin-bottom:20px;">
          <img id="modal-image" src="" alt="Producto"
               style="width:100%; height:240px; object-fit:contain; border-radius:12px; margin-bottom:10px; background:#1a0810;">
          <div id="modal-thumbnails" style="display:none; flex-direction:row; gap:8px; overflow-x:auto; flex-wrap:nowrap; width:100%; padding-bottom:4px; scrollbar-width:none;"></div>
        </div>

        <!-- Contenido -->
        <div id="modal-content-col" style="width:100%; display:flex; flex-direction:column;">

          <!-- Nombre + precio (solo desktop, oculto en mobile por CSS) -->
          <div id="modal-desktop-info" style="display:none; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid rgba(251,243,224,0.07);">
            <h2 id="modal-name" style="font-size:28px; font-weight:400; color:#fbf3e0; line-height:1.2; margin-bottom:8px;"></h2>
            <p id="modal-price" style="font-size:26px; font-weight:500; color:#e8a87c; margin-bottom:4px;"></p>
            <p id="cera-info" style="font-size:11px; color:rgba(251,243,224,0.35); font-style:italic; display:none; margin-bottom:4px;"></p>
            <p id="modal-description" style="color:rgba(251,243,224,0.42); font-size:13px; line-height:1.65; margin-top:10px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;"></p>
          </div>

          <!-- Variaciones -->
          <div style="display:flex; flex-direction:column; gap:20px;">

            <div id="aroma-variation-group" style="display:none;">
              <p style="font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.14em; color:rgba(251,243,224,0.35); margin-bottom:10px;">Elige tu aroma</p>
              <div id="aroma-chips" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
            </div>

            <div id="combinacion-variation-group" style="display:none;">
              <p style="font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.14em; color:rgba(251,243,224,0.35); margin-bottom:10px;">Elige el diseño</p>
              <div id="combinacion-chips" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
            </div>

            <p id="selection-status" style="font-size:12px; color:rgba(251,243,224,0.35); display:none;"></p>
            <p id="stock-info" style="font-size:12px; font-weight:600; display:none;"></p>

          </div>

          <!-- CTA desktop (oculto en mobile por CSS) -->
          <div id="modal-cta-desktop" style="display:none; margin-top:24px;">
            <button id="add-to-cart-modal"
                    style="width:100%; padding:14px; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer;"
                    disabled>
              <span class="hover-bar"></span>Añadir al Carrito
            </button>
            <p id="modal-success-message" style="margin-top:8px; text-align:center; color:#16a34a; font-weight:700; display:none; font-size:13px;">¡Añadido! 🎉</p>
            <p id="modal-error-message" style="margin-top:8px; text-align:center; color:#ef4444; font-weight:600; display:none; font-size:13px;"></p>
          </div>

          <!-- Reseñas -->
          <div style="margin-top:20px;">
            <button id="toggle-reviews-btn"
                    style="width:100%; padding:10px 16px; font-size:12px; font-weight:600; border-radius:12px; border:1px solid rgba(251,243,224,0.1); color:rgba(251,243,224,0.5); background:rgba(251,243,224,0.04); display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
              <span id="reviews-btn-label">Ver reseñas</span>
              <i id="reviews-chevron" class="fas fa-chevron-down" style="font-size:11px; transition:transform 0.2s;"></i>
            </button>
            <div id="modal-reviews-container" style="display:none; margin-top:12px; max-height:192px; overflow-y:auto; font-size:13px;"></div>
          </div>

        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- MOBILE FOOTER fijo (oculto en desktop por CSS) -->
    <!-- ═══════════════════════════════════════════ -->
    <div id="modal-footer-m" class="flex-none" style="background:#130508; border-top:1px solid rgba(251,243,224,0.07); padding:12px 16px 28px;">
      <button id="add-to-cart-modal-m"
              style="width:100%; padding:16px; border-radius:12px; font-size:15px; font-weight:700; color:#53161d; background:#fbf3e0; cursor:pointer; transition:opacity 0.2s;"
              disabled>
        Añadir al Carrito
      </button>
      <p id="modal-success-message-m" style="margin-top:8px; text-align:center; color:#4ade80; font-weight:700; display:none; font-size:13px;">¡Añadido! 🎉</p>
      <p id="modal-error-message-m" style="margin-top:8px; text-align:center; color:#f87171; font-weight:600; display:none; font-size:13px;"></p>
    </div>

  </div>
`;
document.body.appendChild(modal);

// Lazy thumbnails
function initLazyLoadThumbnails() {
  const imgs = document.querySelectorAll('#modal-thumbnails img[data-src]');
  if (!imgs.length) return;
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const img = e.target;
          if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
          o.unobserve(img);
        }
      });
    }, { rootMargin: '50px' });
    imgs.forEach(img => obs.observe(img));
  } else {
    imgs.forEach(img => { if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); } });
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

// Estado
let currentProduct = null;
let scrollPosition = 0;
let triggerElement = null;
let selectedAroma = '';
let selectedCombId = '';

// DOM
const combinacionGroup = document.getElementById('combinacion-variation-group');
const aromaGroup = document.getElementById('aroma-variation-group');
const stockInfoEl = document.getElementById('stock-info');
const selectionStatusEl = document.getElementById('selection-status');

function getAddBtn() { return window.innerWidth < 768 ? document.getElementById('add-to-cart-modal-m') : document.getElementById('add-to-cart-modal'); }
function getErrorMsg() { return window.innerWidth < 768 ? document.getElementById('modal-error-message-m') : document.getElementById('modal-error-message'); }
function getSuccessMsg() { return window.innerWidth < 768 ? document.getElementById('modal-success-message-m') : document.getElementById('modal-success-message'); }

function setCtaDisabled(disabled) {
  const m = document.getElementById('add-to-cart-modal-m');
  const d = document.getElementById('add-to-cart-modal');
  if (m) m.disabled = disabled;
  if (d) d.disabled = disabled;
}

export function openModal(product) {
  if (!product) return;
  triggerElement = document.activeElement;
  currentProduct = {
    ...product,
    images: product.images || product.imageUrls || [],
    combinaciones: product.combinaciones || [],
    stock_variations: product.stock_variations || {},
  };
  selectedAroma = '';
  selectedCombId = '';

  // Analytics
  if (typeof gtag === 'function') {
    gtag('event', 'view_item', {
      currency: 'COP', value: parseFloat(product.price) || 0,
      items: [{ item_id: product.id, item_name: product.name, price: parseFloat(product.price) || 0, item_category: product.categoria || 'velas', quantity: 1 }]
    });
  }
  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', { content_ids: [product.id], content_name: product.name, content_type: 'product', value: parseFloat(product.price) || 0, currency: 'COP' });
  }

  // Llenar nombre + precio (mobile header y desktop)
  const nameM = document.getElementById('modal-name-m');
  const priceM = document.getElementById('modal-price-m');
  const nameD = document.getElementById('modal-name');
  const priceD = document.getElementById('modal-price');
  if (nameM) nameM.textContent = currentProduct.name;
  if (nameD) nameD.textContent = currentProduct.name;

  const priceHtml = buildPriceHtml(currentProduct);
  if (priceM) priceM.innerHTML = priceHtml;
  if (priceD) priceD.innerHTML = priceHtml;

  // Cera
  const ceraM = document.getElementById('cera-info-m');
  const ceraD = document.getElementById('cera-info');
  const ceraText = currentProduct.cantidad_cera > 0 ? `Contiene ${currentProduct.cantidad_cera} g de cera de soya` : '';
  [ceraM, ceraD].forEach(el => {
    if (!el) return;
    el.textContent = ceraText;
    el.style.display = ceraText ? 'block' : 'none';
  });

  // Descripción (desktop)
  const desc = document.getElementById('modal-description');
  if (desc) desc.textContent = currentProduct.description || '';

  // Imagen
  updateImage(currentProduct.images[0]);
  renderModalThumbnails(currentProduct.images);

  // Variaciones
  const hasAromas = Array.isArray(currentProduct.aroma) && currentProduct.aroma.length > 0;
  setCtaDisabled(true);

  if (hasAromas) {
    aromaGroup.style.display = 'block';
    combinacionGroup.style.display = 'none';
    renderAromaChips(currentProduct);
    selectionStatusEl.textContent = 'Selecciona un aroma para continuar.';
    selectionStatusEl.style.display = 'block';
  } else {
    aromaGroup.style.display = 'none';
    combinacionGroup.style.display = 'block';
    selectionStatusEl.style.display = 'none';
    const available = currentProduct.combinaciones.filter(c => (currentProduct.stock_variations[c.id] ?? 0) > 0);
    renderDesignChips(available, currentProduct);
  }

  // Limpiar mensajes
  ['modal-success-message', 'modal-success-message-m', 'modal-error-message', 'modal-error-message-m']
    .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });

  // Mostrar modal
  scrollPosition = window.pageYOffset;
  document.body.classList.add('modal-open');
  document.body.style.top = `-${scrollPosition}px`;
  modal.classList.remove('hidden');

  // Reset scroll al top
  const scrollArea = document.getElementById('modal-scroll');
  if (scrollArea) scrollArea.scrollTop = 0;

  // Swipe-to-close en el handle (mobile)
  const modalBox = document.getElementById('modal-box');
  const mobileHeader = document.getElementById('modal-mobile-header');
  if (mobileHeader && modalBox) {
    let startY = 0, currentY = 0, dragging = false;

    const onTouchStart = e => {
      startY = e.touches[0].clientY;
      currentY = 0;
      dragging = true;
      modalBox.style.transition = 'none';
    };
    const onTouchMove = e => {
      if (!dragging) return;
      const dy = e.touches[0].clientY - startY;
      if (dy < 0) return; // no swipe up
      currentY = dy;
      modalBox.style.transform = `translateY(${dy}px)`;
    };
    const onTouchEnd = () => {
      if (!dragging) return;
      dragging = false;
      modalBox.style.transition = 'transform 0.3s ease';
      if (currentY > 80) {
        modalBox.style.transform = `translateY(100%)`;
        setTimeout(closeModal, 280);
      } else {
        modalBox.style.transform = 'translateY(0)';
      }
    };

    mobileHeader.addEventListener('touchstart', onTouchStart, { passive: true });
    mobileHeader.addEventListener('touchmove', onTouchMove, { passive: true });
    mobileHeader.addEventListener('touchend', onTouchEnd);

    modal._cleanupSwipe = () => {
      mobileHeader.removeEventListener('touchstart', onTouchStart);
      mobileHeader.removeEventListener('touchmove', onTouchMove);
      mobileHeader.removeEventListener('touchend', onTouchEnd);
      modalBox.style.transform = '';
      modalBox.style.transition = '';
    };
  }

  // Swipe horizontal en la imagen → cambiar foto
  const imgEl = document.getElementById('modal-image');
  if (imgEl) {
    let imgStartX = 0, imgStartY = 0, imgDeltaX = 0, imgLocked = false;

    const imgTouchStart = e => {
      imgStartX = e.touches[0].clientX;
      imgStartY = e.touches[0].clientY;
      imgDeltaX = 0;
      imgLocked = false;
      imgEl.style.transition = 'none';
    };
    const imgTouchMove = e => {
      const dx = e.touches[0].clientX - imgStartX;
      const dy = e.touches[0].clientY - imgStartY;
      if (!imgLocked) {
        // Determinar dirección dominante en los primeros píxeles
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          imgLocked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        }
      }
      if (imgLocked === 'h') {
        e.preventDefault(); // evita scroll vertical mientras swipe horizontal
        imgDeltaX = dx;
        imgEl.style.transform = `translateX(${dx * 0.4}px)`;
        imgEl.style.opacity = `${1 - Math.abs(dx) / 400}`;
      }
    };
    const imgTouchEnd = () => {
      imgEl.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      imgEl.style.transform = '';
      imgEl.style.opacity = '1';
      const images = currentProduct?.images || [];
      if (images.length < 2) return;
      const currentIdx = images.indexOf(imgEl.src) !== -1
        ? images.indexOf(imgEl.src)
        : images.findIndex(url => imgEl.src.endsWith(url.split('/').pop()));
      if (imgDeltaX < -50) {
        const next = (currentIdx + 1) % images.length;
        updateImage(images[next]);
        syncThumbnail(next);
      } else if (imgDeltaX > 50) {
        const prev = (currentIdx - 1 + images.length) % images.length;
        updateImage(images[prev]);
        syncThumbnail(prev);
      }
    };

    imgEl.addEventListener('touchstart', imgTouchStart, { passive: true });
    imgEl.addEventListener('touchmove', imgTouchMove, { passive: false });
    imgEl.addEventListener('touchend', imgTouchEnd);

    modal._cleanupImgSwipe = () => {
      imgEl.removeEventListener('touchstart', imgTouchStart);
      imgEl.removeEventListener('touchmove', imgTouchMove);
      imgEl.removeEventListener('touchend', imgTouchEnd);
      imgEl.style.transform = '';
      imgEl.style.opacity = '1';
    };
  }

  // Event listeners
  document.getElementById('close-modal').onclick = closeModal;

  const mBtn = document.getElementById('add-to-cart-modal-m');
  const dBtn = document.getElementById('add-to-cart-modal');
  if (mBtn) { mBtn.onclick = null; mBtn.onclick = addToCartFromModal; }
  if (dBtn) { dBtn.onclick = null; dBtn.onclick = addToCartFromModal; }

  // Reseñas
  const reviewsContainer = document.getElementById('modal-reviews-container');
  const reviewsToggleBtn = document.getElementById('toggle-reviews-btn');
  const reviewsLabel = document.getElementById('reviews-btn-label');
  const chevron = document.getElementById('reviews-chevron');
  let reviewsLoaded = false;
  if (reviewsContainer) reviewsContainer.style.display = 'none';
  if (reviewsLabel) reviewsLabel.textContent = 'Ver reseñas';
  if (chevron) chevron.style.transform = 'rotate(0deg)';

  reviewsToggleBtn.onclick = async () => {
    const isOpen = reviewsContainer.style.display !== 'none';
    if (isOpen) {
      reviewsContainer.style.display = 'none';
      reviewsLabel.textContent = 'Ver reseñas';
      chevron.style.transform = 'rotate(0deg)';
    } else {
      reviewsContainer.style.display = 'block';
      reviewsLabel.textContent = 'Ocultar reseñas';
      chevron.style.transform = 'rotate(180deg)';
      if (!reviewsLoaded) { reviewsLoaded = true; await renderReviewsSection(currentProduct.id, '#modal-reviews-container'); }
    }
  };

  modal.addEventListener('keydown', trapFocus);
  document.getElementById('close-modal').focus();

  setTimeout(() => initLazyLoadThumbnails(), 0);
}

export function closeModal() {
  modal._cleanupSwipe?.();
  modal._cleanupSwipe = null;
  modal._cleanupImgSwipe?.();
  modal._cleanupImgSwipe = null;
  modal.classList.add('hidden');
  const modalBox = document.getElementById('modal-box');
  if (modalBox) { modalBox.style.transform = ''; modalBox.style.transition = ''; }
  modal.removeEventListener('keydown', trapFocus);
  triggerElement?.focus();
  triggerElement = null;
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, scrollPosition);
  currentProduct = null;
  selectedAroma = '';
  selectedCombId = '';
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const focusable = Array.from(
    modal.querySelectorAll('button:not([disabled]), .glowie-chip:not(.oos)')
  ).filter(el => !el.closest('.hidden'));
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function buildPriceHtml(product) {
  if (product.on_sale && product.on_sale_price < product.price) {
    return `${formatPriceCOP(product.on_sale_price)} <span class="text-base text-gray-400 line-through font-normal ml-1">${formatPriceCOP(product.price)}</span>`;
  }
  return formatPriceCOP(product.price);
}

function renderAromaChips(product) {
  const container = document.getElementById('aroma-chips');
  container.innerHTML = '';
  product.aroma.forEach(a => {
    const hasStock = product.combinaciones.some(c => (product.stock_variations[`${c.id}-${a}`] ?? 0) > 0);
    const btn = document.createElement('button');
    btn.type = 'button';
    if (hasStock) {
      btn.className = 'glowie-chip';
      btn.onclick = () => {
        selectedAroma = a;
        container.querySelectorAll('.glowie-chip').forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
        selectionStatusEl.style.display = 'none';
        updateDesignsFromAroma(product);
      };
    } else {
      btn.className = 'glowie-chip oos';
      btn.disabled = true;
      btn.title = 'Sin stock actualmente';
    }
    btn.textContent = a;
    container.appendChild(btn);
  });
}

function updateDesignsFromAroma(product) {
  const available = product.combinaciones.filter(c => (product.stock_variations[`${c.id}-${selectedAroma}`] ?? 0) > 0);
  combinacionGroup.style.display = 'block';
  selectedCombId = '';
  setCtaDisabled(true);

  if (available.length === 0) {
    document.getElementById('combinacion-chips').innerHTML = '<span class="text-sm text-gray-400 italic">Sin stock para este aroma.</span>';
    updateStockInfo(false, 0);
    return;
  }

  renderDesignChips(available, product, selectedAroma);

  if (available.length === 1) {
    const comb = available[0];
    selectedCombId = comb.id;
    document.querySelector('#combinacion-chips .glowie-chip')?.classList.add('selected');
    updateImageByComb(comb);
    updateStockInfo(true, product.stock_variations[`${comb.id}-${selectedAroma}`]);
    setCtaDisabled(false);
  }
}

function renderDesignChips(available, product, aroma = null) {
  const container = document.getElementById('combinacion-chips');
  container.innerHTML = '';

  if (!available.length) {
    container.innerHTML = '<span class="text-sm text-gray-400 italic">Sin stock disponible.</span>';
    setCtaDisabled(true);
    return;
  }

  available.forEach(comb => {
    const btn = document.createElement('button');
    btn.className = 'glowie-chip';
    btn.textContent = comb.label;
    btn.type = 'button';
    btn.onclick = () => {
      selectedCombId = comb.id;
      container.querySelectorAll('.glowie-chip').forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      updateImageByComb(comb);
      const key = aroma ? `${comb.id}-${aroma}` : comb.id;
      const stock = currentProduct.stock_variations[key] ?? 0;
      updateStockInfo(stock > 0, stock);
      setCtaDisabled(stock <= 0);
    };
    container.appendChild(btn);
  });

  if (available.length === 1) {
    const comb = available[0];
    selectedCombId = comb.id;
    container.querySelector('.glowie-chip').classList.add('selected');
    updateImageByComb(comb);
    const key = aroma ? `${comb.id}-${aroma}` : comb.id;
    const stock = currentProduct.stock_variations[key] ?? 0;
    updateStockInfo(stock > 0, stock);
    setCtaDisabled(stock <= 0);
  }
}

function syncThumbnail(idx) {
  const thumbs = document.querySelectorAll('#modal-thumbnails img');
  thumbs.forEach((t, i) => {
    t.style.borderColor = i === idx ? '#f59e0b' : 'transparent';
    t.style.opacity = i === idx ? '1' : '0.6';
  });
}

function updateImageByComb(comb) {
  if (!comb?.image) return;
  const img = currentProduct.images.find(i => i.includes(comb.image));
  if (img) updateImage(img);
}

function updateImage(src) {
  const img = document.getElementById('modal-image');
  if (!src || !img || img.src === src) return;
  img.style.opacity = '0';
  img.style.transition = 'opacity 0.15s ease';
  setTimeout(() => { img.src = src; img.style.opacity = '1'; }, 150);
}

function renderModalThumbnails(images) {
  const container = document.getElementById('modal-thumbnails');
  if (images.length <= 1) { container.style.display = 'none'; return; }
  container.innerHTML = '';
  container.style.display = 'flex';
  images.forEach((imgSrc, i) => {
    const thumb = document.createElement('img');
    if (i === 0) { thumb.src = optimizeThumb(imgSrc); }
    else { thumb.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E"; thumb.dataset.src = optimizeThumb(imgSrc); }
    thumb.alt = '';
    thumb.className = `w-14 h-14 object-contain rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${i === 0 ? 'border-amber-500' : 'border-transparent opacity-60 hover:opacity-100'}`;
    thumb.style.backgroundColor = 'var(--color-casi-blanco)';
    thumb.onclick = () => {
      updateImage(imgSrc);
      container.querySelectorAll('img').forEach(t => { t.classList.replace('border-amber-500', 'border-transparent'); t.classList.add('opacity-60'); });
      thumb.classList.replace('border-transparent', 'border-amber-500');
      thumb.classList.remove('opacity-60');
    };
    container.appendChild(thumb);
  });
}

function updateStockInfo(hasStock, stock = 0) {
  stockInfoEl.style.display = 'block';
  if (hasStock && stock > 0) {
    stockInfoEl.textContent = stock <= 3 ? `¡Solo quedan ${stock}!` : `En stock (${stock} disponibles)`;
    stockInfoEl.className = stock <= 3 ? 'text-xs font-semibold text-amber-600' : 'text-xs font-semibold text-green-600';
  } else {
    stockInfoEl.textContent = 'Sin stock para esta opción.';
    stockInfoEl.className = 'text-xs font-semibold text-red-500';
  }
}

function addToCartFromModal() {
  const hasAromas = Array.isArray(currentProduct.aroma) && currentProduct.aroma.length > 0;
  const aroma = hasAromas ? selectedAroma : 'N/A';
  const combId = selectedCombId;

  if (!combId) {
    const msg = hasAromas && !aroma ? '¡Elige un aroma primero!' : '¡Elige un diseño!';
    const errEl = getErrorMsg();
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
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
    variation: { aroma: aroma === 'N/A' ? null : aroma, diseño: comb?.label }
  });

  currentProduct.stock_variations[key]--;

  const successEl = getSuccessMsg();
  if (successEl) successEl.style.display = 'block';
  setTimeout(closeModal, 900);
}
