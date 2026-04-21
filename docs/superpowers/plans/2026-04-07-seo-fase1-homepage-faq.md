# SEO Fase 1 Plan — Homepage SEO + FAQ Schema

> **Para agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development para ejecutar task-by-task.

**Goal:** Mejorar posicionamiento en Google para keywords: "velas en cali", "velas cali", "waxmelt cali", "velas artesanales", etc.

**Scope Fase 1:**
1. Agregar contenido SEO sobre "Velas en Cali" en el fallback estático de `index.html` (lo que Googlebot indexa antes del JS)
2. Agregar FAQPage JSON-LD Schema con preguntas sobre waxmelt, velas aromáticas vs decorativas, cuidado de velas, etc.

**Tech Stack:**
- HTML estático (fallback crawleable por Googlebot)
- JSON-LD Schema.org (FAQPage)
- No nuevas dependencias

---

## Archivos a modificar

- `public/index.html` — dos cambios localizados:
  - **Cambio 1:** Líneas ~187–223 (static fallback) — Reemplazar/ampliar con sección SEO
  - **Cambio 2:** Línea ~90 (después de WebSite schema) — Insertar FAQPage JSON-LD

---

## Implementación

### Task 1: Agregar sección SEO "Velas en Cali" en fallback estático

**Archivo:** `public/index.html` líneas ~187–223

**Contexto:**
Actualmente hay un fallback estático que Googlebot ve antes de que cargue el JS. Contiene:
- Un `<h1>` "Velas Artesanales en Cali"
- Un párrafo descriptivo
- 4 badges (cera de soja, aromas, hecho a mano, envío gratis)
- 3 cards con `<h2>`: Velas Aromáticas, Velas Decorativas, Velas para Eventos
- Un loading spinner

**Cambio:**
Reemplazar con contenido más optimizado para SEO:
- Párrafo más largo (~150 palabras) que incluya keywords: "velas en cali", "velas artesanales", "cera de soja", "envío cali"
- Tres cards con H2 secundarios enfocados en:
  - "Velas Aromáticas en Cali"
  - "Waxmelt & Pebetero Cali"
  - "Velas Decorativas Personalizadas"
- Texto en cada card que mencione keywords naturalmente

**Código a implementar:**

```html
<main id="app-content" style="background-color: var(--color-casi-blanco);">

  <!-- FALLBACK ESTÁTICO: Visible para Googlebot antes del JS carga -->
  <div style="max-width:900px; margin:0 auto; padding:40px 20px; font-family:inherit;">

    <h1 style="color: #53161D; font-size: 2rem; font-weight: 900; margin-bottom: 12px; line-height: 1.2;">
      Velas Artesanales en Cali — Glowie
    </h1>

    <p style="color: #555; font-size: 1rem; line-height: 1.7; margin-bottom: 24px;">
      Somos <strong>Glowie</strong>, tu tienda de <strong>velas artesanales en Cali</strong>, Colombia. 
      Fabricamos velas aromáticas, decorativas y waxmelt con <strong>cera de soja 100% natural</strong>, 
      hechas completamente a mano. Nuestros aromas premium incluyen: vainilla, bambú, coco, lavanda, 
      café y muchos más. <strong>Envío gratis en Cali</strong> desde $60.000 en compras de velas 
      artesanales. Somos un negocio local basado en el Valle del Cauca, comprometido con la 
      sustentabilidad y la calidad.
    </p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px;">

      <div style="padding: 20px; border-radius: 12px; background: #fff; border: 1px solid #eee; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="color: #53161D; font-size: 1.1rem; font-weight: 700; margin: 0 0 8px; display: flex; align-items: center; gap: 6px;">
          🕯️ Velas Aromáticas en Cali
        </h2>
        <p style="color: #666; font-size: 0.9rem; line-height: 1.6; margin: 0;">
          Velas de soja con aceites esenciales puros. Aromas duraderos que transforman cualquier 
          espacio. Ideales como regalo o para crear ambientes relajantes en el hogar.
        </p>
      </div>

      <div style="padding: 20px; border-radius: 12px; background: #fff; border: 1px solid #eee; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="color: #53161D; font-size: 1.1rem; font-weight: 700; margin: 0 0 8px; display: flex; align-items: center; gap: 6px;">
          🌿 Waxmelt &amp; Pebetero Cali
        </h2>
        <p style="color: #666; font-size: 0.9rem; line-height: 1.6; margin: 0;">
          Waxmelt artesanal para usar con pebetero eléctrico o de tealight. Sin llama, máxima fragancia. 
          Disponible en Cali con envío a todo Colombia. Duran más y son seguros para hogares con niños y mascotas.
        </p>
      </div>

      <div style="padding: 20px; border-radius: 12px; background: #fff; border: 1px solid #eee; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="color: #53161D; font-size: 1.1rem; font-weight: 700; margin: 0 0 8px; display: flex; align-items: center; gap: 6px;">
          🎁 Velas Decorativas Personalizadas
        </h2>
        <p style="color: #666; font-size: 0.9rem; line-height: 1.6; margin: 0;">
          Velas decorativas en cemento, cerámica y jarrones para eventos, bodas y regalos corporativos 
          en Cali y Valle del Cauca. Diseño único y aromas a elección.
        </p>
      </div>

    </div>

    <!-- Spinner: Se reemplaza cuando carga el JS -->
    <div style="text-align: center; color: #999; padding: 40px 20px;">
      <p style="margin: 0; font-size: 0.95rem;">Cargando catálogo de velas...</p>
    </div>

  </div>

</main>
```

