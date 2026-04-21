/**
 * js/pages/aromas.js
 * Guía de Aromas Glowie — SEO + UX + conversión
 * Rankea para: "velas en cali", "velas artesanales cali", "vela aromática cali",
 *              "pebetero en cali", "pebetero cerámico cali", "vela artesanal",
 *              "qué aroma elegir", "velas aromáticas coco vainilla", etc.
 */

// ─────────────────────────────────────────────
// DATA DE AROMAS
// ─────────────────────────────────────────────
const aromas = [
  {
    id: 'bambú',
    name: 'Bambú',
    emoji: '🌿',
    color: '#4a7c59',
    colorLight: '#e8f5ed',
    badge: 'Más popular',
    badgeColor: '#4a7c59',
    moods: ['relajar', 'concentrar'],
    headline: 'Frescura que despeja la mente',
    description: 'Bambú evoca bosques verdes y aire puro. Su fragancia limpia y herbácea crea un ambiente de calma y claridad mental. Perfecta para espacios de trabajo, meditación o lectura.',
    notas: ['Verde · Fresco · Terroso'],
    intensidad: 3,
    ambientes: ['Oficina', 'Estudio', 'Sala'],
    duracion: '50–60 hrs',
    slug: 'bambú',
  },
  {
    id: 'Coco & Vainilla',
    name: 'Coco & Vainilla',
    emoji: '🥥',
    color: '#c87941',
    colorLight: '#fdf3e7',
    badge: 'Favorito de clientes',
    badgeColor: '#c87941',
    moods: ['relajar', 'romantico'],
    headline: 'El aroma del descanso perfecto',
    description: 'La dulzura tropical del coco se funde con la calidez envolvente de la vainilla. Evoca días de playa y tardes de relax. Ideal para dormitorios, baños y noches de descanso.',
    notas: ['Dulce · Cálido · Tropical'],
    intensidad: 4,
    ambientes: ['Dormitorio', 'Baño', 'Sala'],
    duracion: '45–55 hrs',
    slug: 'Coco & Vainilla',
  },
  {
    id: 'durazno',
    name: 'Durazno',
    emoji: '🍑',
    color: '#d4732a',
    colorLight: '#fef0e6',
    badge: 'Aroma del verano',
    badgeColor: '#d4732a',
    moods: ['energizar', 'romantico'],
    headline: 'Fruta madura, energía positiva',
    description: 'Jugoso y vibrante, el durazno trae alegría y vitalidad a cualquier espacio. Su nota frutal y ligeramente floral eleva el ánimo sin ser invasiva. Perfecta para espacios sociales.',
    notas: ['Frutal · Fresco · Luminoso'],
    intensidad: 4,
    ambientes: ['Sala', 'Comedor', 'Recibidor'],
    duracion: '45–55 hrs',
    slug: 'durazno',
  },
  {
    id: 'cafe-mocka',
    name: 'Café Mocka',
    emoji: '☕',
    color: '#6b3f1e',
    colorLight: '#f5ede6',
    badge: 'Para madrugar',
    badgeColor: '#6b3f1e',
    moods: ['energizar', 'concentrar'],
    headline: 'El ritual del café en tu espacio',
    description: 'Café tostado con un toque de chocolate oscuro y especias. Evoca mañanas productivas y cafeterías acogedoras. Ideal para quien necesita motivación y concentración.',
    notas: ['Tostado · Rico · Especiado'],
    intensidad: 5,
    ambientes: ['Oficina', 'Cocina', 'Estudio'],
    duracion: '40–50 hrs',
    slug: 'cafe-mocka',
  },
  {
    id: 'coco',
    name: 'Coco',
    emoji: '🏝️',
    color: '#5a8a6a',
    colorLight: '#eaf4ee',
    badge: 'Brisa tropical',
    badgeColor: '#5a8a6a',
    moods: ['relajar', 'energizar'],
    headline: 'Vacaciones en tu hogar',
    description: 'Coco puro y tropical, sin dulzuras artificiales. Trae la ligereza de la brisa caribeña a tu hogar. Refrescante y uplifting, funciona en cualquier espacio del hogar.',
    notas: ['Tropical · Limpio · Fresco'],
    intensidad: 3,
    ambientes: ['Sala', 'Baño', 'Dormitorio'],
    duracion: '45–55 hrs',
    slug: 'coco',
  },
];

