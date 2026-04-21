#!/usr/bin/env python3
"""
Generador de cotización PDF para Glowie.
Uso: python3 script/generar_cotizacion.py
Salida: cotizacion_glowie_COT-2026-001.pdf
"""

import base64
import io
import os
import sys

# WeasyPrint requiere libpango — configurar ruta Homebrew antes del import
os.environ.setdefault("DYLD_LIBRARY_PATH", "/opt/homebrew/lib")

from pathlib import Path
from weasyprint import HTML

# Instalar Pillow si no está
try:
    from PIL import Image as PILImage, ImageOps
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])
    from PIL import Image as PILImage, ImageOps

# ---------------------------------------------------------------------------
# Rutas
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent.parent
LOGO_PATH = BASE_DIR / "public" / "img" / "logo_glowie.png"
OUTPUT_PATH = BASE_DIR / "cotizacion_glowie_COT-2026-001.pdf"

# Pre-procesar logo: invertir RGB para obtener versión blanca sobre fondo oscuro
def make_white_logo_b64(path: Path) -> str:
    img = PILImage.open(path).convert("RGBA")
    r, g, b, a = img.split()
    rgb_inv = ImageOps.invert(PILImage.merge("RGB", (r, g, b)))
    result = PILImage.merge("RGBA", (*rgb_inv.split(), a))
    buf = io.BytesIO()
    result.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

logo_src = f"data:image/png;base64,{make_white_logo_b64(LOGO_PATH)}"

