// Importar todo el módulo cart.js para asegurar que window.Cart se inicialice
import * as CartModule from './cart.js';
// CORRECCIÓN CLAVE: Usamos isFirebaseReady y db de firebase.js
import { isFirebaseReady, db, getPublicCollectionPath } from './firebase.js'; 
// Importar las funciones necesarias de Firestore
import { getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Importar render/listeners del catálogo
import { renderCatalogPage, initializeCatalogListeners } from './pages/catalog.js';

// Importaciones de otras páginas
import { renderOffersPage, initializeOffersListeners } from './pages/offers.js';
import { renderTipsPage } from './pages/tips.js';

// Asignar window.Cart al inicio para que esté disponible globalmente
window.Cart = CartModule;

// --- CONFIGURACIÓN DE RUTAS ---
// Las claves son ahora los NOMBRES DE PÁGINA (ej: 'catalog'), no los fragmentos.
const pageRoutes = {
  'catalog': { render: renderCatalogPage, init: initializeCatalogListeners },
  'offers': { render: renderOffersPage, init: initializeOffersListeners },
  'tips': { render: renderTipsPage, init: null },
};

// -----------------------------------------
// ENRUTADOR PRINCIPAL (Expuesto al ámbito global)
// -----------------------------------------

/**
 * Función central llamada por el router de index.html cuando cambia la ruta (URL).
 * Esta función es la nueva forma de manejar la navegación.
 * @param {string} pageName - El nombre de la página a cargar ('catalog', 'offers', 'tips').
 */
window.loadAppContent = async function(pageName) {
  const appContent = document.getElementById('app-content');
  const route = pageRoutes[pageName];

  if (!appContent) {
    console.error("⚠️ No se encontró el contenedor #app-content en el HTML.");
    return;
  }
  
  // Limpiar y mostrar mensaje de carga
  appContent.innerHTML = `<div class="text-center p-20 text-gray-500">Cargando ${pageName}...</div>`;
  updateActiveLink(pageName); // Actualizar el enlace activo inmediatamente

  if (route) {
    try {
      console.log("Página detectada:", pageName);

      // Renderizar el contenido HTML
      appContent.innerHTML = route.render();

      // Inicializar los listeners y la lógica de la página (ej: cargar productos)
      if (route.init) await route.init();

      // Forzar la actualización del carrito al cargar ciertas páginas
      if (pageName === 'catalog') {
        window.Cart.updateCartUI(); 
      }

    } catch (error) {
      console.error(`❌ Error al renderizar la página ${pageName}:`, error);
      appContent.innerHTML = `
        <div class="text-center py-20 text-red-600">
          Error al cargar el contenido de ${pageName}. Verifique sus archivos JS.
        </div>`;
    }

    window.scrollTo(0, 0); // Subir al inicio de la página
  } else {
    // Manejo de 404
    appContent.innerHTML = `
      <div class="text-center py-20">
        <h2 class="text-5xl font-extrabold text-red-500">404</h2>
        <p class="text-2xl text-gray-600">Página no encontrada.</p>
        <a href="/catalogo" class="link-route text-amber-600 hover:underline mt-4 inline-block">Volver al Catálogo</a>
      </div>
    `;
    updateActiveLink('catalog'); // Activa el link del catálogo por defecto en 404
  }
}

// -----------------------------------------
// NAVEGACIÓN ACTIVA
// -----------------------------------------
/**
 * Actualiza la clase 'active' en los enlaces de navegación basándose en el nombre de la página.
 * @param {string} currentPageName - El nombre de la página activa ('catalog', 'offers', 'tips').
 */
function updateActiveLink(currentPageName) {
  // Mapeo inverso de nombres a rutas de URL para la comparación
  const urlMap = {
      'catalog': '/catalogo',
      'offers': '/ofertas',
      'tips': '/tips',
  };
  
  const currentPath = urlMap[currentPageName];

  document.querySelectorAll('.nav-link').forEach(link => {
    // Compara el atributo href del link con la ruta de URL de la página actual
    link.classList.toggle('active', link.getAttribute('href') === currentPath);
  });
  
  // También actualizamos el título de la página
  const title = document.querySelector('title');
  if (title) {
      const pageTitle = currentPageName.charAt(0).toUpperCase() + currentPageName.slice(1);
      title.textContent = `Glowie | ${pageTitle}`;
  }
}

// -----------------------------------------
// EVENTOS GLOBALES (SIN CAMBIOS)
// -----------------------------------------
function setupGlobalEvents() {
  // ELIMINADO: window.addEventListener('hashchange', handleRouting);
  // La navegación ahora se maneja en index.html con popstate y click listeners.

  const openCartBtn = document.getElementById('open-cart-btn');
  if (openCartBtn && !openCartBtn._listenerAdded) {
    openCartBtn.addEventListener('click', () => window.Cart.toggleCart(true));
    openCartBtn._listenerAdded = true;
  }

  const closeCartBtn = document.getElementById('close-cart-btn');
  if (closeCartBtn && !closeCartBtn._listenerAdded) {
    closeCartBtn.addEventListener('click', () => window.Cart.toggleCart(false));
    closeCartBtn._listenerAdded = true;
  }

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn && !checkoutBtn._listenerAdded) {
    checkoutBtn.addEventListener('click', () => {
      window.Cart.alertUser("¡Gracias por tu compra! (Simulación de pago completada)");
      localStorage.removeItem('candleCart');
      window.Cart.updateCartUI();
      window.Cart.toggleCart(false);
    });
    checkoutBtn._listenerAdded = true;
  }

  const checkoutWhatsappBtn = document.getElementById('checkout-whatsapp-btn');
  if (checkoutWhatsappBtn && !checkoutWhatsappBtn._listenerAdded) {
    checkoutWhatsappBtn.addEventListener('click', window.Cart.handleWhatsappCheckout);
    checkoutWhatsappBtn._listenerAdded = true;
  }
}

// -----------------------------------------
// INICIALIZACIÓN PRINCIPAL
// -----------------------------------------
async function init() {
  try {
    // Esperar a que Firebase esté listo
    await isFirebaseReady();
    
    window.Cart.updateCartUI();
    setupGlobalEvents();
    
    // NOTA: La primera carga de contenido (el equivalente a handleRouting) 
    // se maneja ahora en el script de index.html, que llama a window.loadAppContent 
    // después de inicializar el router. No necesitamos llamarla aquí.

  } catch (error) {
    console.error("⚠️ Error durante la inicialización:", error);
  }
}

document.addEventListener('DOMContentLoaded', init);
