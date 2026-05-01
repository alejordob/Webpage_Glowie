/**
 * js/pages/home.js — Glowie Home Page
 */
import { formatPriceCOP } from '../cart.js';
import { openModal } from './modal.js';
import { db, isFirebaseReady } from '../firebase.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const CACHE_KEY = 'glowie_products_v1';
const FEATURED = ['waxmelt','trinidad','flama','circo','parlante','jarron','rombo','estrella'];

function imgUrl(url, w = 400) {
  if (!url || !url.includes('cloudinary')) return url;
  if (url.includes('/f_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_80,w_${w}/`);
}

// ─────────────────────────────────────────────────────────────
// HTML
// ─────────────────────────────────────────────────────────────
export const renderHomePage = () => `
<style id="home-styles">
/* ── Full-bleed layout para home ── */
#app-content {
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* ── Transparent header over hero ── */
.home-header-transparent header,
.home-header-transparent #site-header {
  background: transparent !important;
  box-shadow: none !important;
  border-bottom-color: transparent !important;
}
.home-header-transparent .nav-link { color: rgba(251,243,224,0.65) !important; }
.home-header-transparent .nav-link.active { color: #fbf3e0 !important; }
.home-header-transparent #open-cart-btn { color: rgba(251,243,224,0.7) !important; }

/* ── Orbs floating ── */
@keyframes glowie-float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-28px) scale(1.06)} }

/* ── Spark twinkle ── */
@keyframes glowie-spark { 0%,100%{opacity:0;transform:scale(0)} 45%,55%{opacity:1;transform:scale(1)} }

/* ── Marquee ── */
@keyframes glowie-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

/* ── Reveal on scroll ── */
.g-reveal { opacity:0; transform:translateY(28px); transition:opacity 0.7s ease,transform 0.7s ease; }
.g-reveal.g-visible { opacity:1; transform:translateY(0); }
.g-reveal-left { opacity:0; transform:translateX(-32px); transition:opacity 0.7s ease,transform 0.7s ease; }
.g-reveal-left.g-visible { opacity:1; transform:translateX(0); }
.g-reveal-right { opacity:0; transform:translateX(32px); transition:opacity 0.7s ease,transform 0.7s ease; }
.g-reveal-right.g-visible { opacity:1; transform:translateX(0); }

/* ── Category track scroll ── */
#cat-track { scrollbar-width:none; -ms-overflow-style:none; }
#cat-track::-webkit-scrollbar { display:none; }
.cat-card { transition: transform 0.3s ease; }
.cat-card:hover { transform: translateY(-8px); }
.cat-card:hover .cat-img { opacity: 0.65 !important; transform: scale(1.05); }


/* ── Card glow hover ── */
.home-prod-card { transition:transform 0.3s ease,box-shadow 0.3s ease,border-color 0.3s ease; }
.home-prod-card:hover { transform:translateY(-10px); box-shadow:0 24px 60px rgba(83,22,29,0.5),0 0 0 1px rgba(251,243,224,0.12) !important; }
.home-prod-card:hover .prod-card-glow { opacity:1 !important; }

/* ── Aroma cards ── */
.home-aroma-card { transition:transform 0.25s ease,box-shadow 0.25s ease; }
.home-aroma-card:hover { transform:translateY(-6px); box-shadow:0 20px 48px rgba(83,22,29,0.13) !important; }
.home-aroma-card:hover .aroma-arrow-inner { background:#53161d !important; color:#fbf3e0 !important; transform:translateX(3px); }

/* ── Products: scroll animado desktop / swipe mobile ── */
@keyframes home-prod-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
/* Loop en todos los tamaños */
.home-products-track {
  overflow: hidden; overflow-y: hidden;
  scrollbar-width: none; -ms-overflow-style: none;
}
.home-products-track::-webkit-scrollbar { display: none; }
.home-products-belt {
  display: flex; gap: 16px; width: max-content;
  animation: home-prod-scroll 18s linear infinite;
}
/* Imagen zoom al hover */
.home-prod-card:hover .prod-img-inner { transform: scale(1.07); }
.prod-img-inner { transition: transform 0.5s ease; width:100%; height:100%; object-fit:cover; }

/* Hero: texto al fondo en mobile y desktop — elimina espacio muerto */
#home-hero { justify-content: flex-end !important; min-height: 80svh !important; min-height: 80vh !important; }
@media (min-width: 768px) {
  #home-hero { justify-content: flex-end !important; min-height: 100svh !important; min-height: 100vh !important; }
  .home-scroll-hint { display: flex !important; }
  #home-progress-dots { display: flex !important; }
}
</style>

<!-- ════════════════════════════════════ -->
<!--  HERO                                -->
<!-- ════════════════════════════════════ -->
<section id="home-hero" data-section style="
  position:relative; min-height:100svh; min-height:100vh;
  background:#0a0203; display:flex; flex-direction:column;
  justify-content:flex-end; overflow:hidden; box-sizing:border-box;">

  <!-- Foto de fondo como <img> real para que el browser la priorice como LCP -->
  <img src="img/hero4.jpg" alt="" fetchpriority="high" decoding="async"
       width="1920" height="960"
       style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:0.38;filter:saturate(0.55);pointer-events:none;">
  <!-- Gradiente -->
  <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(10,2,3,0.15) 0%,rgba(10,2,3,0) 25%,rgba(10,2,3,0.65) 65%,rgba(10,2,3,0.97) 100%);"></div>

  <!-- Orbes ambientales -->
  <div style="position:absolute;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle,rgba(160,60,15,0.22) 0%,transparent 70%);filter:blur(55px);top:15%;right:10%;animation:glowie-float 13s ease-in-out infinite;pointer-events:none;"></div>
  <div style="position:absolute;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(83,22,29,0.35) 0%,transparent 70%);filter:blur(45px);top:38%;right:28%;animation:glowie-float 9s ease-in-out infinite;animation-delay:-4s;pointer-events:none;"></div>
  <div style="position:absolute;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(251,243,224,0.07) 0%,transparent 70%);filter:blur(35px);bottom:28%;left:8%;animation:glowie-float 16s ease-in-out infinite;animation-delay:-8s;pointer-events:none;"></div>

  <!-- Chispas -->
  <div id="home-sparks" style="position:absolute;inset:0;pointer-events:none;z-index:1;"></div>

  <!-- Contenido hero -->
  <div style="position:relative;z-index:2;padding:clamp(16px,4vw,60px) clamp(20px,5vw,60px) clamp(28px,6vw,80px);max-width:900px;width:100%;">

    <p style="font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgba(251,243,224,0.4);margin-bottom:20px;">
      Cali, Colombia · Cera de soja 100% natural
    </p>

    <h1 style="font-size:clamp(52px,9vw,120px);font-weight:400;line-height:0.92;letter-spacing:-0.01em;margin-bottom:24px;">
      <span style="display:block;color:#fbf3e0;">Velas que</span>
      <span style="display:block;background:linear-gradient(90deg,#e8a87c,#fbf3e0 50%,#c9956a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">transforman</span>
      <span style="display:block;color:rgba(251,243,224,0.38);font-size:0.24em;font-weight:300;font-style:italic;letter-spacing:0.06em;margin-top:16px;-webkit-text-fill-color:rgba(251,243,224,0.38);">Artesanales &nbsp;·&nbsp; Únicas &nbsp;·&nbsp; Hechas a mano en Cali</span>
    </h1>

    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
      <a href="/catalogo" class="link-route"
         style="background:#fbf3e0;color:#53161d;padding:14px 28px;border-radius:4px;font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;text-decoration:none;transition:all 0.2s;display:inline-flex;align-items:center;gap:8px;">
        Ver colección
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
      </a>
      <a href="https://wa.me/573017748623?text=Hola%20Glowie!%20Vi%20su%20p%C3%A1gina%20y%20quiero%20conocer%20m%C3%A1s%20%F0%9F%95%AF%EF%B8%8F"
         target="_blank"
         onclick="if(typeof gtag==='function')gtag('event','whatsapp_click',{event_category:'home',event_label:'hero_asesoria'});if(typeof fbq==='function')fbq('track','Contact');"
         style="color:rgba(251,243,224,0.55);font-size:13px;font-weight:500;text-decoration:none;border-bottom:1px solid rgba(251,243,224,0.2);padding-bottom:2px;">
        Pedir asesoría →
      </a>
    </div>
  </div>

  <!-- Scroll hint solo desktop -->
  <div style="position:absolute;bottom:32px;right:40px;z-index:2;display:none;flex-direction:column;align-items:center;gap:8px;color:rgba(251,243,224,0.25);font-size:9px;letter-spacing:0.18em;text-transform:uppercase;" class="home-scroll-hint">
    <div style="width:1px;height:44px;background:linear-gradient(to bottom,transparent,rgba(251,243,224,0.3));"></div>
    scroll
  </div>
</section>

<!-- Dots de progreso lateral (solo desktop) -->
<div id="home-progress-dots" style="
  position:fixed; right:24px; top:50%; transform:translateY(-50%);
  z-index:40; display:none; flex-direction:column; gap:10px;
  pointer-events:none;">
  ${['home-hero','home-cats','home-bestsellers-section','home-aromas','home-quote','home-cta-section']
    .map((id,i) => `<div class="home-dot" data-target="${id}" style="
      width:6px; height:6px; border-radius:50%;
      background:rgba(251,243,224,0.22);
      transition:all 0.3s ease;
      pointer-events:none;"></div>`).join('')}
</div>

<!-- ════════════════════════════════════ -->
<!--  DÍA DE LA MADRE                    -->
<!-- ════════════════════════════════════ -->
<!-- ════════════════════════════════════ -->
<!--  DÍA DE LA MADRE — COUNTDOWN       -->
<!-- ════════════════════════════════════ -->
<section id="home-mothers-day" style="background:#0a0203;position:relative;overflow:hidden;">
  <!-- Línea cálida superior -->
  <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.2),transparent);"></div>

  <!-- Header con gradiente cinna -->
  <div style="background:linear-gradient(135deg,#53161d 0%,#3d0a0f 50%,#2d0a10 100%);padding:clamp(22px,4vw,36px) clamp(16px,5vw,48px);position:relative;overflow:hidden;">
    <div style="position:absolute;right:-10px;top:50%;transform:translateY(-50%);font-size:clamp(80px,14vw,140px);opacity:0.07;user-select:none;pointer-events:none;line-height:1;">🌹</div>
    <div style="position:relative;z-index:1;max-width:700px;">
      <div style="font-size:8px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(251,243,224,0.45);margin-bottom:10px;">Día de la Madre · 10 de Mayo 2026</div>
      <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(26px,4.5vw,44px);color:#fbf3e0;line-height:1.05;margin-bottom:6px;">
        El tiempo corre,<br><em style="color:#e8a87c;font-style:italic;">mamá te espera</em> 🌹
      </h2>
      <p style="font-size:12px;color:rgba(251,243,224,0.42);margin:0;">Regalos artesanales con envío en Cali · Cera de soja hecha a mano</p>
    </div>
  </div>

  <!-- Countdown -->
  <div id="home-mothers-countdown" style="display:flex;gap:0;border-bottom:1px solid rgba(251,243,224,0.07);">
    ${['days','hours','mins','secs'].map((id, i) => `
      <div style="flex:1;padding:clamp(14px,3vw,22px) 8px;display:flex;flex-direction:column;align-items:center;gap:4px;border-right:${i<3 ? '1px solid rgba(251,243,224,0.07)' : 'none'};background:rgba(10,2,3,0.4);">
        <span id="hmd-${id}" style="font-family:'DM Serif Display',serif;font-size:clamp(28px,5vw,52px);color:#e8a87c;line-height:1;display:block;">00</span>
        <span style="font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(251,243,224,0.28);">${['Días','Horas','Min','Seg'][i]}</span>
      </div>`).join('')}
  </div>

  <!-- Productos sugeridos -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid rgba(251,243,224,0.07);">
    ${[
      {emoji:'🕯️', name:'Vela Flama', price:'$35.000', sub:'5 aromas · Cemento'},
      {emoji:'✨', name:'Combo Trinidad', price:'$60.000', sub:'3 velas · El más regalado'},
      {emoji:'🧨', name:'Kit Waxmelts', price:'$60.000', sub:'5 aromas incluidos'},
    ].map((p, i) => `
      <div style="padding:clamp(14px,2.5vw,20px) clamp(10px,2vw,18px);text-align:center;border-right:${i<2 ? '1px solid rgba(251,243,224,0.07)' : 'none'};display:flex;flex-direction:column;align-items:center;gap:8px;">
        <span style="font-size:clamp(24px,4vw,32px);filter:drop-shadow(0 0 6px rgba(232,168,124,0.2));">${p.emoji}</span>
        <div>
          <div style="font-family:'DM Serif Display',serif;font-size:clamp(13px,2vw,17px);color:#fbf3e0;margin-bottom:2px;">${p.name}</div>
          <div style="font-size:9px;color:rgba(251,243,224,0.3);margin-bottom:4px;">${p.sub}</div>
          <div style="font-size:clamp(13px,2vw,16px);color:#e8a87c;font-weight:500;">${p.price}</div>
        </div>
      </div>`).join('')}
  </div>

  <!-- CTAs -->
  <div style="display:flex;gap:10px;padding:clamp(14px,2.5vw,20px) clamp(16px,5vw,48px);flex-wrap:wrap;">
    <a href="/catalogo" class="link-route"
       onclick="if(typeof gtag==='function')gtag('event','click',{event_category:'home_mothers_day',event_label:'ver_regalos'});"
       style="flex:1;min-width:160px;background:#fbf3e0;color:#53161d;padding:13px 20px;border-radius:8px;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;text-decoration:none;text-align:center;transition:opacity 0.2s;"
       onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">
      Ver todos los regalos →
    </a>
    <a href="https://wa.me/573017748623?text=Hola%20Glowie!%20Quiero%20un%20regalo%20para%20el%20D%C3%ADa%20de%20la%20Madre%20%F0%9F%8C%B9"
       target="_blank"
       onclick="if(typeof gtag==='function')gtag('event','whatsapp_click',{event_category:'home',event_label:'mothers_day_wa'});if(typeof fbq==='function')fbq('track','Contact');"
       style="background:rgba(37,211,102,0.1);border:1px solid rgba(37,211,102,0.25);color:#25D366;padding:13px 20px;border-radius:8px;font-size:13px;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;transition:all 0.2s;"
       onmouseover="this.style.background='rgba(37,211,102,0.18)'" onmouseout="this.style.background='rgba(37,211,102,0.1)'">
      💬 Pedir asesoría
    </a>
  </div>
