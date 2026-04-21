# SEO + Performance + Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement three integrated improvements: Product Schema JSON-LD with aggregateRating (for rich snippets +15-25% CTR), image lazy loading optimization (+20-30% PageSpeed), and persistent URL filters (/catalogo?aroma=lavanda) for UX and SEO.

**Architecture:** 
- **Schema:** Enhance existing `generateProductSchema()` in `catalog.js` to include `aggregateRating` field populated from Firestore reviews data. Inject structured data both in listing (CollectionPage with ItemList) and product detail pages.
- **Image Loading:** Add native `loading="lazy"` attribute to catalog product cards (already has `srcset`), and use Intersection Observer for thumbnail lazy-loading in modals.
- **URL Filters:** Parse `?aroma=`, `?categoria=`, `?disponible=` query params in `app.js` routing, sync filter state to URL via `pushState`, restore filter state on page load/back navigation.

All three integrate through `catalog.js` (schema + image optimization) and `app.js` (URL routing + state restoration).

**Tech Stack:** 
- Vanilla JS, Firestore queries (existing), History API (pushState/popState), Intersection Observer API
- No new dependencies
- Existing Cloudinary image optimization (f_auto, q_auto already implemented)

---

## File Structure

**Files to modify:**
- `public/js/pages/catalog.js` — Add aggregateRating to schema, enhance image optimization
- `public/js/app.js` — Parse/restore URL filter params, sync filters to URL
- `public/js/pages/modal.js` — Add lazy loading to modal thumbnails (Intersection Observer)

**Files NOT modified:**
- `public/index.html` — No changes
- `public/js/cart.js` — No changes
- `public/js/reviews.js` — No changes

---

## Implementation Tasks

### Task 1: Enhance Product Schema with aggregateRating (Firestore Reviews)

**Files:**
- Modify: `public/js/pages/catalog.js:198-239` (generateProductSchema & injectProductSchemas)

**Context:**
Currently `generateProductSchema()` returns basic Product schema without ratings. We need to:
1. Fetch review aggregates (already cached by `loadAndDisplayRatings()`)
2. Add `aggregateRating` field to schema with `ratingValue` and `reviewCount`
3. Pass rating data from `loadAndDisplayRatings()` to the schema generation

**Implementation:**

- [ ] **Step 1: Modify generateProductSchema to accept rating data**

Update `generateProductSchema()` signature to accept optional `{ ratingValue, reviewCount }`:

