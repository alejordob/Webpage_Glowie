import barcode
from barcode.writer import ImageWriter
import os

# 1. Definición de Atributos
referencias_velas = ["Flama", "Jarron", "Nudo", "Lazo", "Estrella", "Rombo", "Circo", "Parlante", "Tina"]
referencias_bases = ["Hex", "Ovalo", "Arcoiris", "Ondulada"]

colores_cemento = ["Amarillo", "Blanco", "Rojo", "Natural"]
colores_cera = ["Blanco", "Rojo", "Natural"] # Colores disponibles para la cera
aromas = ["Durazno", "Bambu", "Coco", "Cafe"]

# Carpeta de salida
output_folder = 'Codigos_Glowie_Oficial'
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

def generar_barcode(texto):
    code_class = barcode.get_barcode_class('code128')
    output_file = os.path.join(output_folder, texto)
    # Generamos el barcode (el archivo se guarda como .png automáticamente)
    my_barcode = code_class(texto, writer=ImageWriter())
    my_barcode.save(output_file)
    print(f"Generado: {texto}")

# --- REGLA 1: VELAS (Referencia_ColorCemento_ColorCera_Aroma) ---
print("Generando códigos para VELAS...")
for ref in referencias_velas:
    for ccem in colores_cemento:
        for ccer in colores_cera:
            for arom in aromas:
                # Ejemplo: Estrella_Blanco_Rojo_Durazno
                codigo = f"{ref}_{ccem}_{ccer}_{arom}"
                generar_barcode(codigo)

# --- REGLA 2: BASES (Base_Referencia_Color) ---
print("\nGenerando códigos para BASES...")
for ref in referencias_bases:
    for col in colores_cemento:
        # Ejemplo: Base_Hex_Amarillo
        codigo = f"Base_{ref}_{col}"
        generar_barcode(codigo)

# --- REGLA 3: OTROS (Referencia_Color) ---
print("\nGenerando códigos para OTROS (Floreros y Combos)...")
otros = ["Florero", "Combo"]
for ot in otros:
    for col in colores_cemento:
        # Ejemplo: Florero_Amarillo
        codigo = f"{ot}_{col}"
        generar_barcode(codigo)

print(f"\n¡Hecho! Todos los códigos están en: {os.path.abspath(output_folder)}")