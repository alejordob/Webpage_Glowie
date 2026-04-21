# Modal Redesign Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the product modal for mobile with fullscreen image, scrollable thumbnails, and comfortable selector spacing — everything flows in one smooth scroll.

**Architecture:** Change modal from side-by-side layout (desktop-centric) to mobile-first vertical stack. Mobile: fullwidth image (320px) → thumbnails → fluent scroll for title/price/description/selectors/button. Desktop: unchanged (flex-row with image left, form right). All scrollable as one unit, nothing fixed.

**Tech Stack:** Vanilla JavaScript, Tailwind CSS, existing Firestore product data, GSAP (if animations needed).

---

## File Structure

**Files to modify:**
- `public/js/pages/modal.js` — Main modal template and layout logic

**Files NOT modified:**
- `public/js/pages/product.js` — No changes needed
- `public/js/cart.js` — No changes needed
- `public/index.html` — No changes to overall structure

---

## Implementation Tasks

### Task 1: Update Modal HTML Template for Mobile-First Stack

**Files:**
- Modify: `public/js/pages/modal.js:63-123` (modal.innerHTML template)

**Context:**
Current layout uses `flex flex-col md:flex-row` with separate scrollable areas. We need to change to:
- Mobile: single `flex-col` with one scrollable container
- Desktop: `flex-row` with image left, form right (existing behavior)

- [ ] **Step 1: Read the current modal.innerHTML (lines 63-123)**

Open `public/js/pages/modal.js` and review the current structure to understand what sections exist.

- [ ] **Step 2: Replace the modal.innerHTML with mobile-first layout**

```javascript
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
```

- [ ] **Step 3: Verify the template structure**

Check that:
- Mobile (`w-full`) stacks vertically
- Desktop (`md:flex-row`) shows image left, form right
- Image uses `h-72 md:h-[420px]` (small on mobile, large on desktop)
- Selectors have `p-3 md:p-2` (larger padding on mobile, normal on desktop)
- Everything scrolls as one unit (no `overflow-y-auto` on sub-sections except reviews container)

- [ ] **Step 4: Commit this change**

```bash
git add public/js/pages/modal.js
git commit -m "refactor: mobile-first modal layout with fullscreen image and fluent scroll"
```

---

### Task 2: Adjust Select Input Sizes for Mobile Touch

**Files:**
- Modify: `public/js/pages/modal.js:25-61` (buttonStyles CSS)

**Context:**
Mobile users need larger, easier-to-tap select inputs. Add `font-size: 16px` inline style (done in Task 1) + better padding for mobile.

- [ ] **Step 1: Update buttonStyles to add mobile-friendly select styles**

Find the `const buttonStyles = \`` section and add this CSS rule inside:

```javascript
  select {
    font-size: 16px;
    min-height: 44px;
  }
  select:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background-color: #f3f4f6;
  }
  select.is-auto-selected:disabled {
    opacity: 1;
    cursor: default;
    background-color: var(--color-gris-crema);
    border-color: var(--color-cinna);
    font-weight: 600;
  }
```

The full updated `buttonStyles` should be:

```javascript
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
```

- [ ] **Step 2: Verify selects are larger on mobile**