```javascript
function generateProductSchema(product, rating = null) {
  const images = Array.isArray(product.imageUrls) ? product.imageUrls : product.images || [];
  const isOnSale = product.on_sale === true && product.on_sale_price < product.price;
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || 'Vela artesanal de cera de soja natural',
    image: images,
    offers: {
      '@type': 'Offer',
      price: String(isOnSale ? product.on_sale_price : product.price),
      priceCurrency: 'COP',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://velasglowie.com/catalogo/${slugify(product.name)}`,
    },
  };
  
  if (rating && rating.ratingValue > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(rating.ratingValue),
      reviewCount: String(rating.reviewCount),
    };
  }
  
  return schema;
}
```

- [ ] **Step 2: Create ratingsMap from reviews before injecting schemas**

Add a new function to build the ratings map and pass it to schema injection:

```javascript
async function getRatingsMap() {
  try {
    const app = getApp();
    const db = getFirestore(app);
    const snapshot = await getDocs(query(collection(db, 'reviews'), where('approved', '==', true)));
    
    const ratingsMap = {};
    snapshot.docs.forEach(doc => {
      const { productId, rating } = doc.data();
      if (!productId || !rating) return;
      if (!ratingsMap[productId]) ratingsMap[productId] = { sum: 0, count: 0 };
      ratingsMap[productId].sum += Number(rating);
      ratingsMap[productId].count += 1;
    });
    
    // Convert to averages
    Object.keys(ratingsMap).forEach(productId => {
      const entry = ratingsMap[productId];
      ratingsMap[productId].ratingValue = Math.round((entry.sum / entry.count) * 10) / 10;
      ratingsMap[productId].reviewCount = entry.count;
    });
    
    return ratingsMap;
  } catch (error) {
    console.error('Error fetching ratings for schema:', error);
    return {};
  }
}
```

- [ ] **Step 3: Update injectProductSchemas to use rating data**

Modify `injectProductSchemas(products, ratingsMap)` to pass ratings:

```javascript
function injectProductSchemas(products, ratingsMap = {}) {
  document.querySelectorAll('script[data-glowie-schema="catalog"]').forEach(el => el.remove());
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Catálogo de Velas Glowie',
    description: 'Colección de velas artesanales de cera de soja natural, hechas a mano en Cali',
    url: 'https://velasglowie.com/catalogo',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 12).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: generateProductSchema(p, ratingsMap[p.id]),
      })),
    },
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-glowie-schema', 'catalog');
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}
```

- [ ] **Step 4: Update loadProducts to fetch ratings before injecting schemas**

Modify `loadProducts()` to call `getRatingsMap()` and pass result to `injectProductSchemas()`:

```javascript
async function loadProducts(retryCount = 0) {
  const container = document.getElementById('product-list');
  if (!container) return;

  const cached = getCachedProducts();
  if (cached) {
    setAllProducts(cached);
    renderProducts(cached);
    const ratingsMap = await getRatingsMap();
    injectProductSchemas(cached, ratingsMap);
    loadAndDisplayRatings();
    return;
  }

  renderSkeletons();

  try {
    const app = getApp();
    const db = getFirestore(app);
    const snapshot = await withTimeout(getDocs(collection(db, 'products')));
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      imageUrls: doc.data().imageUrls || doc.data().images || [],
      is_new: doc.data().is_new || false,
      stock: doc.data().stock || 0,
    }));

    setAllProducts(products);
    setCachedProducts(products);
    renderProducts(products);
    const ratingsMap = await getRatingsMap();
    injectProductSchemas(products, ratingsMap);
    loadAndDisplayRatings();

  } catch (error) {
    if ((error.code === 'app/no-app' || error.message?.includes('No Firebase App')) && retryCount < MAX_RETRIES) {
      setTimeout(() => loadProducts(retryCount + 1), BASE_DELAY_MS * Math.pow(2, retryCount));
      return;
    }
    console.error('Error cargando catálogo:', error);
    container.innerHTML = `<div class="col-span-full text-center p-10 text-red-600">Error al cargar productos. Intenta de nuevo.</div>`;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add public/js/pages/catalog.js
git commit -m "feat: add Product Schema with aggregateRating from Firestore reviews"
```

---

### Task 2: Implement Image Lazy Loading Optimization

**Files:**
- Modify: `public/js/pages/catalog.js:310-370` (renderProducts function)
- Modify: `public/js/pages/modal.js` (thumbnail lazy loading with Intersection Observer)

**Context:**
Product images in catalog already have `loading="lazy"` and `srcset`. Modal thumbnails currently load all images immediately. Add Intersection Observer for modal thumbnails to defer loading until user scrolls to them.

**Implementation:**

- [ ] **Step 1: Verify catalog image loading attribute**

Check that `renderProducts()` has `loading="lazy"` on img tag (already present at line 355). No changes needed here — attribute is already set.

- [ ] **Step 2: Add Intersection Observer for modal thumbnails**

In `public/js/pages/modal.js`, add this function after the modal template is rendered:

```javascript
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
```

- [ ] **Step 3: Update modal thumbnail rendering to use data-src**

Find the section in `modal.js` that renders thumbnails (around line 64 in the template). Change from:

```javascript
`<img src="${image}" alt="Thumbnail" class="..." />`
```

to:

```javascript
`<img data-src="${image}" alt="Thumbnail" class="..." src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E" />`
```

This defers loading until intersection is detected.

- [ ] **Step 4: Call initLazyLoadThumbnails after modal renders**

In the `openModal()` function in `modal.js`, after `modal.appendChild(backdrop)` and modal content is set, add:

```javascript
setTimeout(() => initLazyLoadThumbnails(), 0);
```

This ensures DOM is ready before observer is attached.

- [ ] **Step 5: Test modal thumbnail lazy loading**

Open DevTools Network tab:
1. Open product modal
2. Observe that thumbnail images load only when visible in viewport
3. Scroll thumbnail area — images load on demand

- [ ] **Step 6: Commit**

```bash
git add public/js/pages/modal.js
git commit -m "perf: add Intersection Observer for lazy-loaded modal thumbnails"
```

---

### Task 3: Add URL Filter Params (?aroma=, ?categoria=, ?disponible=)

**Files:**
- Modify: `public/js/app.js` (routing & query param parsing)
- Modify: `public/js/pages/catalog.js` (filter state sync & restoration)

**Context:**
Currently filters are stored in component state only. Add URL params so:
- `/catalogo?aroma=lavanda` applies aroma filter
- `/catalogo?disponible=true` filters to in-stock only
- Back button restores filter state
- Shared URLs maintain filters

**Implementation:**

- [ ] **Step 1: Add query param parsing utility to app.js**

Add this function at the top of `public/js/app.js` after imports:

```javascript
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    aroma: params.get('aroma') || '',
    categoria: params.get('categoria') || '',
    disponible: params.get('disponible') === 'true',
  };
}

