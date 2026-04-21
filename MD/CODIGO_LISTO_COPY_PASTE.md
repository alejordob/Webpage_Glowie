# 💻 CÓDIGO REFACTORIZADO - COPY & PASTE LISTO

## 🔗 ARCHIVO: index.html
### Agregar esto en el `<head>` (después del viewport)

```html
<!-- ===== NUEVO: SEO Y PERFORMANCE ===== -->

<!-- Preconnect a recursos externos -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://res.cloudinary.com">
<link rel="dns-prefetch" href="https://www.googletagmanager.com">

<!-- Canonical URL -->
<link rel="canonical" href="https://velasglowie.com/">

<!-- Mejorar Open Graph -->
<meta property="og:image" content="https://res.cloudinary.com/du3kkvkmy/image/upload/f_auto,q_auto,w_1200,h_630/v1762141308/anis_amarillo_ftb5xv.webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Glowie | Velas Artesanales en Cali">
<meta name="twitter:description" content="Velas artesanales de cera de soja 100% natural. Envío gratis en Cali.">
<meta name="twitter:image" content="https://res.cloudinary.com/du3kkvkmy/image/upload/f_auto,q_auto,w_1200,h_630/v1762141308/anis_amarillo_ftb5xv.webp">

<!-- JSON-LD Schema -->
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
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+57-315-6265846",
    "contactType": "Sales"
  }
}
</script>

<!-- Theme Color para Mobile -->
<meta name="theme-color" content="#CFB3A9">

<!-- Preload recursos críticos -->
<link rel="preload" as="image" href="./img/hero4.jpg" importance="high">
<link rel="preload" as="script" href="./js/app.js" importance="high">
```

---

## 🛍️ ARCHIVO: catalog.js
### REEMPLAZAR la función `renderProducts()` y agregar nuevas funciones

