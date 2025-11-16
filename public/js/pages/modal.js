/**
 * js/pages/modal.js
 * -------------------------------------------------------------
 * Controla la apertura y cierre del modal de detalles de producto.
 * Mantiene la lógica de variaciones (color, aroma) y es responsive.
 * -------------------------------------------------------------
 */

// Importaciones
import { formatPriceCOP, addToCart } from '../cart.js';

// --- VARIABLES Y ESTRUCTURA DEL MODAL ---
const modal = document.createElement('div');
modal.id = 'product-modal';
modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[1002] hidden p-0 md:p-4 overflow-hidden';

// --- ESTILOS ---
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

  #add-to-cart-modal:hover .hover-bar {
    width: 100%;
  }

  #add-to-cart-modal > * {
    position: relative;
    z-index: 1;
  }

  body.modal-open {
    overflow: hidden !important;
    position: fixed;
    width: 100%;
    top: 0;
  }

  #close-modal {
    transition: all 0.3s ease-in-out;
  }

  #close-modal:hover {
    transform: rotate(180deg) scale(1.1);
    background-color: rgba(0,0,0,0.05) !important;
  }

  #modal-description {
    overflow: hidden;
    line-height: 1.5;
    transition: all 0.3s ease;
  }

  #toggle-description.hidden {
    display: none;
  }

  /* Opciones deshabilitadas */
  select option:disabled {
    color: #9ca3af !important;
    font-style: italic;
  }
`;

modal.innerHTML = `
  <style>${buttonStyles}</style>

  <!-- Contenedor principal -->
  <div class="relative rounded-xl shadow-2xl w-full max-w-full h-[90vh] md:h-auto md:max-w-5xl transform transition-all duration-300 md:max-h-[95vh] overflow-hidden p-6 md:p-8" 
       style="background-color: var(--color-casi-blanco);">
    
    <!-- Botón Cerrar -->
    <button id="close-modal" 
            class="absolute top-4 right-4 text-xl font-black z-10 transition-all shadow-lg duration-300 rounded-full flex items-center justify-center w-9 h-9 leading-none cursor-pointer"
            style="color: var(--color-cinna); background-color: var(--color-gris-crema);">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Estructura de dos columnas -->
    <div class="flex flex-col md:flex-row md:space-x-8 h-full">

      <!-- Imagen -->
      <div id="modal-image-container" class="w-full relative mb-2 md:mb-0 md:w-1/2 rounded-xl p-2 flex justify-center items-center" style="background-color: var(--color-casi-blanco);"> 
        <img id="modal-image" 
             src="" 
             alt="Producto" 
             class="w-full h-48 md:h-[500px] object-contain rounded-xl shadow-xl border-2" 
             style="border-color: var(--color-casi-blanco); transition: border-color 0.3s;"
             onerror="this.src='https://placehold.co/800x600/CFB3A9/FFFFFF?text=Sin+Imagen';">
        
        <!-- Flechas de navegación -->
        <div id="image-nav" class="absolute inset-x-0 bottom-4 flex justify-center space-x-4 hidden">
          <button id="prev-image" class="text-white hover:text-white bg-black/50 hover:bg-black/70 p-3 rounded-full transition-colors font-bold shadow-md">&lt;</button>
          <button id="next-image" class="text-white hover:text-white bg-black/50 hover:bg-black/70 p-3 rounded-full transition-colors font-bold shadow-md">&gt;</button>
        </div>
      </div>

      <!-- Detalles -->
      <div class="w-full md:w-1/2 relative pt-0 flex flex-col overflow-y-auto">
        
        <!-- Contenido fijo superior -->
        <div class="flex-shrink-0">
          <h2 id="modal-name" class="text-2xl md:text-4xl font-extrabold mb-1 md:mb-2 text-gray-800"></h2>
          <p id="modal-price" class="text-xl md:text-3xl font-black mb-2 md:mb-6" style="color: var(--color-cinna);"></p>
          
          <!-- CANTIDAD DE CERA -->
          <p id="cera-info" class="text-sm text-gray-600 font-medium mb-3 italic hidden"></p>

          <!-- DESCRIPCIÓN CON "VER MÁS" -->
          <div class="mb-4">
            <p id="modal-description" class="text-gray-600 text-xs md:text-sm line-clamp-2 transition-all duration-300"></p>
            <button id="toggle-description" class="text-xs md:text-sm font-medium text-amber-600 hover:text-amber-700 mt-1 focus:outline-none">
              Ver más
            </button>
          </div>
        </div>

        <!-- Variaciones -->
        <div class="space-y-3 mb-4 flex-grow overflow-y-auto">
          
          <div class="variation-group" id="cera-variation-group">
            <label class="block text-xs font-semibold mb-1" style="color: var(--color-cinna);">Color de Cera</label>
            <select id="color-cera" class="w-full p-2 text-sm border rounded-xl shadow-inner appearance-none transition-all cursor-pointer" 
                    style="border-color: var(--color-gris-crema); background-color: var(--color-casi-blanco); color: var(--color-cinna); font-weight: 500;">
            </select>
          </div>

          <div class="variation-group" id="cemento-variation-group"> 
            <label class="block text-xs font-semibold mb-1" style="color: var(--color-cinna);">Color de Cemento</label>
            <select id="color-cemento" class="w-full p-2 text-sm border rounded-xl shadow-inner appearance-none transition-all cursor-pointer" 
                    style="border-color: var(--color-gris-crema); background-color: var(--color-casi-blanco); color: var(--color-cinna); font-weight: 500;">
            </select>
          </div>

          <div class="variation-group" id="aroma-variation-group">
            <label class="block text-xs font-semibold mb-1" style="color: var(--color-cinna);">Aroma</label>
            <select id="aroma" class="w-full p-2 text-sm border rounded-xl shadow-inner appearance-none transition-all cursor-pointer" 
                    style="border-color: var(--color-gris-crema); background-color: var(--color-casi-blanco); color: var(--color-cinna); font-weight: 500;">
            </select>
          </div>
          
          <!-- Mensaje de error/selección si falta algo -->
          <p id="selection-status" class="mt-2 text-xs font-medium text-gray-500">Selecciona las combinaciones deseadas.</p>
          <!-- Mensaje de stock -->
          <p id="stock-info" class="mt-2 text-xs font-medium"></p> 
        </div>

        <!-- Botón Añadir al Carrito -->
        <div class="flex-shrink-0 pt-4 border-t" style="border-color: var(--color-gris-crema);">
          <button id="add-to-cart-modal" 
                  class="w-full py-2 mt-2 text-base rounded-xl font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
            <span class="hover-bar"></span>
            Añadir al Carrito
          </button>
          
          <div id="modal-success-message" class="mt-2 text-center text-green-600 font-bold hidden text-sm">
            ¡Producto añadido al carrito!
          </div>
          <div id="modal-error-message" class="mt-2 text-center text-red-600 font-bold hidden text-sm">
            ¡Por favor, selecciona todas las opciones para continuar!
          </div>
        </div>
      </div>
    </div>
  </div>
