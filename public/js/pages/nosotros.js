export function initializeNosotrosListeners() {
  const gsap = window.gsap;
  if (!gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.fromTo('.nos-hero-title',
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
  );
  gsap.fromTo('.nos-hero-sub',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.3 }
  );

  const ScrollTrigger = window.ScrollTrigger;
  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo('.nos-section',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: '.nos-section', start: 'top 85%', once: true } }
    );
  }
}

export function renderNosotrosPage() {
  return `
    <!-- HERO -->
    <section class="relative overflow-hidden rounded-3xl mb-12 flex items-end min-h-[480px]"
             style="background: linear-gradient(135deg, var(--color-cinna) 0%, #2a0b0e 100%);">
      <!-- Decoraciones de fondo -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-10"
             style="background: var(--color-fondo);"></div>
        <div class="absolute top-1/3 -left-10 w-48 h-48 rounded-full opacity-8"
             style="background: var(--color-gris-crema);"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-5"
             style="background: var(--color-fondo);"></div>
        <!-- Palabra decorativa de fondo -->
        <div class="absolute bottom-4 right-6 text-[9rem] font-black opacity-5 leading-none select-none"
             style="color: var(--color-fondo);">Glowie</div>
      </div>

      <div class="relative z-10 px-8 py-12 md:px-16 max-w-3xl">
        <span class="inline-block text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-6"
              style="background: rgba(239,223,187,0.15); color: var(--color-fondo);">
          Nuestra Historia
        </span>
        <h1 class="nos-hero-title text-4xl md:text-5xl font-black leading-tight mb-6 text-white">
          Más que una vela,<br>
          <span style="color: var(--color-fondo);">una experiencia.</span>
        </h1>
        <p class="nos-hero-sub text-lg md:text-xl leading-relaxed" style="color: rgba(239,223,187,0.85);">
          Glowie nació en Cali con una idea simple: crear velas que no solo iluminen,
          sino que transformen el ambiente y cuenten una historia.
        </p>
      </div>
    </section>

    <!-- HISTORIA -->
    <section class="nos-section mb-16">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <span class="text-xs font-bold uppercase tracking-[0.2em] mb-4 block" style="color: var(--color-gris-crema);">
            Cómo empezamos
          </span>
          <h2 class="text-3xl md:text-4xl font-black mb-6" style="color: var(--color-cinna);">
            De una pasión a un oficio
          </h2>
          <div class="space-y-4 text-gray-600 leading-relaxed">
            <p>
              Todo comenzó con una obsesión: encontrar la vela perfecta. Una que oliera bien,
              durara mucho y se viera hermosa. Después de recorrer mercados y tiendas sin encontrarla,
              decidimos hacerla nosotros mismos.
            </p>
            <p>
              Con cera de soja, fragancias de calidad y mucha paciencia, nacieron las primeras
              velas Glowie en una cocina de Cali. Lo que empezó como un proyecto personal
              rápidamente llamó la atención de amigos, familiares y clientes que buscaban
              exactamente eso: algo hecho con amor y con criterio.
            </p>
            <p>
              Hoy, cada vela que fabricamos sigue teniendo ese mismo cuidado artesanal del
              primer día. Sin atajos, sin ingredientes baratos, sin comprometer la experiencia.
            </p>
          </div>
        </div>
        <div class="relative">
          <!-- Imagen con decoración -->
          <div class="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5]"
               style="background: linear-gradient(135deg, var(--color-fondo) 0%, var(--color-gris-crema) 100%);">
            <img src="./img/logo_glowie.png" alt="Glowie — Velas artesanales en Cali"
                 class="absolute inset-0 w-full h-full object-contain p-16 opacity-70">
            <!-- Decoración corner -->
            <div class="absolute bottom-0 left-0 right-0 h-1/3"
                 style="background: linear-gradient(to top, rgba(83,22,29,0.15), transparent);"></div>
          </div>
          <!-- Badge flotante -->
          <div class="absolute -bottom-4 -right-4 w-24 h-24 rounded-full flex flex-col items-center justify-center text-center shadow-xl border-4 border-white"
               style="background: var(--color-cinna); color: var(--color-fondo);">
            <span class="text-xs font-bold leading-tight">Hecho<br>en</span>
            <span class="text-sm font-black">Cali</span>
          </div>
        </div>
      </div>
    </section>

    <!-- PROCESO -->
    <section class="nos-section mb-16 rounded-3xl overflow-hidden"
             style="background: var(--color-casi-blanco); border: 1px solid rgba(83,22,29,0.08);">
      <div class="px-8 py-12 md:px-16 md:py-14">
        <div class="text-center mb-12">
          <span class="text-xs font-bold uppercase tracking-[0.2em] mb-3 block" style="color: var(--color-gris-crema);">
            Cómo las hacemos
          </span>
          <h2 class="text-3xl md:text-4xl font-black" style="color: var(--color-cinna);">El proceso artesanal</h2>
          <p class="text-gray-500 mt-3 max-w-xl mx-auto">
            Cada vela pasa por cuatro etapas hechas a mano. Sin máquinas, sin prisa.
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${[
            { step: '01', icon: 'fa-seedling', title: 'Selección', desc: 'Elegimos cera de soja 100% natural y fragancias libres de toxinas. Solo los mejores ingredientes.', color: '#4a7c59' },
            { step: '02', icon: 'fa-fire-alt', title: 'Fundición', desc: 'Derretimos la cera a temperatura controlada para preservar sus propiedades naturales.', color: '#c87941' },
            { step: '03', icon: 'fa-fill-drip', title: 'Aromatización', desc: 'Incorporamos la fragancia en el punto exacto para garantizar una difusión uniforme y duradera.', color: 'var(--color-cinna)' },
            { step: '04', icon: 'fa-clock', title: 'Curado', desc: 'Dejamos reposar cada vela mínimo 14 días antes de su venta. La paciencia marca la diferencia.', color: 'var(--color-gris-crema)' },
          ].map(s => `
            <div class="relative p-6 rounded-2xl bg-white shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div class="absolute -top-3 -left-1 text-5xl font-black leading-none select-none opacity-6"
                   style="color: var(--color-cinna);">${s.step}</div>
              <div class="w-14 h-14 rounded-full flex items-center justify-center mb-4 mt-2"
                   style="background: ${s.color}15;">
                <i class="fas ${s.icon} text-xl" style="color: ${s.color};"></i>
              </div>
              <h3 class="font-bold text-gray-800 mb-2 text-lg">${s.title}</h3>
              <p class="text-gray-500 text-sm leading-relaxed">${s.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- INGREDIENTES -->
    <section class="nos-section mb-16">
      <div class="text-center mb-10">
        <span class="text-xs font-bold uppercase tracking-[0.2em] mb-3 block" style="color: var(--color-gris-crema);">
          Lo que usamos
        </span>
        <h2 class="text-3xl md:text-4xl font-black" style="color: var(--color-cinna);">Ingredientes que importan</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${[
          { icon: 'fa-leaf', title: 'Cera de Soja 100% Natural', desc: 'No petroquímica. Más limpia, más duradera, biodegradable. Arde hasta un 50% más que la parafina convencional.', badge: 'Sostenible' },
          { icon: 'fa-wind', title: 'Fragancias Premium', desc: 'Aceites de fragancia libres de ftalatos. Aromas diseñados para durar: coco, vainilla, bambú, café, lavanda y más.', badge: 'Sin tóxicos' },
          { icon: 'fa-cut', title: 'Pabilos de Algodón', desc: 'Trenzados a mano, libres de plomo. Garantizan una llama limpia, sin humo negro y sin residuos.', badge: 'Hecho a mano' },
        ].map(i => `
          <div class="p-7 rounded-3xl flex flex-col gap-4 border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                   style="background: var(--color-fondo);">
                <i class="fas ${i.icon} text-lg" style="color: var(--color-cinna);"></i>
              </div>
              <div>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="background: var(--color-gris-crema)20; color: var(--color-gris-crema);">${i.badge}</span>
                <h3 class="font-bold text-gray-800 mt-0.5">${i.title}</h3>
              </div>
            </div>
            <p class="text-gray-500 text-sm leading-relaxed">${i.desc}</p>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- VALORES -->
    <section class="mb-16">
      <div class="text-center mb-10">
        <span class="text-xs font-bold uppercase tracking-[0.2em] mb-3 block" style="color: var(--color-gris-crema);">
          Lo que nos define
        </span>
        <h2 class="text-3xl md:text-4xl font-black" style="color: var(--color-cinna);">Nuestros valores</h2>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${[
          { icon: 'fa-leaf', label: 'Natural', color: '#4a7c59' },
          { icon: 'fa-hands', label: 'Artesanal', color: '#c87941' },
          { icon: 'fa-map-marker-alt', label: 'Hecho en Cali', color: 'var(--color-cinna)' },
          { icon: 'fa-heart', label: 'Con amor', color: '#c0392b' },
        ].map(v => `
          <div class="rounded-2xl p-6 flex flex-col items-center text-center gap-3"
               style="background: var(--color-casi-blanco); border: 1px solid rgba(83,22,29,0.06);">
            <div class="w-14 h-14 rounded-full flex items-center justify-center"
                 style="background: ${v.color}15;">
              <i class="fas ${v.icon} text-2xl" style="color: ${v.color};"></i>
            </div>
            <span class="font-bold text-gray-700">${v.label}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- UBICACIÓN EN MAPA -->
    <section class="nos-section mb-16">
      <div class="text-center mb-10">
        <span class="text-xs font-bold uppercase tracking-[0.2em] mb-3 block" style="color: var(--color-gris-crema);">
          Encuéntranos
        </span>
        <h2 class="text-3xl md:text-4xl font-black" style="color: var(--color-cinna);">Ubicación en Cali</h2>
      </div>
      <div class="rounded-3xl overflow-hidden shadow-lg border border-gray-100 h-96">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3982.1524835926636!2d-76.5320139!3d3.4516120!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e30a6acccccc:0x66888bdf4a45f4!2sGlowie%20-%20Velas%20Artesanales!5e0!3m2!1ses!2sco!4v1712604000000"
                width="100%"
                height="100%"
                style="border:0;"
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </section>

    <!-- CTA -->
    <section class="rounded-3xl overflow-hidden relative text-center py-16 px-8"
             style="background: linear-gradient(135deg, var(--color-cinna) 0%, #2a0b0e 100%);">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-10 -right-10 w-52 h-52 rounded-full opacity-10"
             style="background: var(--color-fondo);"></div>
        <div class="absolute -bottom-10 -left-10 w-64 h-64 rounded-full opacity-8"
             style="background: var(--color-gris-crema);"></div>
      </div>
      <div class="relative z-10">
        <h2 class="text-3xl md:text-4xl font-black text-white mb-4">
          ¿Lista para vivir la experiencia Glowie?
        </h2>
        <p class="text-lg mb-8" style="color: rgba(239,223,187,0.85);">
          Explora nuestro catálogo y encuentra la vela perfecta para ti.
        </p>
        <a href="/catalogo" class="link-route inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold shadow-lg transition-all duration-200 hover:scale-105"
           style="background: var(--color-fondo); color: var(--color-cinna);">
          <i class="fas fa-store"></i>
          Ver Catálogo
        </a>
      </div>
    </section>
  `;
}