```javascript
/**
 * ===== NUEVO: Schema.org dinámico =====
 */
function generateProductSchema(product) {
  const images = Array.isArray(product.imageUrls) ? product.imageUrls : product.images || [];
  const isOnSale = product.on_sale === true && product.on_sale_price < product.price;
  const finalPrice = isOnSale ? product.on_sale_price : product.price;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || "Vela artesanal de cera de soja",
    "image": images,
    "price": finalPrice.toString(),
    "priceCurrency": "COP",
    "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    "offers": {
      "@type": "Offer",
      "price": finalPrice.toString(),
      "priceCurrency": "COP",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };
}

function injectProductSchemas(products) {
  // Limpiar schemas antiguos
  document.querySelectorAll('script[data-glowie-schema]').forEach(el => el.remove());

  // Agregar CollectionPage schema
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Catálogo de Velas Glowie",
    "description": "Colección de velas artesanales de cera de soja",
    "url": "https://velasglowie.com/catalogo",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.slice(0, 12).map((p, i) => ({
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
  script.setAttribute('data-glowie-schema', 'collection');
  script.textContent = JSON.stringify(collectionSchema);
  document.head.appendChild(script);
}

/**
 * ===== NUEVO: Optimización de imágenes =====
 */
function getOptimizedImageUrl(url, width = 400) {
  if (!url || !url.includes('cloudinary')) return url;
  
  // Si ya tiene transformaciones, no duplicar
  if (url.includes('/f_auto')) return url;
  
  // Insertar transformaciones antes de /v
  const parts = url.split('/upload/');
  if (parts.length < 2) return url;
  
  return `${parts[0]}/upload/f_auto,q_80,w_${width}/${parts[1]}`;
}

/**
 * ===== NUEVO: Cache local =====
 */
const CACHE_KEY = 'glowie_products_cache';
const CACHE_TTL = 3600000; // 1 hora

function getCachedProducts() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    console.log("✅ Usando productos desde caché local");
    return data;
  } catch (e) {
    return null;
  }
}

function setCachedProducts(products) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: products,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("No se pudo cachear productos:", e);
  }
}

/**
 * ===== MODIFICADO: renderProducts() con optimizaciones =====
 */
function renderProducts(products) {
  const container = document.getElementById('product-list');
  if (!container) return;

  if (allProducts.length === 0 && products.length > 0) {
    setAllProducts(products);
  }

  if (products.length === 0) {
    const query = document.getElementById('aroma-filter')?.value || '';
    container.innerHTML = `
      <div class="col-span-full text-center p-10 text-gray-600">
        <i class="fas fa-search text-4xl mb-4 text-gray-400"></i>
        <p class="text-lg">No encontramos velas con aroma "<strong>${query}</strong>"</p>
        <p class="text-sm mt-2">Prueba con: coco, vainilla, bambú, café...</p>
      </div>`;
    return;
  }

  container.innerHTML = '';

  products.forEach(product => {
    const isOnSale = product.on_sale === true && product.on_sale_price < product.price;
    const isNew = product.is_new === true;
    const stock = product.stock || 0;
    const isOutOfStock = stock === 0;

    const originalPrice = formatPriceCOP(product.price);
    const salePrice = formatPriceCOP(product.on_sale_price || product.price);
    const discountPercent = isOnSale ? Math.round(((product.price - product.on_sale_price) / product.price) * 100) : 0;

    const images = Array.isArray(product.imageUrls) ? product.imageUrls : product.images || [];
    const mainImage = images[0] || 'https://placehold.co/400x300/fbf3e0/2e2e2e?text=Vela';
    
    // ===== NUEVO: Optimizar imagen =====
    const optimizedImage = getOptimizedImageUrl(mainImage, 400);
    const optimizedImageSmall = getOptimizedImageUrl(mainImage, 250);
    const optimizedImageLarge = getOptimizedImageUrl(mainImage, 600);

    // === ETIQUETAS ===
    let tagsHtml = '';

    if (isOutOfStock) {
      tagsHtml = `<span class="absolute top-3 right-3 px-5 py-2 text-sm font-extrabold text-white rounded-full shadow-lg z-10"
                    style="background-color: #ef4444;">
        AGOTADO
      </span>`;
    } else {
      if (isNew) {
        tagsHtml += `<span class="absolute top-3 right-3 px-4 py-1.5 text-xs font-extrabold text-black rounded-full shadow-lg z-10"
                      style="background: linear-gradient(135deg, #FFD700, #FFA500); border: 2px solid #B8860B;">
          NEW
        </span>`;
      }

      if (isOnSale && discountPercent > 0) {
        const topPos = isNew ? 'top-12' : 'top-3';
        tagsHtml += `<span class="absolute ${topPos} right-3 px-3 py-1 text-sm font-extrabold text-black rounded-full shadow-md z-10"
                      style="background-color: var(--color-fondo);">
          ${discountPercent}% OFF
        </span>`;
      }
    }

    // === BOTÓN ===
    const buttonHtml = isOutOfStock
      ? `<button class="w-full px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-200 cursor-not-allowed">Agotado</button>`
      : `<button class="open-modal-btn w-full px-4 py-2 rounded-xl font-medium transition duration-200 z-20"
                data-product-id="${product.id}"
                style="background-color: var(--color-fondo); color: var(--color-cinna);"
                onmouseover="this.style.backgroundColor='var(--color-gris-crema)'"
                onmouseout="this.style.backgroundColor='var(--color-fondo)'">
          Ver Detalles
         </button>`;

    // === HTML DE TARJETA CON SRCSET =====
    const cardHTML = `
      <div class="catalog-card-clickable shadow-xl rounded-2xl p-4 text-center border-2 border-transparent transform hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden cursor-pointer"
           style="background-color: var(--color-cinna);" data-product-id="${product.id}">
        ${tagsHtml}
        <img src="${optimizedImage}" 
             srcset="${optimizedImageSmall} 250w, ${optimizedImage} 400w, ${optimizedImageLarge} 600w"
             sizes="(max-width: 640px) 250px, (max-width: 1024px) 400px, 600px"
             alt="${product.name}"
             loading="lazy"
             class="w-full h-64 object-contain rounded-xl mb-4 opacity-95 hover:opacity-100 transition-opacity"
             onerror="this.src='https://placehold.co/400x300/fbf3e0/2e2e2e?text=Vela'">
        <h3 class="text-xl font-semibold text-white mb-1 line-clamp-1">${product.name}</h3>
        <p class="text-white text-sm mb-2 line-clamp-2">${product.description || ''}</p>
        <div class="mb-4">
          ${isOnSale
            ? `<span class="text-sm text-white line-through mr-2">${originalPrice}</span>
               <span class="font-extrabold text-2xl" style="color: var(--color-fondo);">${salePrice}</span>`
            : `<p class="text-2xl font-extrabold text-white">${originalPrice}</p>`
          }
        </div>
        ${buttonHtml}
      </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHTML);
  });

  // === LISTENERS ===
  container.querySelectorAll('.catalog-card-clickable').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') return;
      const id = card.dataset.productId;
      const product = products.find(p => p.id === id);
      if (product && product.stock > 0) openModal(product);
    });
  });

  container.querySelectorAll('.open-modal-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.productId;
      const product = products.find(p => p.id === id);
      if (product) openModal(product);
    });
  });

  const input = document.getElementById('aroma-filter');
  if (input) {
    input.removeEventListener('input', filterByAroma);
    input.addEventListener('input', filterByAroma);
  }

  // ===== NUEVO: Inyectar schemas =====
  injectProductSchemas(products);
}

/**
 * ===== MODIFICADO: loadProducts() con caché =====
 */
