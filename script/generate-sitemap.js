/**
 * script/generate-sitemap.js
 * Genera public/sitemap.xml con todas las páginas estáticas + URLs de producto desde Firestore.
 * Uso: node script/generate-sitemap.js
 * Se ejecuta automáticamente antes de firebase deploy: npm run deploy
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Misma función slugify que usa la web
function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function generateSitemap() {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ No se encontró serviceAccountKey.json en script/');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  console.log('🔥 Conectando a Firestore...');
  const snapshot = await db.collection('products').get();
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`📦 ${products.length} productos encontrados`);

  const today = formatDate(new Date());

  const staticPages = [
    { loc: 'https://velasglowie.com/',          changefreq: 'weekly',  priority: '1.0', lastmod: today },
    { loc: 'https://velasglowie.com/catalogo',  changefreq: 'weekly',  priority: '0.9', lastmod: today },
    { loc: 'https://velasglowie.com/ofertas',   changefreq: 'weekly',  priority: '0.7', lastmod: today },
    { loc: 'https://velasglowie.com/nosotros',  changefreq: 'monthly', priority: '0.5' },
    { loc: 'https://velasglowie.com/tips',      changefreq: 'monthly', priority: '0.4' },
    { loc: 'https://velasglowie.com/aromas',    changefreq: 'monthly', priority: '0.7', lastmod: today },
  ];

  const productPages = products
    .filter(p => p.name) // ignorar productos sin nombre
    .map(p => ({
      loc: `https://velasglowie.com/catalogo/${slugify(p.name)}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: today,
    }));

  const allPages = [...staticPages, ...productPages];

  const urlEntries = allPages.map(p => `  <url>
    <loc>${p.loc}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');

  console.log(`✅ sitemap.xml generado: ${allPages.length} URLs (${productPages.length} productos)`);
  console.log(`   → ${outputPath}`);
  process.exit(0);
}

generateSitemap().catch(e => {
  console.error('❌ Error generando sitemap:', e.message);
  process.exit(1);
});
