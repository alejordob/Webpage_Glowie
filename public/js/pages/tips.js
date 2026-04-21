/**
 * js/pages/tips.js
 * Guía profesional de cuidado y uso de velas artesanales
 * Basado en mejores prácticas: Yankee Candle, Diptyque, Jo Malone
 */

const tipsContent = [
  {
    title: "Primer Encendido: La Regla de Oro",
    icon: "fa-fire",
    badge: "Lo más importante",
    highlight: "Sin esto tu vela forma un túnel y pierdes hasta el 40% de la cera",
    date: "2025-03-18",
    excerpt: "Deja que la cera se derrita completamente hasta el borde del recipiente (piscina completa) en el primer uso. Esto evita el efecto «túnel» y garantiza que tu vela se consuma uniformemente durante toda su vida útil."
  },
  {
    title: "Máximo 3 Horas por Encendido",
    icon: "fa-hourglass-half",
    badge: "Crítico",
    badgeStyle: "background-color:#fee2e2; color:#dc2626;",
    highlight: "La mecha forma hongo y produce humo negro",
    date: "2025-03-15",
    excerpt: "Nunca dejes una vela encendida más de 3 horas seguidas. Después de este tiempo, la mecha genera hongo, humo negro y pierde intensidad aromática. Apaga, deja enfriar 2 horas y vuelve a encender."
  },
  {
    title: "Corta la Mecha a 5mm Antes de Cada Uso",
    icon: "fa-cut",
    badge: "Esencial",
    badgeStyle: "background-color:#fef3c7; color:#d97706;",
    highlight: "Una mecha larga genera hollín y quema el doble de rápido",
    date: "2025-03-12",
    excerpt: "Una mecha larga produce llama alta, hollín y quema desigual. Usa tijeras o un cortador de mechas. Mantén siempre 5mm para una llama limpia, segura y con aroma óptimo."
  },
  {
    title: "Espera la Piscina Completa Antes de Apagar",
    icon: "fa-tint",
    badge: "Esencial",
    badgeStyle: "background-color:#fef3c7; color:#d97706;",
    highlight: "Apagar antes desperdicia cera y crea hundimientos",
    date: "2025-03-08",
    excerpt: "Apaga la vela solo cuando la cera derretida cubra toda la superficie (llegue al borde). Esto evita hundimientos, desperdicio de cera y asegura que cada capa se queme por completo."
  },
  {
    title: "Guarda tus Velas en Lugar Fresco y Oscuro",
    icon: "fa-box-open",
    badge: "Consejo Pro",
    badgeStyle: "background-color:#d1fae5; color:#059669;",
    highlight: "El sol defuma los aromas en días",
    date: "2025-03-05",
    excerpt: "La luz solar y el calor derriten la cera, decoloran los pigmentos y evaporan los aceites esenciales. Guarda tus velas en un cajón o armario fresco. Nunca en el baño o cerca de ventanas."
  },
  {
    title: "Usa un Apagavelas — Nunca Soples",
    icon: "fa-hand-sparkles",
    badge: "Consejo Pro",
    badgeStyle: "background-color:#d1fae5; color:#059669;",
    highlight: "Soplar contamina el aroma y salpica cera caliente",
    date: "2025-03-01",
    excerpt: "Soplar genera humo, salpica cera caliente y contamina el aroma. Usa un apagavelas, una tapa metálica o sumerge la mecha en la cera derretida y enderézala. Así evitas olor a humo y mantienes la mecha limpia."
  },
  {
    title: "Centra la Mecha Después de Cada Uso",
    icon: "fa-compass",
    badge: "Pro Tip",
    badgeStyle: "background-color:#ede9fe; color:#7c3aed;",
    highlight: "Una mecha descentrada quema solo un lado",
    date: "2025-02-25",
    excerpt: "Si la mecha se desvía, la llama quema solo un lado y crea hundimientos. Mientras la cera esté líquida, usa un palillo para centrarla. Deja enfriar antes de mover la vela."
  },
  {
    title: "Evita Corrientes de Aire",
    icon: "fa-wind",
    badge: "Fundamento",
    badgeStyle: "background-color:#f3f4f6; color:#6b7280;",
    highlight: "El viento puede duplicar el consumo de cera",
    date: "2025-02-20",
    excerpt: "El viento hace que la llama baile, genere hollín y queme más rápido. Coloca tu vela lejos de ventanas, ventiladores o puertas. Un ambiente tranquilo = quema perfecta y más duradera."
  }
];

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Tarjeta numerada para tips 02–08
function renderTipCard(tip, index) {
  const num = String(index + 1).padStart(2, '0');
  const badgeStyle = tip.badgeStyle || 'background-color:var(--color-gris-crema); color:white;';

  return `
    <article class="tips-card group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
                    transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <!-- Número decorativo de fondo -->
      <div class="absolute top-3 right-4 text-[72px] font-extrabold leading-none select-none pointer-events-none"
           style="color: var(--color-cinna); opacity: 0.04;">${num}</div>

      <div class="relative p-6 flex flex-col h-full">
        <!-- Badge de categoría -->
        <span class="inline-block self-start px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
              style="${badgeStyle}">${tip.badge}</span>

        <!-- Ícono + número -->
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
               style="background-color: var(--color-fondo);">
            <i class="fas ${tip.icon} text-sm" style="color: var(--color-cinna);"></i>
          </div>
          <span class="text-xs font-extrabold tracking-widest" style="color: var(--color-gris-crema);">TIP ${num}</span>
        </div>

        <!-- Título -->
        <h3 class="text-lg font-bold text-gray-900 mb-3 leading-snug">
          ${tip.title}
        </h3>

        <!-- Contenido -->
        <p class="text-sm text-gray-600 leading-relaxed flex-grow mb-4">
          ${tip.excerpt}
        </p>

        <!-- Highlight -->
        <div class="flex items-start gap-2 p-3 rounded-xl"
             style="background-color: var(--color-fondo); background-opacity: 0.5;">
          <i class="fas fa-exclamation-circle text-xs mt-0.5 flex-shrink-0" style="color: var(--color-cinna);"></i>
          <p class="text-xs font-medium leading-snug" style="color: var(--color-cinna);">${tip.highlight}</p>
        </div>
      </div>
    </article>
  `;
}