</section>

<!-- ════════════════════════════════════ -->
<!--  MARQUEE                             -->
<!-- ════════════════════════════════════ -->
<div style="background:#53161d;padding:13px 0;overflow:hidden;white-space:nowrap;border-top:1px solid rgba(251,243,224,0.08);border-bottom:1px solid rgba(251,243,224,0.08);">
  <div style="display:inline-flex;animation:glowie-marquee 20s linear infinite;">
    ${['Cera de soja natural','Hecho en Cali','Diseños únicos','Aromas artesanales','Envío gratis $60k+','Glowie · 2025',
       'Cera de soja natural','Hecho en Cali','Diseños únicos','Aromas artesanales','Envío gratis $60k+','Glowie · 2025']
      .map((t,i) => `<span style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(251,243,224,${i%6===5?'0.5':'0.75'});padding:0 ${i%6===5?'12':'28'}px;">${i%6===5?'·':t}</span>`).join('')}
  </div>
</div>

<!-- ════════════════════════════════════ -->
<!--  CATEGORÍAS — scroll cinematográfico -->
<!-- ════════════════════════════════════ -->
<section id="home-cats" data-section style="background:#0a0203;padding:clamp(56px,7vw,88px) 0;overflow:hidden;">

  <!-- Header -->
  <div class="g-reveal" style="padding:0 clamp(20px,5vw,56px);margin-bottom:clamp(32px,5vw,52px);display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:16px;">
    <div>
      <p style="font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgba(251,243,224,0.25);margin-bottom:10px;">Lo que hacemos</p>
      <h2 style="font-size:clamp(32px,5vw,56px);font-weight:400;line-height:1;letter-spacing:-0.01em;color:#fbf3e0;">Nuestro<br><span style="background:linear-gradient(90deg,#e8a87c,#fbf3e0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">universo</span></h2>
    </div>
    <p style="font-size:13px;color:rgba(251,243,224,0.35);font-style:italic;max-width:220px;line-height:1.5;">Cada pieza, diseñada con intención desde Cali.</p>
  </div>

  <!-- Cards: scroll horizontal en mobile, 4 cols en desktop -->
  <div id="cat-track" style="display:flex;gap:clamp(10px,1.5vw,16px);overflow-x:auto;padding:0 clamp(20px,5vw,56px) 16px;scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;">

    <!-- 01 — Velas -->
    <a href="/catalogo" class="link-route cat-card" data-cat="velas"
       style="flex-shrink:0;width:clamp(240px,38vw,320px);border-radius:20px;overflow:hidden;position:relative;cursor:pointer;display:block;text-decoration:none;background:#16060a;">
      <!-- Foto -->
      <div style="position:absolute;inset:0;overflow:hidden;">
        <img src="img/hero4.jpg" alt="Velas" class="cat-img"
             style="width:100%;height:100%;object-fit:cover;opacity:0.5;transition:transform 0.6s ease,opacity 0.4s ease;">
      </div>
      <!-- Overlay degradado -->
      <div style="position:absolute;inset:0;background:linear-gradient(170deg,rgba(83,22,29,0.15) 0%,rgba(10,2,3,0.9) 75%);"></div>
      <!-- Número grande de fondo -->
      <div style="position:absolute;top:-10px;right:-8px;font-size:clamp(80px,14vw,130px);font-weight:900;color:rgba(251,243,224,0.04);line-height:1;letter-spacing:-0.05em;pointer-events:none;">01</div>
      <!-- Contenido -->
      <div style="position:relative;z-index:1;height:clamp(300px,50vw,440px);display:flex;flex-direction:column;justify-content:space-between;padding:clamp(20px,3vw,28px);">
        <div>
          <span style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(251,243,224,0.4);border:1px solid rgba(251,243,224,0.12);padding:4px 10px;border-radius:20px;">Más vendidas</span>
        </div>
        <div>
          <p style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(251,243,224,0.35);margin-bottom:8px;">01 / Velas</p>
          <h3 style="font-size:clamp(28px,4.5vw,40px);font-weight:400;color:#fbf3e0;line-height:1;letter-spacing:0;margin-bottom:10px;">Velas<br>aromáticas</h3>
          <p style="font-size:12px;color:rgba(251,243,224,0.5);line-height:1.6;margin-bottom:16px;">Cera de soja · 5 aromas · Diseño de cemento artesanal</p>
          <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:rgba(251,243,224,0.45);border-bottom:1px solid rgba(251,243,224,0.2);padding-bottom:2px;">Explorar →</span>
        </div>
      </div>
    </a>

    <!-- 02 — Pebeteros & Waxmelts -->
    <a href="/catalogo" class="link-route cat-card"
       style="flex-shrink:0;width:clamp(240px,38vw,320px);border-radius:20px;overflow:hidden;position:relative;cursor:pointer;display:block;text-decoration:none;background:#060e0a;">
      <div style="position:absolute;inset:0;background:linear-gradient(170deg,#0d2015 0%,#030a06 100%);"></div>
      <div style="position:absolute;top:-10px;right:-8px;font-size:clamp(80px,14vw,130px);font-weight:900;color:rgba(251,243,224,0.035);line-height:1;letter-spacing:-0.05em;pointer-events:none;">02</div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
        <div style="width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(40,120,60,0.12) 0%,transparent 70%);filter:blur(20px);"></div>
      </div>
      <div style="position:relative;z-index:1;height:clamp(300px,50vw,440px);display:flex;flex-direction:column;justify-content:space-between;padding:clamp(20px,3vw,28px);">
        <div>
          <span style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(160,220,170,0.4);border:1px solid rgba(160,220,170,0.12);padding:4px 10px;border-radius:20px;">Cerámica · Waxmelts</span>
        </div>
        <div>
          <p style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(251,243,224,0.35);margin-bottom:8px;">02 / Pebeteros</p>
          <h3 style="font-size:clamp(28px,4.5vw,40px);font-weight:400;color:#fbf3e0;line-height:1;letter-spacing:0;margin-bottom:10px;">Pebeteros<br><em style="color:rgba(251,243,224,0.4);">cerámicos</em></h3>
          <p style="font-size:12px;color:rgba(251,243,224,0.5);line-height:1.6;margin-bottom:16px;">Cerámica artesanal · Kit & Refill de waxmelts disponibles</p>
          <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:rgba(251,243,224,0.4);border-bottom:1px solid rgba(251,243,224,0.15);padding-bottom:2px;">Explorar →</span>
        </div>
      </div>
    </a>

    <!-- 03 — Bases -->
    <a href="/catalogo" class="link-route cat-card"
       style="flex-shrink:0;width:clamp(240px,38vw,320px);border-radius:20px;overflow:hidden;position:relative;cursor:pointer;display:block;text-decoration:none;background:#0c0810;">
      <div style="position:absolute;inset:0;background:linear-gradient(170deg,#1a1228 0%,#080610 100%);"></div>
      <div style="position:absolute;top:-10px;right:-8px;font-size:clamp(80px,14vw,130px);font-weight:900;color:rgba(251,243,224,0.03);line-height:1;letter-spacing:-0.05em;pointer-events:none;">04</div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
        <div style="width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(100,80,180,0.08) 0%,transparent 70%);filter:blur(20px);"></div>
      </div>
      <div style="position:relative;z-index:1;height:clamp(300px,50vw,440px);display:flex;flex-direction:column;justify-content:space-between;padding:clamp(20px,3vw,28px);">
        <div>
          <span style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(180,160,220,0.4);border:1px solid rgba(180,160,220,0.1);padding:4px 10px;border-radius:20px;">Cemento artesanal</span>
        </div>
        <div>
          <p style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(251,243,224,0.35);margin-bottom:8px;">03 / Bases</p>
          <h3 style="font-size:clamp(28px,4.5vw,40px);font-weight:400;color:#fbf3e0;line-height:1;letter-spacing:0;margin-bottom:10px;">Bases<br><em style="color:rgba(251,243,224,0.4);">decorativas</em></h3>
          <p style="font-size:12px;color:rgba(251,243,224,0.5);line-height:1.6;margin-bottom:16px;">Pedestales únicos · Cemento · Múltiples formas</p>
          <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:rgba(251,243,224,0.4);border-bottom:1px solid rgba(251,243,224,0.15);padding-bottom:2px;">Explorar →</span>
        </div>
      </div>
    </a>

    <!-- 05 — Próximamente: Mist -->
    <div class="cat-card"
       style="flex-shrink:0;width:clamp(200px,32vw,260px);border-radius:20px;overflow:hidden;position:relative;display:block;background:#08080e;border:1px solid rgba(251,243,224,0.05);">
      <div style="position:absolute;inset:0;background:linear-gradient(170deg,#10101e 0%,#050508 100%);"></div>
      <div style="position:relative;z-index:1;height:clamp(300px,50vw,440px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:clamp(20px,3vw,28px);text-align:center;gap:16px;">
        <div style="width:52px;height:52px;border-radius:50%;border:1.5px solid rgba(251,243,224,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:4px;">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(251,243,224,0.3)" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <div>
          <p style="font-size:9px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgba(251,243,224,0.2);margin-bottom:10px;">Próximamente</p>
          <h3 style="font-size:clamp(22px,3.5vw,32px);font-weight:400;color:rgba(251,243,224,0.18);letter-spacing:0;line-height:1;margin-bottom:8px;">Mist</h3>
          <p style="font-size:11px;color:rgba(251,243,224,0.18);line-height:1.5;font-style:italic;">Bruma aromática<br>para espacios</p>
        </div>
        <div style="width:40px;height:1px;background:rgba(251,243,224,0.08);"></div>
        <p style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(251,243,224,0.15);">2025</p>
      </div>
    </div>

  </div>

  <!-- Indicador de scroll (mobile) -->
  <div style="display:flex;justify-content:center;align-items:center;gap:6px;margin-top:20px;padding:0 20px;">
    <div style="height:1px;flex:1;background:rgba(251,243,224,0.08);max-width:60px;"></div>
    <p style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(251,243,224,0.2);">desliza →</p>
    <div style="height:1px;flex:1;background:rgba(251,243,224,0.08);max-width:60px;"></div>
  </div>
