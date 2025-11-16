/**
 * js/data.js
 * * Contiene la lista de productos y datos de la tienda.
 * En una implementación real con Firebase, estos datos se cargarían desde Firestore.
 */

export const products = [
    { id: 101, name: "Vela Cera de Soja - Vainilla", price: 28.50, description: "Un aroma cálido que evoca calma y dulzura, en envase de vidrio reciclable.", imageText: "Imagen Vainilla" },
    { id: 102, name: "Vela de Lavanda & Bergamota", price: 35.00, description: "Perfecta para la relajación nocturna y la meditación. Aceites esenciales puros.", imageText: "Imagen Lavanda" },
    { id: 103, name: "Set 3 Velas Mini - Aromas Cítricos", price: 45.00, description: "Energía pura de limón, naranja y pomelo. Ideal para escritorio o espacios pequeños.", imageText: "Imagen Cítricos" },
    { id: 104, name: "Vela Pilar de Cera de Abeja", price: 22.00, description: "Cera de abeja natural, con quema limpia y duradera. Sin aditivos.", imageText: "Imagen Abeja" },
    { id: 105, name: "Vela Edición Limitada - Sándalo", price: 42.00, description: "Aroma amaderado y profundo, ideal para crear un ambiente sofisticado.", imageText: "Imagen Sándalo" },
    { id: 106, name: "Vela Rombo", price: 18.000, description: "Aroma amaderado y profundo, ideal para crear un ambiente sofisticado.", imageText: "Imagen Sándalo" },

];

export const specialOffers = [
    { id: 201, name: "Oferta: Llévalo 2x1 en Lavanda", price: 35.00, originalPrice: 70.00, description: "Paga una Vela de Lavanda y lleva dos. ¡Aprovecha!", imageText: "Imagen Oferta 1" },
    { id: 202, name: "20% OFF en Velas de Soja", price: 22.80, originalPrice: 28.50, description: "Todas las velas de soja con un 20% de descuento por tiempo limitado.", imageText: "Imagen Oferta 2" },
];

export const newReleases = [
    { id: 301, name: "NUEVO: Vela de Coco & Sal Marina", price: 38.00, description: "Aroma fresco y veraniego, con notas de sal marina.", imageText: "Imagen Novedad 1" },
];

export const tipsContent = [
    { id: 401, title: "El Secreto para Quemar tu Vela por más Tiempo", date: "15/Sep/2024" },
    { id: 402, title: "¿Por Qué Usar Velas de Soja en Lugar de Parafina?", date: "01/Sep/2024" },
];
