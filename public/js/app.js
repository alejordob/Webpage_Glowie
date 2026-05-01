// Solo los módulos críticos cargan al inicio
import * as CartModule from './cart.js';
import { isFirebaseReady, db, getPublicCollectionPath } from './firebase.js';
import { getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

window.Cart = CartModule;
window._glowieNavCount = 0;

// Cada página se carga dinámicamente solo cuando se navega a ella
const pageRoutes = {
  'home':     () => import('./pages/home.js'),
  'catalog':  () => import('./pages/catalog.js'),
  'offers':   () => import('./pages/offers.js'),
  'tips':     () => import('./pages/tips.js'),
  'aromas':   () => import('./pages/aromas.js'),
  'nosotros': () => import('./pages/nosotros.js'),
  'product':  () => import('./pages/product.js'),
  'privacy':  () => import('./pages/policies.js'),
  'changes':  () => import('./pages/policies.js'),
};

// -----------------------------------------
// QUERY PARAMS UTILITIES
// -----------------------------------------

/**
 * Extrae los parámetros de filtro de la URL
 * @returns {Object} Objeto con aroma, categoria, y disponible
 */
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    aroma: params.get('aroma') || '',
    categoria: params.get('categoria') || '',
    disponible: params.get('disponible') === 'true',
  };
}

/**
 * Actualiza la URL con los parámetros de filtro actuales
 * @param {Object} filters - Objeto con aroma, categoria, disponible
 */