</section>

<!-- ════════════════════════════════════ -->
<!--  BESTSELLERS                         -->
<!-- ════════════════════════════════════ -->
<section id="home-bestsellers-section" data-section style="background:#0a0203;padding:70px 0 70px clamp(16px,5vw,48px);">
  <div class="g-reveal" style="display:flex;align-items:flex-end;justify-content:space-between;padding-right:clamp(16px,5vw,48px);margin-bottom:36px;">
    <div style="position:relative;">
      <!-- Número de fondo -->
      <span style="position:absolute;top:-20px;left:-4px;font-size:clamp(72px,12vw,130px);font-weight:900;color:rgba(251,243,224,0.04);line-height:1;letter-spacing:-0.05em;pointer-events:none;user-select:none;">01</span>
      <p style="position:relative;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(251,243,224,0.28);margin-bottom:10px;">Más vendidos</p>
      <h2 style="position:relative;font-size:clamp(32px,5vw,52px);font-weight:400;line-height:1;letter-spacing:-0.01em;color:#fbf3e0;">Los más<br><span style="background:linear-gradient(90deg,#e8a87c,#fbf3e0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">amados</span></h2>
    </div>
    <a href="/catalogo" class="link-route" style="color:rgba(251,243,224,0.4);font-size:12px;text-decoration:none;border-bottom:1px solid rgba(251,243,224,0.2);padding-bottom:2px;flex-shrink:0;margin-bottom:4px;">Ver todo →</a>
  </div>
  <!-- Cards: auto-scroll belt -->
  <div class="home-products-track" style="overflow:hidden;">
    <div id="home-bestsellers" class="home-products-belt">
      <!-- skeletons -->
      ${[1,2,3,4,5].map(() => `
        <div style="flex-shrink:0;width:clamp(200px,30vw,280px);height:clamp(260px,40vw,380px);border-radius:20px;background:rgba(251,243,224,0.05);"></div>
      `).join('')}
    </div>
  </div>