# ---------------------------------------------------------------------------
# HTML / CSS
# ---------------------------------------------------------------------------
HTML_CONTENT = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  /* ── Reset ── */
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

  /* ── Página A4 ── */
  @page {{
    size: A4;
    margin: 0;
  }}

  /* ── Raíz ── */
  html, body {{
    width: 210mm;
    font-family: Helvetica, Arial, sans-serif;
    font-size: 10pt;
    color: #2A2017;
    background: #FAF7F2;
  }}

  /* ── Acento dorado top ── */
  .accent-top {{
    height: 4px;
    background: #C8A96A;
  }}

  /* ── Header ── */
  .header {{
    background: #1C1410;
    padding: 28px 44px 24px 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }}
  .header img {{
    height: 64px;
  }}
  .header-right {{
    text-align: right;
  }}
  .header-right .doc-type {{
    font-size: 9pt;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #C8A96A;
    margin-bottom: 4px;
  }}
  .header-right .doc-ref {{
    font-size: 16pt;
    font-weight: 700;
    color: #FAF7F2;
    letter-spacing: 0.04em;
  }}
  .header-right .doc-date {{
    font-size: 8.5pt;
    color: #B5A58A;
    margin-top: 5px;
  }}

  /* ── Separador dorado sub-header ── */
  .accent-sub {{
    height: 1px;
    background: #C8A96A;
    opacity: 0.5;
  }}

  /* ── Cuerpo ── */
  .body {{
    padding: 36px 44px 32px 44px;
    background: #FAF7F2;
  }}

  /* ── Saludo / destinatario ── */
  .recipient-block {{
    margin-bottom: 28px;
  }}
  .recipient-block .label {{
    font-size: 7.5pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #8A7355;
    margin-bottom: 6px;
  }}
  .recipient-block .name {{
    font-size: 14pt;
    font-weight: 700;
    color: #1C1410;
  }}
  .recipient-block .city {{
    font-size: 9pt;
    color: #6B5C44;
    margin-top: 2px;
  }}
  .recipient-block .greeting {{
    font-size: 9.5pt;
    color: #2A2017;
    margin-top: 14px;
    line-height: 1.6;
    max-width: 480px;
  }}

  /* ── Línea divisora sutil ── */
  .divider {{
    border: none;
    border-top: 1px solid #DDD4C3;
    margin: 24px 0;
  }}

  /* ── Sección label ── */
  .section-label {{
    font-size: 7pt;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #8A7355;
    margin-bottom: 12px;
  }}

  /* ── Tabla de productos ── */
  .products-table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6px;
  }}
  .products-table thead tr {{
    border-bottom: 1.5px solid #C8A96A;
  }}
  .products-table thead th {{
    font-size: 7.5pt;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #8A7355;
    padding: 0 0 8px 0;
    font-weight: 600;
    text-align: left;
  }}
  .products-table thead th.right {{
    text-align: right;
  }}
  .products-table tbody td {{
    padding: 14px 0 12px 0;
    vertical-align: top;
    border-bottom: 1px solid #E8E0D4;
    font-size: 9.5pt;
    color: #2A2017;
  }}
  .products-table tbody td.right {{
    text-align: right;
  }}
  .product-name {{
    font-weight: 600;
    font-size: 10pt;
    color: #1C1410;
    margin-bottom: 3px;
  }}
  .product-detail {{
    font-size: 8.5pt;
    color: #6B5C44;
    line-height: 1.5;
  }}
  .product-note {{
    font-size: 8pt;
    color: #9A8B72;
    font-style: italic;
    margin-top: 4px;
  }}

  /* ── Totales ── */
  .totals-block {{
    margin-top: 6px;
    display: flex;
    justify-content: flex-end;
  }}
  .totals-inner {{
    width: 260px;
  }}
  .total-row {{
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 9.5pt;
    border-bottom: 1px solid #E8E0D4;
    color: #2A2017;
  }}
  .total-row:last-child {{
    border-bottom: none;
  }}
  .total-row.grand {{
    border-top: 1.5px solid #C8A96A;
    border-bottom: none;
    margin-top: 4px;
    padding-top: 10px;
    font-size: 11pt;
    font-weight: 700;
    color: #1C1410;
  }}
  .total-row .t-label {{
    color: #6B5C44;
    font-size: 8.5pt;
  }}
  .total-row.grand .t-label {{
    color: #1C1410;
    font-size: 11pt;
    font-weight: 700;
  }}

  /* ── Condiciones de pago ── */
  .payment-section {{
    margin-top: 30px;
  }}
  .payment-grid {{
    display: flex;
    gap: 24px;
    margin-top: 12px;
  }}
  .payment-card {{
    flex: 1;
    border-left: 2px solid #C8A96A;
    padding-left: 14px;
  }}
  .payment-card .pct {{
    font-size: 18pt;
    font-weight: 700;
    color: #1C1410;
    line-height: 1;
  }}
  .payment-card .pct-label {{
    font-size: 8pt;
    color: #8A7355;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 3px;
    margin-bottom: 6px;
  }}
  .payment-card .amount {{
    font-size: 10.5pt;
    font-weight: 700;
    color: #1C1410;
  }}
  .payment-card .when {{
    font-size: 8.5pt;
    color: #6B5C44;
    margin-top: 4px;
    line-height: 1.5;
  }}

  /* ── Vigencia / Entrega ── */
  .meta-grid {{
    display: flex;
    gap: 40px;
    margin-top: 28px;
    padding: 18px 20px;
    background: #F0EBE2;
    border-radius: 2px;
  }}
  .meta-item .mi-label {{
    font-size: 7pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #8A7355;
    margin-bottom: 5px;
  }}
  .meta-item .mi-value {{
    font-size: 10pt;
    font-weight: 600;
    color: #1C1410;
  }}

  /* ── Nota final ── */
  .closing-note {{
    margin-top: 28px;
    font-size: 9pt;
    color: #4A3D2A;
    line-height: 1.7;
    border-left: 2px solid #E8E0D4;
    padding-left: 14px;
    max-width: 520px;
  }}

  /* ── Footer ── */
  .footer {{
    background: #1C1410;
    padding: 22px 44px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 36px;
  }}
  .footer-left {{
    font-size: 8.5pt;
    color: #B5A58A;
    line-height: 1.7;
  }}
  .footer-left strong {{
    color: #FAF7F2;
    font-size: 9pt;
  }}
  .footer-right {{
    text-align: right;
    font-size: 8pt;
    color: #8A7355;
    line-height: 1.7;
  }}
  .footer-right a {{
    color: #C8A96A;
    text-decoration: none;
  }}

  /* ── Acento dorado bottom ── */
  .accent-bottom {{
    height: 4px;
    background: #C8A96A;
  }}
</style>
</head>
<body>

<!-- Línea dorada superior -->
<div class="accent-top"></div>

<!-- Header oscuro con logo -->
<div class="header">
  <img src="{logo_src}" alt="Glowie">
  <div class="header-right">
    <div class="doc-type">Cotización</div>
    <div class="doc-ref">COT-2026-001</div>
    <div class="doc-date">15 de abril de 2026 &nbsp;·&nbsp; Cali, Colombia</div>
  </div>
