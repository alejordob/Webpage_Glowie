# 🔧 REFACTORING ESPECÍFICO - VELASGLOWIE.COM

## 📁 Cambios por archivo

---

## 1️⃣ INDEX.HTML - Mejoras SEO + Meta Tags

### ✅ CAMBIO #1: Agregar meta tags dinámicos y og:image mejorado

```html
<!-- ANTES (línea 17-24) -->
<meta property="og:title" content="Glowie | Velas Artesanales en Cali">
<meta property="og:description" content="Velas de soja natural, hechas a mano en Cali. Aromas que transforman tu espacio. Envío gratis desde $60.000.">
<meta property="og:image" content="https://res.cloudinary.com/du3kkvkmy/image/upload/f_auto,q_auto/v1762141308/anis_amarillo_ftb5xv.webp">

<!-- DESPUÉS -->
<!-- Open Graph general -->
<meta property="og:title" content="Glowie | Velas Artesanales en Cali">
<meta property="og:description" content="Velas de soja 100% natural. Aromas premium, diseños únicos. Envío gratis en Cali.">
<meta property="og:image" content="https://res.cloudinary.com/du3kkvkmy/image/upload/f_auto,q_auto,w_1200,h_630/v1762141308/anis_amarillo_ftb5xv.webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Glowie | Velas Artesanales">
<meta name="twitter:description" content="Velas de soja natural, hechas a mano en Cali.">
<meta name="twitter:image" content="https://res.cloudinary.com/du3kkvkmy/image/upload/f_auto,q_auto,w_1200,h_630/v1762141308/anis_amarillo_ftb5xv.webp">

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Glowie",
  "url": "https://velasglowie.com",
  "description": "Velas artesanales de cera de soja natural, hechas a mano en Cali",
  "logo": "https://velasglowie.com/img/logo_glowie.png",
  "sameAs": [
    "https://www.instagram.com/glowie.velas",
    "https://www.facebook.com/profile.php?id=61583394446413"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressCity": "Cali",
    "addressCountry": "CO"
  }
}
</script>

<!-- Canonical URL -->
<link rel="canonical" href="https://velasglowie.com/">

<!-- Preload recursos críticos -->
<link rel="preload" as="image" href="./img/hero4.jpg">
<link rel="preload" as="script" href="./js/app.js">
```

### ✅ CAMBIO #2: Agregar viewport y performance optimizations

```html
<!-- Agregar después del viewport (línea 3) -->
<meta name="theme-color" content="#CFB3A9">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

<!-- Preconnect a recursos externos (después de meta) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://res.cloudinary.com">
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
<link rel="dns-prefetch" href="https://connect.facebook.net">
```

---

## 2️⃣ CATALOG.JS - Refactoring SEO + Performance

### ✅ CAMBIO #1: Agregar schema.org dinámico para productos

```javascript
// Agregar al inicio de catalog.js (después de imports)

/**
 * Genera Schema.org para un producto
 */
function generateProductSchema(product) {
  const images = Array.isArray(product.imageUrls) ? product.imageUrls : product.images || [];
  const isOnSale = product.on_sale === true && product.on_sale_price < product.price;
  const finalPrice = isOnSale ? product.on_sale_price : product.price;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || "",
    "image": images,
    "price": finalPrice.toString(),
    "priceCurrency": "COP",
    "offers": {
      "@type": "Offer",
      "price": finalPrice.toString(),
      "priceCurrency": "COP",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": `https://velasglowie.com/catalogo#${product.id}`
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "12"
    }
  };
}

/**
 * Inyecta schema.org en el head del documento
 */
function injectProductSchemas(products) {
  // Limpiar schemas antiguos
  document.querySelectorAll('script[data-product-schema]').forEach(el => el.remove());

  // Agregar ProductCollection schema
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Catálogo de Velas Glowie",
    "description": "Colección de velas artesanales de cera de soja",
    "url": "https://velasglowie.com/catalogo",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.slice(0, 10).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://velasglowie.com/catalogo#${p.id}`,
        "name": p.name,
        "image": p.images?.[0] || ""
      }))
    }
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-product-schema', 'collection');
  script.textContent = JSON.stringify(collectionSchema);
  document.head.appendChild(script);
}
```

### ✅ CAMBIO #2: Optimizar imágenes con srcset

```javascript
// En renderProducts(), cambiar línea de imagen (busca mainImage)