**Steps:**
1. Leer líneas 187–223 de `index.html`
2. Identificar exactamente dónde está el `<main id="app-content">` y su cierre
3. Reemplazar el contenido interno con el código de arriba
4. Verificar que mantiene las clases/estilos Tailwind existentes

---

### Task 2: Agregar FAQPage JSON-LD Schema

**Archivo:** `public/index.html` línea ~90 (después del WebSite schema)

**Contexto:**
Ya hay dos schemas estáticos en `<head>`:
- LocalBusiness (líneas 44–79)
- WebSite (líneas 81–89)

El FAQPage se inserta como tercer schema, inmediatamente después.

**Cambio:**
Insertar nuevo `<script type="application/ld+json">` con FAQPage para que Google muestre snippets de FAQ en search results.

**Código a implementar:**

```html
<!-- JSON-LD: FAQPage Schema — Google Featured Snippets -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Qué es un waxmelt?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Un waxmelt (o wax melt) es una porción pequeña de cera perfumada que se derrite en un quemador especial o pebetero sin necesidad de llama. Al calentarse, libera gradualmente los aromas de sus aceites esenciales. En Glowie fabricamos waxmelt artesanal en Cali con cera de soja 100% natural y fragancias premium, ofreciendo una alternativa segura y duradera a las velas tradicionales."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cuál es la diferencia entre una vela aromática y una vela decorativa?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Las velas aromáticas están diseñadas principalmente para perfumar espacios con aceites esenciales o fragancias, enfocándose en la experiencia sensorial. Las velas decorativas se priorizan por su diseño visual: colores, formas, texturas y acabados que embellecen ambientes. En Glowie ofrecemos velas artesanales que combinan lo mejor de ambas: diseño hermoso y aromas duraderos, hechas con cera de soja natural en Cali."
      }
    },
    {
      "@type": "Question",
      "name": "¿Dónde comprar velas artesanales en Cali?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Puedes comprar velas artesanales de Glowie directamente en velasglowie.com. Hacemos entregas gratis en Cali desde $60.000 y enviamos a todo Colombia. También puedes contactarnos por WhatsApp al +57 315 6265846 para consultar sobre pedidos personalizados, velas para eventos o regalos corporativos."
      }
    },
    {
      "@type": "Question",
      "name": "¿De qué están hechas las velas Glowie?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Las velas Glowie están hechas con cera de soja 100% natural, libre de parafina y sustancias tóxicas. Usamos mechas de algodón puro y fragancias premium importadas. Son completamente ecológicas, tienen combustión limpia y larga duración (40-60 horas según tamaño). Cada vela es fabricada a mano en Cali, Colombia, siguiendo estrictos estándares de calidad."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cuánto tiempo duran las velas de cera de soja?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Las velas artesanales de cera de soja duran entre 40 y 60 horas según el tamaño y cuidado. Duran aproximadamente 50% más que las velas de parafina convencionales. Para maximizar la duración: deja que se forme una piscina completa de cera derretida en el primer encendido, corta la mecha a 5mm antes de cada uso, y no las dejes encendidas más de 3 horas seguidas. Guárdalas en lugar fresco y oscuro."
      }
    },
    {
      "@type": "Question",
      "name": "¿Las velas Glowie son seguras para hogares con niños y mascotas?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sí, nuestras velas son seguras para hogares con niños y mascotas. Están hechas con ingredientes naturales sin tóxicos. Sin embargo, recomendamos colocar las velas en lugares altos fuera del alcance de niños pequeños y mascotas. Para máxima seguridad, considera nuestros waxmelt que usan quemadores eléctricos sin llama, eliminando riesgos de quemaduras."
      }
    }
  ]
}
</script>
```

