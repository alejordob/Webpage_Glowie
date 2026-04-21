/**
 * js/reviews.js
 * Sistema de reseñas — Firebase Firestore
 * Collection: reviews / { productId, authorName, rating, comment, approved, createdAt }
 * Las reseñas se muestran solo cuando approved === true (aprobación manual en Firebase Console)
 */

import { db, collection, getDocs, addDoc, query, where, serverTimestamp }
  from './firebase.js';

// --- CACHE EN MEMORIA (no localStorage: las reseñas cambian con aprobaciones) ---
const _reviewsCache = {};

export async function getProductReviews(productId) {
  if (_reviewsCache[productId]) return _reviewsCache[productId];
  try {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      where('approved', '==', true)
    );
    const snap = await getDocs(q);
    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    _reviewsCache[productId] = reviews;
    return reviews;
  } catch (e) {
    console.warn('Error cargando reseñas:', e);
    return [];
  }
}

export async function submitReview(productId, authorName, rating, comment) {
  try {
    await addDoc(collection(db, 'reviews'), {
      productId,
      authorName: authorName.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      approved: false, // requiere aprobación manual
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (e) {
    console.warn('Error enviando reseña:', e);
    return { error: 'No se pudo enviar la reseña. Intenta de nuevo.' };
  }
}

export function getAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return { avg: 0, count: 0 };
  const avg = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;
  return { avg: Math.round(avg * 10) / 10, count: reviews.length };
}

// Genera HTML de estrellas (1-5, soporta medias estrellas)
export function renderStars(rating, size = 'sm') {
  const cls = size === 'lg' ? 'text-lg' : 'text-sm';
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return `
    <span class="${cls}" style="color: #f59e0b;" aria-label="${rating} de 5 estrellas">
      ${'<i class="fas fa-star"></i>'.repeat(full)}
      ${half ? '<i class="fas fa-star-half-alt"></i>' : ''}
      ${'<i class="far fa-star"></i>'.repeat(empty)}
    </span>`;
}

// HTML de lista de reseñas
export function renderReviewsList(reviews) {
  if (!reviews || reviews.length === 0) return `
    <p class="text-gray-400 text-sm italic text-center py-4">Aún no hay reseñas aprobadas. ¡Sé el primero!</p>`;

  return reviews.map(r => {
    const date = r.createdAt?.toDate?.()?.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) || '';
    return `
      <div class="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0">
        <div class="flex items-center justify-between mb-1 gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                 style="background: var(--color-cinna);">${r.authorName.charAt(0).toUpperCase()}</div>
            <span class="font-semibold text-gray-800 text-sm">${r.authorName}</span>
          </div>
          <div class="flex items-center gap-2">
            ${renderStars(r.rating)}
            ${date ? `<span class="text-xs text-gray-400">${date}</span>` : ''}
          </div>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mt-1">${r.comment}</p>
      </div>`;
  }).join('');
}

// Formulario de nueva reseña
export function renderReviewForm(productId) {
  return `
    <form id="review-form-${productId}" class="mt-4 rounded-2xl p-5 border border-gray-100" style="background: var(--color-casi-blanco);">
      <h4 class="font-bold text-gray-800 mb-4 text-sm">Escribe tu reseña</h4>

      <div class="mb-3">
        <label class="block text-xs font-semibold mb-1" style="color: var(--color-cinna);">Tu nombre *</label>
        <input type="text" id="review-name-${productId}" maxlength="60" required
               class="w-full px-3 py-2 text-sm border-2 rounded-xl focus:outline-none transition-colors"
               style="border-color: var(--color-fondo);"
               onfocus="this.style.borderColor='var(--color-cinna)'"
               onblur="this.style.borderColor='var(--color-fondo)'"
               placeholder="Ej: María">
      </div>

      <div class="mb-3">
        <label class="block text-xs font-semibold mb-2" style="color: var(--color-cinna);">Calificación *</label>
        <div id="star-picker-${productId}" class="flex gap-2" data-value="0">
          ${[1,2,3,4,5].map(n => `
            <button type="button" data-star="${n}"
                    class="star-btn text-2xl text-gray-300 hover:text-yellow-400 transition-colors"
                    aria-label="${n} estrella${n > 1 ? 's' : ''}">
              <i class="fas fa-star"></i>
            </button>`).join('')}
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-xs font-semibold mb-1" style="color: var(--color-cinna);">Comentario * <span class="font-normal text-gray-400">(mín. 10 caracteres)</span></label>
        <textarea id="review-comment-${productId}" rows="3" minlength="10" maxlength="400" required
                  class="w-full px-3 py-2 text-sm border-2 rounded-xl focus:outline-none resize-none transition-colors"
                  style="border-color: var(--color-fondo);"
                  onfocus="this.style.borderColor='var(--color-cinna)'"
                  onblur="this.style.borderColor='var(--color-fondo)'"
                  placeholder="¿Cómo fue tu experiencia con esta vela?"></textarea>
      </div>

      <p id="review-form-error-${productId}" class="text-red-500 text-xs mb-2 hidden"></p>
      <p id="review-form-success-${productId}" class="text-green-600 text-xs mb-2 font-semibold hidden">
        ¡Gracias! Tu reseña fue enviada y será publicada tras revisión.
      </p>

      <button type="submit"
              class="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:opacity-90"
              style="background: var(--color-cinna);">
        Enviar reseña
      </button>
    </form>`;
}

// Inicializa el star picker interactivo en el formulario
export function initReviewForm(productId) {
  const picker = document.getElementById(`star-picker-${productId}`);
  if (!picker) return;

  const buttons = picker.querySelectorAll('.star-btn');

  function paintStars(n) {
    buttons.forEach(b => {
      const starN = Number(b.dataset.star);
      const icon = b.querySelector('i');
      icon.style.color = starN <= n ? '#f59e0b' : '#d1d5db';
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => paintStars(Number(btn.dataset.star)));
    btn.addEventListener('mouseleave', () => paintStars(Number(picker.dataset.value)));
    btn.addEventListener('click', () => {
      picker.dataset.value = btn.dataset.star;
      paintStars(Number(btn.dataset.star));
    });
  });

  const form = document.getElementById(`review-form-${productId}`);
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById(`review-form-error-${productId}`);
    const successEl = document.getElementById(`review-form-success-${productId}`);
    const submitBtn = form.querySelector('button[type="submit"]');

    const name = document.getElementById(`review-name-${productId}`)?.value.trim();
    const rating = Number(picker.dataset.value);
    const comment = document.getElementById(`review-comment-${productId}`)?.value.trim();

    errorEl.classList.add('hidden');

    if (!name) { errorEl.textContent = 'Ingresa tu nombre.'; errorEl.classList.remove('hidden'); return; }
    if (!rating) { errorEl.textContent = 'Selecciona una calificación.'; errorEl.classList.remove('hidden'); return; }
    if (comment.length < 10) { errorEl.textContent = 'El comentario debe tener mínimo 10 caracteres.'; errorEl.classList.remove('hidden'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const result = await submitReview(productId, name, rating, comment);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar reseña';

    if (result.success) {
      successEl.classList.remove('hidden');
      form.reset();
      picker.dataset.value = '0';
      paintStars(0);
    } else {
      errorEl.textContent = result.error;
      errorEl.classList.remove('hidden');
    }
  });
}

// --- Función de alto nivel: carga y renderiza el bloque completo de reseñas ---
export async function renderReviewsSection(productId, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = `<div class="py-4 text-center text-gray-400 text-sm">Cargando reseñas...</div>`;

  const reviews = await getProductReviews(productId);
  const { avg, count } = getAverageRating(reviews);

  container.innerHTML = `
    <div class="border-t border-gray-100 pt-8 mb-8">
      <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 class="text-xl font-extrabold" style="color: var(--color-cinna);">Reseñas</h3>
          ${count > 0 ? `
            <div class="flex items-center gap-2 mt-1">
              ${renderStars(avg, 'lg')}
              <span class="text-gray-600 text-sm font-medium">${avg} de 5 · ${count} reseña${count !== 1 ? 's' : ''}</span>
            </div>` : ''}
        </div>
      </div>

      <div id="reviews-list-${productId}" class="mb-8">
        ${renderReviewsList(reviews)}
      </div>

      ${renderReviewForm(productId)}
    </div>`;

  initReviewForm(productId);
}