Open the page on a phone or DevTools mobile view (375px width) and check that:
- Select dropdowns are at least 44px tall (Apple's HIG standard)
- Text is 16px (readable, no zoom-on-focus)
- Padding is comfortable (12px on mobile)

- [ ] **Step 3: Commit**

```bash
git add public/js/pages/modal.js
git commit -m "style: improve select input sizes and touch targets for mobile"
```

---

### Task 3: Test Modal on Mobile and Desktop

**Files:**
- No code changes
- Test: Manual browser testing

- [ ] **Step 1: Build CSS and start local server**

```bash
npm run build:css
firebase emulators:start
# or use: npx http-server public
```

- [ ] **Step 2: Open modal on mobile view (375px)**

Using Chrome DevTools:
1. Press `F12` to open DevTools
2. Click device toggle (top-left, looks like phone icon)
3. Select "iPhone SE" (375px width) or manually set to 375px
4. Refresh page and open any product modal

Verify:
- ✅ Image is fullwidth and large (320px tall minimum)
- ✅ Thumbnails visible below image
- ✅ Scroll starts from top (image visible when modal opens)
- ✅ All content scrolls together (no fixed sections)
- ✅ Selectors are large and easy to tap
- ✅ Button is visible at bottom of scroll

- [ ] **Step 3: Test on desktop view (1024px+)**

Set DevTools to Desktop view or manually resize to 1024px+.

Verify:
- ✅ Image on left side (50% width)
- ✅ Form on right side (50% width)
- ✅ Layout unchanged from current (existing behavior preserved)
- ✅ All functionality works (selectors, add to cart, reviews)

- [ ] **Step 4: Test on real mobile device (if available)**

Open `https://velasglowie.com` on an actual iPhone or Android and:
- Open product modal
- Scroll smoothly through image → thumbnails → selectors
- Tap selectors and choose options
- Add to cart
- Verify no layout shifts or weird spacing

- [ ] **Step 5: No code commit needed for testing**

Document results locally. If issues found, file them and fix in next iteration.

---

### Task 4: Verify Thumbnail Click Handler Still Works

**Files:**
- Modify: `public/js/pages/modal.js:200-250` (renderModalThumbnails function)

**Context:**
Thumbnails are now visible on mobile. Ensure clicking them changes the main image.

- [ ] **Step 1: Find and review the renderModalThumbnails function**

Search for `function renderModalThumbnails` in modal.js. Review how it currently adds click handlers to thumbnail elements.

- [ ] **Step 2: Verify click handlers are attached**

Make sure the function includes:

```javascript
const thumbs = document.querySelectorAll('#modal-thumbnails img');
thumbs.forEach((thumb, index) => {
  thumb.addEventListener('click', () => {
    updateImage(currentProduct.images[index]);
  });
});
```

If this code doesn't exist or is different, add/update it to match above.

- [ ] **Step 3: Test thumbnail clicks**

On mobile view:
1. Open product modal
2. Scroll to see thumbnails
3. Click a different thumbnail
4. Verify main image changes smoothly
5. Check that image opacity animation works (fade effect)

- [ ] **Step 4: Commit if changes were needed**

```bash
git add public/js/pages/modal.js
git commit -m "fix: ensure thumbnail click handlers work on mobile layout"
```

---

### Task 5: Deploy and Monitor

**Files:**
- No code changes
- Deploy: Firebase hosting

- [ ] **Step 1: Run full build pipeline**

```bash
npm run build:css
npm run generate-sitemap
firebase deploy
```

- [ ] **Step 2: Verify deployment**

Visit `https://velasglowie.com` on mobile and desktop:
- Open 3-4 different products
- Test scroll, selectors, add to cart
- Check console for JS errors (F12 → Console tab)

- [ ] **Step 3: Check GSC**

Log into Google Search Console and:
- Check for crawl errors (should be 0)
- Verify product pages are still indexed
- No new errors introduced

- [ ] **Step 4: Done!**

Modal redesign is live. Users on mobile now have a much better experience.

---

## Testing Checklist

Before declaring complete:

- [ ] Mobile (375px): Image fullwidth, comfortable scroll, large selectors
- [ ] Desktop (1024px+): Layout unchanged, existing functionality preserved
- [ ] Thumbnail clicks work on both mobile and desktop
- [ ] No console errors on either breakpoint
- [ ] Add to cart works on mobile
- [ ] Reviews can be toggled open/closed on mobile
- [ ] Escape key closes modal on mobile
- [ ] Firebase deploy successful, no 404s or deploy errors

---

## Rollback Plan

If issues arise:

```bash
git revert HEAD~2 --no-edit  # Revert last 2 commits (Tasks 1-2)
npm run build:css
firebase deploy
```

Keep the old modal.innerHTML backed up locally if needed.

---

**Plan complete!** Ready to execute task-by-task.
