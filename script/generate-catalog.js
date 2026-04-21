const puppeteer    = require('puppeteer');
const path         = require('path');
const fs           = require('fs');
const https        = require('https');
const http         = require('http');
const { execSync } = require('child_process');

// ── Data ──────────────────────────────────────────────────────────────────────
const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'cargarProductos.json'), 'utf-8'));

// ── Icon (square 1024×1024) for cover ────────────────────────────────────────
const iconSrc      = path.join(__dirname, '..', 'public', 'img', 'icono', 'icono_glowie.png');
const iconCoverTmp = '/tmp/glowie_icon_cover.png';
execSync(`sips -z 500 500 "${iconSrc}" --out "${iconCoverTmp}"`, { stdio: 'ignore' });
const iconCoverB64 = `data:image/png;base64,${fs.readFileSync(iconCoverTmp).toString('base64')}`;

// ── Cloudinary ────────────────────────────────────────────────────────────────
function compressUrl(url) {
  return url.replace(/\/upload\/[^/]+\/(v\d+\/)/, '/upload/f_jpg,q_80,w_900/$1');
}

// ── Fetch → base64 data URI ───────────────────────────────────────────────────
function fetchBase64(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return fetchBase64(res.headers.location).then(resolve);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const mime = (res.headers['content-type'] || 'image/jpeg').split(';')[0];
        resolve(`data:${mime};base64,${Buffer.concat(chunks).toString('base64')}`);
      });
      res.on('error', () => resolve(''));
    });
    req.on('error', () => resolve(''));
    req.setTimeout(15000, () => { req.destroy(); resolve(''); });
  });
}

function formatPrice(n) { return '$' + n.toLocaleString('es-CO'); }

// ── Product card: image fills full card, text overlaid in white ───────────────
function productCard(product, uris, featured = false) {
  const isOnSale  = product.on_sale && product.on_sale_price;
  const isNew     = product.is_new;
  const validUris = uris.filter(Boolean);

  const badges = [
    isNew    ? `<span class="badge badge-new">Nuevo</span>`   : '',
    isOnSale ? `<span class="badge badge-sale">Oferta</span>` : '',
  ].join('');

  const priceHtml = isOnSale
    ? `<span class="price-original">${formatPrice(product.price)}</span>
       <span class="price-sale">${formatPrice(product.on_sale_price)}</span>`
    : `<span class="price">${formatPrice(product.price)}</span>
       <span class="price-label">COP</span>`;

  const cat = product.category ? `<div class="card-category">${product.category}</div>` : '';

  // Overlay (name + price in white over the image)
  const overlay = `<div class="card-overlay">
    ${cat}
    <div class="card-name">${product.name}</div>
    <div class="price-block">${priceHtml}</div>
  </div>`;

  // Image area
  let imgHtml;
  if (featured && validUris.length >= 2) {
    const imgs = validUris.map(u => `<img src="${u}" alt="${product.name}" />`).join('');
    imgHtml = `<div class="img-featured img-featured-${validUris.length}">${imgs}</div>`;
  } else if (validUris.length >= 3) {
    const imgs = validUris.map(u => `<img src="${u}" alt="${product.name}" />`).join('');
    imgHtml = `<div class="img-gallery img-gallery-${validUris.length}">${imgs}</div>`;
  } else if (validUris.length === 2) {
    imgHtml = `<div class="img-pair">
      <img src="${validUris[0]}" alt="${product.name}" />
      <img src="${validUris[1]}" alt="${product.name}" />
    </div>`;
  } else if (validUris.length === 1) {
    imgHtml = `<div class="img-single"><img src="${validUris[0]}" alt="${product.name}" /></div>`;
  } else {
    imgHtml = `<div class="img-placeholder"></div>`;
  }

  const cls = ['product-card', featured ? 'card-featured' : ''].filter(Boolean).join(' ');
  return `<div class="${cls}">${badges ? `<div class="card-badges">${badges}</div>` : ''}${imgHtml}${overlay}</div>`;
}

// ── Catalog page HTML ─────────────────────────────────────────────────────────
function catalogPageHtml(cardsHtml) {
  return `<div class="catalog-page">
    <div class="page-header">
      <span class="page-header-brand">Glowie</span>
      <span class="page-header-title">Colección &nbsp;·&nbsp; Abril 2026</span>
    </div>
    <div class="grid">${cardsHtml}</div>
    <div class="page-footer">
      <span>velasglowie.com</span>
      <span>Velas artesanales &nbsp;·&nbsp; Cali, Colombia</span>
    </div>
  </div>`;
}

