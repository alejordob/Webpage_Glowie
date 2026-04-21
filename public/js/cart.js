/**
 * js/cart.js
 * Módulo para manejar toda la lógica del carrito de compras.
 * Envío CORRECTO: < 60k → "Domicilio $8.000" | ≥ 60k → "Gratis en Cali"
 * WhatsApp: Mensaje dividido → nunca se corta
 */

let cart = JSON.parse(window.localStorage.getItem('candleCart')) || [];

// Referencias DOM
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const cartCountElement = document.getElementById('cart-count');
const cartSubtotalElement = document.getElementById('cart-subtotal');
const cartDiscountElement = document.getElementById('cart-discount-total');

// Elementos envío
const shippingContainer = document.getElementById('shipping-container');
const shippingTextElement = document.getElementById('shipping-text');
const finalTotalElement = document.getElementById('final-total');
const finalTotalLabel = document.getElementById('final-total-label');

// Botones
const openCartBtn = document.getElementById('open-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const checkoutWhatsappBtn = document.getElementById('checkout-whatsapp-btn');

// CONSTANTES
const SHIPPING_THRESHOLD = 60000; // 60.000 para envío gratis
const SHIPPING_COST = 8000;

// -------------------------------------------------------------
// FUNCIONES
// -------------------------------------------------------------

export function formatPriceCOP(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return `$0`;
    return `$${amount.toLocaleString('es-CO')}`;
}

export function toggleCart(show) {
    if (!cartSidebar || !cartOverlay) return;
    const shouldShow = typeof show === 'boolean' ? show : cartSidebar.classList.contains('translate-x-full');

    if (shouldShow) {
        cartSidebar.classList.remove('translate-x-full');
        cartOverlay.classList.remove('opacity-0', 'pointer-events-none');
        cartOverlay.classList.add('opacity-50');
        document.body.style.overflow = 'hidden';
    } else {
        cartSidebar.classList.add('translate-x-full');
        cartOverlay.classList.remove('opacity-50');
        cartOverlay.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
    }
}

export function addToCart(product) {
    const existingItem = cart.find(item => item.id.toString() === product.id.toString());

    const normalPrice = parseFloat(product.price) || 0;
    const salePrice = parseFloat(product.on_sale_price) || 0;
    const isOnSale = product.on_sale === true || product.on_sale === 'true' || product.on_sale === 1;

    let finalPrice = normalPrice;
    let originalPrice = null;

    if (isOnSale && salePrice > 0 && salePrice < normalPrice) {
        originalPrice = normalPrice;
        finalPrice = salePrice;
    }

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        const image = product.images?.[0] || product.image || (product.imageUrls?.[0]) || '';
        cart.push({
            id: product.id,
            name: product.name,
            price: finalPrice,
            originalPrice: originalPrice,
            image: image,
            quantity: 1,
            variation: product.variation || {}
        });
    }

    if (typeof gtag === 'function') {
        gtag('event', 'add_to_cart', {
            currency: 'COP',
            value: finalPrice,
            items: [{ item_id: product.id, item_name: product.name, price: finalPrice, quantity: 1 }]
        });
    }

    saveCart();
    updateCartUI();
    toggleCart(true);

    const cartBtn = document.getElementById('open-cart-btn');
    if (cartBtn) {
        cartBtn.classList.add('added');
        setTimeout(() => cartBtn.classList.remove('added'), 600);
    }
}

export function updateCartQuantity(productId, newQuantity) {
    const itemIndex = cart.findIndex(item => item.id.toString() === productId.toString());
    if (itemIndex > -1) {
        if (newQuantity <= 0) {
            cart.splice(itemIndex, 1);
            alertUser('Producto eliminado del carrito.');
        } else {
            cart[itemIndex].quantity = newQuantity;
        }
    }
    saveCart();
    updateCartUI();
}

export function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
}

export function removeItemById(productId) {
    updateCartQuantity(productId, 0);
}

