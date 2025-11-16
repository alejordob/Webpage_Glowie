/**
 * js/pages/catalog.js
 * -------------------------------------------------------------
 * Catálogo principal del sitio. Carga productos desde Firestore
 * y renderiza tarjetas de productos.
 * -------------------------------------------------------------
 */

// =============================
// Importaciones
// =============================
import { addToCart, formatPriceCOP } from '../cart.js';
import { getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { openModal } from './modal.js';

// =============================
// Configuración
// =============================
const MAX_RETRIES = 10;
const BASE_DELAY_MS = 80;

// =============================
// Renderizado de Productos
// =============================

function handleOpenModal(productId, products) {
  const productData = products.find(p => p.id === productId);
  if (productData) {
    openModal(productData); 
  }
}

// === ALMACENAR TODOS LOS PRODUCTOS ===
let allProducts = [];

export function setAllProducts(products) {
  allProducts = [...products];
}

// === FILTRO POR AROMA (SOPORTA ARRAY) ===
function filterByAroma() {
  const query = document.getElementById('aroma-filter')?.value.trim().toLowerCase() || '';
  if (!query) {
    renderProducts(allProducts);
    return;
  }

  const filtered = allProducts.filter(product => {
    if (Array.isArray(product.aroma)) {
      return product.aroma.some(a => 
        typeof a === 'string' && a.toLowerCase().includes(query)
      );
    }
    if (typeof product.aroma === 'string') {
      return product.aroma.toLowerCase().includes(query);
    }
    return false;
  });

  renderProducts(filtered);
}

function renderProducts(products) {
  const productsContainer = document.getElementById('product-list');
  if (!productsContainer) return;

  // Guardar todos los productos la primera vez
  if (allProducts.length === 0 && products.length > 0) {
    setAllProducts(products);
  }

  // Sin resultados
  if (products.length === 0) {
    const query = document.getElementById('aroma-filter')?.value || '';
    productsContainer.innerHTML = `
      <div class="col-span-full text-center p-10 text-gray-600">
        <i class="fas fa-search text-4xl mb-4 text-gray-400"></i>
        <p class="text-lg">No encontramos velas con aroma "<strong>${query}</strong>"</p>
        <p class="text-sm mt-2">Prueba con: coco, vainilla, bambú, café...</p>
      </div>`;
    return;
  }

  productsContainer.innerHTML = '';

  products.forEach((product) => {
    const isOnSale = product.on_sale === true && product.on_sale_price && product.on_sale_price < product.price;
    const isNewRelease = product.isNew === true;

    const originalPrice = formatPriceCOP(product.price);
    const salePrice = formatPriceCOP(product.on_sale_price || product.price);
    const discountPercent = isOnSale ? Math.round(((parseFloat(product.price) - parseFloat(product.on_sale_price)) / parseFloat(product.price)) * 100) : 0;
    const images = Array.isArray(product.imageUrls) ? product.imageUrls : product.images ? product.images : [];
    const placeholderImg = 'https://placehold.co/400x300/fbf3e0/2e2e2e?text=Vela';
    const mainImage = images[0] || placeholderImg;

    let tagsHtml = '';
    let discountTopClass = "top-3";

    if (isNewRelease) {
      tagsHtml += `
        <span class="tag-new absolute top-3 right-3 text-black text-sm font-extrabold px-3 py-1 rounded-full shadow-md z-10 whitespace-nowrap"
              style="background-color: #FFFBF0;">
          NUEVO
        </span>`;
    }

    if (isNewRelease && isOnSale) {
      discountTopClass = "top-12";
    }

    if (isOnSale && discountPercent > 0) {
      tagsHtml += `
        <span class="tag-discount absolute ${discountTopClass} right-3 text-black text-sm font-extrabold px-3 py-1 rounded-full shadow-md z-10 whitespace-nowrap"
              style="background-color: var(--color-fondo);">
          ${discountPercent}% OFF
        </span>`;
    }

    const productCard = `
      <div class="catalog-card-clickable shadow-xl rounded-2xl p-4 text-center border-2 border-transparent transform hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden cursor-pointer" 
           style="background-color: var(--color-cinna);"
           data-product-id="${product.id}">
        ${tagsHtml}
        <img src="${mainImage}" alt="${product.name}" 
             class="w-full h-64 object-contain rounded-xl mb-4 opacity-95 transition-opacity duration-300 hover:opacity-100"
             onerror="this.onerror=null; this.src='${placeholderImg}';">
        <h3 class="text-xl font-semibold text-white mb-1 line-clamp-1">${product.name}</h3>
        <p class="text-white text-sm mb-2 line-clamp-2">${product.description || ''}</p>
        <div class="mb-4">
          ${isOnSale ? `
            <span class="text-sm text-white line-through mr-2">${originalPrice}</span>
            <span class="font-extrabold text-2xl" style="color: var(--color-fondo);">${salePrice}</span>` : `
            <p class="text-2xl font-extrabold text-white">${originalPrice}</p>`}
        </div>
        <button class="open-modal-btn w-full px-4 py-2 rounded-xl transition duration-200 font-medium z-20"
                data-product-id="${product.id}"
                style="background-color: var(--color-fondo); color: var(--color-cinna);"
                onmouseover="this.style.backgroundColor='var(--color-gris-crema)'; this.style.color='var(--color-cinna)';"
                onmouseout="this.style.backgroundColor='var(--color-fondo)'; this.style.color='var(--color-cinna)';">
          Ver Detalles
        </button>
      </div>
    `;
    productsContainer.insertAdjacentHTML('beforeend', productCard);
  });

  // Listeners: Tarjeta completa
  productsContainer.querySelectorAll('.catalog-card-clickable').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const id = card.dataset.productId;
      handleOpenModal(id, products);
    });
  });

  // Listeners: Botón "Ver Detalles"
  productsContainer.querySelectorAll('.open-modal-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = button.dataset.productId;
      handleOpenModal(id, products);
    });
  });

  // === REINICIAR FILTRO DE AROMA (SIN BORRAR EL TEXTO) ===
  const filterInput = document.getElementById('aroma-filter');
  if (filterInput) {
    filterInput.removeEventListener('input', filterByAroma);
    filterInput.addEventListener('input', filterByAroma);
    // ELIMINADO: filterInput.value = ''; → ¡ESTO BORRABA EL INPUT!
  }
}