// ── Full HTML document ────────────────────────────────────────────────────────
function buildHtml(catalogPages) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap');
:root{
  --cinna:#7A4F2E;--fondo:#F5E6D3;--cream:#FFFBF6;--gris:#A89880;
  --dark:#1E0F07;--sale:#FFB3A7;--border:#E8DDD0;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Lato',sans-serif;background:#fff;color:var(--dark);}

/* ═══ COVER ════════════════════════════════════════════════════════════════ */
.cover{
  width:794px;height:1123px;
  background:linear-gradient(155deg,#0D0603 0%,#2A1610 30%,#6B3E22 65%,#B07840 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  position:relative;overflow:hidden;
}
.cover::before{content:'';position:absolute;top:-100px;left:-100px;width:480px;height:480px;
  background:radial-gradient(ellipse,rgba(176,120,64,.22) 0%,transparent 68%);}
.cover::after{content:'';position:absolute;bottom:-200px;right:-200px;width:560px;height:560px;
  border:1px solid rgba(245,230,211,.07);border-radius:50%;}
.cover-frame{position:absolute;inset:26px;border:1px solid rgba(245,230,211,.13);}
.cover-corner{position:absolute;width:26px;height:26px;
  border-color:rgba(176,120,64,.6);border-style:solid;}
.cover-corner.tl{top:34px;left:34px;border-width:1.5px 0 0 1.5px;}
.cover-corner.tr{top:34px;right:34px;border-width:1.5px 1.5px 0 0;}
.cover-corner.bl{bottom:34px;left:34px;border-width:0 0 1.5px 1.5px;}
.cover-corner.br{bottom:34px;right:34px;border-width:0 1.5px 1.5px 0;}
.cover-logo{width:220px;height:220px;object-fit:contain;margin-bottom:24px;
  position:relative;z-index:1;filter:drop-shadow(0 4px 32px rgba(176,120,64,.55));}
.cover-brand{font-family:'Playfair Display',serif;font-size:74px;font-weight:700;
  color:var(--fondo);letter-spacing:16px;text-transform:uppercase;line-height:1;
  position:relative;z-index:1;}
.cover-rule{display:flex;align-items:center;gap:14px;margin:20px 0 16px;position:relative;z-index:1;}
.cover-rule-line{width:52px;height:1px;background:rgba(176,120,64,.65);}
.cover-rule-dot{width:5px;height:5px;background:rgba(176,120,64,.85);border-radius:50%;}
.cover-tagline{font-size:11px;color:rgba(245,230,211,.60);letter-spacing:5px;text-transform:uppercase;
  margin-bottom:32px;position:relative;z-index:1;}
.cover-subtitle{font-family:'Playfair Display',serif;font-size:21px;font-style:italic;
  color:rgba(245,230,211,.82);letter-spacing:1px;position:relative;z-index:1;}
.cover-date{margin-top:10px;font-size:10px;color:rgba(245,230,211,.40);letter-spacing:4px;
  text-transform:uppercase;position:relative;z-index:1;}
.cover-footer-strip{position:absolute;bottom:40px;display:flex;align-items:center;gap:10px;
  font-size:9px;color:rgba(245,230,211,.28);letter-spacing:3.5px;text-transform:uppercase;z-index:1;}
.cover-footer-dot{width:2px;height:2px;background:rgba(176,120,64,.35);border-radius:50%;}

/* ═══ CATALOG PAGE ══════════════════════════════════════════════════════════ */
.catalog-page{
  width:794px;height:1123px;background:var(--cream);
  display:flex;flex-direction:column;padding:30px 40px 26px;overflow:hidden;
}

/* Header */
.page-header{
  display:flex;align-items:baseline;justify-content:space-between;
  padding-bottom:10px;border-bottom:1.5px solid var(--dark);
  margin-bottom:16px;flex-shrink:0;
}
.page-header-brand{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;
  letter-spacing:7px;text-transform:uppercase;color:var(--dark);}
.page-header-title{font-size:9px;font-weight:300;letter-spacing:3px;text-transform:uppercase;color:var(--gris);}

/* 2×3 Grid — rows equally share available height */
.grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  grid-template-rows:repeat(3,1fr);
  gap:12px;
  flex:1;min-height:0;
}

/* ── CARD: image fills entirely, text overlaid ── */
.product-card{
  position:relative;overflow:hidden;background:#000;
  border:1px solid rgba(232,221,208,.3);
}

/* Featured (Kit): spans both columns, row 1 */
.card-featured{grid-column:1 / -1;}

/* Badges */
.card-badges{position:absolute;top:8px;right:8px;z-index:10;display:flex;gap:4px;}
.badge{font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 8px;}
.badge-new{background:rgba(30,15,7,.85);color:var(--fondo);backdrop-filter:blur(4px);}
.badge-sale{background:rgba(184,50,50,.85);color:#fff;backdrop-filter:blur(4px);}

/* Image areas — all use cover so no empty space */
.img-single,.img-pair,.img-gallery,.img-featured,.img-placeholder{
  position:absolute;inset:0;
}
.img-single img{width:100%;height:100%;object-fit:cover;display:block;}
.img-pair{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(0,0,0,.15);}
.img-pair img{width:100%;height:100%;object-fit:cover;display:block;}
.img-placeholder{background:#2a1610;}

/* Gallery (Refill: 3 images) */
.img-gallery{display:grid;gap:1px;background:rgba(0,0,0,.15);}
.img-gallery-3{grid-template-columns:repeat(3,1fr);}
.img-gallery-4{grid-template-columns:repeat(2,1fr);}
.img-gallery img{width:100%;height:100%;object-fit:cover;display:block;}

/* Featured row (Kit Waxmelts: all images side by side) */
.img-featured{display:grid;gap:1px;background:rgba(0,0,0,.15);}
.img-featured-2{grid-template-columns:repeat(2,1fr);}
.img-featured-3{grid-template-columns:repeat(3,1fr);}
.img-featured-4{grid-template-columns:repeat(4,1fr);}
.img-featured-5{grid-template-columns:repeat(5,1fr);}
.img-featured img{width:100%;height:100%;object-fit:cover;display:block;}

/* Dark gradient overlay — name & price in white */
.card-overlay{
  position:absolute;bottom:0;left:0;right:0;z-index:5;
  background:linear-gradient(to top,rgba(10,5,2,.88) 0%,rgba(10,5,2,.55) 55%,transparent 100%);
  padding:36px 14px 12px;
}
.card-category{
  font-size:7px;font-weight:700;letter-spacing:3px;text-transform:uppercase;
  color:rgba(245,230,211,.65);margin-bottom:3px;
}
.card-name{
  font-family:'Playfair Display',serif;font-size:17px;font-weight:600;
  color:#fff;line-height:1.2;margin-bottom:5px;
}
.price-block{display:flex;align-items:baseline;gap:7px;}
.price{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;
  color:var(--fondo);letter-spacing:-.5px;}
.price-label{font-size:9px;color:rgba(245,230,211,.6);letter-spacing:2px;text-transform:uppercase;}
.price-original{font-size:11px;color:rgba(245,230,211,.55);text-decoration:line-through;}
.price-sale{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;
  color:var(--sale);letter-spacing:-.5px;}

/* Footer */
.page-footer{
  display:flex;align-items:center;justify-content:space-between;
  padding-top:10px;border-top:1px solid var(--border);
  margin-top:12px;flex-shrink:0;
  font-size:9px;color:#C4B5A5;letter-spacing:2.5px;text-transform:uppercase;
}
</style></head><body>

<div class="cover">
  <div class="cover-frame"></div>
  <div class="cover-corner tl"></div><div class="cover-corner tr"></div>
  <div class="cover-corner bl"></div><div class="cover-corner br"></div>
  <img class="cover-logo" src="${iconCoverB64}" alt="Glowie" />
  <div class="cover-brand">Glowie</div>
  <div class="cover-rule">
    <div class="cover-rule-line"></div><div class="cover-rule-dot"></div>
    <div class="cover-rule-line"></div>
  </div>
  <div class="cover-tagline">Velas Artesanales de Soya &nbsp;·&nbsp; Cali, Colombia</div>
  <div class="cover-subtitle">Catálogo de Productos</div>
  <div class="cover-date">Abril 2026</div>
  <div class="cover-footer-strip">
    <span>Hecho a mano</span><div class="cover-footer-dot"></div>
    <span>Cera de soya</span><div class="cover-footer-dot"></div>
    <span>Cemento artesanal</span>
  </div>
</div>

${catalogPages.join('\n')}

</body></html>`;
}

function chunkArray(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// ── Minimal PDF writer (JPEG pages) ──────────────────────────────────────────
function writePdfFromJpegs(jpegs, outputPath) {
  const W = 595.28, H = 841.89;
  const n = jpegs.length;
  const imgBase = 3, pageBase = 3+n, contBase = 3+2*n, totalObjs = 2+3*n;
  const bufs=[]; const objPos={}; let pos=0;
  const push=(s)=>{const b=Buffer.from(s,'latin1');bufs.push(b);pos+=b.length;};
  const pushBuf=(b)=>{bufs.push(b);pos+=b.length;};
  const so=(id)=>{objPos[id]=pos;push(`${id} 0 obj\n`);};
  const eo=()=>push('endobj\n');
  push('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');
  for(let i=0;i<n;i++){
    const b=jpegs[i];
    so(imgBase+i);
    push(`<< /Type /XObject /Subtype /Image /Width 2382 /Height 3369 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${b.length} >>\n`);
    push('stream\n');pushBuf(b);push('\nendstream\n');eo();
  }
  for(let i=0;i<n;i++){
    const s=`q ${W.toFixed(2)} 0 0 ${H.toFixed(2)} 0 0 cm /Im${i} Do Q\n`;
    so(contBase+i);push(`<< /Length ${s.length} >>\nstream\n${s}endstream\n`);eo();
  }
  for(let i=0;i<n;i++){
    so(pageBase+i);
    push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] /Resources << /XObject << /Im${i} ${imgBase+i} 0 R >> >> /Contents ${contBase+i} 0 R >>\n`);
    eo();
  }
  const kids=Array.from({length:n},(_,i)=>`${pageBase+i} 0 R`).join(' ');
  so(2);push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>\n`);eo();
  so(1);push('<< /Type /Catalog /Pages 2 0 R >>\n');eo();
  const xp=pos;
  push(`xref\n0 ${totalObjs+1}\n`);
  push('0000000000 65535 f \n');
  for(let i=1;i<=totalObjs;i++) push(`${String(objPos[i]||0).padStart(10,'0')} 00000 n \n`);
  push(`trailer\n<< /Size ${totalObjs+1} /Root 1 0 R >>\nstartxref\n${xp}\n%%EOF\n`);
  fs.writeFileSync(outputPath, Buffer.concat(bufs));
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const outputPath = path.join(__dirname, '..', '..', 'Catalogo_Glowie_2025.pdf');

  // Reorder: Kit first, Refill second, rest in original order
  const kit    = products.find(p => p.id === 'Kit-Waxmelts');
  const refill = products.find(p => p.id === 'refill-waxmelts');
  const rest   = products.filter(p => p.id !== 'Kit-Waxmelts' && p.id !== 'refill-waxmelts');
  const ordered = [kit, refill, ...rest];

  // Fetch images
  console.log('Descargando imágenes...');
  const imageData = await Promise.all(
    ordered.map(async (p) => {
      const maxImgs = (p.id === 'Kit-Waxmelts' || p.id === 'refill-waxmelts') ? Infinity : 2;
      const urls = (p.images || []).slice(0, maxImgs).map(compressUrl);
      return Promise.all(urls.map(fetchBase64));
    })
  );
  console.log('Imágenes listas.');

  // Build cards
  const allCards = ordered.map((p, i) => productCard(p, imageData[i], p.id === 'Kit-Waxmelts'));

  // Page grouping:
  // Page 1: Kit (featured, spans row 1) + 4 regular products (rows 2–3)
  // Remaining pages: 6 products each (2×3)
  const page1Cards = allCards.slice(0, 5);          // Kit + Refill + 3 more
  const restChunks = chunkArray(allCards.slice(5), 6);
  const allGroups  = [page1Cards, ...restChunks];

  const catalogPages = allGroups.map(g => catalogPageHtml(g.join('\n')));

  // Render
  console.log('Renderizando...');
  const browser = await puppeteer.launch({ headless: true });
  const page    = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 3 });
  await page.setContent(buildHtml(catalogPages), { waitUntil: 'domcontentloaded', timeout: 30000 });

  const totalH  = await page.evaluate(() => document.body.scrollHeight);
  const PAGE_H  = 1123;
  const numPages = Math.ceil(totalH / PAGE_H);
  console.log(`Páginas: ${numPages}`);

  const jpegs = [];
  for (let i = 0; i < numPages; i++) {
    const buf = await page.screenshot({
      type: 'jpeg', quality: 96,
      clip: { x: 0, y: i * PAGE_H, width: 794, height: PAGE_H },
    });
    jpegs.push(buf);
    process.stdout.write(`  ${i+1}/${numPages}\r`);
  }
  console.log('');
  await browser.close();

  // Write PDF
  console.log('Ensamblando PDF...');
  writePdfFromJpegs(jpegs, outputPath);

  const mb = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`✅ Catálogo: ${outputPath} (${mb} MB)`);
})();
