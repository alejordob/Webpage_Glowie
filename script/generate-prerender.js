/**
 * script/generate-prerender.js
 * Genera public/catalogo/{slug}/index.html por cada producto desde Firestore.
 * Firebase Hosting sirve estos archivos estáticos con prioridad sobre el rewrite SPA,
 * así Google indexa HTML completo con meta tags + schema.org sin necesidad de Functions.
 * Uso: node script/generate-prerender.js
 * Se ejecuta automáticamente antes de firebase deploy: npm run deploy
 */

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1).trimEnd() + '…';
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildProductHead(product, slug, baseHtml) {
  const name        = escapeHtml(product.name || 'Vela Artesanal');
  const title       = `${name} | Glowie`;
  const description = escapeHtml(truncate(product.description || 'Vela artesanal de cera de soja natural, hecha a mano en Cali, Colombia.', 155));
  const canonical   = `https://velasglowie.com/catalogo/${slug}`;
  const image       = (product.images && product.images[0]) || 'https://res.cloudinary.com/du3kkvkmy/image/upload/f_auto,q_auto,w_1200,h_630,c_fill/v1762141308/anis_amarillo_ftb5xv.webp';
  const price       = product.on_sale && product.on_sale_price ? product.on_sale_price : (product.price || 0);
  const availability = (product.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  const productSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name || 'Vela Artesanal',
    'description': product.description || '',
    'image': product.images || [],
    'brand': { '@type': 'Brand', 'name': 'Glowie' },
    'offers': {
      '@type': 'Offer',
      'price': String(price),
      'priceCurrency': 'COP',
      'availability': availability,
      'url': canonical,
    },
  }, null, 2);

  let html = baseHtml;

  // Title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${title}</title>`
  );

  // Meta description
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${description}">`
  );

  // Canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${canonical}">`
  );

  // OG title
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${title}">`
  );

  // OG description
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${description}">`
  );

  // OG url
  html = html.replace(
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${canonical}">`
  );

  // OG image
  html = html.replace(
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${escapeHtml(image)}">`
  );

  // OG type: website → product
  html = html.replace(
    /<meta property="og:type" content="website">/,
    `<meta property="og:type" content="product">`
  );

  // Twitter title
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${title}">`
  );

  // Twitter description
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${description}">`
  );

  // Twitter image
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`
  );

  // Inject Product schema before </head>
  html = html.replace(
    '</head>',
    `  <script type="application/ld+json">\n  ${productSchema}\n  </script>\n</head>`
  );

  return html;
}

async function generatePrerender() {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ No se encontró serviceAccountKey.json en script/');
    process.exit(1);
  }

  // Evitar doble init si generate-sitemap ya lo hizo en el mismo proceso
  if (!admin.apps.length) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  const db = admin.firestore();

  console.log('🔥 Conectando a Firestore...');
  const snapshot = await db.collection('products').get();
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`📦 ${products.length} productos encontrados`);

  const indexHtmlPath = path.join(__dirname, '../public/index.html');
  const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  const outputBase = path.join(__dirname, '../public/catalogo');
  let generated = 0;

  for (const product of products) {
    if (!product.name) continue;
    const slug = slugify(product.name);
    if (!slug) continue;

    const dir = path.join(outputBase, slug);
    fs.mkdirSync(dir, { recursive: true });

    const html = buildProductHead(product, slug, baseHtml);
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    generated++;
  }

  console.log(`✅ Pre-render generado: ${generated} páginas de producto`);
  console.log(`   → ${outputBase}/{slug}/index.html`);
  process.exit(0);
}

generatePrerender().catch(e => {
  console.error('❌ Error en generate-prerender:', e.message);
  process.exit(1);
});