// ─────────────────────────────────────────────
// MOODS / AMBIENTES
// ─────────────────────────────────────────────
const moods = [
  { id: 'todos',      icon: 'fa-border-all',    label: 'Todos',       desc: 'Ver todos los aromas' },
  { id: 'relajar',   icon: 'fa-spa',            label: 'Relajarme',   desc: 'Calma y descanso' },
  { id: 'energizar', icon: 'fa-bolt',           label: 'Energizarme', desc: 'Vitalidad y ánimo' },
  { id: 'romantico', icon: 'fa-heart',          label: 'Romantico',   desc: 'Ambiente íntimo' },
  { id: 'concentrar',icon: 'fa-brain',          label: 'Concentrarme',desc: 'Foco y productividad' },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function renderIntensidad(nivel) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < nivel ? 'var(--color-cinna)' : '#e5e7eb'}; font-size:12px;">●</span>`
  ).join('');
}

function renderAromaCard(aroma) {
  return `
    <article class="aroma-card group relative rounded-3xl overflow-hidden border border-gray-100
                    shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer bg-white"
             data-moods="${aroma.moods.join(',')}"
             data-id="${aroma.id}">

      <!-- Header con color del aroma -->
      <div class="relative flex flex-col items-center justify-center pt-8 pb-5 px-4"
           style="background: linear-gradient(135deg, ${aroma.colorLight} 0%, white 100%); min-height: 160px;">
        <!-- Círculo decorativo de fondo -->
        <div class="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20 pointer-events-none"
             style="background: ${aroma.color};"></div>
        <div class="absolute -left-4 -bottom-4 w-20 h-20 rounded-full opacity-10 pointer-events-none"
             style="background: ${aroma.color};"></div>
        <!-- Badge — encima del emoji, sin cortar -->
        <span class="relative z-20 px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block"
              style="background: ${aroma.colorLight}; color: ${aroma.badgeColor}; border: 1px solid ${aroma.color}40;">
          ${aroma.badge}
        </span>
        <!-- Emoji grande -->
        <span class="relative z-10 text-5xl select-none leading-none" style="filter: drop-shadow(0 4px 12px ${aroma.color}40);">
          ${aroma.emoji}
        </span>
      </div>

      <!-- Contenido -->
      <div class="p-5">
        <h3 class="text-xl font-black mb-1" style="color: var(--color-cinna);">${aroma.name}</h3>
        <p class="text-xs font-semibold mb-3" style="color: ${aroma.color};">${aroma.headline}</p>
        <p class="text-sm text-gray-500 leading-relaxed mb-4">${aroma.description}</p>

        <!-- Notas olfativas -->
        <div class="flex flex-wrap gap-1.5 mb-4">
          ${aroma.notas.map(n => `
            <span class="px-2.5 py-1 rounded-full text-xs font-medium"
                  style="background: ${aroma.colorLight}; color: ${aroma.color};">${n}</span>
          `).join('')}
        </div>

        <!-- Ambiente ideal -->
        <div class="flex items-center gap-1.5 mb-4 text-xs text-gray-500">
          <i class="fas fa-home" style="color: ${aroma.color};"></i>
          <span>${aroma.ambientes.join(' · ')}</span>
        </div>

        <!-- Intensidad -->
        <div class="flex items-center gap-2 mb-5">
          <span class="text-xs text-gray-400">Intensidad</span>
          <div class="flex gap-0.5">${renderIntensidad(aroma.intensidad)}</div>
        </div>

        <!-- CTA -->
        <a href="/catalogo?aroma=${aroma.slug}"
           class="link-route block w-full text-center py-2.5 px-4 rounded-xl text-sm font-bold
                  transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
           style="background: ${aroma.color}; color: white;">
          Ver velas con ${aroma.name}
          <i class="fas fa-arrow-right ml-1 text-xs"></i>
        </a>
      </div>
    </article>
  `;
}

