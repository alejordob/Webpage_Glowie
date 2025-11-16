import { db, collection, query, where, getDocs, formatPrice, getPrimaryImageUrl } from '../firebase.js';
import * as Cart from '../cart.js'; 

// 1. Renderiza el esqueleto de la página
export function renderOffersPage() {
  // Ajustamos el estilo del título para usar var(--color-cinna)
  return `
    <section class="pt-6">
      <h2 class="text-4xl font-extrabold text-center mb-2" style="color: var(--color-cinna);">🔥 Ofertas Exclusivas</h2>
      <p class="text-xl text-center text-gray-600 mb-10">Encuentra tus velas favoritas a precios imperdibles. ¡Stock limitado!</p>
      <div id="offers-list" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <p class="col-span-full text-center text-gray-500">Cargando ofertas...</p>
      </div>
    </section>
  `;
}

// 2. Inicializa la conexión a Firebase y renderiza los productos con on_sale: true
export async function initializeOffersListeners() {
  console.log("🧭 Inicializando Ofertas desde Firestore...");
  const offersList = document.getElementById('offers-list');
  if (!offersList) return;

  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('on_sale', '==', true));
    
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`🧾 Ofertas recibidas (${products.length}):`, products.map(p => p.name));

    if (products.length === 0) {
      offersList.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10">No hay ofertas activas en este momento. Vuelve pronto para nuevas promociones.</p>`;
      return;
    }

    offersList.innerHTML = '';
    
    products.forEach(product => {
  const originalPrice = formatPrice(product.price);
  const salePrice = formatPrice(product.on_sale_price || product.price);

  // CÁLCULO AUTOMÁTICO DEL PORCENTAJE
  const original = parseFloat(product.price);
  const sale = parseFloat(product.on_sale_price || product.price);
  const discountPercent = original > sale ? Math.round(((original - sale) / original) * 100) : 0;

  const imageUrl = getPrimaryImageUrl(product);

  const productCard = `
    <div class="shadow-xl rounded-2xl p-4 text-center border-2 border-transparent transform hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
         style="background-color: var(--color-cinna); border-color: var(--color-cinna);">
      
      <!-- ETIQUETA DE DESCUENTO (SIEMPRE VISIBLE SI HAY OFERTA) -->
      ${discountPercent > 0 ? `
      <span class="absolute top-3 right-3 text-white text-sm font-extrabold px-3 py-1 rounded-full shadow-md z-10"
            style="background-color: #e63946;">
        -${discountPercent}% OFF
      </span>` : ''}

      <img src="${imageUrl}" alt="${product.name}" class="w-full h-48 object-cover rounded-xl mb-4 opacity-95 transition-opacity duration-300 hover:opacity-100">
      
      <h3 class="text-xl font-semibold mb-1 line-clamp-1" style="color: var(--color-casi-blanco);">${product.name}</h3>
      <p class="text-sm mb-2 line-clamp-2" style="color: var(--color-casi-blanco); opacity: 0.8;">${product.description || ''}</p>
      
      <div class="mb-4">
          <span class="text-sm line-through mr-2" style="color: var(--color-gris-crema);">${originalPrice}</span>
          <span class="font-extrabold text-2xl" style="color: var(--color-casi-blanco);">${salePrice}</span>
      </div>

      <button class="add-to-cart-btn w-full px-4 py-2 rounded-xl transition duration-200 font-medium"
              data-id="${product.id}"
              style="background-color: var(--color-fondo); color: var(--color-cinna);"
              onmouseover="this.style.backgroundColor='var(--color-gris-crema)';"
              onmouseout="this.style.backgroundColor='var(--color-fondo)';">
        ¡Añadir al Carrito!
      </button>
    </div>
  `;
  offersList.insertAdjacentHTML('beforeend', productCard);
});

    // Adjuntar listeners de eventos a los botones de "Añadir al Carrito"
    offersList.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            const productData = products.find(p => p.id === id);

            if (productData) {
                const variationData = {
                      aroma: productData.aroma?.[0] || 'N/A',
                      colorCera: productData.color_cera?.[0] || 'N/A',
                      colorCemento: productData.color_Cemento?.[0] || 'N/A'
                    };
                
                const cartItemId = `${productData.id}-${variationData.colorCera.replace(/ /g, '')}-${variationData.colorCemento.replace(/ /g, '')}-${variationData.aroma.replace(/ /g, '')}-OFERTA`;

                Cart.addToCart({ 
                    id: cartItemId,
                    productId: productData.id,
                    name: productData.name,
                    price: productData.on_sale_price || productData.price, 
                    on_sale: productData.on_sale,
                    on_sale_price: productData.on_sale_price,
                    image: getPrimaryImageUrl(productData), 
                    quantity: 1,
                    variation: variationData
                });
                
                console.log(`Producto ${productData.name} añadido al carrito con precio de oferta.`);

                // Feedback visual de adición al carrito con colores definidos
                e.currentTarget.textContent = '¡Añadido!';
                e.currentTarget.style.backgroundColor = 'var(--color-gris-crema)';
                e.currentTarget.style.color = 'var(--color-cinna)';
                
                setTimeout(() => {
                    e.currentTarget.textContent = '¡Añadir al Carrito!';
                    e.currentTarget.style.backgroundColor = 'var(--color-fondo)';
                    e.currentTarget.style.color = 'var(--color-cinna)';
                }, 1000);
            }
        });
    });


  } catch (error) {
    console.error('🔥 Error al cargar ofertas:', error);
    offersList.innerHTML = `<p class="col-span-full text-center text-red-600 py-10">Error al cargar las ofertas. Por favor, revisa la conexión a Firebase y la colección 'products'.</p>`;
  }
}