`;
document.body.appendChild(modal);

// --- LÓGICA DEL MODAL ---
let currentProduct = null;
let currentImageIndex = 0;
let scrollPosition = 0;

// === SELECTORES CLAVE ===
const colorCeraSelect = document.getElementById('color-cera');
const colorCementoSelect = document.getElementById('color-cemento');
const aromaSelect = document.getElementById('aroma');
const stockInfoEl = document.getElementById('stock-info');
const selectionStatusEl = document.getElementById('selection-status');
const addToCartBtn = document.getElementById('add-to-cart-modal');
const modalErrorMsg = document.getElementById('modal-error-message');


// === ABRIR MODAL ===
export function openModal(product, products) {
  if (!product) {
    console.error('No se recibió un producto para abrir el modal');
    return;
  }
  currentProduct = product;
  currentImageIndex = 0;

  // Datos
  document.getElementById('modal-name').textContent = product.name;
  updatePrice(product);
  
  // Inicialización de variaciones y listeners
  populateSelects(product);
  
  updateImage();
  updateStockInfo();

  // === CANTIDAD DE CERA ===
  const ceraInfo = document.getElementById('cera-info');
  const isBase = product.color_cera?.includes('N/A');
  if (!isBase && product.cantidad_cera && product.cantidad_cera > 0) {
    ceraInfo.innerHTML = `Esta mágica vela contiene <strong>${product.cantidad_cera} g</strong> de cera de soya`;
    ceraInfo.classList.remove('hidden');
  } else {
    ceraInfo.classList.add('hidden');
  }

  // --- DESCRIPCIÓN "VER MÁS" ---
  const descriptionEl = document.getElementById('modal-description');
  const toggleBtn = document.getElementById('toggle-description');
  descriptionEl.textContent = product.description || 'Sin descripción disponible.';
  descriptionEl.classList.add('line-clamp-2');
  toggleBtn.textContent = 'Ver más';
  toggleBtn.classList.remove('hidden');
  setTimeout(() => {
    if (descriptionEl.scrollHeight <= descriptionEl.clientHeight + 5) {
      toggleBtn.classList.add('hidden');
    }
  }, 100);
  toggleBtn.onclick = (e) => {
    e.stopPropagation();
    descriptionEl.classList.toggle('line-clamp-2');
    toggleBtn.textContent = descriptionEl.classList.contains('line-clamp-2') ? 'Ver más' : 'Ver menos';
  };

  // Scroll fix
  scrollPosition = window.pageYOffset;
  document.body.classList.add('modal-open');
  document.body.style.top = `-${scrollPosition}px`;

  modal.classList.remove('hidden');
  document.getElementById('modal-success-message').classList.add('hidden');
  modalErrorMsg.classList.add('hidden');

  // Listeners
  document.getElementById('close-modal').addEventListener('click', closeModal);
  addToCartBtn.addEventListener('click', addToCartFromModal);
  modal.addEventListener('click', handleOutsideClick);

  // Navegación de imágenes (se mantiene la lógica original)
  const imageNav = document.getElementById('image-nav');
  if (product.images?.length > 1 && !hasColorVariations(product)) {
    imageNav.classList.remove('hidden');
    document.getElementById('prev-image').onclick = () => navigateImage(-1);
    document.getElementById('next-image').onclick = () => navigateImage(1);
  } else {
    imageNav.classList.add('hidden');
  }
}

// === CERRAR MODAL ===
export function closeModal() {
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, scrollPosition);

  // Limpiar y clonar para remover listeners
  const elements = ['close-modal', 'add-to-cart-modal', 'color-cera', 'color-cemento', 'aroma', 'prev-image', 'next-image'];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.replaceWith(el.cloneNode(true));
  });
  
  // Re-obtener los selectores para la próxima apertura
  [colorCeraSelect, colorCementoSelect, aromaSelect].forEach(s => {
    if (s) s.value = '';
  });

  // Limpiar variables globales
  currentProduct = null;
  currentImageIndex = 0;

  modal.removeEventListener('click', handleOutsideClick);
}

function handleOutsideClick(e) {
  if (e.target === modal) closeModal();
}

function updatePrice(product) {
  const priceElement = document.getElementById('modal-price');
  if (product.on_sale && product.on_sale_price < product.price) {
    priceElement.innerHTML = `<span style="color: var(--color-cinna);">${formatPriceCOP(product.on_sale_price)}</span> <span class="text-sm md:text-lg text-gray-500 line-through font-normal ml-2">${formatPriceCOP(product.price)}</span>`;
  } else {
    priceElement.textContent = formatPriceCOP(product.price);
  }
}

// =================================================================
// === LÓGICA CRÍTICA: GESTIÓN DE VARIACIONES Y FILTRADO DE STOCK ===
// =================================================================

/**
 * Rellena un select con opciones, manteniendo la selección actual si es válida.
 * @param {HTMLElement} selectEl - El elemento <select>.
 * @param {string[]} options - Array de strings de opciones válidas.
 * @param {string} type - Tipo de variación (cera, cemento, aroma).
 */
const fillSelect = (selectEl, options, type) => {
    const currentValue = selectEl.value;
    selectEl.innerHTML = ''; // Limpiar opciones

    // Añadir opción por defecto o placeholder
    const placeholder = document.createElement('option');
    placeholder.value = "";
    placeholder.textContent = `Selecciona ${type}...`;
    placeholder.disabled = true;
    placeholder.selected = true; // Por defecto es la seleccionada, a menos que el currentValue sea válido
    selectEl.appendChild(placeholder);

    // Añadir las opciones válidas
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        selectEl.appendChild(option);
    });

    // Restaurar la selección si el valor actual sigue siendo una opción válida
    if (currentValue && options.includes(currentValue)) {
        selectEl.value = currentValue;
    } else {
        // Si el valor actual ya no es válido, se borra y queda el placeholder
        selectEl.value = ''; 
    }
};

/**
 * Función principal que actualiza los selectores de variación basado en las selecciones actuales.
 */
function updateVariations() {
    if (!currentProduct || !currentProduct.stock_variations) return;

    // Obtener las selecciones actuales
    const selectedCera = colorCeraSelect.value || null;
    const selectedCemento = colorCementoSelect.value || null;
    const selectedAroma = aromaSelect.value || null;

    const variations = currentProduct.stock_variations;
    const validKeys = Object.keys(variations).filter(key => variations[key] > 0);

    // 1. Filtrar las opciones válidas para Cemento (basado en Cera y Aroma)
    const possibleCemento = new Set();
    validKeys.forEach(key => {
        const [cemento, cera, aroma] = key.split('-');
        if ((selectedCera === null || selectedCera === cera) &&
            (selectedAroma === null || selectedAroma === aroma)) {
            possibleCemento.add(cemento);
        }
    });
    fillSelect(colorCementoSelect, Array.from(possibleCemento).sort(), "Color Cemento");

    // 2. Filtrar las opciones válidas para Cera (basado en Cemento y Aroma)
    const possibleCera = new Set();
    validKeys.forEach(key => {
        const [cemento, cera, aroma] = key.split('-');
        if ((selectedCemento === null || selectedCemento === cemento) &&
            (selectedAroma === null || selectedAroma === aroma)) {
            possibleCera.add(cera);
        }
    });
    fillSelect(colorCeraSelect, Array.from(possibleCera).sort(), "Color Cera");


    // 3. Filtrar las opciones válidas para Aroma (basado en Cera y Cemento)
    const possibleAroma = new Set();
    validKeys.forEach(key => {
        const [cemento, cera, aroma] = key.split('-');
        if ((selectedCemento === null || selectedCemento === cemento) &&
            (selectedCera === null || selectedCera === cera)) {
            possibleAroma.add(aroma);
        }
    });
    fillSelect(aromaSelect, Array.from(possibleAroma).sort(), "Aroma");

    // Llama a las actualizaciones de estado e imagen después de ajustar las selecciones
    updateStockInfo();
    updateImage();
}

/**
 * Inicializa los selectores y establece los listeners de cambio.
 */
function populateSelects(product) {
    const ceraGroup = document.getElementById('cera-variation-group');
    const cementoGroup = document.getElementById('cemento-variation-group');
    const aromaGroup = document.getElementById('aroma-variation-group');

    // Ocultar si es un producto simple (ej. N/A)
    const isBase = product.color_cera?.includes('N/A');
    if (isBase) {
        ceraGroup.classList.add('hidden');
        aromaGroup.classList.add('hidden');
        cementoGroup.classList.add('hidden');
        return;
    } else {
        ceraGroup.classList.remove('hidden');
        aromaGroup.classList.remove('hidden');
        cementoGroup.classList.remove('hidden');
    }

    // Inicializar los listeners para disparar el filtrado encadenado
    [colorCeraSelect, colorCementoSelect, aromaSelect].forEach(s => {
        // Importante: Remover listeners viejos antes de añadir nuevos
        s.removeEventListener('change', updateVariations);
        s.addEventListener('change', updateVariations);
    });

    // Iniciar el filtrado para poblar con las opciones iniciales válidas
    updateVariations();
}

function hasColorVariations(product) {
  const count = (arr) => (Array.isArray(arr) ? arr : [arr]).filter(o => o && !o.toLowerCase().includes('n/a')).length;
  return count(product.color_cera) > 1 || count(product.color_Cemento) > 1 || count(product.aroma) > 1;
}

// === CAMBIO DE IMAGEN ===
function updateImage() {
  if (!currentProduct || !currentProduct.images) return;

  const imageElement = document.getElementById('modal-image');
  const imageNav = document.getElementById('image-nav');

  const isBase = currentProduct.color_cera?.includes('N/A');
  if (isBase) {
    imageElement.src = currentProduct.images[0];
    imageNav.classList.add('hidden');
    return;
  }

  const colorCera = colorCeraSelect?.value || '';
  const colorCemento = colorCementoSelect?.value || '';
  const aroma = aromaSelect?.value || '';

  const variationKey = `${colorCemento}-${colorCera}-${aroma}`;
  const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const keyNorm = normalize(variationKey);

  const foundImage = currentProduct.images.find(img => {
    const fileName = normalize(img.split('/').pop().split('.')[0]);
    // La imagen debe contener el nombre de la vela, más (idealmente) alguna variación seleccionada.
    return fileName.includes(normalize(currentProduct.id)) && 
           (fileName.includes(normalize(colorCemento)) || 
           fileName.includes(normalize(colorCera)) || 
           fileName.includes(normalize(aroma)));
  });

  imageElement.src = foundImage || currentProduct.images[0];
  imageNav.classList.add('hidden');
}

function navigateImage(direction) {
  if (!currentProduct || !currentProduct.images || currentProduct.images.length <= 1) return;
  currentImageIndex = (currentImageIndex + direction + currentProduct.images.length) % currentProduct.images.length;
  updateImage();
}

/**
 * Muestra el estado del stock o el mensaje de selección incompleta.
 */
function updateStockInfo() {
  const cera = colorCeraSelect.value;
  const cemento = colorCementoSelect.value;
  const aroma = aromaSelect.value;

  const allSelected = cera && cemento && aroma;

  stockInfoEl.classList.add('hidden');
  selectionStatusEl.classList.remove('hidden');
  addToCartBtn.disabled = true;
  modalErrorMsg.classList.add('hidden');

  if (!allSelected) {
    selectionStatusEl.textContent = 'Selecciona Color Cera, Color Cemento y Aroma.';
    selectionStatusEl.className = 'mt-2 text-xs font-medium text-gray-500';
    return;
  }
  
  // Si todo está seleccionado, comprobamos el stock
  selectionStatusEl.classList.add('hidden');
  stockInfoEl.classList.remove('hidden');

  const key = `${cemento}-${cera}-${aroma}`;
  const stock = currentProduct.stock_variations?.[key] ?? 0;

  if (stock > 0) {
    stockInfoEl.textContent = `¡En stock! Quedan ${stock} unidades.`;
    stockInfoEl.className = 'mt-2 text-xs font-medium text-green-600';
    addToCartBtn.disabled = false;
  } else {
    stockInfoEl.textContent = 'Esta combinación está agotada. Por favor, cambia una opción.';
    stockInfoEl.className = 'mt-2 text-xs font-medium text-red-600';
    addToCartBtn.disabled = true;
  }
}

// === AÑADIR AL CARRITO ===
function addToCartFromModal() {
  const colorCera = colorCeraSelect.value;
  const colorCemento = colorCementoSelect.value;
  const aroma = aromaSelect.value;
  const variationKey = `${colorCemento}-${colorCera}-${aroma}`;
  const stock = currentProduct.stock_variations?.[variationKey];

  if (!colorCera || !colorCemento || !aroma) {
    modalErrorMsg.textContent = '¡Por favor, selecciona todas las opciones para continuar!';
    modalErrorMsg.classList.remove('hidden');
    return;
  }
  if (!stock || stock <= 0) {
    modalErrorMsg.textContent = 'Esta combinación no está disponible o está agotada.';
    modalErrorMsg.classList.remove('hidden');
    return;
  }
  
  modalErrorMsg.classList.add('hidden'); // Ocultar si la validación es exitosa

  const effectivePrice = currentProduct.on_sale && currentProduct.on_sale_price < currentProduct.price 
    ? currentProduct.on_sale_price 
    : currentProduct.price;

  // Creamos un ID único y seguro para el carrito
  const cartItemId = `${currentProduct.id}-${colorCera.replace(/ /g, '')}-${colorCemento.replace(/ /g, '')}-${aroma.replace(/ /g, '')}`;

  addToCart({
    id: cartItemId,
    productId: currentProduct.id,
    name: currentProduct.name,
    price: effectivePrice,
    image: document.getElementById('modal-image').src,
    quantity: 1,
    variation: { 
        cera: colorCera, 
        cemento: colorCemento, 
        aroma: aroma 
    }
  });

  // Aseguramos la resta del stock antes de cerrar
  if (currentProduct.stock_variations[variationKey] !== undefined) {
      currentProduct.stock_variations[variationKey] -= 1;
  }
  
  updateStockInfo();
  document.getElementById('modal-success-message').classList.remove('hidden');
  // Usamos requestAnimationFrame para asegurar que el mensaje se muestre antes de cerrar el modal
  requestAnimationFrame(() => {
      setTimeout(closeModal, 800);
  });
}