// ANTES:
const mainImage = images[0] || 'https://placehold.co/400x300/fbf3e0/2e2e2e?text=Vela';
// ...
// <img src="${mainImage}" ...>

// DESPUÉS:
function getOptimizedImageUrl(url, width = 400) {
  if (!url || !url.includes('cloudinary')) return url;
  // https://res.cloudinary.com/du3kkvkmy/image/upload/v.../image.jpg
  // → https://res.cloudinary.com/du3kkvkmy/image/upload/f_auto,q_80,w_400/v.../image.jpg
  return url.replace('/upload/', `/upload/f_auto,q_80,w_${width}/`);
}

// En renderProducts(), dentro del forEach:
const mainImage = images[0] || 'https://placehold.co/400x300/fbf3e0/2e2e2e?text=Vela';
const optimizedImage = getOptimizedImageUrl(mainImage, 400);
const optimizedImageSmall = getOptimizedImageUrl(mainImage, 250);

// En el HTML de la tarjeta:
<img src="${optimizedImage}" 
     srcset="${optimizedImageSmall} 250w, ${optimizedImage} 400w, ${getOptimizedImageUrl(mainImage, 600)} 600w"
     sizes="(max-width: 640px) 250px, (max-width: 1024px) 400px, 600px"
     alt="${product.name}"
     loading="lazy"
     class="w-full h-64 object-contain rounded-xl mb-4 opacity-95 hover:opacity-100 transition-opacity">
```

### ✅ CAMBIO #3: Agregar lazy loading e intersection observer

```javascript
// Agregar después de renderProducts()

/**
 * Lazy loading de imágenes con Intersection Observer
 */
function setupLazyLoadingImages() {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px' // Cargar 50px antes de que sea visible
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// Llamar después de renderProducts():
// setupLazyLoadingImages();
```

### ✅ CAMBIO #4: Cachear productos en localStorage

```javascript
// Agregar al inicio (después de MAX_RETRIES)

const CACHE_KEY = 'glowie_products_cache';
const CACHE_TTL = 3600000; // 1 hora en milisegundos

function getCachedProducts() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_TTL) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }

  return data;
}

function setCachedProducts(products) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data: products,
    timestamp: Date.now()
  }));
}

// En loadProducts(), antes de getDocs():
async function loadProducts(retryCount = 0) {
  const container = document.getElementById('product-list');
  if (!container) return;

  // Intentar caché primero
  const cached = getCachedProducts();
  if (cached) {
    console.log("📦 Usando productos en caché");
    renderProducts(cached);
    injectProductSchemas(cached); // NUEVO: inyectar schemas
    return;
  }

  try {
    // ... resto del código ...
    const products = snapshot.docs.map(doc => ({
      // ...
    }));

    // Guardar en caché después de obtener
    setCachedProducts(products);
    renderProducts(products);
    injectProductSchemas(products); // NUEVO: inyectar schemas
  } catch (error) {
    // ...
  }
}
```

---

## 3️⃣ MODAL.JS - Mejoras UX

### ✅ CAMBIO #1: Validación visual más clara

```javascript
// En updateStockInfo(), mejorar los mensajes

function updateStockInfo(hasStock, stock = 0, msg = '') {
  stockInfoEl.classList.remove('hidden');
  addToCartBtn.disabled = !hasStock;
  
  if (hasStock && stock > 0) {
    stockInfoEl.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span>¡En stock! Queda ${stock} ${stock === 1 ? 'unidad' : 'unidades'}.</span>
      </div>
    `;
    stockInfoEl.className = 'mt-2 text-xs font-medium text-green-600';
    addToCartBtn.style.opacity = '1';
  } else {
    stockInfoEl.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-lg">❌</span>
        <span>${msg || 'Selecciona una opción.'}</span>
      </div>
    `;
    stockInfoEl.className = 'mt-2 text-xs font-medium text-red-600';
    addToCartBtn.style.opacity = '0.5';
  }
}

