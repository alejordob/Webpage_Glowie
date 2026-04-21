# SEO Implementation Guide
## velasglowie.com - Code-Level Recommendations

---

## 1. Product Schema Implementation

### Priority: CRITICAL
### Estimated Implementation Time: 2-3 hours
### Expected Impact: +15-25% CTR on product pages

### What is Product Schema?

Product schema is structured data that tells Google exactly what each product is, what it costs, and what reviews it has. This enables:
- Rich snippets in search results (images, price, rating)
- Higher click-through rates (CTR)
- Shopping-specific features (availability, offers)

### Implementation Step 1: Create Schema Template

**File:** `public/js/pages/product.js`

Add this function to generate Product schema:

```javascript
// Add this near the top of product.js, after your imports
function generateProductSchema(product) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || "",
    "image": product.image || [product.image],
    "brand": {
      "@type": "Brand",
      "name": "Glowie"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "COP",
      "price": product.price.toString(),
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Glowie",
        "url": "https://velasglowie.com"
      }
    }
  };

  // Add rating if available
  if (product.rating && product.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.rating.toString(),
      "reviewCount": product.reviewCount.toString()
    };
  }

  return schema;
}

// Call this function when product loads:
// const schema = generateProductSchema(productData);
// injectSchema(schema);
```

### Implementation Step 2: Inject Schema into Head

Add this helper function to inject schema into the page:

```javascript
// Add to product.js
function injectSchema(schema) {
  // Remove existing product schema if present
  const existingSchema = document.querySelector('script[data-schema="product"]');
  if (existingSchema) {
    existingSchema.remove();
  }

  // Create new schema script
  const schemaScript = document.createElement('script');
  schemaScript.type = 'application/ld+json';
  schemaScript.setAttribute('data-schema', 'product');
  schemaScript.textContent = JSON.stringify(schema);

  // Inject into head before other scripts
  document.head.insertBefore(schemaScript, document.head.querySelector('script[async]'));
}
```

### Implementation Step 3: Update Product Display Function

When you render the product, call the schema injection:

```javascript
// In your renderProduct() or similar function:
function renderProduct(productData) {
  // ... existing code ...

  // Generate and inject schema
  const productSchema = generateProductSchema(productData);
  injectSchema(productSchema);

  // ... rest of render code ...
}
```

### Implementation Step 4: Verify with Google Tools

After deploying, test each product page:

