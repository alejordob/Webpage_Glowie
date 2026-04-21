# Mejoras Visuales 360 — Glowie Webpage
> Plan de transformación visual disruptiva. Orden de implementación acordado: Scroll Cinematográfico → Selector de Ambiente → 3D Tilt + Glow → Configurador Visual → Cursor de Llama

---

## ✅ Estado de implementación

| Feature | Estado | Archivo(s) |
|---|---|---|
| Scroll Cinematográfico (GSAP) | ✅ Implementado | `catalog.js`, `index.html` |
| Selector de Ambiente | ❌ Descartado | — |
| 3D Tilt + Color Glow | ✅ Implementado | `catalog.js`, `styles.css` |
| Configurador Visual | ✅ Implementado | `product.js`, `styles.css` |
| Cursor de Llama | ❌ Descartado | — |

---

## 1. 🎬 Scroll Cinematográfico con GSAP

### Qué es
La experiencia de entrada al catálogo se convierte en una narrativa visual que se despliega al hacer scroll, en lugar de mostrar la grilla de productos directamente. Como un corto de marca.

### Flujo visual
```
[Pantalla 1] Hero oscuro full-screen
  → Vela con llama animada en CSS al centro
  → Headline "Velas que cuentan historias" aparece letra por letra
  → Subtítulo fade-in: "Cera de soja. Hechas a mano. Cali, Colombia."
  → CTA "Explorar colección ↓" pulsa suavemente

[Scroll] → Transición de parallax

[Pantalla 2] Split screen
  → Izquierda: imagen editorial close-up (cera, textura, manos)
  → Derecha: texto sobre el proceso artesanal
  → Aparece al entrar en viewport con slide-in

[Scroll] → Los productos entran

[Pantalla 3] Catálogo
  → Título de sección fade-in
  → Tarjetas entran con stagger (0.1s delay entre cada una)
  → Filtros aparecen desde arriba
```

### Stack técnico
- **GSAP 3** + **ScrollTrigger** plugin (100% gratis desde adquisición por Webflow 2024)
- Carga via CDN: `https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js`
- Sin cambios en Firebase ni lógica de negocio
- La llama del hero es CSS puro (sin imágenes extra)

### Archivos a modificar
- `public/js/pages/catalog.js` — renderCatalogPage() + initializeCatalogListeners()
- `public/styles.css` — animaciones de llama, hero styles
- `public/index.html` — agregar GSAP CDN script