**Steps:**
1. Leer línea 89 de `index.html` (cierre del WebSite schema `</script>`)
2. Insertar el FAQPage schema inmediatamente después (línea 90)
3. Verificar que no hay duplicados o conflictos

---

## Verificación

- [ ] **Task 1 completada:** Contenido SEO en fallback visible en page source
- [ ] **Task 2 completada:** FAQPage schema insertado y válido
- [ ] **Testing local:**
  1. Abrir `http://localhost:5000` → View Page Source
  2. Buscar "Velas en Cali" → debe aparecer párrafo largo
  3. Buscar "Waxmelt &" → debe aparecer en card
  4. Buscar "FAQPage" → debe aparecer schema JSON-LD
  5. Abrir DevTools → Console → 0 errores
- [ ] **Google Rich Results Test:**
  1. Ir a `https://search.google.com/test/rich-results`
  2. Pegar `https://velasglowie.com`
  3. Debe detectar: FAQPage + Product Schema + LocalBusiness
- [ ] **Deployment:**
  1. `npm run build:css`
  2. `firebase deploy`
  3. Esperar 24–48h para que Google reindex

---

## Fase 2 (PENDIENTE — Iniciar próxima sesión)

Blog posts en `public/js/pages/`:

1. **Post: "¿Qué son waxmelt? Guía completa para Cali"**
   - Keywords: waxmelt cali, waxmelt colombia, qué es un waxmelt, cómo usar waxmelt
   - Duración: ~600 palabras
   - Estructura: intro, qué es, cómo usar, ventajas, dónde comprar en Cali
   - Schema: Article + FAQSection

2. **Post: "Velas aromáticas vs decorativas: ¿cuál elegir?"**
   - Keywords: velas artesanales, velas aromáticas, velas decorativas, diferencia
   - Duración: ~600 palabras
   - Estructura: intro, diferencias, cuándo usar cada una, combinación
   - Schema: Article + FAQSection

3. **Post: "Cómo cuidar velas artesanales en clima tropical"**
   - Keywords: cuidado de velas, velas de soja, clima tropical, duración velas
   - Duración: ~600 palabras
   - Estructura: intro, almacenamiento, encendido, apagado, problemas comunes
   - Schema: Article + HowTo

**Infraestructura necesaria:**
- Nueva ruta `/blog/:slug` en `app.js`
- Nueva función `loadBlogPost(slug)` en `app.js`
- Nueva exportación `renderBlogPost(post)` en `public/js/pages/blog.js`
- Data: array de posts con { slug, title, date, content, schema }
- SEO: meta tags dinámicos por post

**Estimación:** 4–6 horas total

---

## Rollback

Si hay problemas:
```bash
git diff public/index.html  # Ver cambios
git restore public/index.html  # Revertir
npm run build:css
firebase deploy
```

---

**Plan completo para Fase 1. Listo para ejecutar.**