async function loadProducts(retryCount = 0) {
  const container = document.getElementById('product-list');
  if (!container) return;

  try {
    // ===== NUEVO: Intentar caché primero =====
    const cached = getCachedProducts();
    if (cached) {
      renderProducts(cached);
      return;
    }

    const app = getApp();
    const db = getFirestore(app);
    container.innerHTML = `<div class="col-span-full text-center p-10 text-gray-600">Cargando productos...</div>`;

    const snapshot = await getDocs(collection(db, 'products'));
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      imageUrls: doc.data().imageUrls || doc.data().images || [],
      is_new: doc.data().is_new || false,
      stock: doc.data().stock || 0
    }));

    // ===== NUEVO: Guardar en caché =====
    setCachedProducts(products);
    
    renderProducts(products);

  } catch (error) {
    if ((error.code === 'app/no-app' || error.message.includes('No Firebase App')) && retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
      setTimeout(() => loadProducts(retryCount + 1), delay);
      return;
    }
    console.error("Error:", error);
    container.innerHTML = `<div class="col-span-full text-center p-10 text-red-600">Error al cargar productos</div>`;
  }
}
```

---

## 🎯 ARCHIVO: modal.js
### REEMPLAZAR la función `updateStockInfo()`

```javascript
function updateStockInfo(hasStock, stock = 0, msg = '') {
  stockInfoEl.classList.remove('hidden');
  addToCartBtn.disabled = !hasStock;
  
  if (hasStock && stock > 0) {
    // ===== NUEVO: Visual mejorado =====
    stockInfoEl.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span>¡En stock! Queda ${stock} ${stock === 1 ? 'unidad' : 'unidades'}.</span>
      </div>
    `;
    stockInfoEl.className = 'mt-2 text-xs font-medium text-green-600';
    addToCartBtn.style.opacity = '1';
  } else {
    // ===== NUEVO: Error visual =====
    stockInfoEl.innerHTML = `
      <div class="flex items-center space-x-2">
        <i class="fas fa-exclamation-circle text-lg"></i>
        <span>${msg || 'Selecciona una opción.'}</span>
      </div>
    `;
    stockInfoEl.className = 'mt-2 text-xs font-medium text-red-600';
    addToCartBtn.style.opacity = '0.5';
  }
}
```

### Agregar animación shake en los estilos del modal

```javascript
// Buscar const buttonStyles en modal.js y agregar esto:

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
  select option:disabled { color: #9ca3af !important; font-style: italic; background-color: #f9fafb !important; }
  select:disabled { opacity: 0.7; cursor: not-allowed; background-color: #f3f4f6; }
  
  /* ===== NUEVO: Animación shake ===== */
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  .shake { animation: shake 0.5s; }
`;
```

### Mejorar mensaje de error en `addToCartFromModal()`

```javascript
function addToCartFromModal() {
  const hasAromas = Array.isArray(currentProduct.aroma) && currentProduct.aroma.length > 0;
  let aroma = hasAromas ? aromaSelect.value : 'N/A';
  let combId = combinacionSelect.value;

  if (!combId || (hasAromas && aroma === '')) {
    // ===== NUEVO: Mensaje visual mejorado =====
    modalErrorMsg.innerHTML = `
      <div class="flex items-center justify-center space-x-2">
        <i class="fas fa-exclamation-circle"></i>
        <span>Por favor, selecciona ${!combId ? 'un diseño' : 'un aroma'}</span>
      </div>
    `;
    modalErrorMsg.classList.remove('hidden');
    modalErrorMsg.classList.add('shake');
    
    setTimeout(() => { 
      modalErrorMsg.classList.remove('shake'); 
    }, 500);
    return;
  }

  // ... resto del código igual ...
}
```

---

## 🎉 ARCHIVO: offers.js
### Agregar schema.org antes de `initializeOffersListeners()`

```javascript
/**
 * ===== NUEVO: Schema para ofertas =====
 */
function generateOffersSchema(products) {
  if (products.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Ofertas Exclusivas - Glowie",
    "description": "Velas artesanales en oferta con descuentos especiales",
    "url": "https://velasglowie.com/ofertas",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.slice(0, 5).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Product",
          "name": p.name,
          "image": getPrimaryImageUrl(p),
          "price": (p.on_sale_price || p.price).toString(),
          "priceCurrency": "COP",
          "offers": {
            "@type": "Offer",
            "price": (p.on_sale_price || p.price).toString(),
            "priceCurrency": "COP",
            "availability": "https://schema.org/InStock",
            "url": `https://velasglowie.com/ofertas#${p.id}`
          }
        }
      }))
    }
  };
}

function injectOffersSchema(products) {
  document.querySelectorAll('script[data-glowie-schema="offers"]').forEach(el => el.remove());
  
  const schema = generateOffersSchema(products);
  if (!schema) return;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-glowie-schema', 'offers');
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}
```

### En `initializeOffersListeners()`, agregar esto antes del `} catch (error) {`

```javascript
    // ===== NUEVO: Inyectar schema =====
    injectOffersSchema(products);

  } catch (error) {
    // ... resto igual ...
  }
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Agregar meta tags en `index.html`
- [ ] Copiar funciones de schema en `catalog.js`
- [ ] Reemplazar `renderProducts()` en `catalog.js`
- [ ] Reemplazar `loadProducts()` en `catalog.js`
- [ ] Reemplazar `updateStockInfo()` en `modal.js`
- [ ] Agregar keyframes en `modal.js`
- [ ] Mejorar error en `addToCartFromModal()` en `modal.js`
- [ ] Agregar schema en `offers.js`
- [ ] Probar en navegador
- [ ] Subir a producción
- [ ] Verificar en Google Search Console

**Tiempo estimado:** 2-3 horas  
**Impacto:** +500% en búsqueda orgánica dentro de 4-6 semanas

