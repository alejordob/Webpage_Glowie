import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    onSnapshot,
    setDoc,
    doc,
    addDoc,
    getDocs,
    getDoc,
    deleteDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- CONFIGURACIÓN CONOCIDA DE GLOWIE-D4D12 (FALLBACK) ---
const KNOWN_GOOD_CONFIG = {
    apiKey: "AIzaSyAbMPf5vC9NUvSxdFxF4kKc5m2Stkr9z54",
    authDomain: "glowie-d4d12.firebaseapp.com",
    projectId: "glowie-d4d12",
    storageBucket: "glowie-d4d12.firebasestorage.app",
    messagingSenderId: "13333722495",
    appId: "1:13333722495:web:dcb6d3aa0cc96df4b9964a",
    measurementId: "G-6MBT6S8V1Y"
};

// Importante: Usar las variables globales proporcionadas por el entorno
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- LÓGICA PARA CARGAR LA CONFIGURACIÓN ---
let firebaseConfig = KNOWN_GOOD_CONFIG; 
const firebaseConfigString = typeof __firebase_config !== 'undefined' && __firebase_config ? __firebase_config : '{}';

try {
    const envConfig = JSON.parse(firebaseConfigString);
    if (envConfig && envConfig.projectId && envConfig.apiKey) {
        firebaseConfig = envConfig;
    }
} catch (e) {
    // Ignorar errores de parseo
}

// Inicialización de Firebase.
let app = null;
let db = null;
let auth = null;
let currentUserId = null;

// Promesa que se resuelve cuando la autenticación y la inicialización han terminado.
let authInitializationPromise;

// -----------------------------------------
// 1. INICIALIZACIÓN Y AUTENTICACIÓN
// -----------------------------------------

/**
 * Inicializa la aplicación, la base de datos y la autenticación.
 */
function setupFirebase() {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("✅ DEBUG: Firebase inicializado con éxito.");
    } catch (e) {
        console.error("Error crítico al inicializar Firebase:", e);
        currentUserId = crypto.randomUUID();
        return;
    }
    
    authInitializationPromise = new Promise(async (resolve) => {
        try {
            await setPersistence(auth, browserLocalPersistence).catch(() => {}); // Ignorar error de persistencia

            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (!user) {
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(auth, initialAuthToken);
                        } else {
                            await signInAnonymously(auth);
                        }
                    } catch (error) {
                        console.warn("Auth error during sign-in:", error.message);
                    }
                }
                
                currentUserId = auth.currentUser?.uid || crypto.randomUUID();
                unsubscribe(); // Detenemos el listener
                resolve(true); // Resolvemos la promesa: Firebase está listo.
            });

        } catch (e) {
            currentUserId = crypto.randomUUID();
            resolve(true); // Asegurar que la promesa se resuelve incluso si hay un error
        }
    });
}

// Llama a la función de configuración inmediatamente
setupFirebase();

/**
 * Devuelve una promesa que se resuelve cuando Firebase está listo para consultas.
 * @returns {Promise<boolean>} Promesa que se resuelve a true cuando el sistema está listo.
 */
export function isFirebaseReady() {
    return authInitializationPromise || Promise.resolve(false);
}

/**
 * Devuelve el ID del usuario actual.
 * @returns {string} El UID del usuario o un ID anónimo/aleatorio.
 */
export function getCurrentUserId() {
    return currentUserId;
}

// -----------------------------------------
// 2. UTILIDADES DE DATOS Y FORMATO
// -----------------------------------------

export function formatPrice(amount) {
    if (typeof amount !== 'number') return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

export function getPrimaryImageUrl(product) {
    const imageUrl = product.images?.[0] || 'https://placehold.co/192x192/f0f0f0/666666?text=Sin+Imagen';
    return imageUrl;
}

// -----------------------------------------
// 3. FUNCIONES DE LECTURA DE PRODUCTOS Y RUTAS
// -----------------------------------------

export function getPublicCollectionPath(collectionName) {
    return `artifacts/${appId}/public/data/${collectionName}`;
}

export function getUserCollectionPath(collectionName) {
    const userId = getCurrentUserId();
    return `artifacts/${appId}/users/${userId}/${collectionName}`;
}

/**
 * Escucha los productos marcados como Novedad (isNew: true) en tiempo real.
 * @param {string} collectionName - El nombre de la colección principal ('products').
 * @param {function(Array<Object>): void} callback - Función para manejar los datos recibidos.
 * @param {function(Error): void} errorCallback - Función para manejar errores.
 * @returns {function(): void} Función para desuscribirse del listener.
 */
export function fetchNovelties(collectionName, callback, errorCallback) {
    if (!db) {
        if (errorCallback) errorCallback(new Error("Firebase Database is not initialized."));
        return () => {};
    }

    const productsCollectionRef = collection(db, getPublicCollectionPath(collectionName));
    const q = query(productsCollectionRef, where('isNew', '==', true));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        try {
            const products = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Asegurarse de que isNew sea booleano
                if (typeof data.isNew === 'boolean' && data.isNew) {
                    products.push({ id: doc.id, ...data });
                }
            });
            callback(products); // Llama al callback con los productos filtrados
            console.log(`✅ DEBUG: Productos filtrados por isNew: ${products.length}`);
        } catch (e) {
            if (errorCallback) errorCallback(e);
        }
    }, (error) => {
        if (errorCallback) errorCallback(error);
    });

    return unsubscribe;
}

export function fetchAllProducts(collectionName, callback) {
    if (!db) {
        return () => {};
    }

    const productsCollectionRef = collection(db, getPublicCollectionPath(collectionName));
    const q = query(productsCollectionRef);
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        callback(products);
    }, (error) => {
        // Los errores de Firestore se ignoran en la consola.
    });

    return unsubscribe;
}

export { 
    app, 
    db, 
    auth, 
    collection, 
    query, 
    where, 
    onSnapshot,
    getDocs, 
    getDoc, 
    doc,
    setDoc,
    addDoc,
    deleteDoc,
    serverTimestamp
};