</section>

<!-- ════════════════════════════════════ -->
<!--  AROMAS                              -->
<!-- ════════════════════════════════════ -->
<section id="home-aromas" data-section style="background:#fbf3e0;padding:clamp(48px,7vw,88px) clamp(16px,5vw,48px);">
  <div class="g-reveal" style="text-align:center;margin-bottom:44px;">
    <p style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(83,22,29,0.3);margin-bottom:10px;">Nuestros aromas</p>
    <h2 style="font-size:clamp(32px,5vw,54px);font-weight:400;letter-spacing:-0.01em;color:#53161d;">¿Cuál es el tuyo?</h2>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;max-width:1100px;margin:0 auto;" id="aromas-grid">
    ${[
      {emoji:'🌿',name:'Bambú',desc:'Fresco y limpio. Aire puro en tu espacio.',accent:'#e8f5e9',dot:'#4caf50'},
      {emoji:'🥥',name:'Coco & Vainilla',desc:'Dulce y envolvente. Como una tarde de sol.',accent:'#fff8e1',dot:'#ff9800'},
      {emoji:'☕',name:'Café Mocka',desc:'Profundo y acogedor. Energía en estado puro.',accent:'#efebe9',dot:'#795548'},
      {emoji:'🍑',name:'Durazno',desc:'Frutal y delicado. Suavidad en cada llama.',accent:'#fce4ec',dot:'#e91e63'},
    ].map((a,i) => `
      <a href="/aromas" class="link-route home-aroma-card g-reveal" style="transition-delay:${i*0.08}s;
         background:white;border-radius:20px;padding:clamp(18px,3vw,28px) clamp(16px,3vw,22px);position:relative;
         overflow:hidden;cursor:pointer;text-decoration:none;display:block;
         border:1px solid rgba(83,22,29,0.05);">
        <div style="position:absolute;top:-24px;right:-24px;width:96px;height:96px;border-radius:50%;background:${a.dot};opacity:0.12;"></div>
        <span style="font-size:clamp(28px,5vw,36px);display:block;margin-bottom:12px;">${a.emoji}</span>
        <p style="font-size:clamp(16px,2.5vw,20px);font-family:'DM Serif Display',serif;font-weight:400;color:#53161d;margin-bottom:5px;">${a.name}</p>
        <p style="font-size:11px;color:rgba(83,22,29,0.5);line-height:1.55;">${a.desc}</p>
        <div class="aroma-arrow-inner" style="position:absolute;bottom:16px;right:16px;width:28px;height:28px;border-radius:50%;background:rgba(83,22,29,0.07);display:flex;align-items:center;justify-content:center;font-size:12px;color:#53161d;transition:all 0.2s;">→</div>
      </a>
    `).join('')}
  </div>
  <div class="g-reveal" style="text-align:center;margin-top:32px;">
    <a href="/aromas" class="link-route" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#53161d;text-decoration:none;border-bottom:1px solid rgba(83,22,29,0.3);padding-bottom:2px;">Ver guía completa de aromas →</a>
  </div>