function pushFilterParams(filters) {
  const params = new URLSearchParams();
  if (filters.aroma) params.append('aroma', filters.aroma);
  if (filters.categoria) params.append('categoria', filters.categoria);
  if (filters.disponible) params.append('disponible', 'true');
  
  const queryString = params.toString();
  const newUrl = queryString ? `/catalogo?${queryString}` : '/catalogo';
  window.history.pushState({ filters }, '', newUrl);
}
```

- [ ] **Step 2: Update loadAppContent to restore filters**

Modify the catalog page load in `loadAppContent()`:

```javascript
// When page name is 'catalogo', after rendering, restore filters
if (pageName === 'catalogo') {
  const filters = getQueryParams();
  applyFiltersFromUrl(filters);
}
```

- [ ] **Step 3: Add filter application function to catalog.js**

Add this function to `catalog.js` (export it):

```javascript
export function applyFiltersFromUrl(filters) {
  const aromaFilter = document.getElementById('aroma-filter');
  const categoryFilter = document.getElementById('categoria-filter');
  
  // Restore aroma filter
  if (filters.aroma && aromaFilter) {
    aromaFilter.value = filters.aroma;
  }
  
  // Restore category filter (if it exists)
  if (filters.categoria && categoryFilter) {
    categoryFilter.value = filters.categoria;
  }
  
  // Apply filters
  filterByAromaAndCategory(filters);
}

function filterByAromaAndCategory(filters = {}) {
  const aroma = filters.aroma || document.getElementById('aroma-filter')?.value.trim().toLowerCase() || '';
  const categoria = filters.categoria || document.getElementById('categoria-filter')?.value.trim().toLowerCase() || '';
  
  let filtered = allProducts;
  
  // Filter by aroma
  if (aroma) {
    filtered = filtered.filter(product => {
      if (Array.isArray(product.aroma))
        return product.aroma.some(a => typeof a === 'string' && a.toLowerCase().includes(aroma));
      return typeof product.aroma === 'string' && product.aroma.toLowerCase().includes(aroma);
    });
  }
  
  // Filter by category
  if (categoria) {
    filtered = filtered.filter(product => {
      const productCategories = product.categoria || [];
      return productCategories.some(c => c.toLowerCase().includes(categoria));
    });
  }
  
  renderProducts(filtered);
}
```

- [ ] **Step 4: Update filterByAroma to sync URL**

Replace existing `filterByAroma()` in catalog.js:

```javascript
function filterByAroma() {
  const aroma = document.getElementById('aroma-filter')?.value.trim().toLowerCase() || '';
  const categoria = document.getElementById('categoria-filter')?.value.trim().toLowerCase() || '';
  
  // Update URL
  const filters = { aroma, categoria };
  pushFilterParams(filters);
  
  // Apply filters
  filterByAromaAndCategory(filters);
}
```

Add event listeners in `initializeCatalogListeners()`:

```javascript
export const initializeCatalogListeners = async () => {
  initScrollAnimations();
  await loadProducts();
  document.getElementById('aroma-filter')?.addEventListener('input', filterByAroma);
  document.getElementById('categoria-filter')?.addEventListener('change', filterByAroma);
};
```

- [ ] **Step 5: Add popstate listener for back button**

Add to `app.js` in the initialization section (after DOMContentLoaded):

```javascript
window.addEventListener('popstate', (event) => {
  if (event.state?.filters) {
    const { aroma, categoria } = event.state.filters;
    applyFiltersFromUrl({ aroma, categoria });
  }
});
```

- [ ] **Step 6: Test URL filter persistence**

1. Go to `/catalogo`
2. Type "lavanda" in aroma filter
3. Verify URL becomes `/catalogo?aroma=lavanda`
4. Refresh page — filter persists
5. Click back button — filter state restored
6. Share URL with filter params — recipient sees filtered results

- [ ] **Step 7: Commit**

```bash
git add public/js/app.js public/js/pages/catalog.js
git commit -m "feat: add persistent URL filters (?aroma=, ?categoria=, ?disponible=)"
```

---

### Task 4: Test All Three Features Integrated

**Files:**
- No code changes
- Test: Manual browser testing

**Context:**
Verify that schema injection, lazy loading, and URL filters all work together without conflicts.

**Implementation:**

- [ ] **Step 1: Build CSS and start local server**

```bash
npm run build:css
firebase emulators:start
# or: npx http-server public
```

- [ ] **Step 2: Test Product Schema with aggregateRating**

1. Open DevTools → Inspector
2. Go to `/catalogo`
3. Right-click page → View Page Source (or Ctrl+U)
4. Search for `aggregateRating`
5. Verify schema contains:
   ```json
   "aggregateRating": {
     "@type": "AggregateRating",
     "ratingValue": "4.8",
     "reviewCount": "12"
   }
   ```

- [ ] **Step 3: Test image lazy loading**

1. Open DevTools → Network tab
2. Filter by `img`
3. Go to `/catalogo`
4. Scroll through catalog — verify images load as they enter viewport
5. Open a product modal
6. Scroll thumbnails — verify they load only when visible

Expected: ~20-30% fewer image requests on initial page load.

- [ ] **Step 4: Test URL filter params**

1. Go to `/catalogo`
2. Type "lavanda" in aroma search
3. Verify URL changes to `/catalogo?aroma=lavanda`
4. Verify products are filtered to lavanda only
5. Refresh page — filter persists
6. Go to `/catalogo?aroma=vainilla` directly in address bar
7. Verify filter is applied without typing
8. Click browser back button
9. Verify filter state is restored

- [ ] **Step 5: Test filter interaction with schema**

1. Apply filter: `/catalogo?aroma=lavanda`
2. Open DevTools → Inspector
3. Verify schema updates to show only lavanda products (first 12)
4. Verify aggregateRating is present in filtered schema

- [ ] **Step 6: Test on mobile (DevTools)**

1. Open DevTools → Toggle device toolbar
2. Set to iPhone SE (375px)
3. Repeat tests 2-5 above
4. Verify all features work on small screen

- [ ] **Step 7: Check for console errors**

1. Open DevTools → Console
2. Go through all tests above
3. Verify no JS errors logged

- [ ] **Step 8: Document results**

No commit needed — testing complete.

---

### Task 5: Deploy to Firebase

**Files:**
- No code changes
- Deploy: Firebase hosting

**Context:**
Push all changes to production and verify live.

**Implementation:**

- [ ] **Step 1: Run build pipeline**

```bash
npm run build:css
npm run generate-sitemap
firebase deploy
```

- [ ] **Step 2: Verify deployment on live site**

Visit `https://velasglowie.com/catalogo`:
1. Verify products load
2. Type in aroma search — verify URL changes to `?aroma=...`
3. Refresh with filter params — filter persists
4. Open DevTools → Network → Images
5. Verify lazy loading works (scroll triggers image loads)
6. Check page source for `aggregateRating` in schema