export function initializeTipsListeners() {
  const gsap = window.gsap;
  if (!gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.fromTo('.tips-hero-title',
    { opacity: 0, y: 35 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
  );
  gsap.fromTo('.tips-hero-sub',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.3 }
  );
  gsap.fromTo('.tips-stat-badge',
    { opacity: 0, y: 15 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.45 }
  );

  const ScrollTrigger = window.ScrollTrigger;
  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo('.tips-featured',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: '.tips-featured', start: 'top 85%', once: true } }
    );
    gsap.fromTo('.tips-card',
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out',
        scrollTrigger: { trigger: '.tips-grid', start: 'top 88%', once: true } }
    );
  }
}

export function renderTipsPage() {
  const featured = tipsContent[0];
  const rest = tipsContent.slice(1);

  return `
    <!-- HERO DRAMÁTICO -->
    <section class="relative py-20 md:py-28 overflow-hidden rounded-2xl mb-10"
             style="background-color: var(--color-cinna);">
      <!-- Elementos decorativos de fondo -->
      <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white opacity-[0.03] pointer-events-none"></div>
      <div class="absolute -bottom-16 -left-20 w-72 h-72 rounded-full bg-white opacity-[0.03] pointer-events-none"></div>
      <div class="absolute right-10 top-1/2 -translate-y-1/2 text-[18rem] font-extrabold leading-none
                  opacity-[0.03] text-white select-none pointer-events-none hidden xl:block">8</div>

      <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <!-- Badge -->
        <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style="background-color: rgba(239,223,187,0.15); color: var(--color-fondo); border: 1px solid rgba(239,223,187,0.3);">
          <i class="fas fa-book-open text-xs"></i>
          Guía de Expertos
        </span>

        <h1 class="tips-hero-title text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
          8 secretos que<br class="hidden sm:block">
          <span style="color: var(--color-fondo);">alargan la vida</span><br class="hidden sm:block">
          de tu vela
        </h1>

        <p class="tips-hero-sub text-base md:text-xl mb-8 max-w-2xl mx-auto" style="color: rgba(239,223,187,0.8);">
          Los mismos principios que aplican marcas como Diptyque y Yankee Candle.
          Para que tu Glowie dure más, huela mejor y sea más segura.
        </p>

        <!-- Stat badges -->
        <div class="flex flex-wrap justify-center gap-3">
          <span class="tips-stat-badge flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style="background-color: rgba(255,255,255,0.1); color: white;">
            <i class="fas fa-clock text-xs" style="color: var(--color-fondo);"></i>
            3 min de lectura
          </span>
          <span class="tips-stat-badge flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style="background-color: rgba(255,255,255,0.1); color: white;">
            <i class="fas fa-list-ol text-xs" style="color: var(--color-fondo);"></i>
            8 tips esenciales
          </span>
          <span class="tips-stat-badge flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style="background-color: rgba(255,255,255,0.1); color: white;">
            <i class="fas fa-certificate text-xs" style="color: var(--color-fondo);"></i>
            Estándar internacional
          </span>
        </div>
      </div>
    </section>

    <!-- QUICK NUMBERS — valor inmediato antes de leer -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 px-4 max-w-5xl mx-auto">
      <div class="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100
                  hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div class="text-3xl font-extrabold mb-1" style="color: var(--color-cinna);">5mm</div>
        <div class="text-xs font-bold text-gray-500 uppercase tracking-wide leading-tight">Largo ideal<br>de mecha</div>
      </div>
      <div class="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100
                  hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div class="text-3xl font-extrabold mb-1" style="color: var(--color-cinna);">3h</div>
        <div class="text-xs font-bold text-gray-500 uppercase tracking-wide leading-tight">Máximo<br>por sesión</div>
      </div>
      <div class="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100
                  hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div class="text-3xl font-extrabold mb-1" style="color: var(--color-cinna);">2h</div>
        <div class="text-xs font-bold text-gray-500 uppercase tracking-wide leading-tight">Enfriamiento<br>entre usos</div>
      </div>
      <div class="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100
                  hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div class="text-3xl font-extrabold mb-1" style="color: var(--color-cinna);">100%</div>
        <div class="text-xs font-bold text-gray-500 uppercase tracking-wide leading-tight">Cera de soja<br>natural</div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 pb-20">

      <!-- TIP 01 — FEATURED (full width, tarjeta principal) -->
      <article class="tips-featured relative rounded-3xl overflow-hidden shadow-2xl mb-10"
               style="background-color: var(--color-cinna);">
        <!-- Número decorativo -->
        <div class="absolute top-4 left-6 text-[120px] md:text-[160px] font-extrabold leading-none
                    select-none pointer-events-none text-white opacity-[0.06]">01</div>

        <div class="relative z-10 p-8 md:p-12 grid md:grid-cols-5 gap-8 items-center">
          <!-- Contenido (3/5) -->
          <div class="md:col-span-3">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
                  style="background-color: var(--color-fondo); color: var(--color-cinna);">
              Lo más importante · TIP 01
            </span>
            <h2 class="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
              ${featured.title}
            </h2>
            <p class="text-white/85 text-base md:text-lg leading-relaxed">
              ${featured.excerpt}
            </p>
          </div>

          <!-- Panel lateral (2/5) -->
          <div class="md:col-span-2 flex flex-col items-center gap-5">
            <div class="w-24 h-24 rounded-full flex items-center justify-center shadow-xl"
                 style="background-color: var(--color-fondo);">
              <i class="fas ${featured.icon} text-4xl" style="color: var(--color-cinna);"></i>
            </div>
            <div class="w-full p-5 rounded-2xl text-center"
                 style="background-color: rgba(239,223,187,0.1); border: 1px solid rgba(239,223,187,0.2);">
              <i class="fas fa-exclamation-triangle mb-2" style="color: var(--color-fondo);"></i>
              <p class="text-sm font-bold leading-snug" style="color: var(--color-fondo);">
                ${featured.highlight}
              </p>
            </div>
          </div>
        </div>
      </article>

      <!-- TIPS 02–08 — Grid numerado -->
      <div class="tips-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        ${rest.map((tip, i) => renderTipCard(tip, i + 1)).join('')}

        <!-- TARJETA PRÓXIMAMENTE -->
        <article class="flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed min-h-[200px]"
                 style="border-color: var(--color-gris-crema);">
          <div class="w-12 h-12 rounded-full flex items-center justify-center mb-4"
               style="background-color: var(--color-fondo);">
            <i class="fas fa-clock text-lg" style="color: var(--color-cinna);"></i>
          </div>
          <h3 class="font-bold mb-2" style="color: var(--color-cinna);">Próximamente</h3>
          <p class="text-sm text-gray-500 leading-relaxed">
            Velas de masaje · Reciclaje de envases<br>
            Aromaterapia para dormir · Decoración
          </p>
        </article>
      </div>

      <!-- CTA FINAL -->
      <section class="relative rounded-3xl overflow-hidden py-16 px-6 text-center"
               style="background-color: var(--color-fondo);">
        <div class="absolute inset-0 opacity-[0.03]"
             style="background-image: repeating-linear-gradient(45deg, var(--color-cinna) 0, var(--color-cinna) 1px, transparent 0, transparent 50%); background-size: 20px 20px;"></div>
        <div class="relative z-10 max-w-2xl mx-auto">
          <i class="fas fa-fire text-3xl mb-4" style="color: var(--color-cinna);"></i>
          <p class="text-xl md:text-2xl font-bold mb-2" style="color: var(--color-cinna);">
            Una vela bien cuidada es una experiencia que se repite.
          </p>
          <p class="text-base text-gray-600 mb-8">
            Aplica estos 8 tips y aprovecha al máximo cada Glowie que enciendes.
          </p>
          <a href="/catalogo" class="link-route inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-bold shadow-lg
                         transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
             style="background-color: var(--color-cinna); color: white;">
            Explora nuestras velas
            <i class="fas fa-arrow-right text-sm"></i>
          </a>
        </div>
      </section>

    </div>
  `;
}
