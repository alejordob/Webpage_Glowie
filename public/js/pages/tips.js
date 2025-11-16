/**
 * js/pages/tips.js
 * Guía profesional de cuidado y uso de velas artesanales
 * Basado en mejores prácticas: Yankee Candle, Diptyque, Jo Malone
 */

const tipsContent = [
  {
    title: "Primer Encendido: La Regla de Oro",
    icon: "fa-fire",
    date: "2025-03-18",
    excerpt: "Deja que la cera se derrita completamente hasta el borde del recipiente (piscina completa) en el primer uso. Esto evita el efecto 'túnel' y garantiza que tu vela se consuma uniformemente durante toda su vida útil."
  },
  {
    title: "Máximo 3 Horas por Encendido",
    icon: "fa-hourglass-half",
    date: "2025-03-15",
    excerpt: "Nunca dejes una vela encendida más de 3 horas seguidas. Después de este tiempo, la mecha genera hongo, humo negro y pierde intensidad aromática. Apaga, deja enfriar 2 horas y vuelve a encender."
  },
  {
    title: "Corta la Mecha a 5mm Antes de Cada Uso",
    icon: "fa-cut",
    date: "2025-03-12",
    excerpt: "Una mecha larga produce llama alta, hollín y quema desigual. Usa tijeras o un cortador de mechas. Mantén siempre 5mm para una llama limpia, segura y con aroma óptimo."
  },
  {
    title: "Espera la Piscina Completa Antes de Apagar",
    icon: "fa-tint",
    date: "2025-03-08",
    excerpt: "Apaga la vela solo cuando la cera derretida cubra toda la superficie (llegue al borde). Esto evita hundimientos, desperdicio de cera y asegura que cada capa se queme por completo."
  },
  {
    title: "Guarda tus Velas en Lugar Fresco y Oscuro",
    icon: "fa-box-open",
    date: "2025-03-05",
    excerpt: "La luz solar y el calor derriten la cera, decoloran los pigmentos y evaporan los aceites esenciales. Guarda tus velas en un cajón o armario fresco. ¡Nunca en el baño o cerca de ventanas!"
  },
  {
    title: "Usa un Apagavelas (¡Nunca soples!)",
    icon: "fa-hand-sparkles",
    date: "2025-03-01",
    excerpt: "Soplar genera humo, salpica cera caliente y contamina el aroma. Usa un apagavelas, una tapa metálica o sumerge la mecha en la cera derretida y enderézala. Así evitas olor a humo y mantienes la mecha limpia."
  },
  {
    title: "Centra la Mecha Después de Cada Uso",
    icon: "fa-compass",
    date: "2025-02-25",
    excerpt: "Si la mecha se desvía, la llama quema solo un lado y crea hundimientos. Mientras la cera esté líquida, usa un palillo para centrarla. Deja enfriar antes de mover la vela."
  },
  {
    title: "Evita Corrientes de Aire",
    icon: "fa-wind",
    date: "2025-02-20",
    excerpt: "El viento hace que la llama baile, genere hollín y queme más rápido. Coloca tu vela lejos de ventanas, ventiladores o puertas. Un ambiente tranquilo = quema perfecta."
  }
];

/**
 * Renderiza una tarjeta limpia y profesional
 */
const renderTipCard = (tip) => {
  return `
    <!-- TARJETA LIMPIA: Sin botones, hover sutil -->
    <article class="group relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-t-4"
             style="border-top-color: var(--color-cinna);">
      
      <!-- Fondo suave en hover -->
      <div class="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div class="relative p-6 flex flex-col h-full">
        <!-- Ícono -->
        <div class="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110" style="color: var(--color-cinna);">
          <i class="fas ${tip.icon}"></i>
        </div>
        
        <!-- Título -->
        <h3 class="text-xl font-bold text-gray-900 mb-2 leading-tight line-clamp-2">
          ${tip.title}
        </h3>
        
        <!-- Fecha -->
        <time class="text-xs font-medium tracking-wider opacity-70 mb-3" style="color: var(--color-cinna);">
          ${formatDate(tip.date)}
        </time>
        
        <!-- Extracto -->
        <p class="text-sm text-gray-700 flex-grow leading-relaxed">
          ${tip.excerpt}
        </p>
      </div>
    </article>
  `;
};

/**
 * Formatea fecha: "18 de marzo, 2025"
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('es-CO', options);
}

/**
 * Renderiza la página completa
 */
export function renderTipsPage() {
  const tipListHTML = tipsContent.map(renderTipCard).join('');

  return `
    <!-- HERO: LIMPIO, ELEGANTE Y SIN MARCAS DE AGUA -->
    <section class="py-20 mb-16 rounded-3xl overflow-hidden" 
             style="background: linear-gradient(135deg, var(--color-fondo) 0%, var(--color-gris-crema) 80%);">
      <div class="max-w-5xl mx-auto px-6 text-center">
        <h1 class="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight" style="color: var(--color-cinna);">
          Guía Definitiva de Cuidado
        </h1>
        <p class="text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto" style="color: var(--color-cinna); opacity: 0.9;">
          Aprende los secretos de los expertos para que tus velas artesanales 
          <span class="block mt-2 font-bold">Duren más tiempo · Huelan mejor</span>
        </p>
      </div>
    </section>

    <!-- GRID DE TIPS -->
    <section class="max-w-7xl mx-auto px-6 pb-20">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${tipListHTML}
        
        <!-- TARJETA PRÓXIMAMENTE -->
        <article class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-300">
          <div class="text-6xl mb-4 opacity-50">
            <i class="fas fa-clock"></i>
          </div>
          <h3 class="text-lg font-bold mb-2" style="color: var(--color-cinna);">¡Muy pronto!</h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            Velas de masaje · Reciclaje de envases · 
            Aromaterapia para dormir · Decoración con velas
          </p>
        </article>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="py-16 text-center" style="background-color: var(--color-fondo);">
      <div class="max-w-3xl mx-auto px-6">
        <p class="text-lg italic text-gray-700 mb-6">
          <strong>Una vela bien cuidada es una experiencia que se repite.</strong><br>
          Sigue estos consejos y disfruta al máximo cada Glowie.
        </p>
        <a href="/catalogo" class="inline-flex items-center px-8 py-3 rounded-xl font-bold text-white text-lg shadow-lg transition-all duration-300"
           style="background-color: var(--color-cinna);"
           onmouseover="this.style.backgroundColor='var(--color-cinna-hover)'"
           onmouseout="this.style.backgroundColor='var(--color-cinna)'">
          Explora nuestras velas
          <i class="fas fa-arrow-right ml-3"></i>
        </a>
      </div>
    </section>
  `;
}