// ─────────────────────────────────────────────
// LISTENERS — Filtro de moods interactivo
// ─────────────────────────────────────────────
export function initializeAromasListeners() {
  const gsap = window.gsap;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // GSAP animations
  if (gsap && !prefersReduced) {
    gsap.fromTo('.aromas-hero-title',
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
    );
    gsap.fromTo('.aromas-hero-sub',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.3 }
    );

    const ScrollTrigger = window.ScrollTrigger;
    if (ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.fromTo('.mood-btn',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out',
          scrollTrigger: { trigger: '.moods-bar', start: 'top 88%', once: true } }
      );
      gsap.fromTo('.aroma-card',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: '#aromas-grid', start: 'top 88%', once: true } }
      );
      gsap.fromTo('.guia-step',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: '.guia-section', start: 'top 88%', once: true } }
      );
    }
  }

  // Filtro de moods
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;

      // Toggle estado activo en botones
      document.querySelectorAll('.mood-btn').forEach(b => {
        b.classList.remove('mood-active');
        b.style.removeProperty('background');
        b.style.removeProperty('color');
        b.style.removeProperty('border-color');
        b.style.removeProperty('box-shadow');
      });
      btn.classList.add('mood-active');
      btn.style.background = 'var(--color-cinna)';
      btn.style.color = 'white';
      btn.style.borderColor = 'var(--color-cinna)';
      btn.style.boxShadow = '0 4px 14px rgba(83,22,29,0.3)';

      // Filtrar cards
      document.querySelectorAll('.aroma-card').forEach(card => {
        const cardMoods = card.dataset.moods.split(',');
        const visible = mood === 'todos' || cardMoods.includes(mood);
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        if (visible) {
          card.style.opacity = '1';
          card.style.transform = '';
          card.style.display = '';
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            if (!card.classList.contains('mood-visible-' + mood)) {
              card.style.display = 'none';
            }
          }, 300);
        }
      });

      // Actualizar label del filtro activo
      const activeLabel = document.getElementById('active-mood-label');
      if (activeLabel) {
        const moodData = moods.find(m => m.id === mood);
        activeLabel.textContent = mood === 'todos' ? 'todos los aromas' : `aromas para ${moodData?.label.toLowerCase()}`;
      }
    });
  });
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
export function renderAromasPage() {
  return `

    <!-- HERO -->
    <section class="relative overflow-hidden rounded-2xl mb-10"
             style="background: linear-gradient(135deg, #1a0609 0%, var(--color-cinna) 55%, #3d1014 100%);">

      <!-- Textura sutil diagonal -->
      <div class="absolute inset-0 pointer-events-none"
           style="opacity:0.04; background: repeating-linear-gradient(-45deg, white, white 1px, transparent 1px, transparent 60px);"></div>

      <!-- Glow suave a la izquierda -->
      <div class="absolute inset-0 pointer-events-none"
           style="background: radial-gradient(ellipse 55% 80% at 20% 50%, rgba(239,223,187,0.07) 0%, transparent 65%);"></div>

      <div class="relative" style="z-index:10; padding: 3rem 3.5rem 2.5rem;">

        <!-- Badge -->
        <div style="margin-bottom: 1.75rem;">
          <span style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.35rem 0.9rem; border-radius:9999px; font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; background:rgba(239,223,187,0.1); color:var(--color-fondo); border:1px solid rgba(239,223,187,0.2);">
            <i class="fas fa-wind" style="font-size:0.6rem;"></i>
            Guía de Aromas · Glowie
          </span>
        </div>

        <!-- Título + copy + CTAs — full width -->
        <h1 class="aromas-hero-title"
            style="font-weight:900; color:white; line-height:1.05; margin-bottom:1.1rem;
                   font-size:clamp(2.4rem, 5vw, 3.6rem); text-shadow:0 4px 24px rgba(0,0,0,0.3); max-width:680px;">
          El aroma<br>
          <span style="color:var(--color-fondo);">cambia todo</span>
        </h1>

        <p class="aromas-hero-sub"
           style="color:rgba(239,223,187,0.68); font-size:0.95rem; line-height:1.75; margin-bottom:2rem; max-width:48ch;">
          Cada vela artesanal Glowie transforma el estado de tu espacio.
          Encuentra la fragancia que es tuya.
        </p>

        <div style="display:flex; gap:0.65rem; flex-wrap:wrap; margin-bottom:2.25rem;">
          <a href="/catalogo" class="link-route"
             style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.6rem 1.4rem; border-radius:9999px; font-weight:700; font-size:0.82rem; background:var(--color-fondo); color:var(--color-cinna); white-space:nowrap; text-decoration:none; transition:opacity 0.2s;">
            <i class="fas fa-th-large" style="font-size:0.7rem;"></i>
            Ver catálogo
          </a>
          <button onclick="document.getElementById('aromas-grid').scrollIntoView({behavior:'smooth'})"
                  style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.6rem 1.4rem; border-radius:9999px; font-weight:700; font-size:0.82rem; border:1.5px solid rgba(239,223,187,0.32); color:rgba(239,223,187,0.88); background:transparent; cursor:pointer; white-space:nowrap; transition:opacity 0.2s;">
            <i class="fas fa-arrow-down" style="font-size:0.7rem;"></i>
            Ver aromas
          </button>
        </div>

        <!-- Separador + pills decorativas -->
        <div style="padding-top:1.5rem; border-top:1px solid rgba(239,223,187,0.12);
                    display:flex; align-items:center; gap:0.6rem; overflow-x:auto; scrollbar-width:none; padding-bottom:2px;">
          <span style="font-size:0.68rem; font-weight:600; color:rgba(239,223,187,0.38); white-space:nowrap; flex-shrink:0; text-transform:uppercase; letter-spacing:0.1em;">
            Nuestros aromas:
          </span>
          ${aromas.map(a => `
            <span style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.35rem 0.9rem; border-radius:9999px;
                         font-size:0.75rem; font-weight:600; white-space:nowrap; flex-shrink:0;
                         background:rgba(239,223,187,0.07); border:1px solid rgba(239,223,187,0.15);
                         color:rgba(239,223,187,0.78);">
              ${a.emoji} ${a.name}
            </span>
          `).join('')}
        </div>

      </div>
    </section>

    <!-- FILTRO DE MOODS -->
    <section class="moods-bar mb-10">
      <div class="text-center mb-6">
        <p class="text-sm font-semibold text-gray-500">¿Para qué quieres usar tu vela?</p>
      </div>
      <div class="flex flex-wrap justify-center gap-3">
        ${moods.map((m, i) => `
          <button class="mood-btn flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold
                         border-2 transition-all duration-200 hover:scale-105"
                  style="border-color: rgba(83,22,29,0.15); color: var(--color-cinna);
                         background: white; ${i === 0 ? 'background:var(--color-cinna); color:white; border-color:var(--color-cinna); box-shadow:0 4px 14px rgba(83,22,29,0.3);' : ''}"
                  data-mood="${m.id}">
            <i class="fas ${m.icon} text-xs"></i>
            ${m.label}
          </button>
        `).join('')}
      </div>
      <p class="text-center text-xs text-gray-400 mt-4">
        Mostrando <strong id="active-mood-label">todos los aromas</strong>
      </p>
    </section>

    <!-- GRID DE AROMAS -->
    <section class="mb-16">
      <div id="aromas-grid"
           class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        ${aromas.map(a => renderAromaCard(a)).join('')}
      </div>
    </section>

    <!-- GUÍA: ¿CÓMO ELEGIR? -->
    <section class="guia-section mb-16 max-w-5xl mx-auto px-4">
      <div class="text-center mb-12">
        <span class="text-xs font-bold uppercase tracking-[0.2em] mb-3 block"
              style="color: var(--color-gris-crema);">Para principiantes</span>
        <h2 class="text-3xl md:text-4xl font-extrabold" style="color: var(--color-cinna);">
          ¿Cómo elegir tu aroma ideal?
        </h2>
        <p class="text-gray-500 mt-3 max-w-xl mx-auto text-sm">
          No hay reglas absolutas, pero estos criterios te ayudan a acertar desde el primer intento.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        ${[
          {
            icon: 'fa-home', color: '#4a7c59',
            title: '1. Piensa en el espacio',
            text: 'Los aromas frescos (bambú, coco) funcionan mejor en áreas sociales y de trabajo. Los cálidos (vainilla, café) son ideales para dormitorios y momentos de descanso.',
          },
          {
            icon: 'fa-clock', color: '#c87941',
            title: '2. Considera el momento del día',
            text: 'Mañana y tarde: aromas energizantes como café mocka o durazno. Noche: aromas relajantes como bambú o coco & vainilla para descansar mejor.',
          },
          {
            icon: 'fa-volume-up', color: 'var(--color-cinna)',
            title: '3. Elige la intensidad adecuada',
            text: 'Espacios pequeños (baño, habitación): intensidades 1–3. Salas y áreas abiertas: intensidades 4–5. El café mocka es ideal para espacios grandes.',
          },
          {
            icon: 'fa-heart', color: '#b8956a',
            title: '4. Empieza por lo familiar',
            text: 'Tu primer aroma debería evocar algo que ya te gusta. ¿Te encanta el café? Empieza por ahí. ¿Te relaja la playa? Coco es tu punto de partida.',
          },
        ].map(step => `
          <div class="guia-step flex gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm
                      hover:shadow-md transition-shadow duration-300">
            <div class="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
                 style="background: ${step.color}15;">
              <i class="fas ${step.icon} text-sm" style="color: ${step.color};"></i>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 mb-1.5">${step.title}</h3>
              <p class="text-sm text-gray-500 leading-relaxed">${step.text}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- TABLA RÁPIDA DE REFERENCIA -->
    <section class="mb-16 max-w-5xl mx-auto px-4">
      <div class="rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
        <div class="px-6 py-5" style="background: var(--color-cinna);">
          <h2 class="text-xl font-extrabold text-white">Guía rápida de aromas</h2>
          <p class="text-sm mt-1" style="color: rgba(239,223,187,0.7);">Para compartir y guardar</p>
        </div>
        <div class="overflow-x-auto bg-white">
          <table class="w-full text-sm">
            <thead>
              <tr style="background: var(--color-fondo);">
                <th class="text-left px-5 py-3 font-bold text-gray-700">Aroma</th>
                <th class="text-left px-5 py-3 font-bold text-gray-700">Ambiente ideal</th>
                <th class="text-left px-5 py-3 font-bold text-gray-700">Mejor momento</th>
                <th class="text-left px-5 py-3 font-bold text-gray-700">Intensidad</th>
              </tr>
            </thead>
            <tbody>
              ${aromas.map((a, i) => `
                <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 transition-colors">
                  <td class="px-5 py-3.5 font-semibold" style="color: var(--color-cinna);">
                    ${a.emoji} ${a.name}
                  </td>
                  <td class="px-5 py-3.5 text-gray-600">${a.ambientes.join(', ')}</td>
                  <td class="px-5 py-3.5 text-gray-600">
                    ${a.moods.includes('energizar') ? 'Mañana / Tarde' : 'Tarde / Noche'}
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="flex gap-0.5">${renderIntensidad(a.intensidad)}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- SEO: contexto de marca y keywords locales -->
    <section class="max-w-5xl mx-auto px-4 mb-16">
      <div class="rounded-3xl p-8 md:p-10" style="background: var(--color-fondo);">
        <h2 class="text-2xl font-extrabold mb-4" style="color: var(--color-cinna);">
          Velas artesanales y pebeteros en Cali
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 leading-relaxed">
          <div>
            <p class="mb-3">
              En <strong>Glowie</strong> hacemos <strong>velas artesanales en Cali</strong> con cera de soja 100% natural.
              Cada <strong>vela aromática</strong> está elaborada a mano, sin parafinas ni aditivos artificiales,
              para que el aroma sea limpio, duradero y seguro en tu hogar.
            </p>
            <p>
              Si buscas <strong>velas en Cali</strong> con fragancias premium —bambú, coco & vainilla, durazno o café mocka—
              encontrarás en nuestro catálogo diseños únicos en cemento: floreros, rombos, hexagonales y más.
            </p>
          </div>
          <div>
            <p class="mb-3">
              También trabajamos con <strong>pebeteros cerámicos en Cali</strong> y waxmelts:
              una forma de disfrutar el aroma de nuestras fragancias sin llama, usando calor suave para
              fundir la cera y liberar la fragancia de forma continua y segura.
            </p>
            <p>
              Todas nuestras velas artesanales y <strong>pebeteros en Cali</strong> están disponibles para entrega
              a domicilio en Cali y todo el Valle del Cauca. También hacemos envíos nacionales.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="relative rounded-3xl overflow-hidden mb-8 max-w-5xl mx-auto px-4">
      <div class="relative py-16 px-8 text-center rounded-3xl overflow-hidden"
           style="background: linear-gradient(135deg, var(--color-fondo) 0%, #f5e6d0 100%);">
        <div class="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
             style="background: var(--color-cinna);"></div>
        <div class="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15"
             style="background: var(--color-cinna);"></div>
        <div class="relative z-10">
          <div class="text-5xl mb-5">🕯️</div>
          <h2 class="text-3xl md:text-4xl font-extrabold mb-4" style="color: var(--color-cinna);">
            ¿Listo para elegir tu aroma?
          </h2>
          <p class="text-gray-600 mb-8 max-w-lg mx-auto">
            Explora nuestra colección completa de velas artesanales en Cali.
            Cada fragancia, disponible en diseños únicos de cemento.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <a href="/catalogo" class="link-route inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-white transition-all hover:scale-105 hover:opacity-90 shadow-lg"
               style="background: var(--color-cinna);">
              <i class="fas fa-th-large text-sm"></i>
              Ver catálogo completo
            </a>
            <a href="https://wa.me/573017748623?text=%C2%A1Hola%2C%20Glowie%21%20Estoy%20viendo%20la%20secci%C3%B3n%20de%20aromas%20en%20la%20web%20y%20me%20gustar%C3%ADa%20que%20me%20ayudaran%20a%20elegir%20uno%20seg%C3%BAn%20mis%20gustos."
               target="_blank"
               class="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold transition-all hover:scale-105 shadow-sm border-2"
               style="color: var(--color-cinna); border-color: var(--color-cinna); background: white;">
              <i class="fab fa-whatsapp text-sm"></i>
              Pedir asesoría
            </a>
          </div>
        </div>
      </div>
    </section>

  `;
}