</div>
<div class="accent-sub"></div>

<!-- Cuerpo del documento -->
<div class="body">

  <!-- Destinatario -->
  <div class="recipient-block">
    <div class="label">Dirigida a</div>
    <div class="name">Alejandra Tinoco</div>
    <div class="city">Cali, Valle del Cauca</div>
    <div class="greeting">
      Estimada Alejandra, con gusto le presentamos la siguiente cotización para su pedido de
      velas artesanales Glowie. Quedamos atentos a su confirmación.
    </div>
  </div>

  <hr class="divider">

  <!-- Tabla de productos -->
  <div class="section-label">Detalle del pedido</div>
  <table class="products-table">
    <thead>
      <tr>
        <th style="width:44%">Producto</th>
        <th class="right" style="width:14%">Cant.</th>
        <th class="right" style="width:21%">Precio unit.</th>
        <th class="right" style="width:21%">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="product-name">Vela artesanal en recipiente de vidrio con tapa de corcho</div>
          <div class="product-detail">Fabricación artesanal &nbsp;·&nbsp; Domicilio incluido al lugar de entrega</div>
          <div class="product-note">Aroma y empaque pendientes por confirmar</div>
        </td>
        <td class="right">110</td>
        <td class="right">$ 14.745</td>
        <td class="right">$ 1.621.950</td>
      </tr>
    </tbody>
  </table>

  <!-- Totales -->
  <div class="totals-block">
    <div class="totals-inner">
      <div class="total-row grand">
        <span class="t-label">Total</span>
        <span>$ 1.621.950 COP</span>
      </div>
    </div>
  </div>

  <hr class="divider">

  <!-- Condiciones de pago -->
  <div class="payment-section">
    <div class="section-label">Condiciones de pago</div>
    <div class="payment-grid">
      <div class="payment-card">
        <div class="pct">60%</div>
        <div class="pct-label">Abono para iniciar</div>
        <div class="amount">$ 973.170 COP</div>
        <div class="when">Al confirmar el pedido, para dar inicio a la fabricación.</div>
      </div>
      <div class="payment-card">
        <div class="pct">40%</div>
        <div class="pct-label">Saldo a la entrega</div>
        <div class="amount">$ 648.780 COP</div>
        <div class="when">Se cancela para la entrega de la totalidad del pedido.</div>
      </div>
    </div>
  </div>

  <!-- Meta: entrega y vigencia -->
  <div class="meta-grid">
    <div class="meta-item">
      <div class="mi-label">Fecha de entrega estimada</div>
      <div class="mi-value">28 de abril de 2026</div>
    </div>
    <div class="meta-item">
      <div class="mi-label">Vigencia de la cotización</div>
      <div class="mi-value">Hasta el 17 de abril de 2026</div>
    </div>
    <div class="meta-item">
      <div class="mi-label">Ciudad de entrega</div>
      <div class="mi-value">Cali, Valle del Cauca</div>
    </div>
  </div>

  <!-- Nota de cierre -->
  <div class="closing-note">
    Esta cotización tiene carácter informativo y está sujeta a disponibilidad de materiales.
    El aroma y el diseño del empaque deberán confirmarse antes de iniciar la fabricación.
    Una vez recibido el abono del 60%, se inicia el proceso productivo y se coordina la entrega.
  </div>

</div><!-- /body -->

<!-- Footer oscuro -->
<div class="footer">
  <div class="footer-left">
    <strong>Glowie — Velas Artesanales</strong><br>
    Cali, Valle del Cauca, Colombia<br>
    WhatsApp / Tel: +57 315 626 5846
  </div>
  <div class="footer-right">
    velasglowie.com<br>
    COT-2026-001 &nbsp;·&nbsp; 15 Abr 2026
  </div>
</div>

<!-- Línea dorada inferior -->
<div class="accent-bottom"></div>

</body>
</html>
"""

# ---------------------------------------------------------------------------
# Generar PDF
# ---------------------------------------------------------------------------
print("Generando PDF...")
HTML(string=HTML_CONTENT).write_pdf(str(OUTPUT_PATH))
print(f"PDF generado: {OUTPUT_PATH}")