export function updateCartUI() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    let subtotalBeforeDiscount = 0;
    let totalDiscount = 0;

    cart.forEach(item => {
        const unitPrice = item.originalPrice || item.price;
        subtotalBeforeDiscount += unitPrice * item.quantity;
        if (item.originalPrice && item.originalPrice > item.price) {
            totalDiscount += (item.originalPrice - item.price) * item.quantity;
        }
    });

    const subtotal = subtotalBeforeDiscount - totalDiscount;
    const isFreeShipping = subtotal >= SHIPPING_THRESHOLD;
    const shippingCost = isFreeShipping ? 0 : SHIPPING_COST;
    const finalTotal = subtotal + shippingCost;
    const isEmpty = cart.length === 0;

    // --- Contador del header ---
    if (cartCountElement) cartCountElement.textContent = totalItems;

    // --- Badge de cuenta en sidebar header ---
    const cartBadge = document.getElementById('cart-count-badge');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.classList.toggle('hidden', totalItems === 0);
    }

    // --- Barra de progreso de envío gratis ---
    const progressBar = document.getElementById('shipping-progress-bar');
    const progressLabel = document.getElementById('shipping-progress-label');
    const progressAmount = document.getElementById('shipping-progress-amount');
    const progressContainer = document.getElementById('shipping-progress-container');

    if (progressContainer) {
        progressContainer.classList.toggle('hidden', isEmpty);
        if (!isEmpty && progressBar && progressLabel && progressAmount) {
            const progress = Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100);
            const remaining = SHIPPING_THRESHOLD - subtotal;
            progressBar.style.width = `${progress}%`;
            if (progress >= 100) {
                progressLabel.textContent = '¡Tienes envío gratis! 🎉';
                progressLabel.style.color = '#16a34a';
                progressBar.style.background = '#16a34a';
                progressAmount.textContent = '';
            } else {
                progressLabel.textContent = 'Faltan para envío gratis:';
                progressLabel.style.color = '';
                progressBar.style.background = 'var(--color-cinna)';
                progressAmount.textContent = formatPriceCOP(remaining);
            }
        }
    }

    // --- Subtotal (visible solo cuando hay items) ---
    const subtotalContainer = document.getElementById('subtotal-container');
    if (subtotalContainer) subtotalContainer.classList.toggle('hidden', isEmpty);
    if (cartSubtotalElement) cartSubtotalElement.textContent = formatPriceCOP(subtotal);

    // --- Descuento ---
    const discountContainer = document.getElementById('discount-container');
    if (cartDiscountElement && discountContainer) {
        cartDiscountElement.textContent = `- ${formatPriceCOP(totalDiscount)}`;
        discountContainer.classList.toggle('hidden', totalDiscount === 0);
    }

    // --- Envío ---
    if (shippingTextElement) {
        if (isFreeShipping) {
            shippingTextElement.textContent = 'Gratis en Cali';
            shippingTextElement.className = 'font-medium text-green-600';
        } else {
            shippingTextElement.textContent = 'Domicilio $8.000';
            shippingTextElement.className = 'font-medium text-gray-700';
        }
    }

    // --- Total final ---
    if (finalTotalElement) finalTotalElement.textContent = formatPriceCOP(finalTotal);

    // --- Sección de acciones (checkout + seguir comprando) ---
    const cartActionsEl = document.getElementById('cart-actions');
    if (cartActionsEl) cartActionsEl.classList.toggle('hidden', isEmpty);
    if (checkoutWhatsappBtn) checkoutWhatsappBtn.classList.toggle('hidden', isEmpty);

    // --- Botón vaciar carrito ---
    const clearRow = document.getElementById('cart-clear-row');
    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearRow) clearRow.classList.toggle('hidden', isEmpty);
    if (clearBtn && !clearBtn._listenerAdded) {
        clearBtn._listenerAdded = true;
        clearBtn.addEventListener('click', () => {
            if (confirm('¿Vaciar el carrito?')) clearCart();
        });
    }

    // --- Estado vacío o items ---
    if (isEmpty) {
        cartItemsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center gap-5 py-12">
                <div class="w-20 h-20 rounded-full flex items-center justify-center"
                     style="background: var(--color-fondo);">
                    <i class="fas fa-shopping-bag text-3xl" style="color: var(--color-cinna); opacity: 0.4;"></i>
                </div>
                <div>
                    <p class="text-gray-700 font-semibold mb-1">Tu carrito está vacío</p>
                    <p class="text-gray-400 text-sm">Agrega una vela y transforma tu espacio.</p>
                </div>
                <button id="cart-go-catalog" class="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 hover:scale-105"
                        style="background: var(--color-cinna);">
                    Ver Catálogo
                </button>
            </div>`;
        document.getElementById('cart-go-catalog')?.addEventListener('click', () => {
            toggleCart(false);
            if (typeof window['navigate'] === 'function') window['navigate']('/catalogo');
        });
        return;
    }

    // --- Renderizar items ---
    cart.forEach(item => {
        const isDiscounted = item.originalPrice && item.originalPrice > item.price;
        const lineTotal = item.price * item.quantity;

        // Chips de variaciones
        const v = item.variation || {};
        const chips = [];
        if (v.aroma && v.aroma !== 'N/A') chips.push(v.aroma);
        if (v.diseño) chips.push(v.diseño);
        if (v.cera && v.cera !== 'N/A') chips.push(v.cera);
        if (v.cemento && v.cemento !== 'N/A') chips.push(v.cemento);
        const chipsHtml = chips.length > 0
            ? `<div class="flex flex-wrap gap-1 mt-1">
                 ${chips.map(c => `<span class="text-xs px-2 py-0.5 rounded-full" style="background: var(--color-fondo); color: var(--color-cinna);">${c}</span>`).join('')}
               </div>`
            : '';

        const pricingHtml = isDiscounted
            ? `<span class="text-xs text-gray-400 line-through">${formatPriceCOP(item.originalPrice)}</span>
               <span class="text-xs font-semibold ml-1" style="color: var(--color-cinna);">${formatPriceCOP(item.price)}</span>`
            : `<span class="text-xs font-semibold text-gray-500">${formatPriceCOP(item.price)}</span>`;

        const itemEl = document.createElement('div');
        itemEl.className = 'flex gap-3 py-3 border-b border-gray-100 last:border-0';
        itemEl.innerHTML = `
            <img src="${item.image || 'https://placehold.co/64x64/fbf3e0/2e2e2e?text=V'}"
                 alt="${item.name}"
                 class="w-16 h-16 object-contain rounded-xl flex-shrink-0 border border-gray-100"
                 style="background: var(--color-fondo);"
                 onerror="this.src='https://placehold.co/64x64/fbf3e0/2e2e2e?text=V'">
            <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 text-sm leading-snug truncate">${item.name}</p>
                ${chipsHtml}
                <div class="mt-1">${pricingHtml}</div>
                <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button class="quantity-btn w-7 h-7 text-gray-500 hover:bg-gray-100 text-sm font-bold flex items-center justify-center"
                                data-id="${item.id}" data-action="decrease">−</button>
                        <span class="w-8 text-center text-sm font-semibold select-none">${item.quantity}</span>
                        <button class="quantity-btn w-7 h-7 text-gray-500 hover:bg-gray-100 text-sm font-bold flex items-center justify-center"
                                data-id="${item.id}" data-action="increase">+</button>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold" style="color: var(--color-cinna);">${formatPriceCOP(lineTotal)}</p>
                        <button class="remove-btn text-xs text-gray-400 hover:text-red-500 transition-colors mt-0.5"
                                data-id="${item.id}">Eliminar</button>
                    </div>
                </div>
            </div>`;
        cartItemsContainer.appendChild(itemEl);
    });

    // --- Listeners de cantidad y eliminar ---
    cartItemsContainer.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.onclick = e => {
            const id = e.currentTarget.dataset.id;
            const action = e.currentTarget.dataset.action;
            const item = cart.find(i => i.id.toString() === id.toString());
            if (item) updateCartQuantity(id, action === 'increase' ? item.quantity + 1 : item.quantity - 1);
        };
    });

    cartItemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
        btn.onclick = e => removeItemById(e.currentTarget.dataset.id);
    });
}

// WhatsApp con texto correcto
export function handleWhatsappCheckout() {
    const phoneNumber = '573017748623';
    const MAX_LENGTH = 1500;

    let subtotal = 0;
    const itemsLines = [];

    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;

        let variation = '';
        const v = item.variation || {};
        if (v.aroma && v.aroma !== 'N/A') variation += `Aroma: ${v.aroma} | `;
        if (v.cera && v.cera !== 'N/A') variation += `Cera: ${v.cera} | `;
        if (v.cemento && v.cemento !== 'N/A') variation += `Cemento: ${v.cemento} | `;
        if (v.diseño) variation += `Diseño: ${v.diseño} | `;
        if (variation) variation = variation.slice(0, -3);

        const line = `• *${item.name}* ${variation ? `(${variation})` : ''} × ${item.quantity} = ${formatPriceCOP(itemSubtotal)}`;
        itemsLines.push(line);
    });

    const isFreeShipping = subtotal >= SHIPPING_THRESHOLD;
    const shippingCost = isFreeShipping ? 0 : SHIPPING_COST;
    const finalTotal = subtotal + shippingCost;
    const shippingText = isFreeShipping ? 'GRATIS EN CALI' : 'Domicilio $8.000';

    const header = `*Hola Glowie,*%0A%0AConfirmando mi pedido:%0A%0A`;
    const footer = `%0A*Subtotal:* ${formatPriceCOP(subtotal)}%0A*Envio:* ${shippingText}%0A*Total a pagar:* ${formatPriceCOP(finalTotal)}%0A%0AEntrega: *1-3 dias habiles* en Cali%0AVelas 100% soja natural, hechas a mano.%0A%0aGracias!`;

    const chunks = [];
    let currentChunk = header;

    itemsLines.forEach(line => {
        const test = currentChunk + line + '%0A';
        if (test.length > MAX_LENGTH) {
            chunks.push(currentChunk);
            currentChunk = '';
        }
        currentChunk += line + '%0A';
    });
    currentChunk += footer;
    chunks.push(currentChunk);

    chunks.forEach((chunk, index) => {
        setTimeout(() => {
            const text = index === 0
                ? chunk
                : `Continuacion del pedido (${index + 1}/${chunks.length}):%0A%0A` + chunk.replace(header, '').replace(footer, '');
            const finalText = index === chunks.length - 1 ? text + footer : text;
            const url = `https://wa.me/${phoneNumber}?text=${finalText}`;
            window.open(url, '_blank');
        }, index * 700);
    });

    cart = [];
    saveCart();
    updateCartUI();
    alertUser('Pedido enviado a WhatsApp! Te contactaremos pronto');
    toggleCart(false);
}

export function alertUser(message) {
    const alertBox = document.createElement('div');
    alertBox.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 p-4 bg-green-600 text-white text-center font-bold rounded-xl shadow-2xl z-[9999] transition-all';
    alertBox.textContent = message;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 3500);
}

function saveCart() {
    window.localStorage.setItem('candleCart', JSON.stringify(cart));
}

function setupStaticListeners() {
    if (openCartBtn) openCartBtn.addEventListener('click', () => toggleCart(true));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
    if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));
    
    if (checkoutWhatsappBtn) {
        checkoutWhatsappBtn.addEventListener('click', () => {
            if (typeof gtag === 'function') {
                gtag('event', 'whatsapp_click', { event_category: 'conversion', event_label: 'checkout_whatsapp', value: 1 });
            }
            handleWhatsappCheckout();
        });
    }
}

window.Cart = { addToCart, updateCartQuantity, removeItemById, toggleCart, handleWhatsappCheckout, formatPriceCOP, alertUser, updateCartUI };
setupStaticListeners();
updateCartUI();