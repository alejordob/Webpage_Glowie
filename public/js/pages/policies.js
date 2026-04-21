export function renderPrivacyPolicy() {
  return `
    <div class="max-w-2xl mx-auto py-12 px-4">
      <h1 class="text-4xl font-black mb-8" style="color: var(--color-cinna);">Política de Privacidad</h1>

      <div class="space-y-6 text-gray-700 leading-relaxed text-sm">
        <section>
          <h2 class="text-lg font-bold mb-2" style="color: var(--color-cinna);">1. Recopilación de datos</h2>
          <p>Recopilamos información que nos proporcionas voluntariamente (nombre, email, número WhatsApp) para procesar tu pedido. También recopilamos datos automáticos de navegación a través de Google Analytics (GA4) y Meta Pixel para mejorar la experiencia del sitio y personalizar anuncios.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold mb-2" style="color: var(--color-cinna);">2. Uso de cookies</h2>
          <p>Usamos localStorage para guardar tu carrito de compras. Google Analytics y Meta Pixel utilizan cookies para rastrear comportamiento de navegación. Puedes desactivar cookies en tu navegador, pero algunos servicios pueden no funcionar correctamente.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold mb-2" style="color: var(--color-cinna);">3. Privacidad de datos</h2>
          <p>Tus datos están protegidos y nunca se venden a terceros. Solo se comparten con Google (Analytics) y Meta (Pixel) para mejorar publicidad y realizar análisis. Cumplimos con regulaciones de privacidad colombianas (Ley 1581 de 2012).</p>
        </section>

        <section>
          <h2 class="text-lg font-bold mb-2" style="color: var(--color-cinna);">4. Derechos del usuario</h2>
          <p>Tienes derecho a acceder, corregir o eliminar tus datos. Contacta a <strong>hola@velasglowie.com</strong> en cualquier momento. El tiempo de respuesta es de 10 días hábiles.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold mb-2" style="color: var(--color-cinna);">5. Cambios en la política</h2>
          <p>Podemos actualizar esta política en cualquier momento. Los cambios significativos se anunciarán en el sitio. Última actualización: abril 2026.</p>
        </section>
      </div>

      <div class="mt-10 pt-6 border-t border-gray-200">
        <a href="/catalogo" class="link-route text-amber-600 hover:text-amber-700 font-medium">← Volver al catálogo</a>
      </div>
    </div>
  `;
}

export function renderChangePolicy() {
  return `
    <div class="max-w-2xl mx-auto py-12 px-4">
      <h1 class="text-4xl font-black mb-8" style="color: var(--color-cinna);">Política de Cambios</h1>

      <div class="space-y-6 text-gray-700 leading-relaxed text-sm">
        <section>
          <h2 class="text-lg font-bold mb-2" style="color: var(--color-cinna);">1. Plazo para cambios</h2>
          <p>Puedes solicitar un cambio dentro de <strong>7 días hábiles</strong> después de recibir tu vela. Después de este plazo, no podemos procesar cambios.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold mb-2" style="color: var(--color-cinna);">2. Condiciones del cambio</h2>
          <p>El producto debe estar sin usar, en su empaque original. Cambios por defecto de fabricación son sin costo. Si deseas cambiar modelo/aroma sin defecto, se aplica un costo de envío (COP $8.000 en Cali).</p>
        </section>

        <section>
          <h2 class="text-lg font-bold mb-2" style="color: var(--color-cinna);">3. Cómo solicitar un cambio</h2>
          <p>Envía un mensaje por WhatsApp a <strong>+57 301 774 8623</strong> con foto del producto y tu comprobante de pago. Coordinaremos el envío de la vela de cambio.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold mb-2" style="color: var(--color-cinna);">4. No hay reembolsos</h2>
          <p>Glowie solo ofrece cambios, no reembolsos. Si tu vela llega dañada, hacemos el cambio sin costo incluido envío.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold mb-2" style="color: var(--color-cinna);">5. Disponibilidad</h2>
          <p>Los cambios están sujetos a disponibilidad de stock del modelo/aroma solicitado.</p>
        </section>
      </div>

      <div class="mt-10 pt-6 border-t border-gray-200">
        <a href="/catalogo" class="link-route text-amber-600 hover:text-amber-700 font-medium">← Volver al catálogo</a>
      </div>
    </div>
  `;
}

export function initializePoliciesListeners() {
  // No animation needed for policy pages
}
