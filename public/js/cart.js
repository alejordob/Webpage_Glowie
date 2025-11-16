/**
 * js/cart.js
 * Módulo para manejar toda la lógica del carrito de compras.
 * Exporta funciones y la variable global Cart para acceso.
 */

let cart = JSON.parse(window.localStorage.getItem('candleCart')) || [];

// Referencias DOM
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const cartCountElement = document.getElementById('cart-count');
const emptyMessage = document.getElementById('empty-cart-message');
const cartSubtotalElement = document.getElementById('cart-subtotal');
const cartDiscountElement = document.getElementById('cart-discount-total');

// NUEVOS ELEMENTOS PARA ENVÍO
const shippingContainer = document.getElementById('shipping-container');
const shippingTextElement = document.getElementById('shipping-text');
const finalTotalElement = document.getElementById('final-total');
const finalTotalLabel = document.getElementById('final-total-label');

// Botones
const openCartBtn = document.getElementById('open-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const checkoutWhatsappBtn = document.getElementById('checkout-whatsapp-btn');

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

        // === TRACKING: Añadir al carrito ===
    if (typeof gtag === 'function') {
        const item = {
            item_id: product.id,
            item_name: product.name,
            price: finalPrice,
            quantity: 1
        };

        if (product.variation) {
            const v = product.variation;
            let variant = '';
            if (v.colorCera && v.colorCera.toLowerCase() !== 'n/a') variant += `Cera: ${v.colorCera} | `;
            if (v.colorCemento && v.colorCemento.toLowerCase() !== 'n/a') variant += `Cemento: ${v.colorCemento} | `;
            if (v.aroma && v.aroma.toLowerCase() !== 'n/a') variant += `Aroma: ${v.aroma} | `;
            if (variant) item.item_variant = variant.slice(0, -3);
        }

        gtag('event', 'add_to_cart', {
            currency: 'COP',
            value: finalPrice,
            items: [item]
        });
    }

    saveCart();
    updateCartUI();
    toggleCart(true);

        // Después de toggleCart(true);
    const cartBtn = document.getElementById('open-cart-btn');
    cartBtn.classList.add('added');
    setTimeout(() => cartBtn.classList.remove('added'), 600);
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

export function removeItemById(productId) {
    updateCartQuantity(productId, 0);
}

export function handleWhatsappCheckout() {
    const phoneNumber = '573156265846';
    let message = "*¡Hola Glowie!* %0A%0ATengo un pedido listo: %0A%0A";
    let subtotal = 0;

    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;

        let variation = '';
        const v = item.variation || {};
        if (v.colorCera && v.colorCera.toLowerCase() !== 'n/a') variation += `Cera: ${v.colorCera} | `;
        if (v.colorCemento && v.colorCemento.toLowerCase() !== 'n/a') variation += `Cemento: ${v.colorCemento} | `;
        if (v.aroma && v.aroma.toLowerCase() !== 'n/a') variation += `Aroma: ${v.aroma} | `;
        if (variation) variation = variation.slice(0, -3);

        message += `• *${item.name}* ${variation ? `(${variation})` : ''} × ${item.quantity} = ${formatPriceCOP(itemSubtotal)}%0A`;
    });

    // CÁLCULO DE ENVÍO
    const shippingCost = subtotal >= 50000 ? 0 : 8000;
    const shippingText = subtotal >= 50000 
        ? `*Gratis en Cali*` 
        : `*Envío a Cali: $${shippingCost.toLocaleString('es-CO')}*`;

    const finalTotal = subtotal + shippingCost;

    message += `%0A`;
    message += `*Subtotal: ${formatPriceCOP(subtotal)}*%0A`;
    message += `*Envío: ${shippingText}*%0A`;
    message += `*Total a pagar: ${formatPriceCOP(finalTotal)}*%0A%0A`;
    message += `Entrega: *1-3 días hábiles*%0A%0A`;
    message += `Por favor confirma disponibilidad y método de pago. ¡Gracias!`;

    const whatsappLink = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappLink, '_blank');

    cart = [];
    saveCart();
    updateCartUI();
    alertUser('¡Pedido enviado! Te responderemos pronto.');
    toggleCart(false);
}

export function alertUser(message) {
    const alertBox = document.createElement('div');
    alertBox.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 p-3 bg-green-500 text-white text-center font-bold rounded-xl shadow-2xl transition-all duration-300 z-[9999]';
    alertBox.textContent = message;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 3000);
}