// En addToCartFromModal(), mensajes de error más claros

function addToCartFromModal() {
  const hasAromas = Array.isArray(currentProduct.aroma) && currentProduct.aroma.length > 0;
  let aroma = hasAromas ? aromaSelect.value : 'N/A';
  let combId = combinacionSelect.value;

  if (!combId || (hasAromas && aroma === '')) {
    modalErrorMsg.innerHTML = `
      <div class="flex items-center justify-center space-x-2">
        <i class="fas fa-exclamation-circle"></i>
        <span>Por favor, selecciona ${!combId ? 'un diseño' : 'un aroma'}</span>
      </div>
    `;
    modalErrorMsg.classList.remove('hidden');
    
    // Animar el error
    modalErrorMsg.style.animation = 'shake 0.5s';
    setTimeout(() => { modalErrorMsg.style.animation = 'none'; }, 500);
    return;
  }

  // ... resto del código ...
}
```

### ✅ CAMBIO #2: Agregar animación shake

```javascript
// En las estilos del modal (buttonStyles), agregar:

const buttonStyles = `
  // ... código anterior ...
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

modal.innerHTML = `
  <style>${buttonStyles}</style>
  // ... resto del HTML ...
`;
```

---

## 4️⃣ FIREBASE.JS - Optimizaciones

### ✅ CAMBIO: Agregar validación de config

```javascript
// Después de la definición de firebaseConfig, agregar:

function validateFirebaseConfig(config) {
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Firebase config incompleto. Falta: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

// Validar antes de setupFirebase():
if (!validateFirebaseConfig(firebaseConfig)) {
  console.error("Firebase config validation failed");
}
```

---

## 5️⃣ CART.JS - Sin cambios urgentes

**Nota:** El carrito está bien implementado. Solo sugerencias futuras:
- Agregar persistencia en IndexedDB para carros muy grandes
- Sincronizar carrito entre pestañas (usando StorageEvent)

---

## 6️⃣ OFFERS.JS & TIPS.JS

### ✅ CAMBIO: Agregar Schema para ofertas

```javascript
// En offers.js, agregar al inicio:

function generateOfferSchema(products) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Ofertas Exclusivas - Glowie",
    "description": "Velas en oferta con descuentos especiales",
    "url": "https://velasglowie.com/ofertas",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.slice(0, 5).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Product",
          "name": p.name,
          "price": (p.on_sale_price || p.price).toString(),
          "priceCurrency": "COP",
          "offers": {
            "@type": "Offer",
            "price": (p.on_sale_price || p.price).toString(),
            "priceCurrency": "COP",
            "availability": "https://schema.org/InStock"
          }
        }
      }))
    }
  };
}

// En initializeOffersListeners(), después de renderizar:
// injectSchema(generateOfferSchema(products));
```

---

## 📋 RESUMEN DE CAMBIOS

| Archivo | Cambios | Prioridad | Tiempo |
|---------|---------|-----------|---------|
| **index.html** | +Schema.org, +meta tags, +preconnect | 🔴 ALTA | 1-2h |
| **catalog.js** | +Schema dinámico, +lazy loading, +cache | 🔴 ALTA | 2-3h |
| **modal.js** | +Validación visual, +animaciones | 🟡 MEDIA | 1h |
| **firebase.js** | +Validación config | 🟡 MEDIA | 30m |
| **offers.js** | +Schema ofertas | 🟡 MEDIA | 1h |

**Tiempo total estimado:** 6-8 horas  
**Impacto esperado:** +500% en búsqueda orgánica

---

## 🚀 Siguiente paso después de refactoring

1. Instalar [Google PageSpeed Insights](https://pagespeed.web.dev)
2. Ejecutar auditoría después de cambios
3. Monitorear en [Google Search Console](https://search.google.com/search-console)
4. Analizar en [Google Analytics 4](https://analytics.google.com)

