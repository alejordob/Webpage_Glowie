export function initializeNosotrosListeners() {
  // Reveal on scroll — mismo sistema que home
  const reveals = document.querySelectorAll('.nos-reveal');
  if (!reveals.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('nos-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  reveals.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
    io.observe(el);
  });
}

const FOUNDER_IMG = 'https://res.cloudinary.com/du3kkvkmy/image/upload/f_auto,q_80,w_900/v1777602014/94438362-03e8-4238-8738-32319c18850f_j3s7eq.jpg';

export function renderNosotrosPage() {
  return `
<style id="nosotros-styles">
#app-content { max-width:none !important; padding:0 !important; margin:0 !important; background:#0a0203 !important; }
.nos-reveal { opacity:0; transform:translateY(24px); transition:opacity 0.65s ease, transform 0.65s ease; }
.nos-reveal.nos-visible { opacity:1; transform:translateY(0); }
@keyframes nos-float   { 0%,100%{transform:translateY(0) scale(1)}   50%{transform:translateY(-14px) scale(1.04)} }
@keyframes nos-float2  { 0%,100%{transform:translateY(0) scale(1)}   50%{transform:translateY(-20px) scale(1.06)} }
@keyframes nos-rotate  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes nos-pulse   { 0%,100%{opacity:0.06} 50%{opacity:0.12} }
@keyframes nos-flicker { 0%,100%{transform:scaleY(1) scaleX(1)} 25%{transform:scaleY(1.06) scaleX(0.96)} 75%{transform:scaleY(0.96) scaleX(1.03)} }
</style>

<div style="background:#0a0203;min-height:100vh;">

  <!-- ── HERO ABSTRACTO ── -->
  <section style="position:relative;min-height:88vh;display:flex;align-items:center;overflow:hidden;background:#0a0203;">

    <!-- Fondo: malla de luz cálida -->
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 70% 40%,rgba(83,22,29,0.45) 0%,transparent 60%),radial-gradient(ellipse 50% 70% at 20% 70%,rgba(160,60,10,0.15) 0%,transparent 55%),radial-gradient(ellipse 40% 40% at 85% 80%,rgba(232,168,124,0.08) 0%,transparent 50%);pointer-events:none;"></div>

    <!-- Orbes animados -->
    <div style="position:absolute;width:480px;height:480px;border-radius:50%;background:radial-gradient(circle,rgba(160,60,15,0.22) 0%,transparent 65%);filter:blur(60px);top:-10%;right:-5%;animation:nos-float 14s ease-in-out infinite;pointer-events:none;"></div>
    <div style="position:absolute;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(83,22,29,0.4) 0%,transparent 65%);filter:blur(50px);top:30%;right:25%;animation:nos-float2 10s ease-in-out infinite;pointer-events:none;"></div>
    <div style="position:absolute;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(232,168,124,0.12) 0%,transparent 65%);filter:blur(35px);bottom:15%;left:10%;animation:nos-float 18s ease-in-out infinite;animation-delay:-6s;pointer-events:none;"></div>

    <!-- Líneas geométricas decorativas -->
    <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.04;" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      <circle cx="600" cy="150" r="220" fill="none" stroke="#e8a87c" stroke-width="1"/>
      <circle cx="600" cy="150" r="160" fill="none" stroke="#e8a87c" stroke-width="0.5"/>
      <circle cx="600" cy="150" r="90"  fill="none" stroke="#e8a87c" stroke-width="0.5"/>
      <line x1="380" y1="0" x2="800" y2="600" stroke="#e8a87c" stroke-width="0.5"/>
      <line x1="420" y1="0" x2="800" y2="500" stroke="#e8a87c" stroke-width="0.3"/>
    </svg>

    <!-- Línea cálida top -->
    <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.25),transparent);"></div>
    <!-- Línea cálida bottom -->
    <div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.1),transparent);"></div>

    <!-- Contenido -->
    <div style="position:relative;z-index:2;padding:clamp(48px,8vw,80px) clamp(16px,5vw,56px);max-width:680px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="width:28px;height:1px;background:#e8a87c;opacity:0.6;"></div>
        <span style="font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#e8a87c;">Nuestra historia · Cali, Colombia</span>
      </div>
      <h1 style="font-family:'DM Serif Display',serif;font-size:clamp(44px,8vw,88px);line-height:0.9;color:#fbf3e0;margin-bottom:22px;">
        Más que una vela,<br><em style="color:#e8a87c;font-style:italic;">una experiencia.</em>
      </h1>
      <p style="font-size:clamp(13px,1.8vw,16px);color:rgba(251,243,224,0.5);line-height:1.8;max-width:480px;margin-bottom:32px;">
        Glowie nació en Cali con una idea simple: crear velas que no solo iluminen, sino que transformen el ambiente y cuenten una historia.
      </p>
      <!-- Fundadores pill -->
      <div style="display:inline-flex;align-items:center;gap:12px;background:rgba(251,243,224,0.05);border:1px solid rgba(251,243,224,0.1);border-radius:40px;padding:8px 16px 8px 8px;">
        <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:1.5px solid rgba(232,168,124,0.35);flex-shrink:0;">
          <img src="${FOUNDER_IMG}" alt="Fundadores" style="width:100%;height:100%;object-fit:cover;object-position:center top;">
        </div>
        <div>
          <div style="font-size:11px;font-weight:600;color:#fbf3e0;line-height:1.2;">Los fundadores</div>
          <div style="font-size:9px;color:rgba(251,243,224,0.35);">Cali · Desde 2025</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── HISTORIA ── -->
  <section style="padding:clamp(56px,8vw,96px) clamp(16px,5vw,56px);position:relative;overflow:hidden;">
    <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.12),transparent);"></div>
    <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr;gap:48px;">
      <style>@media(min-width:768px){#nos-hist-grid{grid-template-columns:1fr 1fr !important;align-items:center;}}</style>
      <div id="nos-hist-grid" style="display:grid;grid-template-columns:1fr;gap:40px;align-items:center;">

        <!-- Texto -->
        <div class="nos-reveal">
          <p style="font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(251,243,224,0.28);margin-bottom:14px;">Cómo empezamos</p>
          <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,44px);color:#fbf3e0;margin-bottom:24px;line-height:1.05;">
            De una pasión<br><em style="color:#e8a87c;font-style:italic;">a un oficio</em>
          </h2>
          <div style="display:flex;flex-direction:column;gap:16px;">
            ${[
      'Todo comenzó con una obsesión: encontrar la vela perfecta. Una que oliera bien, durara mucho y se viera hermosa. Después de recorrer mercados y tiendas sin encontrarla, decidimos hacerla nosotros mismos.',
      'Con cera de soja, fragancias de calidad y mucha paciencia, nacieron las primeras velas Glowie en una cocina de Cali. Lo que empezó como un proyecto personal rápidamente llamó la atención de quienes buscaban exactamente eso: algo hecho con amor y con criterio.',
      'Hoy, cada vela que fabricamos sigue teniendo ese mismo cuidado artesanal del primer día. Sin atajos, sin ingredientes baratos, sin comprometer la experiencia.',
    ].map(p => `<p style="font-size:13px;color:rgba(251,243,224,0.48);line-height:1.8;">${p}</p>`).join('')}
          </div>
          <div style="width:40px;height:2px;background:linear-gradient(90deg,#e8a87c,transparent);margin-top:28px;border-radius:2px;"></div>
        </div>

        <!-- Foto fundadores -->
        <div class="nos-reveal" style="position:relative;">
          <div style="border-radius:24px;overflow:hidden;aspect-ratio:4/5;position:relative;border:1px solid rgba(251,243,224,0.08);">
            <img src="${FOUNDER_IMG}" alt="Fundadores de Glowie"
                 loading="lazy" width="900" height="1125"
                 style="width:100%;height:100%;object-fit:cover;object-position:center top;filter:saturate(0.85);">
            <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(10,2,3,0.5) 0%,transparent 50%);"></div>
            <div style="position:absolute;bottom:20px;left:20px;right:20px;">
              <div style="font-family:'DM Serif Display',serif;font-size:15px;color:#fbf3e0;margin-bottom:3px;">Los fundadores de Glowie</div>
              <div style="font-size:10px;color:rgba(251,243,224,0.45);">Cali, Valle del Cauca · 2025</div>
            </div>
          </div>
          <!-- Badge flotante -->
          <div style="position:absolute;top:-16px;right:-16px;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#53161d,#3d0a0f);border:2px solid rgba(232,168,124,0.3);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 8px 24px rgba(83,22,29,0.5);animation:nos-float 6s ease-in-out infinite;">
            <span style="font-size:9px;font-weight:700;color:#e8a87c;letter-spacing:0.08em;line-height:1.3;text-transform:uppercase;">Hecho<br>en Cali</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── VALOR DIFERENCIAL: MATERIALES RÚSTICOS → ESTILO ── -->
  <section style="padding:clamp(48px,7vw,80px) clamp(16px,5vw,56px);border-top:1px solid rgba(251,243,224,0.06);border-bottom:1px solid rgba(251,243,224,0.06);position:relative;overflow:hidden;">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 80% at 80% 50%,rgba(83,22,29,0.15) 0%,transparent 65%);pointer-events:none;"></div>
    <div style="max-width:1100px;margin:0 auto;position:relative;z-index:1;">

      <!-- Eyebrow -->
      <div class="nos-reveal" style="margin-bottom:clamp(32px,5vw,52px);">
        <p style="font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(251,243,224,0.28);margin-bottom:10px;">Nuestro propósito</p>
        <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,4.5vw,48px);color:#fbf3e0;line-height:1.05;max-width:600px;">
          Transformar lo <em style="color:#e8a87c;font-style:italic;">rústico</em><br>en algo con estilo
        </h2>
      </div>

      <!-- Split: texto + transformación visual -->
      <div style="display:grid;grid-template-columns:1fr;gap:clamp(24px,4vw,48px);">
        <style>@media(min-width:768px){#nos-valor-grid{grid-template-columns:1fr 1fr !important;}}</style>
        <div id="nos-valor-grid" style="display:grid;grid-template-columns:1fr;gap:clamp(24px,4vw,48px);align-items:center;">

          <div class="nos-reveal">
            <p style="font-size:13px;color:rgba(251,243,224,0.48);line-height:1.85;margin-bottom:20px;">
              Detrás de cada vela Glowie hay algo más que cera y fragancia. Hay cemento, pigmentos y cera, materiales que el mundo llama ordinarios — y que nosotros convertimos en piezas de diseño que decoran, ambientan y dicen algo de quien las tiene.
            </p>
            <p style="font-size:13px;color:rgba(251,243,224,0.48);line-height:1.85;margin-bottom:28px;">
              Eso es lo que nos mueve: demostrar que lo artesanal no es lo opuesto a lo sofisticado. Que un trozo de cemento puede ser tan elegante como cualquier objeto de lujo, si se trabaja con intención y criterio.
            </p>
            <!-- Quote -->
            <div style="border-left:2px solid #e8a87c;padding-left:18px;">
              <p style="font-family:'DM Serif Display',serif;font-size:clamp(16px,2.5vw,20px);color:#fbf3e0;line-height:1.4;font-style:italic;">"Lo rústico no es un defecto — es el punto de partida."</p>
              <p style="font-size:10px;color:rgba(251,243,224,0.3);margin-top:6px;">Los fundadores de Glowie</p>
            </div>
          </div>

          <!-- Transformación visual: antes → después -->
          <div class="nos-reveal" style="display:flex;flex-direction:column;gap:12px;">
            <!-- Materiales rústicos -->
            <div style="background:#130508;border:1px solid rgba(251,243,224,0.07);border-radius:16px;padding:20px 22px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;">
              <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(251,243,224,0.08),transparent);"></div>
              <div style="flex-shrink:0;width:44px;height:44px;border-radius:12px;background:rgba(251,243,224,0.05);border:1px solid rgba(251,243,224,0.08);display:flex;align-items:center;justify-content:center;font-size:20px;">🪨</div>
              <div>
                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(251,243,224,0.25);margin-bottom:3px;">Punto de partida</div>
                <div style="font-family:'DM Serif Display',serif;font-size:15px;color:rgba(251,243,224,0.55);">Cemento · Cera cruda</div>
                <div style="font-size:10px;color:rgba(251,243,224,0.25);margin-top:2px;">Materiales simples, sin pretensiones</div>
              </div>
            </div>

            <!-- Flecha de transformación -->
            <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
              <div style="flex:1;height:1px;background:linear-gradient(to right,transparent,rgba(232,168,124,0.2));"></div>
              <div style="width:32px;height:32px;border-radius:50%;background:rgba(232,168,124,0.08);border:1px solid rgba(232,168,124,0.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:#e8a87c;">↓</div>
              <div style="flex:1;height:1px;background:linear-gradient(to left,transparent,rgba(232,168,124,0.2));"></div>
            </div>

            <!-- Producto final -->
            <div style="background:linear-gradient(135deg,#1f0608,#130508);border:1px solid rgba(232,168,124,0.18);border-radius:16px;padding:20px 22px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(83,22,29,0.25);">
              <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.3),transparent);"></div>
              <div style="flex-shrink:0;width:44px;height:44px;border-radius:12px;background:rgba(232,168,124,0.1);border:1px solid rgba(232,168,124,0.2);display:flex;align-items:center;justify-content:center;font-size:20px;filter:drop-shadow(0 0 6px rgba(232,168,124,0.3));">🕯️</div>
              <div>
                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#e8a87c;margin-bottom:3px;">Resultado</div>
                <div style="font-family:'DM Serif Display',serif;font-size:15px;color:#fbf3e0;">Pieza de diseño artesanal</div>
                <div style="font-size:10px;color:rgba(251,243,224,0.38);margin-top:2px;">Con estilo, calidad e intención</div>
              </div>
            </div>

            <!-- Tags -->
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
              ${['Diseño único', 'Hecho en Cali', 'Sin fábrica', 'Con propósito'].map(t => `
                <span style="font-size:9px;color:rgba(251,243,224,0.4);background:rgba(251,243,224,0.05);border:1px solid rgba(251,243,224,0.08);padding:4px 10px;border-radius:20px;">${t}</span>`).join('')}
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>

  <!-- ── PROCESO ARTESANAL ── -->
  <section style="padding:clamp(48px,7vw,80px) clamp(16px,5vw,56px);background:rgba(251,243,224,0.02);border-top:1px solid rgba(251,243,224,0.06);border-bottom:1px solid rgba(251,243,224,0.06);">
    <div style="max-width:1100px;margin:0 auto;">
      <div class="nos-reveal" style="margin-bottom:clamp(32px,5vw,52px);">
        <p style="font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(251,243,224,0.28);margin-bottom:10px;">Cómo las hacemos</p>
        <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,44px);color:#fbf3e0;margin-bottom:8px;">El proceso artesanal</h2>
        <p style="font-size:13px;color:rgba(251,243,224,0.35);max-width:400px;line-height:1.7;">Cada vela pasa por cuatro etapas hechas a mano. Sin máquinas, sin prisa.</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <style>@media(min-width:768px){#nos-proc-grid{grid-template-columns:repeat(4,1fr)!important;}}</style>
        <div id="nos-proc-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;grid-column:1/-1;">
          ${[
      { num: '01', emoji: '🌿', title: 'Selección', desc: 'Cera de soja 100% natural y fragancias libres de toxinas. Solo los mejores ingredientes.', accent: 'rgba(74,124,89,0.15)', border: 'rgba(74,124,89,0.2)' },
      { num: '02', emoji: '🔥', title: 'Fundición', desc: 'Derretimos la cera a temperatura controlada para preservar sus propiedades naturales.', accent: 'rgba(200,121,65,0.15)', border: 'rgba(200,121,65,0.2)' },
      { num: '03', emoji: '✨', title: 'Aromatización', desc: 'Incorporamos la fragancia en el punto exacto para una difusión uniforme y duradera.', accent: 'rgba(83,22,29,0.2)', border: 'rgba(232,168,124,0.2)' },
      { num: '04', emoji: '⏳', title: 'Curado', desc: 'Reposamos cada vela mínimo 14 días antes de su venta. La paciencia marca la diferencia.', accent: 'rgba(251,243,224,0.05)', border: 'rgba(251,243,224,0.08)' },
    ].map(s => `
            <div class="nos-reveal" style="background:#130508;border:1px solid ${s.border};border-radius:20px;padding:clamp(18px,3vw,28px);position:relative;overflow:hidden;">
              <div style="position:absolute;top:-8px;right:-4px;font-size:clamp(48px,8vw,72px);font-weight:900;color:rgba(251,243,224,0.03);line-height:1;pointer-events:none;font-family:'DM Serif Display',serif;">${s.num}</div>
              <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.15),transparent);"></div>
              <div style="width:44px;height:44px;border-radius:12px;background:${s.accent};display:flex;align-items:center;justify-content:center;margin-bottom:14px;font-size:20px;">${s.emoji}</div>
              <h3 style="font-family:'DM Serif Display',serif;font-size:clamp(16px,2.5vw,20px);color:#fbf3e0;margin-bottom:8px;">${s.title}</h3>
              <p style="font-size:11px;color:rgba(251,243,224,0.38);line-height:1.7;">${s.desc}</p>
            </div>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <!-- ── INGREDIENTES ── -->
  <section style="padding:clamp(48px,7vw,80px) clamp(16px,5vw,56px);">
    <div style="max-width:1100px;margin:0 auto;">
      <div class="nos-reveal" style="margin-bottom:clamp(32px,5vw,48px);">
        <p style="font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(251,243,224,0.28);margin-bottom:10px;">Lo que usamos</p>
        <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,44px);color:#fbf3e0;">Ingredientes que importan</h2>
      </div>
      <div style="display:grid;grid-template-columns:1fr;gap:12px;">
        <style>@media(min-width:768px){#nos-ing-grid{grid-template-columns:repeat(3,1fr)!important;}}</style>
        <div id="nos-ing-grid" style="display:grid;grid-template-columns:1fr;gap:12px;">
          ${[
      { emoji: '🌱', title: 'Cera de Soja 100%', badge: 'Sostenible', desc: 'No petroquímica. Más limpia, más duradera, biodegradable. Arde hasta un 50% más que la parafina convencional.' },
      { emoji: '🌬️', title: 'Fragancias Premium', badge: 'Sin tóxicos', desc: 'Aceites de fragancia libres de ftalatos. Aromas diseñados para durar: coco, vainilla, bambú, café y más.' },
      { emoji: '🧵', title: 'Pabilos de Algodón', badge: 'Hecho a mano', desc: 'Trenzados a mano, libres de plomo. Garantizan una llama limpia, sin humo negro y sin residuos.' },
    ].map(i => `
            <div class="nos-reveal" style="background:#130508;border:1px solid rgba(251,243,224,0.07);border-radius:20px;padding:clamp(20px,3vw,28px);position:relative;overflow:hidden;">
              <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.15),transparent);"></div>
              <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
                <span style="font-size:24px;filter:drop-shadow(0 0 6px rgba(232,168,124,0.2));">${i.emoji}</span>
                <div>
                  <span style="font-size:8px;letter-spacing:0.15em;text-transform:uppercase;color:#e8a87c;background:rgba(232,168,124,0.08);padding:2px 8px;border-radius:20px;border:1px solid rgba(232,168,124,0.15);">${i.badge}</span>
                  <h3 style="font-family:'DM Serif Display',serif;font-size:clamp(15px,2.5vw,18px);color:#fbf3e0;margin-top:4px;">${i.title}</h3>
                </div>
              </div>
              <p style="font-size:12px;color:rgba(251,243,224,0.38);line-height:1.75;">${i.desc}</p>
            </div>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <!-- ── VALORES ── -->
  <section style="padding:0 clamp(16px,5vw,56px) clamp(48px,7vw,80px);">
    <div style="max-width:1100px;margin:0 auto;">
      <div class="nos-reveal" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
        <style>@media(min-width:768px){#nos-val-grid{grid-template-columns:repeat(4,1fr)!important;}}</style>
        <div id="nos-val-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;grid-column:1/-1;">
          ${[
      { emoji: '🌿', label: 'Natural', sub: 'Cera de soja pura' },
      { emoji: '🤲', label: 'Artesanal', sub: 'Hecho a mano' },
      { emoji: '📍', label: 'Cali, Colombia', sub: 'Orgullo local' },
      { emoji: '❤️', label: 'Con amor', sub: 'En cada detalle' },
    ].map(v => `
            <div class="nos-reveal" style="background:#130508;border:1px solid rgba(251,243,224,0.07);border-radius:16px;padding:clamp(16px,2.5vw,24px);display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;position:relative;overflow:hidden;">
              <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:40px;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.3),transparent);"></div>
              <span style="font-size:clamp(22px,3.5vw,28px);filter:drop-shadow(0 0 6px rgba(232,168,124,0.2));">${v.emoji}</span>
              <div>
                <div style="font-family:'DM Serif Display',serif;font-size:clamp(14px,2vw,17px);color:#fbf3e0;margin-bottom:3px;">${v.label}</div>
                <div style="font-size:10px;color:rgba(251,243,224,0.3);">${v.sub}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <!-- ── CTA FINAL ── -->
  <section style="margin:0 clamp(16px,4vw,48px) 48px;border-radius:24px;overflow:hidden;position:relative;background:linear-gradient(135deg,#1a0508 0%,#0d0305 50%,#160608 100%);border:1px solid rgba(83,22,29,0.3);">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(83,22,29,0.3) 0%,transparent 60%);pointer-events:none;"></div>
    <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,168,124,0.3),transparent);"></div>
    <div style="position:relative;z-index:1;padding:clamp(36px,6vw,64px) clamp(20px,5vw,48px);text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:rgba(232,168,124,0.08);border:1px solid rgba(232,168,124,0.2);margin-bottom:20px;font-size:20px;filter:drop-shadow(0 0 10px rgba(232,168,124,0.25));">🕯️</div>
      <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(24px,4.5vw,44px);color:#fbf3e0;margin-bottom:10px;">¿Lista para vivir<br><em style="color:#e8a87c;font-style:italic;">la experiencia Glowie?</em></h2>
      <p style="font-size:13px;color:rgba(251,243,224,0.38);max-width:380px;margin:0 auto 28px;line-height:1.7;">Explora nuestro catálogo y encuentra la vela perfecta para ti.</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="/catalogo" class="link-route"
           style="display:inline-flex;align-items:center;gap:10px;background:#fbf3e0;color:#53161d;padding:13px 26px;border-radius:8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;transition:opacity 0.2s;"
           onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">
          Ver colección →
        </a>
        <a href="https://wa.me/573017748623?text=Hola%20Glowie!%20Vi%20su%20historia%20y%20quiero%20conocer%20m%C3%A1s%20%F0%9F%95%AF%EF%B8%8F"
           target="_blank"
           style="display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(251,243,224,0.15);color:rgba(251,243,224,0.6);padding:13px 22px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;transition:all 0.2s;"
           onmouseover="this.style.borderColor='rgba(251,243,224,0.3)';this.style.color='#fbf3e0'" onmouseout="this.style.borderColor='rgba(251,243,224,0.15)';this.style.color='rgba(251,243,224,0.6)'">
          💬 Hablar con nosotros
        </a>
      </div>
    </div>
  </section>

</div>
  `;
}