</section>

<!-- ════════════════════════════════════ -->
<!--  FRASE EDITORIAL                     -->
<!-- ════════════════════════════════════ -->
<section id="home-quote" data-section style="background:#0a0203;padding:clamp(70px,10vw,120px) clamp(16px,5vw,48px);text-align:center;position:relative;overflow:hidden;">
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:clamp(80px,18vw,200px);font-weight:900;color:rgba(251,243,224,0.022);white-space:nowrap;pointer-events:none;letter-spacing:-0.05em;">GLOWIE</div>
  <div class="g-reveal" style="position:relative;z-index:1;">
    <p style="font-size:clamp(36px,6vw,72px);font-family:'DM Serif Display',serif;font-weight:400;line-height:1.1;letter-spacing:-0.01em;">
      <span style="display:block;color:rgba(251,243,224,0.3);">Cada</span>
      <span style="display:block;color:#fbf3e0;">vela</span>
      <span style="display:block;color:rgba(251,243,224,0.3);">es una</span>
      <span style="display:block;background:linear-gradient(90deg,#e8a87c,#fbf3e0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">intención.</span>
    </p>
    <p style="margin-top:28px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(251,243,224,0.25);">Glowie · Cali, Colombia · Desde 2025</p>
  </div>
</section>

<!-- ════════════════════════════════════ -->
<!--  CTA FINAL                           -->
<!-- ════════════════════════════════════ -->
<section id="home-cta-section" data-section style="background:#fbf3e0;padding:clamp(56px,8vw,96px) clamp(16px,5vw,56px);">
  <div class="g-reveal" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:32px;max-width:1100px;margin:0 auto;">
    <h2 style="font-size:clamp(28px,5vw,58px);font-weight:400;letter-spacing:-0.01em;line-height:1.1;color:#53161d;flex:1;min-width:240px;">
      ¿Lista para<br>
      <span style="color:rgba(83,22,29,0.28);">encontrar</span><br>
      tu vela perfecta?
    </h2>
    <div style="display:flex;flex-direction:column;gap:12px;flex-shrink:0;">
      <a href="/catalogo" class="link-route"
         style="background:#53161d;color:#fbf3e0;padding:15px 32px;border-radius:6px;font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;text-decoration:none;text-align:center;transition:opacity 0.2s;display:block;">
        Ver colección →
      </a>
      <a href="https://wa.me/573017748623?text=Hola%20Glowie!%20Quiero%20encontrar%20mi%20vela%20perfecta%20%F0%9F%95%AF%EF%B8%8F"
         target="_blank"
         onclick="if(typeof gtag==='function')gtag('event','whatsapp_click',{event_category:'home',event_label:'cta_final'});if(typeof fbq==='function')fbq('track','Contact');"
         style="border:2px solid rgba(83,22,29,0.25);color:rgba(83,22,29,0.6);padding:13px 32px;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;text-align:center;transition:all 0.2s;display:block;">
        Hablar por WhatsApp
      </a>
    </div>
  </div>
