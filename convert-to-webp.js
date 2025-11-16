// convert-to-webp.js
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// === CONFIGURACIÓN DE RUTAS (CORREGIDA) ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta correcta: webpage/public/img/img_firebase
const inputDir = path.join(__dirname, 'public', 'img', 'img_firebase');
const outputDir = path.join(inputDir, 'webp'); // Guardará dentro: img_firebase/webp/

// Crear carpeta de salida si no existe
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('Carpeta creada:', outputDir);
}

// === LEER TODAS LAS IMÁGENES JPG/JPEG (IGNORANDO "IMG" EN EL NOMBRE) ===
const imageFiles = fs.readdirSync(inputDir)
    .filter(file => {
        const ext = path.extname(file).toLowerCase();
        const hasIMG = file.toUpperCase().includes('IMG'); // ← NUEVA LÍNEA
        return ['.jpg', '.jpeg'].includes(ext) && !hasIMG; // ← MODIFICADO
    });

if (imageFiles.length === 0) {
    console.log('No se encontraron imágenes JPG válidas (sin "IMG" en el nombre) en:', inputDir);
    process.exit(0);
}

console.log(`Encontradas ${imageFiles.length} imágenes JPG válidas. Iniciando conversión a WebP...`);

// === FUNCIÓN DE CONVERSIÓN ===
async function convertToWebp(fileName) {
    const inputPath = path.join(inputDir, fileName);
    const baseName = path.basename(fileName, path.extname(fileName));
    const outputPath = path.join(outputDir, `${baseName}.webp`);

    try {
        const image = sharp(inputPath);
        const metadata = await image.metadata();

        let pipeline = image;

        // CORREGIR ROTACIÓN AUTOMÁTICA (EXIF)
        pipeline = pipeline.rotate(); // ← ¡ESTA LÍNEA LO ARREGLA!

        // Redimensionar solo si es más ancha de 1200px
        if (metadata.width > 1200) {
            pipeline = pipeline.resize({
                width: 1200,
                withoutEnlargement: true
            });
        }

        await pipeline
            .webp({
                quality: 80,
                effort: 6,
                lossless: false
            })
            .toFile(outputPath);

        const stats = fs.statSync(outputPath);
        const originalStats = fs.statSync(inputPath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        const originalKB = (originalStats.size / 1024).toFixed(1);
        const savings = ((1 - stats.size / originalStats.size) * 100).toFixed(1);

        console.log(`${baseName}.webp → ${sizeKB} KB (-${savings}% vs ${originalKB} KB)`);
    } catch (error) {
        console.error(`Error procesando ${fileName}:`, error.message);
    }
}
// === EJECUTAR TODAS LAS CONVERSIONES ===
const convertPromises = imageFiles.map(convertToWebp);
await Promise.all(convertPromises);

console.log('¡CONVERSIÓN COMPLETA!');
console.log(`WebP guardados en: ${outputDir}`);
console.log('Sube esta carpeta "webp" a Cloudinary y actualiza tus URLs en Firebase.');