1. Go to [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Enter product page URL
3. Check: "Product" schema detected
4. Verify: Name, price, image, description are showing

### Example Result

When implemented correctly, Google will show:

```
Vela Flama - Glowie
⭐⭐⭐⭐⭐ (45 reviews)
$45,000 COP - In Stock
Vela artesanal de cera de soja natural con...
```

---

## 2. Image Optimization for Core Web Vitals

### Priority: HIGH
### Estimated Implementation Time: 1-2 hours
### Expected Impact: +10-20 PageSpeed score, prevents CLS

### Issue: Layout Shift Without Dimensions

When images load without explicit width/height, the browser doesn't know how much space to reserve, causing the page to shift when the image loads.

### Solution A: Add Width/Height Attributes (Quick Fix)

**File:** `public/js/pages/catalog.js` (or wherever product images are rendered)

Current code (problematic):
```html
<img src="product-image.webp" alt="Product name">
```

Fixed code:
```html
<img 
  src="product-image.webp" 
  alt="Product name"
  width="300"
  height="300"
  loading="lazy"
>
```

If using JavaScript to create images:

```javascript
// Before (causes layout shift):
const img = document.createElement('img');
img.src = productImage;
img.alt = productName;
container.appendChild(img);

// After (prevents layout shift):
const img = document.createElement('img');
img.src = productImage;
img.alt = productName;
img.width = 300;  // Add explicit dimensions
img.height = 300;
img.loading = 'lazy';  // Lazy-load below-fold images
container.appendChild(img);
```

### Solution B: Use CSS Aspect Ratio (Recommended)

Modern approach using CSS:

```css
/* In public/styles.css */
.product-image {
  aspect-ratio: 1;  /* 1:1 square */
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* For responsive images */
@media (min-width: 768px) {
  .product-image {
    width: 300px;
  }
}
```

HTML:
```html
<img 
  src="product-image.webp" 
  alt="Product name"
  class="product-image"
  loading="lazy"
>
```

### Solution C: Container Query Approach (Best Practice)

```html
<div class="product-card">
  <div class="product-image-container">
    <img 
      src="product-image.webp" 
      alt="Product name"
      class="product-image"
      loading="lazy"
    >
  </div>
</div>
```

```css
.product-image-container {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background-color: #f5f5f5;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Verify Fix: Lighthouse

After implementation:
1. Open product page
2. Chrome DevTools > Lighthouse
3. Generate report
4. Check: "Avoid layout shift" = should improve
5. Check: CLS metric (should be < 0.1)

---

## 3. Google Ads Conversion Tracking (If Running Ads)

### Priority: HIGH (only if running Google Ads)
### Estimated Implementation Time: 30 minutes
### Expected Impact: Accurate conversion tracking for campaigns

### Is This Needed?

Check if you're running:
- Google Shopping ads for your products
- Search ads with "velas artesanales" keywords
- Remarketing campaigns

If YES → Implement this. If NO → Skip.

### Implementation

**File:** `public/index.html`

Replace `AW-XXXXXXXXX` with your actual Google Ads customer ID from Google Ads > Tools > Conversions

Option 1: Global Site Tag (Recommended)

```html
<!-- In <head> section, after GA4 script -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXX');
</script>
```

Option 2: Event Tracking (For Conversions)

In your cart/checkout JavaScript:

```javascript
// When user adds item to cart
function onAddToCart(productName, price) {
  gtag('event', 'add_to_cart', {
    value: price,
    currency: 'COP',
    items: [{
      item_name: productName,
      price: price
    }]
  });
}

// When user completes purchase
function onPurchase(orderId, total) {
  gtag('event', 'purchase', {
    transaction_id: orderId,
    value: total,
    currency: 'COP'
  });
}
```

### Verify in Google Ads

1. Go to Google Ads > Conversions
2. Check: Conversion tag is installed
3. Check: Tag Helper shows "Installation OK"
4. Wait: 24 hours for conversions to appear

---

## 4. FAQ Schema for Tips Page

### Priority: MEDIUM
### Estimated Implementation Time: 1 hour
### Expected Impact: Chance for featured snippets + Q&A in search

### What is FAQ Schema?

Tells Google which content is Q&A format, enabling special search result formatting.

### Implementation

**File:** `public/js/pages/tips.js`

```javascript
// Add this function to tips.js
function generateFAQSchema(faqs) {
  // faqs should be an array of {question: "", answer: ""}
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return schema;
}

// Inject schema when tips page loads
function initTipsFAQSchema() {
  const faqData = [
    {
      question: "¿Cuánto tiempo dura una vela de Glowie?",
      answer: "Nuestras velas tienen una duración promedio de 40-50 horas de quemado continuo. El tiempo exacto depende del tamaño de la vela y las condiciones de uso."
    },
    {
      question: "¿Son seguras las velas de cera de soja?",
      answer: "Sí, nuestras velas están hechas con cera de soja natural 100% pura, sin químicos tóxicos. Cumplen con estándares internacionales de seguridad."
    },
    {
      question: "¿Cómo cuidar mis velas?",
      answer: "Coloca la vela en una superficie plana y segura, lejos de corrientes de aire. Recorta la mecha a 1cm antes de encender. Siempre supervisa la vela mientras esté encendida."
    }
    // Add more Q&A pairs from your Tips page
  ];

  const schema = generateFAQSchema(faqData);
  injectSchema(schema);
}

// Call when page loads
document.addEventListener('DOMContentLoaded', initTipsFAQSchema);
```

### Test the Schema

1. Go to [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Enter Tips page URL
3. Verify: "FAQPage" is detected
4. Check: All questions and answers appear

---

## 5. Lazy Loading Implementation

### Priority: MEDIUM
### Estimated Implementation Time: 30 minutes
### Expected Impact: 20-30% faster page load

### Quick Implementation

Add `loading="lazy"` to all product images:

```html
<!-- Catalog/product images -->
<img 
  src="product.webp" 
  alt="Product"
  loading="lazy"
  width="300"
  height="300"
>

<!-- Video embeds -->
<iframe 
  src="https://youtube.com/embed/..."
  loading="lazy"
></iframe>
```

### JavaScript Implementation

```javascript
// For dynamically created images
function createProductImage(imageSrc, altText) {
  const img = document.createElement('img');
  img.src = imageSrc;
  img.alt = altText;
  img.loading = 'lazy';  // Native lazy loading
  img.decoding = 'async';  // Async decoding
  
  return img;
}
```

### Browser Support

`loading="lazy"` is supported by:
- Chrome 76+
- Firefox 75+
- Safari 15.1+
- Edge 79+

For older browsers, add Intersection Observer API as fallback (most modern bundlers handle this).

---

## 6. Font Optimization

### Priority: MEDIUM
### Estimated Implementation Time: 15 minutes
### Expected Impact: +5-10 PageSpeed score

### Current Implementation

In `public/index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
```

This already has `display=swap` which is good! ✅

### Additional Optimization

Add font preload for critical weights:

```html
<!-- Preload Inter in critical weights -->
<link rel="preload" 
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
  as="style">
```

---

## 7. Meta Tags Improvements

### Priority: LOW (current implementation is good)
### Estimated Implementation Time: 30 minutes
### Expected Impact: +2-5% CTR increase

### Current Status: ✅ GOOD

Your meta tags are well-optimized:
- Title: 70 chars (ideal 50-60) - slightly long but acceptable
- Description: 157 chars (ideal 150-160) - perfect
- Open Graph: Complete implementation

### Minor Improvements

Option 1: Shorten title for better display

Current:
```html
<title>Velas Artesanales en Cali | Glowie — Cera de Soja Natural</title>
```

Shorter option (60 chars):
```html
<title>Velas Artesanales | Glowie — Cera de Soja Natural</title>
```

Option 2: Add structured data for Organization

Add to `<head>`:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Glowie",
  "url": "https://velasglowie.com",
  "logo": "https://velasglowie.com/img/logo_glowie.png",
  "sameAs": [
    "https://www.instagram.com/glowie.velas",
    "https://www.facebook.com/profile.php?id=61583394446413"
  ]
}
</script>
```

---

## 8. Analytics Event Tracking (Advanced)

### Priority: MEDIUM
### Estimated Implementation Time: 2-3 hours
### Expected Impact: Better conversion data

### Current: Event tracking missing

Currently tracking:
- ✅ PageView
- ✅ Meta Pixel PageView

Missing:
- ❌ Add to Cart events
- ❌ Purchase events
- ❌ Product view events
- ❌ Wishlist events

### Implementation Example

**File:** `public/js/cart.js`

```javascript
// Track add to cart
function addToCart(product) {
  // ... existing add to cart logic ...

  // Send event to GA4
  gtag('event', 'add_to_cart', {
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: 1
    }],
    value: product.price,
    currency: 'COP'
  });

  // Send event to Meta Pixel
  fbq('track', 'AddToCart', {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'COP'
  });
}

// Track product view
function viewProduct(product) {
  gtag('event', 'view_item', {
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price
    }],
    value: product.price,
    currency: 'COP'
  });

  fbq('track', 'ViewContent', {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'COP'
  });
}

// Track purchase (call when order is confirmed)
function trackPurchase(order) {
  gtag('event', 'purchase', {
    transaction_id: order.id,
    affiliation: 'Glowie',
    value: order.total,
    currency: 'COP',
    tax: order.tax || 0,
    shipping: order.shipping || 0,
    items: order.items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity
    }))
  });

  fbq('track', 'Purchase', {
    value: order.total,
    currency: 'COP'
  });
}
```

---

## 9. Performance Checklist

Before deploying changes, verify:

```
Code Quality:
[ ] No console errors when schema is loaded
[ ] Schema validates with Rich Results Test
[ ] Images have width/height or aspect-ratio CSS
[ ] lazy loading="lazy" added to below-fold images
[ ] No duplicate schema tags on page

Performance:
[ ] Run Lighthouse audit (DevTools)
[ ] Check CLS score (should be < 0.1)
[ ] Check LCP time (should be < 2.5s)
[ ] Check INP time (should be < 200ms)

SEO:
[ ] Check robots.txt still allows crawlers
[ ] Verify canonical tags are present
[ ] Test with Rich Results Test tool
[ ] Check GSC for any new errors

Security:
[ ] No hardcoded API keys in code
[ ] HTTPS is enabled
[ ] No mixed content warnings
```

---

## 10. Deployment Guide

### Step-by-step deployment:

1. **Create a feature branch**
   ```bash
   git checkout -b feature/seo-improvements
   ```

2. **Make changes incrementally**
   - Start with Product schema (highest impact)
   - Then image optimization
   - Then lazy loading

3. **Test locally**
   ```bash
   # Test each product page
   # Check DevTools Console for errors
   # Run Lighthouse audit
   ```

4. **Verify with Google Tools**
   - Rich Results Test for schema
   - PageSpeed Insights for performance
   - Mobile-Friendly Test for mobile

5. **Deploy to production**
   ```bash
   git add public/
   git commit -m "feat: add product schema and image optimization"
   git push origin feature/seo-improvements
   # Create PR and merge
   ```

6. **Monitor in GSC**
   - Check Core Web Vitals report
   - Monitor indexation changes
   - Track CTR improvements in Performance report

---

## Expected Results Timeline

### Week 1-2: Schema Implementation
- Deploy Product schema
- Google starts reading new data
- Rich snippets appear in search results

### Week 3-4: Performance Improvements
- Image optimization takes effect
- Core Web Vitals may improve
- CTR increases from better snippets (estimated +5-10%)

### Month 2-3: Full Impact
- Organic traffic increases 10-20%
- Rankings improve for target keywords
- Conversion rate improves from better quality traffic

---

## Support Resources

### Schema.org Documentation
- Product schema: https://schema.org/Product
- FAQ schema: https://schema.org/FAQPage
- Local business: https://schema.org/LocalBusiness

### Google Tools
- Search Console: https://search.google.com/search-console
- PageSpeed Insights: https://pagespeed.web.dev/
- Rich Results Test: https://search.google.com/test/rich-results
- Mobile-Friendly Test: https://search.google.com/mobile-friendly

### Analytics
- GA4: https://analytics.google.com/
- Meta Pixel: https://business.facebook.com/

---

**Last Updated:** April 3, 2026  
**Status:** Ready for Implementation  
**Estimated Total Time:** 6-8 hours for all improvements