</section>
`;

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
export const initializeHomeListeners = async () => {
  initHomeHeader();
  spawnSparks();
  initReveal();
  fixAromasGrid();
  initMothersCountdown();
  setTimeout(initCatHover, 100);
  await loadBestsellers();
};

function initMothersCountdown() {
  const target = new Date('2026-05-10T23:59:59');
  const els = {
    days:  document.getElementById('hmd-days'),
    hours: document.getElementById('hmd-hours'),
    mins:  document.getElementById('hmd-mins'),
    secs:  document.getElementById('hmd-secs'),
  };
  if (!els.days) return;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      ['days','hours','mins','secs'].forEach(k => { if (els[k]) els[k].textContent = '00'; });
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (els.days)  els.days.textContent  = pad(d);
    if (els.hours) els.hours.textContent = pad(h);
    if (els.mins)  els.mins.textContent  = pad(m);
    if (els.secs)  els.secs.textContent  = pad(s);
  }

  tick();
  const interval = setInterval(tick, 1000);
  // Limpiar cuando se navegue a otra página
  const orig = window._homeHeaderCleanup;
  window._homeHeaderCleanup = () => { clearInterval(interval); orig?.(); };
}

// ── Chispas animadas ──────────────────────────────────────────
function spawnSparks() {
  const container = document.getElementById('home-sparks');
  if (!container) return;
  for (let i = 0; i < 22; i++) {
    const s = document.createElement('div');
    const size = 1.5 + Math.random() * 2;
    s.style.cssText = `
      position:absolute;
      left:${Math.random() * 100}%;
      top:${Math.random() * 85}%;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:rgba(251,200,80,${0.5 + Math.random() * 0.5});
      animation:glowie-spark ${2.5 + Math.random() * 4}s ease-in-out infinite;
      animation-delay:${Math.random() * 5}s;
    `;
    container.appendChild(s);
  }
}

// ── Scroll reveal ─────────────────────────────────────────────
function initReveal() {
  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('g-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.g-reveal, .g-reveal-left, .g-reveal-right').forEach(el => io.observe(el));

  // Progress dots
  const dots = document.querySelectorAll('.home-dot');
  const sections = document.querySelectorAll('[data-section]');
  if (!dots.length || !sections.length) return;

  // Detectar si fondo es oscuro para el color de los dots
  const darkSections = new Set(['home-hero','home-cats','home-bestsellers-section','home-quote']);

  const dotsIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      const isDark = darkSections.has(id);
      dots.forEach(d => {
        const isActive = d.dataset.target === id;
        d.style.background = isActive
          ? (isDark ? 'rgba(251,243,224,0.9)' : 'rgba(83,22,29,0.7)')
          : (isDark ? 'rgba(251,243,224,0.2)' : 'rgba(83,22,29,0.15)');
        d.style.transform = isActive ? 'scale(1.6)' : 'scale(1)';
      });
    });
  }, { threshold: 0.5 });
  sections.forEach(s => dotsIO.observe(s));
}

// ── Header: fixed oscuro en home, restaurar al salir ─────────
function initHomeHeader() {
  const header = document.querySelector('header');
  if (!header) return;

  const origPosition   = header.style.position || '';
  const origTop        = header.style.top || '';
  const origBackground = header.style.background || '';

  // Solo cambiamos position a fixed para que el hero arranque desde y=0
  // (los colores ya son oscuros globalmente)
  header.style.position   = 'fixed';
  header.style.top        = '0';
  header.style.left       = '0';
  header.style.right      = '0';
  header.style.width      = '100%';
  header.style.zIndex     = '50';
  header.style.background = 'rgba(10,2,3,0.75)';
  header.style.transition = 'background 0.4s ease';

  // Scroll: más opaco fuera del hero
  const hero = document.getElementById('home-hero');
  const onScroll = () => {
    if (!hero) return;
    const heroBottom = hero.getBoundingClientRect().bottom;
    header.style.background = heroBottom <= 0 ? 'rgba(10,2,3,0.96)' : 'rgba(10,2,3,0.75)';
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  window._homeHeaderCleanup = () => {
    window.removeEventListener('scroll', onScroll);
    header.style.position   = origPosition;
    header.style.top        = origTop;
    header.style.left       = '';
    header.style.right      = '';
    header.style.width      = '';
    header.style.background = origBackground;
    header.style.transition = '';
  };
}

// ── Grids responsive ─────────────────────────────────────────
function fixAromasGrid() {
  const aromas = document.getElementById('aromas-grid');
  const update = () => {
    if (aromas) aromas.style.gridTemplateColumns = window.innerWidth >= 768 ? 'repeat(4,1fr)' : 'repeat(2,1fr)';
  };
  update();
  window.addEventListener('resize', update, { passive: true });
}

// ── Hover zoom en cards de categorías ────────────────────────
function initCatHover() {
  document.querySelectorAll('#cat-grid a .cat-img, #cat-grid a').forEach(el => {
    const card = el.closest('a');
    const img  = card?.querySelector('.cat-img');
    if (!card || !img) return;
    card.addEventListener('mouseenter', () => { img.style.transform = 'scale(1.05)'; });
    card.addEventListener('mouseleave', () => { img.style.transform = 'scale(1)'; });
  });
}

// ── Cargar bestsellers (con retry como catalog.js) ────────────
async function loadBestsellers(retry = 0) {
  const container = document.getElementById('home-bestsellers');
  if (!container) return;

  let products = [];

  // 1. Intentar caché
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length) products = parsed;
    }
  } catch {}

  // 2. Si no hay caché, cargar Firebase con retry
  if (!products.length) {
    // Esperar a que la auth anónima de Firebase esté lista
    if (!isFirebaseReady()) {
      if (retry < 10 && document.getElementById('home-bestsellers')) {
        setTimeout(() => loadBestsellers(retry + 1), 400 * (retry + 1));
      }
      return;
    }
    try {
      const freshList = [];
      const snap = await getDocs(collection(db, 'products'));
      snap.forEach(d => freshList.push({ id: d.id, ...d.data() }));
      products = freshList;
      if (products.length) localStorage.setItem(CACHE_KEY, JSON.stringify(products));
    } catch (e) {
      if (retry < 8 && document.getElementById('home-bestsellers')) {
        setTimeout(() => loadBestsellers(retry + 1), 500 * Math.pow(1.5, retry));
        return;
      }
      console.warn('Home: no se pudieron cargar productos', e);
    }
  }

  if (!products.length) { container.innerHTML = ''; return; }

  // Siempre mostrar los featured (incluso agotados para que se vea el catálogo)
  const featured = products.filter(p =>
    FEATURED.some(kw => (p.name || '').toLowerCase().includes(kw))
  );
  const others = products.filter(p => !featured.includes(p) && p.stock > 0);
  const toShow = [...featured, ...others].slice(0, 5);

  // Duplicar para loop infinito en el auto-scroll
  const html = toShow.map(p => buildCard(p)).join('');
  container.innerHTML = html + html;

  container.querySelectorAll('.home-prod-card').forEach(card => {
    card.addEventListener('click', () => {
      const prod = toShow.find(x => x.id === card.dataset.id);
      if (prod) openModal(prod);
    });
  });
}

function buildCard(p) {
  const img = p.images?.[0] || p.imageUrl || '';
  const price = p.on_sale ? p.on_sale_price : p.price;
  const isOnSale = p.on_sale && p.on_sale_price < p.price;
  const pct = isOnSale ? Math.round((1 - p.on_sale_price / p.price) * 100) : 0;

  let badge = '';
  if (p.stock <= 0)
    badge = `<div style="position:absolute;top:14px;left:14px;z-index:2;background:rgba(239,68,68,0.88);backdrop-filter:blur(4px);color:white;padding:4px 10px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:0.08em;">AGOTADO</div>`;
  else if (isOnSale)
    badge = `<div style="position:absolute;top:14px;left:14px;z-index:2;background:rgba(10,2,3,0.7);backdrop-filter:blur(4px);color:#fbf3e0;padding:4px 10px;border-radius:20px;font-size:9px;font-weight:700;">${pct}% OFF</div>`;
  else if (p.isNew)
    badge = `<div style="position:absolute;top:14px;left:14px;z-index:2;background:linear-gradient(135deg,#FFD700,#FFA500);color:#1a0508;padding:4px 10px;border-radius:20px;font-size:9px;font-weight:700;">NEW</div>`;

  return `
    <div class="home-prod-card" data-id="${p.id}" style="
      flex-shrink:0;
      width:clamp(200px,30vw,280px);
      border-radius:20px;
      overflow:hidden;
      cursor:pointer;
      position:relative;
      background:#0d0305;">

      ${badge}

      <!-- Imagen full-card -->
      <div style="height:clamp(260px,38vw,380px);overflow:hidden;position:relative;">
        <img src="${imgUrl(img, 600)}"
             alt="${p.name}"
             class="prod-img-inner"
             loading="lazy"
             onerror="this.parentElement.style.background='#1a0508'"
             style="display:block;">
        <!-- Gradient overlay -->
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(10,2,3,0.92) 0%,rgba(10,2,3,0.3) 45%,transparent 70%);"></div>
      </div>

      <!-- Texto superpuesto abajo -->
      <div style="position:absolute;bottom:0;left:0;right:0;padding:18px 16px;">
        <p style="font-size:14px;font-weight:700;color:#fbf3e0;margin-bottom:4px;line-height:1.2;">${p.name}</p>
        ${isOnSale
          ? `<p style="font-size:16px;font-weight:900;color:rgba(251,243,224,0.7);">
               <span style="font-size:11px;text-decoration:line-through;opacity:0.5;margin-right:5px;">${formatPriceCOP(p.price)}</span>
               ${formatPriceCOP(p.on_sale_price)}
             </p>`
          : `<p style="font-size:16px;font-weight:900;color:rgba(251,243,224,0.7);">${formatPriceCOP(price)}</p>`
        }
      </div>

      <!-- Glow hover -->
      <div class="prod-card-glow" style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);
           width:160px;height:60px;background:radial-gradient(ellipse,rgba(220,120,40,0.45),transparent);
           filter:blur(16px);opacity:0;transition:opacity 0.3s;pointer-events:none;"></div>
    </div>
  `;
}