### Referencias
- [byredo.com](https://www.byredo.com) — scroll suave, fotografía editorial
- [diptyque.com](https://www.diptyque.com) — narrativa por secciones
- [upcandledesign.com](https://upcandledesign.com) — velas escultóricas, asimétrico

---

## 2. 🎭 Selector de Ambiente ("¿Cómo quieres sentirte hoy?")

### Qué es
Antes del catálogo, una pantalla de selección de mood a pantalla completa. El usuario elige una emoción y el catálogo filtra + el color de acento de toda la página cambia.

### Moods definidos
| Mood | Ícono | Color acento | Aromas asociados | Frase |
|---|---|---|---|---|
| Romance | 🕯️ | `#8B1A2A` (granate) | Coco & Vainilla, Durazno | "Para noches que no quieres que terminen" |
| Calma | 🌿 | `#4A7C6F` (sage) | Bambú, Lavanda | "Silencia el ruido del mundo" |
| Energía | ☕ | `#6B3A2A` (espresso) | Café Mocka, Naranja | "Empieza el día con intención" |
| Regalo | 🎁 | `#53161D` (cinna) | Todos | "El detalle que lo dice todo" |

### Comportamiento
1. Al cargar `/catalogo`, aparece el selector sobre el contenido (overlay)
2. Usuario hace click en un mood → animación de transición → catálogo filtrado
3. El color `--color-cinna` en CSS vars se reemplaza por el color del mood
4. Un botón "Ver todo" en el filtro permite resetear
5. El mood elegido se guarda en `sessionStorage` (no se repide en la misma sesión)

### Stack técnico
- Puro JS + CSS custom properties (`document.documentElement.style.setProperty`)
- Sin librerías
- El filtro reutiliza el sistema de filtrado existente en `catalog.js`

### Archivos a modificar
- `public/js/pages/catalog.js` — nuevo renderMoodSelector() + lógica de filtrado por mood
- `public/styles.css` — estilos del selector, transición de color

---

## 3. ✨ 3D Tilt + Color Glow en Tarjetas de Producto

### Qué es
Cada tarjeta de producto se inclina siguiendo el cursor en 3D (efecto de profundidad) y proyecta una sombra/glow cuyo color coincide con el producto. Percepción de marca de nivel lujo.

### Comportamiento
- **Hover:** la tarjeta rota suavemente en X/Y siguiendo el cursor (máx. 12°)
- **Glow:** `box-shadow` animado con el color dominante del producto
- **Shine:** un reflejo de luz blanca atraviesa la tarjeta en diagonal al hacer hover
- **Salida:** la tarjeta regresa suavemente a posición neutral

### Color glow por producto
El color del glow se define en Firebase como campo `glow_color` (hex), o se extrae automáticamente del campo `category`:
- Cemento amarillo → `rgba(255, 200, 50, 0.4)`
- Cemento rojo → `rgba(180, 40, 40, 0.4)`
- Cemento blanco → `rgba(220, 220, 220, 0.4)`
- Default → color de marca `rgba(83, 22, 29, 0.3)`

### Stack técnico
- **VanillaTilt.js** (~2KB) o implementación manual en 40 líneas
- CSS `perspective` + `transform: rotateX() rotateY()`
- `box-shadow` CSS transition para el glow
- Sin cambios en Firebase (el glow_color puede ser opcional/default)

### Archivos a modificar
- `public/js/pages/catalog.js` — initTiltEffect() llamado después de renderProducts()
- `public/styles.css` — `.catalog-card` perspective, glow, shine overlay

---

## 4. 🎨 Configurador Visual de Combinaciones (Pendiente)

### Qué es
En la página de producto, en lugar de dropdowns de texto, un preview visual animado que muestra los colores de la combinación elegida en tiempo real.

### Comportamiento
```
[Círculo animado: color cemento] + [Círculo animado: color cera] → [Imagen del producto]
```
- Al seleccionar aroma/diseño, los círculos se animan con el color real
- La imagen principal hace crossfade a la variante elegida
- Un badge muestra "X unidades disponibles" animado

### Stack técnico
- CSS custom properties + transitions
- La data de `combinaciones` de Firebase ya tiene los colores
- Agregar campo `color_hex` a cada combinación en `cargarProductos.json`

### Archivos a modificar
- `public/js/pages/product.js` — renderProductDetail() + initProductVariantLogic()
- `public/styles.css` — estilos del configurador visual

---

## 5. 🔥 Cursor de Llama Personalizado (Pendiente)

### Qué es
El cursor del mouse es reemplazado por una pequeña llama animada en CSS. Al pasar sobre productos, la llama crece. Al hacer click, hace un flash de luz.

### Comportamiento
- Cursor default: llama pequeña (16×24px) con animación de parpadeo
- Hover sobre tarjeta: llama crece a 24×36px, añade glow naranja
- Click: flash de luz blanca radial que desaparece en 300ms
- Mobile: deshabilitado (no tiene cursor)

### Stack técnico
- CSS `cursor: none` + elemento `#flame-cursor` posicionado con JS
- CSS `@keyframes` para el parpadeo (escala + opacidad)
- ~30 líneas CSS + ~20 líneas JS

### Archivos a modificar
- `public/index.html` — div#flame-cursor en body
- `public/styles.css` — animación de llama
- `public/js/app.js` — mousemove listener para mover el cursor

---

## Dependencias a agregar

```html
<!-- GSAP + ScrollTrigger (gratis, para Feature 1) -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>

<!-- VanillaTilt (opcional, para Feature 3 — alternativa: implementar manual) -->
<script src="https://cdn.jsdelivr.net/npm/vanilla-tilt@1.8.1/dist/vanilla-tilt.min.js"></script>
```

---

## Notas de implementación

- **Mobile first:** el scroll cinematográfico y el tilt se deshabilitan en mobile (no hay hover, el scroll cinematográfico se simplifica)
- **Performance:** las animaciones GSAP respetan `prefers-reduced-motion`
- **No rompe SEO:** el contenido de los productos sigue siendo accesible en el DOM
- **Tailwind + custom CSS:** los nuevos estilos van en `styles.css`, no en clases inline de Tailwind para mejor mantenibilidad
