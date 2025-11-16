/**
 * SCRIPT DE CARGA MASIVA PARA FIRESTORE
 * * PRE-REQUISITOS:
 * 1. Asegúrate de tener Node.js instalado.
 * 2. Instala el SDK de Firebase Admin: npm install firebase-admin
 * 3. Descarga tu clave de cuenta de servicio (Service Account Key) 
 * desde la Consola de Firebase (Configuración del proyecto > Cuentas de servicio > Generar nueva clave privada).
 * Guarda este archivo JSON con el nombre 'serviceAccountKey.json' en la misma carpeta que este script.
 * 4. Asegúrate de que el archivo 'cargarProductos.json' esté en la misma carpeta.
 */

const admin = require('firebase-admin');
// Carga la clave privada para autenticar el script
const serviceAccount = require('./serviceAccountKey.json');
// Carga el array de productos
const products = require('./cargarProductos.json');

// 1. Inicializar la app de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const collectionName = 'products'; // La colección donde se guardarán los productos

console.log('Iniciando carga masiva de productos en Firestore...');

async function uploadProducts() {
  let batch = db.batch(); // Usamos un batch para cargas rápidas
  let commitCounter = 0;
  let totalUploaded = 0;

  for (const product of products) {
    if (!product.id) {
      console.error('Error: Producto sin ID. Saltando:', product);
      continue;
    }

    // Define la referencia del documento usando el 'id' del producto para control
    const docRef = db.collection(collectionName).doc(product.id); 
    
    // Usamos set() para subir el documento. Esto es útil si lo ejecutas varias veces.
    batch.set(docRef, product);

    commitCounter++;
    totalUploaded++;

    // El límite de operaciones por batch es de 500
    if (commitCounter >= 499) {
      console.log(`... Realizando commit de lote (batch) ...`);
      await batch.commit();
      batch = db.batch(); // Iniciar un nuevo batch
      commitCounter = 0;
    }
  }

  // Hacer commit de los elementos restantes
  if (commitCounter > 0) {
    await batch.commit();
  }

  console.log(`\n¡Carga masiva completada exitosamente!`);
  console.log(`Se importaron ${totalUploaded} productos a la colección '${collectionName}'.`);
}

uploadProducts().catch(error => {
  console.error('\n¡Ocurrió un error durante la importación!', error);
  process.exit(1);
});