export function updateCartUI() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    let subtotalBeforeDiscount = 0;
    let totalDiscount = 0;

    cart.forEach(item => {
        const itemOriginalPriceUnit = item.originalPrice || item.price;
        subtotalBeforeDiscount += itemOriginalPriceUnit * item.quantity;
        const itemDiscount = item.originalPrice && item.originalPrice > item.price
            ? (item.originalPrice - item.price) * item.quantity
            : 0;
        totalDiscount += itemDiscount;
    });

    const subtotal = subtotalBeforeDiscount - totalDiscount;
    const shippingCost = subtotal >= 50000 ? 0 : 8000;
    const finalTotal = subtotal + shippingCost;

    if (cartCountElement) cartCountElement.textContent = totalItems;

    // Subtotal y descuento
    const subtotalContainer = document.getElementById('subtotal-container');
    const discountContainer = document.getElementById('discount-container');
    const hasDiscount = totalDiscount > 0;

    if (cartSubtotalElement && subtotalContainer) {
        cartSubtotalElement.textContent = formatPriceCOP(subtotalBeforeDiscount);
        subtotalContainer.classList.toggle('hidden', !hasDiscount);
    }

    if (cartDiscountElement && discountContainer) {
        cartDiscountElement.textContent = `- ${formatPriceCOP(totalDiscount)}`;
        discountContainer.classList.toggle('hidden', !hasDiscount);
    }

    // Envío
    if (shippingTextElement) {
        const text = subtotal >= 50000 
            ? 'Gratis en Cali'
            : `$8.000`;
        const color = subtotal >= 50000 ? 'text-green-600' : 'text-gray-700';
        shippingTextElement.textContent = text;
        shippingTextElement.className = `font-medium ${color}`;
    }

    // Total final
    if (finalTotalElement) finalTotalElement.textContent = formatPriceCOP(finalTotal);
    if (finalTotalLabel) finalTotalLabel.classList.toggle('hidden', subtotal < 50000);

    const isEmpty = cart.length === 0;
    if (emptyMessage) emptyMessage.classList.toggle('hidden', !isEmpty);
    if (checkoutWhatsappBtn) checkoutWhatsappBtn.classList.toggle('hidden', isEmpty);

    if (!isEmpty) {
        cart.forEach(item => {
            const isDiscounted = item.originalPrice && item.originalPrice > item.price;
            const priceClass = isDiscounted ? 'font-bold text-amber-600' : 'font-semibold text-gray-700';

            const unitPriceHtml = `
                <p class="text-sm mt-0.5">
                    ${isDiscounted ? `<span class="text-gray-400 line-through mr-2 font-normal text-xs">${formatPriceCOP(item.originalPrice)} c/u</span>` : ''}
                    <span class="${priceClass} text-sm">${formatPriceCOP(item.price)} c/u</span>
                </p>
            `;

            let variationDetailsHtml = '';
            const v = item.variation || {};
            const variations = [];
            if (v.colorCera && v.colorCera.toLowerCase() !== 'n/a') variations.push(`<strong>Cera</strong>: ${v.colorCera}`);
            if (v.colorCemento && v.colorCemento.toLowerCase() !== 'n/a') variations.push(`<strong>Cemento</strong>: ${v.colorCemento}`);
            if (v.aroma && v.aroma.toLowerCase() !== 'n/a') variations.push(`<strong>Aroma</strong>: ${v.aroma}`);
            if (variations.length > 0) {
                variationDetailsHtml = `<p class="text-xs text-gray-500 mt-0.5">${variations.join('<br>')}</p>`;
            }

            const itemElement = document.createElement('div');
            itemElement.className = 'flex items-start justify-between p-3 bg-gray-50 rounded-lg shadow-sm mb-3';
            itemElement.innerHTML = `
                <div class="flex items-start space-x-3 flex-grow min-w-0">
                    <img src="${item.image || 'https://placehold.co/64x64/fbf3e0/2e2e2e?text=V'}" 
                         alt="${item.name}" 
                         class="w-16 h-16 object-cover rounded-md flex-shrink-0"
                         onerror="this.src='https://placehold.co/64x64/fbf3e0/2e2e2e?text=V';">
                    <div class="flex-grow min-w-0">
                        <p class="text-sm font-semibold text-gray-800 truncate">${item.name}</p>
                        ${variationDetailsHtml}
                        ${unitPriceHtml}
                    </div>
                </div>
                <div class="flex items-center space-x-3 ml-4 flex-shrink-0">
                    <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button class="quantity-btn w-6 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-base font-bold transition-colors duration-150" data-id="${item.id}" data-action="decrease">-</button>
                        <span class="font-bold text-gray-700 w-6 text-center text-sm">${item.quantity}</span>
                        <button class="quantity-btn w-6 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-base font-bold transition-colors duration-150" data-id="${item.id}" data-action="increase">+</button>
                    </div>
                    <button class="remove-btn text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors duration-150" data-id="${item.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        // Listeners dinámicos
        cartItemsContainer.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = e.currentTarget.dataset.id;
                const action = e.currentTarget.dataset.action;
                const item = cart.find(i => i.id.toString() === id);
                if (item) {
                    const newQty = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
                    updateCartQuantity(id, newQty);
                }
            });
        });

        cartItemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                removeItemById(e.currentTarget.dataset.id);
            });
        });
    }
}

// -------------------------------------------------------------
// INTERNAS
// -------------------------------------------------------------

function saveCart() {
    window.localStorage.setItem('candleCart', JSON.stringify(cart));
}

function setupStaticListeners() {
    if (openCartBtn) openCartBtn.addEventListener('click', () => toggleCart(true));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
    if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));
    
    // TRACKING DE WHATSAPP (GA4)
    if (checkoutWhatsappBtn) {
        checkoutWhatsappBtn.addEventListener('click', () => {
            // 1. Enviar evento a GA4
            if (typeof gtag === 'function') {
                gtag('event', 'whatsapp_click', {
                    event_category: 'conversion',
                    event_label: 'checkout_whatsapp',
                    value: 1,
                    currency: 'COP'
                });
                console.log('GA4: Click en WhatsApp (checkout) trackeado');
            }

            // 2. Abrir WhatsApp
            handleWhatsappCheckout();
        });
    }
}

// -------------------------------------------------------------
// INICIALIZACIÓN
// -------------------------------------------------------------

window.Cart = {
    addToCart,
    updateCartQuantity,
    removeItemById,
    toggleCart,
    handleWhatsappCheckout,
    formatPriceCOP,
    alertUser,
    updateCartUI,
};

setupStaticListeners();
updateCartUI();