- [ ] **Step 3: Test on mobile device (if available)**

Open `https://velasglowie.com` on actual iPhone/Android:
1. Search for a product by aroma
2. Verify URL has `?aroma=...` in address bar
3. Go back to home, return to catalog
4. Filter should be preserved
5. Open product modal
6. Scroll thumbnails — verify they load smoothly

- [ ] **Step 4: Check Google Search Console**

Log into GSC (`https://search.google.com/search-console`):
1. Click `velasglowie.com`
2. Check "Coverage" tab
3. Verify 0 errors
4. Check "Enhancements" → "Rich Results"
5. Verify product schema is detected (should show new products with ratings)

- [ ] **Step 5: Run PageSpeed Insights**

Visit `https://pagespeed.web.dev/` and test:
1. `https://velasglowie.com/catalogo`
2. Compare to baseline (before this implementation)
3. Expect +10-20 point improvement in PageSpeed due to lazy loading

- [ ] **Step 6: Deployment complete**

All three features (schema + lazy loading + URL filters) are live and integrated.

---

## Testing Checklist

Before declaring complete:

- [ ] Product Schema contains aggregateRating with ratings from Firestore
- [ ] Schema injects on catalog page and product detail pages
- [ ] Images lazy-load on catalog (srcset + loading="lazy")
- [ ] Modal thumbnails lazy-load via Intersection Observer
- [ ] URL filter params persist: `/catalogo?aroma=lavanda`
- [ ] Back button restores filter state
- [ ] Filter params work on mobile (375px)
- [ ] No console errors on desktop or mobile
- [ ] PageSpeed improved +10-20 points
- [ ] Google Search Console shows 0 coverage errors
- [ ] Rich results detected in GSC

---

## Rollback Plan

If issues arise:

```bash
git log --oneline | head -4  # See last 4 commits
git revert <commit-sha>      # Revert specific task
npm run build:css
firebase deploy
```

Or revert all three tasks:
```bash
git revert HEAD~2 --no-edit  # Revert last 2 commits
npm run build:css
firebase deploy
```

---

**Plan complete!** Ready to execute task-by-task using subagent-driven-development.