function pushFilterParams(filters) {
  const params = new URLSearchParams();
  if (filters.aroma) params.append('aroma', filters.aroma);
  if (filters.categoria) params.append('categoria', filters.categoria);
  if (filters.disponible) params.append('disponible', 'true');

  const queryString = params.toString();
  const newUrl = queryString ? `/catalogo?${queryString}` : '/catalogo';
  window.history.pushState({ filters }, '', newUrl);
}


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
  const routeLoader = pageRoutes[pageName];

  if (!appContent) {
    console.error("⚠️ No se encontró el contenedor #app-content en el HTML.");
    return;
  }

  // Ocultar todos los fallbacks estáticos cuando JS carga
  document.getElementById('aromas-fallback')?.classList.add('hidden');
  document.getElementById('tips-fallback')?.classList.add('hidden');

  // Limpiar efectos de la home si se navega a otra página
  if (pageName !== 'home') {
    window._homeHeaderCleanup?.();
    window._homeHeaderCleanup = null;
    document.getElementById('home-styles')?.remove();
  }

  updateActiveLink(pageName);

  // Fade-out del contenido actual solo si ya hay contenido JS renderizado
  // (no aplicar si es el fallback estático del SSR)
  const isStaticFallback = appContent.querySelector('h1') && !appContent.querySelector('.catalog-product-card, .tips-card, .nos-section');
  if (!isStaticFallback && appContent.children.length > 0) {
    appContent.classList.add('page-leaving');
    await new Promise(r => setTimeout(r, 180));
    appContent.classList.remove('page-leaving');
  }

  if (routeLoader) {
    try {
      // Cargar el módulo de la página dinámicamente (solo cuando se necesita)
      const mod = await routeLoader();

      // Elegir render/init según la página (policies tiene dos renders)
      const renderFn = pageName === 'changes' ? mod.renderChangePolicy : (mod.renderHomePage || mod.renderCatalogPage || mod.renderOffersPage || mod.renderTipsPage || mod.renderAromasPage || mod.renderNosotrosPage || mod.renderProductPage || mod.renderPrivacyPolicy);
      const initFn   = mod.initializeHomeListeners || mod.initializeCatalogListeners || mod.initializeOffersListeners || mod.initializeTipsListeners || mod.initializeAromasListeners || mod.initializeNosotrosListeners || mod.initializeProductListeners || mod.initializePoliciesListeners;

      appContent.innerHTML = renderFn();
      appContent.style.animation = 'none';

      if (window._glowieNavCount > 1) {
        appContent.offsetHeight;
        appContent.style.animation = 'glowiePageIn 0.25s ease-out';
      }
      appContent.classList.add('glowie-ready');
      window._glowieNavCount = (window._glowieNavCount || 0) + 1;

      if (initFn) await initFn();

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
      <div class="flex flex-col items-center justify-center text-center py-24 px-4">
        <div class="w-24 h-24 rounded-full flex items-center justify-center mb-6"
             style="background: var(--color-fondo);">
          <i class="fas fa-map-marker-alt text-4xl" style="color: var(--color-cinna); opacity: 0.35;"></i>
        </div>
        <p class="text-7xl font-black mb-4" style="color: var(--color-cinna); opacity: 0.15;">404</p>
        <h2 class="text-3xl font-extrabold mb-2" style="color: var(--color-cinna);">Página no encontrada</h2>
        <p class="text-gray-500 text-sm mb-8 max-w-sm">
          Esta página no existe o fue movida. Puedes explorar nuestras velas artesanales desde el catálogo.
        </p>
        <a href="/catalogo" class="link-route px-8 py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90"
           style="background: var(--color-cinna);">
          Ver catálogo
        </a>
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
const PAGE_META = {
  home: {
    title: 'Glowie — Velas Artesanales en Cali | Cera de Soja Natural',
    description: 'Velas artesanales de cera de soja 100% natural, hechas a mano en Cali. Aromas premium y diseños únicos de cemento. Envío gratis desde $60.000.',
    canonical: 'https://velasglowie.com/',
  },
  catalog: {
    title: 'Catálogo de Velas Artesanales | Glowie',
    description: 'Velas artesanales de cera de soja 100% natural. Aromas premium: coco, vainilla, bambú, café y más. Diseños únicos, hechas a mano en Cali. Envío gratis desde $60.000.',
    canonical: 'https://velasglowie.com/catalogo',
  },
  offers: {
    title: 'Ofertas en Velas Artesanales | Glowie',
    description: 'Descuentos exclusivos en velas artesanales de cera de soja natural. Encuentra las mejores promociones en velas aromáticas hechas a mano en Cali.',
    canonical: 'https://velasglowie.com/ofertas',
  },
  tips: {
    title: 'Tips & Cuidado de Velas | Glowie',
    description: 'Guía completa para cuidar tus velas artesanales de cera de soja. Consejos de uso, duración y mantenimiento para sacarles el máximo provecho.',
    canonical: 'https://velasglowie.com/tips',
  },
  aromas: {
    title: 'Guía de Aromas — Velas Aromáticas en Cali | Glowie',
    description: 'Descubre qué aroma de vela es perfecto para ti. Bambú, coco & vainilla, durazno, café mocka y más. Guía completa de fragancias artesanales en Cali.',
    canonical: 'https://velasglowie.com/aromas',
  },
  nosotros: {
    title: 'Nuestra Historia | Glowie',
    description: 'Conoce la historia de Glowie. Velas artesanales de cera de soja 100% natural, hechas a mano con dedicación en Cali, Colombia.',
    canonical: 'https://velasglowie.com/nosotros',
  },
  product: {
    title: 'Vela Artesanal | Glowie',
    description: 'Vela artesanal de cera de soja natural, hecha a mano en Cali. Aromas premium y diseños únicos.',
    canonical: 'https://velasglowie.com/catalogo',
  },
  privacy: {
    title: 'Política de Privacidad | Glowie',
    description: 'Política de privacidad de Glowie. Cómo protegemos tus datos y usamos Google Analytics y Meta Pixel.',
    canonical: 'https://velasglowie.com/politica-privacidad',
  },
  changes: {
    title: 'Política de Cambios | Glowie',
    description: 'Política de cambios de Glowie. Plazo, condiciones y cómo solicitar un cambio en tu vela artesanal.',
    canonical: 'https://velasglowie.com/politica-cambios',
  },
};

function updateActiveLink(currentPageName) {
  const urlMap = {
    'home':    '/',
    'catalog': '/catalogo',
    'offers': '/ofertas',
    'tips': '/tips',
    'aromas': '/aromas',
    'nosotros': '/nosotros',
    'product': '/catalogo',
    'privacy': '/politica-privacidad',
    'changes': '/politica-cambios',
  };

  const currentPath = urlMap[currentPageName];
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === currentPath);
  });

  // Actualizar title, meta description y canonical por página
  const meta = PAGE_META[currentPageName] || PAGE_META.catalog;

  document.title = meta.title;

  let descTag = document.querySelector('meta[name="description"]');
  if (descTag) descTag.setAttribute('content', meta.description);

  let canonicalTag = document.querySelector('link[rel="canonical"]');
  if (canonicalTag) {
    // Para páginas de producto usar la URL real, no el canonical genérico de /catalogo
    const canonical = currentPageName === 'product'
      ? 'https://velasglowie.com' + window.location.pathname
      : meta.canonical;
    canonicalTag.setAttribute('href', canonical);
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
    // Configurar eventos globales inmediatamente (no dependen de Firebase)
    window.Cart.updateCartUI();
    setupGlobalEvents();

    // Manejar el botón atrás/adelante del navegador para restaurar filtros
    window.addEventListener('popstate', (event) => {
      if (event.state?.filters) {
        const { aroma, categoria } = event.state.filters;
        import('./pages/catalog.js').then(mod => mod.applyFiltersFromUrl({ aroma, categoria }));
      }
    });

    // Esperar Firebase en segundo plano — loadAppContent ya está disponible
    // desde que el módulo cargó, así que el router de index.html puede llamarlo
    // sin esperar. Los productos se cargan cuando Firebase esté listo.
    isFirebaseReady().catch(e => console.warn('Firebase init error:', e));

    // NOTA: La primera carga de contenido (el equivalente a handleRouting)
    // se maneja ahora en el script de index.html, que llama a window.loadAppContent
    // después de inicializar el router. No necesitamos llamarla aquí.

  } catch (error) {
    console.error("⚠️ Error durante la inicialización:", error);
  }
}

document.addEventListener('DOMContentLoaded', init);

// -----------------------------------------
// EXPORTAR FUNCIONES DE FILTRO
// -----------------------------------------
export { getQueryParams, pushFilterParams };