// =============================
// Carga desde Firestore
// =============================
async function loadProducts(retryCount = 0) {
  const productsContainer = document.getElementById('product-list');

  try {
    const app = getApp();
    const db = getFirestore(app);
    console.log("Firestore inicializado correctamente (Catálogo).");

    if (productsContainer) {
      productsContainer.innerHTML = `
        <div class="col-span-full text-center p-10 text-gray-600">
          Cargando productos...
        </div>`;
    }

    const productsRef = collection(db, 'products');
    const querySnapshot = await getDocs(productsRef);
    
    const products = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      imageUrls: doc.data().imageUrls || doc.data().images || [],
    }));

    console.log(`Productos recibidos (${products.length}):`, products.map(p => p.name));

    renderProducts(products);
  } catch (error) {
    if (
      (error.code === 'app/no-app' || error.message.includes('No Firebase App')) &&
      retryCount < MAX_RETRIES
    ) {
      const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
      console.debug(`Firebase no disponible. Reintentando en ${delay}ms (Intento ${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => loadProducts(retryCount + 1), delay);
      return;
    }

    console.error("Error crítico de conexión Firestore:", error);
    if (productsContainer) {
      productsContainer.innerHTML = `
        <div class="col-span-full text-center p-10 rounded-lg border border-red-200 firebase-error"
             style="background-color: var(--color-fondo); color: var(--color-cinna);">
          <p class="font-bold text-lg mb-2">Error crítico: No se pudieron cargar los productos.</p>
          <p class="text-sm">Verifica la inicialización de Firebase y la colección 'products'.</p>
          <p class="text-xs mt-2" style="color: var(--color-cinna);">Detalle: ${error.message}</p>
        </div>`;
    }
  }
}

// =============================
// Exportaciones
// =============================
export const initializeCatalogListeners = async () => {
  console.log("Inicializando listeners del catálogo...");
  await loadProducts();
};

export const renderCatalogPage = () => `
  <!-- HERO BANNER -->
  <div class="relative w-full h-[50vh] bg-cover bg-center flex items-center justify-center overflow-hidden mb-12 rounded-xl shadow-2xl"
       style="background-image: url('img/hero4.jpg'); background-position: center top;">
    <div class="absolute inset-0 bg-black/40"></div>
    <div class="relative z-10 text-center p-4 max-w-2xl mx-auto">
      <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
        Ilumina tu Espacio con Esencia
      </h2>
      <p class="text-lg md:text-xl text-white/90 mb-8 drop-shadow-md hidden sm:block">
        Descubre nuestra colección exclusiva de velas, diseñadas para transformar momentos cotidianos en experiencias sensoriales únicas.
      </p>
    </div>
  </div>

  <!-- Catálogo de Productos -->
  <section class="pt-10 pb-16">
    <div class="text-center max-w-4xl mx-auto mb-12 px-4">
      <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight pb-3" style="color: var(--color-cinna);">
        Nuestra Colección de Velas Artesanales
      </h1>
      <div class="mx-auto w-24 h-1 rounded-full my-4" style="background-color: var(--color-fondo);"></div>
      <p class="text-lg md:text-xl text-gray-600 mt-4">
        Encuentra la fragancia perfecta para iluminar tu hogar y crear el ambiente ideal.
      </p>
    </div>

    <!-- FILTRO POR AROMA (CORREGIDO) -->
  <div class="max-w-2xl mx-auto mb-8 px-4">
    <div class="relative">
      <input type="text" id="aroma-filter" placeholder="Busca por aroma: coco, vainilla, bambú, cafe..." 
            class="w-full px-5 py-3 pl-12 rounded-full border-2 border-gray-200 focus:border-amber-500 focus:outline-none text-lg transition-all duration-300 shadow-sm"
            style="background-color: var(--color-fondo);"/>
      <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
    </div>
  </div>

    <div id="product-list" 
         class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-4">
      <div class="col-span-full text-center p-10 text-gray-400">Cargando productos...</div>
    </div>
  </section> 

  <!-- SECCIÓN PERSONALIZADAS -->
  <section class="w-full py-16 px-4 mt-12" style="background-color: var(--color-cinna);">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4">
        ¿Velas personalizadas o para eventos?
      </h2>
      <p class="text-xl text-white/90 mb-8">
        Dale un toque único a tus celebraciones y regalos; 
        estamos listos para hacer tu idea realidad.
      </p>
      <a href="https://wa.me/3156265846?text=Hola,%20me%20gustaría%20recibir%20información%20sobre%20las%20velas%20personalizadas%20o%20Eventos."
         class="inline-block px-10 py-4 text-lg font-bold rounded-full shadow-2xl transition duration-300 ease-in-out transform hover:scale-105"
         style="background-color: var(--color-fondo); color: var(--color-cinna);">
        Contáctanos aquí
      </a>
      <p class="text-sm text-white/70 mt-4">
        Respondemos en menos de 24 horas.
      </p>
    </div>
  </section>
`;