#!/usr/bin/env python3
"""
Generador de cotización PDF para Glowie — versión ReportLab.
Uso: python3 script/generar_cotizacion_rl.py
Salida: cotizacion_glowie_COT-2026-001.pdf
"""

from pathlib import Path
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer,
    Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus.flowables import Image

# ── Rutas ──────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
LOGO_PATH = str(BASE_DIR / "public" / "img" / "logo_glowie2.png")
OUTPUT_PATH = str(BASE_DIR / "cotizacion_glowie_COT-2026-001.pdf")

# ── Paleta ─────────────────────────────────────────────────────────────────
DARK   = colors.HexColor("#1C1410")
GOLD   = colors.HexColor("#C8A96A")
CREAM  = colors.HexColor("#FAF7F2")
BEIGE  = colors.HexColor("#F0EBE2")
TAN    = colors.HexColor("#DDD4C3")
SAND   = colors.HexColor("#8A7355")
MOCHA  = colors.HexColor("#6B5C44")
INK    = colors.HexColor("#2A2017")
LIGHT  = colors.HexColor("#B5A58A")

PAGE_W, PAGE_H = A4          # 595.27 x 841.89 pt

MARGIN_L = 44 * mm
MARGIN_R = 44 * mm
MARGIN_T = 0  # header is drawn via onPage
MARGIN_B = 0  # footer is drawn via onPage

HEADER_H = 90   # pt  (gold bar 4 + header block + divider line)
FOOTER_H = 70   # pt  (footer block + gold bar 4)

# ── Estilos de texto ───────────────────────────────────────────────────────
def style(name, font="Helvetica", size=9, leading=13, color=INK,
          align=TA_LEFT, spaceBefore=0, spaceAfter=0, bold=False):
    return ParagraphStyle(
        name,
        fontName=("Helvetica-Bold" if bold else font),
        fontSize=size,
        leading=leading,
        textColor=color,
        alignment=align,
        spaceBefore=spaceBefore,
        spaceAfter=spaceAfter,
    )

S_label   = style("label",   size=7,  color=SAND,  leading=10)
S_name    = style("name",    size=14, color=DARK,   leading=18, bold=True)
S_body    = style("body",    size=9,  color=INK,    leading=14)
S_note    = style("note",    size=8,  color=MOCHA,  leading=12)
S_italic  = style("italic",  size=8,  color=SAND,   leading=12, font="Helvetica-Oblique")
S_section = style("section", size=7,  color=SAND,   leading=10)
S_th      = style("th",      size=7,  color=SAND,   leading=10, bold=True)
S_th_r    = style("th_r",    size=7,  color=SAND,   leading=10, bold=True, align=TA_RIGHT)
S_td      = style("td",      size=9,  color=INK,    leading=13)
S_td_r    = style("td_r",    size=9,  color=INK,    leading=13, align=TA_RIGHT)
S_td_bold = style("td_bold", size=10, color=DARK,   leading=14, bold=True)
S_total_l = style("tl",      size=8,  color=MOCHA,  leading=13)
S_total_r = style("tr",      size=11, color=DARK,   leading=15, bold=True, align=TA_RIGHT)
S_pct     = style("pct",     size=18, color=DARK,   leading=22, bold=True)
S_pct_l   = style("pct_l",   size=7,  color=SAND,   leading=10)
S_amt     = style("amt",     size=10, color=DARK,   leading=14, bold=True)
S_when    = style("when",    size=8,  color=MOCHA,  leading=12)
S_mi_l    = style("mil",     size=7,  color=SAND,   leading=10)
S_mi_v    = style("miv",     size=10, color=DARK,   leading=14, bold=True)
S_close   = style("close",   size=8.5,color=colors.HexColor("#4A3D2A"), leading=13)
S_footer_l= style("fl",      size=8,  color=LIGHT,  leading=13)
S_footer_r= style("fr",      size=7,  color=SAND,   leading=12, align=TA_RIGHT)

# ── onPage: header + footer dibujados con canvas ───────────────────────────
def draw_page(c: canvas.Canvas, doc):
    w, h = PAGE_W, PAGE_H

    # ─ Gold bar top ─
    c.setFillColor(GOLD)
    c.rect(0, h - 4, w, 4, fill=1, stroke=0)

    # ─ Header background ─
    header_top = h - 4
    header_h   = 86
    c.setFillColor(DARK)
    c.rect(0, header_top - header_h, w, header_h, fill=1, stroke=0)

    # ─ Logo (inverted via image; logo2 tiene fondo transparente, sobre oscuro luce bien con inversión)
    # WeasyPrint no está disponible → usamos PIL si hace falta, pero probamos directo
    # reportlab no aplica CSS filter, necesitamos una imagen blanca.
    # Estrategia: dibujar logo con blend color usando setFillColor + mask (workaround)
    # Alternativa simple: dibujar rectángulo blanco y aplicar mask=auto
    logo_h = 42
    logo_w = logo_h * 3.8  # aprox aspect ratio del logo
    logo_x = MARGIN_L
    logo_y = header_top - header_h + (header_h - logo_h) / 2
    # Dibujamos el logo con fondo blanco recortado vía mask; como el logo tiene canal alpha
    # reportlab respeta el canal alpha transparente — el fondo oscuro se verá a través.
    # Pero los trazos son negros → invisibles. Necesitamos la versión blanca.
    # Solución: crear versión blanca on-the-fly con Pillow.
    _draw_white_logo(c, LOGO_PATH, logo_x, logo_y, logo_w, logo_h)

    # ─ Texto derecho del header ─
    right_x = w - MARGIN_R
    label_y  = header_top - 26
    c.setFont("Helvetica", 7)
    c.setFillColor(GOLD)
    c.drawRightString(right_x, label_y, "COTIZACIÓN")

    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(CREAM)
    c.drawRightString(right_x, label_y - 20, "COT-2026-001")

    c.setFont("Helvetica", 8)
    c.setFillColor(LIGHT)
    c.drawRightString(right_x, label_y - 36, "15 de abril de 2026  ·  Cali, Colombia")

    # ─ Línea dorada bajo header ─
    divider_y = header_top - header_h
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.5)
    c.line(0, divider_y, w, divider_y)

    # ─ Footer background ─
    footer_h = 58
    c.setFillColor(DARK)
    c.rect(0, 0, w, footer_h, fill=1, stroke=0)

    # ─ Gold bar bottom ─
    c.setFillColor(GOLD)
    c.rect(0, footer_h, w, 4, fill=1, stroke=0)

    # ─ Footer texto izquierdo ─
    fy = footer_h - 18
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(CREAM)
    c.drawString(MARGIN_L, fy, "Glowie — Velas Artesanales")
    c.setFont("Helvetica", 8)
    c.setFillColor(LIGHT)
    c.drawString(MARGIN_L, fy - 13, "Cali, Valle del Cauca, Colombia")
    c.drawString(MARGIN_L, fy - 25, "WhatsApp / Tel: +57 315 626 5846")

    # ─ Footer texto derecho ─
    c.setFont("Helvetica", 7.5)
    c.setFillColor(GOLD)
    c.drawRightString(w - MARGIN_R, fy, "velasglowie.com")
    c.setFillColor(SAND)
    c.drawRightString(w - MARGIN_R, fy - 13, "COT-2026-001  ·  15 Abr 2026")


def _draw_white_logo(c, logo_path, x, y, w, h):
    """Dibuja el logo invertido a blanco usando Pillow para pre-procesar."""
    import tempfile, os
    try:
        from PIL import Image as PILImage
        img = PILImage.open(logo_path).convert("RGBA")
        r, g, b, a = img.split()
        # Invertir RGB para pasar negro → blanco, preservar alpha
        import PIL.ImageOps
        rgb = PILImage.merge("RGB", (r, g, b))
        rgb_inv = PIL.ImageOps.invert(rgb)
        result = PILImage.merge("RGBA", (*rgb_inv.split(), a))
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        result.save(tmp.name)
        tmp.close()
        c.drawImage(tmp.name, x, y, width=w, height=h, mask="auto")
        os.unlink(tmp.name)
    except ImportError:
        # Sin Pillow: dibujar logo normal (negro, se verá mal en fondo oscuro)
        c.drawImage(logo_path, x, y, width=w, height=h, mask="auto")


# ── Construcción del documento ─────────────────────────────────────────────
def build():
    content_top    = PAGE_H - 4 - 86 - 1  # bajo gold + header + divider
    content_bottom = 58 + 4                # sobre footer + gold
    frame_h = content_top - content_bottom

    frame = Frame(
        MARGIN_L, content_bottom,
        PAGE_W - MARGIN_L - MARGIN_R, frame_h,
        leftPadding=0, rightPadding=0,
        topPadding=20, bottomPadding=12
    )
    tpl = PageTemplate(id="main", frames=[frame], onPage=draw_page)
    doc = BaseDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        pageTemplates=[tpl],
        title="Cotización Glowie COT-2026-001",
        author="Glowie Velas Artesanales",
    )

    story = []
    cw = PAGE_W - MARGIN_L - MARGIN_R  # ancho útil en puntos

    # ─ Destinatario ─────────────────────────────────────────────────────────
    story.append(Paragraph("DIRIGIDA A", S_label))
    story.append(Spacer(1, 5))
    story.append(Paragraph("Alejandra Tinoco", S_name))
    story.append(Spacer(1, 3))
    story.append(Paragraph("Cali, Valle del Cauca", S_note))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Estimada Alejandra, con gusto le presentamos la siguiente cotización para su pedido "
        "de velas artesanales Glowie. Quedamos atentos a su confirmación.",
        S_body
    ))

    # ─ Divisor ──────────────────────────────────────────────────────────────
    story.append(Spacer(1, 18))
    story.append(HRFlowable(width="100%", thickness=0.5, color=TAN))
    story.append(Spacer(1, 16))

    # ─ Tabla de productos ───────────────────────────────────────────────────
    story.append(Paragraph("DETALLE DEL PEDIDO", S_section))
    story.append(Spacer(1, 10))

    col_w = [cw * 0.44, cw * 0.14, cw * 0.21, cw * 0.21]

    hdr = [
        Paragraph("Producto",        S_th),
        Paragraph("Cant.",           S_th_r),
        Paragraph("Precio unit.",    S_th_r),
        Paragraph("Subtotal",        S_th_r),
    ]
    row1_desc = [
        [
            Paragraph("Vela artesanal en recipiente de vidrio con tapa de corcho", S_td_bold),
            Spacer(1, 4),
            Paragraph("Fabricación artesanal  ·  Domicilio incluido al lugar de entrega", S_note),
            Spacer(1, 3),
            Paragraph("Aroma y empaque pendientes por confirmar", S_italic),
        ],
        Paragraph("110",            S_td_r),
        Paragraph("$ 14.745",       S_td_r),
        Paragraph("$ 1.621.950",    S_td_r),
    ]

    tbl = Table([hdr, row1_desc], colWidths=col_w, repeatRows=1)
    tbl.setStyle(TableStyle([
        # Cabecera
        ("LINEBELOW",     (0,0), (-1,0),  1,    GOLD),
        ("BOTTOMPADDING", (0,0), (-1,0),  7),
        ("TOPPADDING",    (0,0), (-1,0),  0),
        # Filas
        ("LINEBELOW",     (0,1), (-1,-1), 0.5,  TAN),
        ("TOPPADDING",    (0,1), (-1,-1), 12),
        ("BOTTOMPADDING", (0,1), (-1,-1), 12),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 6))

    # ─ Total ────────────────────────────────────────────────────────────────
    total_tbl = Table(
        [[Paragraph("Total", S_total_l), Paragraph("$ 1.621.991 COP", S_total_r)]],
        colWidths=[cw * 0.5, cw * 0.5]
    )
    total_tbl.setStyle(TableStyle([
        ("LINEABOVE",     (0,0), (-1,0),  1,    GOLD),
        ("TOPPADDING",    (0,0), (-1,0),  9),
        ("BOTTOMPADDING", (0,0), (-1,0),  9),
        ("VALIGN",        (0,0), (-1,0),  "MIDDLE"),
    ]))
    story.append(total_tbl)

    # ─ Divisor ──────────────────────────────────────────────────────────────
    story.append(Spacer(1, 18))
    story.append(HRFlowable(width="100%", thickness=0.5, color=TAN))
    story.append(Spacer(1, 16))

    # ─ Condiciones de pago ──────────────────────────────────────────────────
    story.append(Paragraph("CONDICIONES DE PAGO", S_section))
    story.append(Spacer(1, 12))

    pay_col = (cw - 20) / 2
    pay_data = [[
        # Cuota 1
        Table([
            [Paragraph("60%",                          S_pct)],
            [Paragraph("ABONO PARA INICIAR",           S_pct_l)],
            [Spacer(1, 4)],
            [Paragraph("$ 973.195 COP",                S_amt)],
            [Paragraph("Al confirmar el pedido, para dar inicio a la fabricación.", S_when)],
        ], colWidths=[pay_col], style=TableStyle([
            ("LEFTPADDING",  (0,0), (-1,-1), 12),
            ("RIGHTPADDING", (0,0), (-1,-1), 0),
            ("TOPPADDING",   (0,0), (-1,-1), 2),
            ("BOTTOMPADDING",(0,0), (-1,-1), 2),
            ("LINEBEFORE",   (0,0), (0,-1),  2,  GOLD),
        ])),
        # Cuota 2
        Table([
            [Paragraph("40%",                          S_pct)],
            [Paragraph("SALDO A LA ENTREGA",           S_pct_l)],
            [Spacer(1, 4)],
            [Paragraph("$ 648.796 COP",                S_amt)],
            [Paragraph("Se cancela el día en que se entrega la totalidad del pedido.", S_when)],
        ], colWidths=[pay_col], style=TableStyle([
            ("LEFTPADDING",  (0,0), (-1,-1), 12),
            ("RIGHTPADDING", (0,0), (-1,-1), 0),
            ("TOPPADDING",   (0,0), (-1,-1), 2),
            ("BOTTOMPADDING",(0,0), (-1,-1), 2),
            ("LINEBEFORE",   (0,0), (0,-1),  2,  GOLD),
        ])),
    ]]
    pay_tbl = Table(pay_data, colWidths=[pay_col + 10, pay_col + 10])
    pay_tbl.setStyle(TableStyle([
        ("VALIGN",  (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING",  (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
    ]))
    story.append(pay_tbl)

    # ─ Meta: entrega y vigencia ──────────────────────────────────────────────
    story.append(Spacer(1, 20))
    meta_col = cw / 3
    meta_data = [[
        [Paragraph("FECHA DE ENTREGA", S_mi_l), Spacer(1,4),
         Paragraph("28 de abril de 2026",       S_mi_v)],
        [Paragraph("VIGENCIA",          S_mi_l), Spacer(1,4),
         Paragraph("Hasta el 17 de abril de 2026", S_mi_v)],
        [Paragraph("CIUDAD DE ENTREGA", S_mi_l), Spacer(1,4),
         Paragraph("Cali, Valle del Cauca",     S_mi_v)],
    ]]
    meta_tbl = Table(meta_data, colWidths=[meta_col, meta_col, meta_col])
    meta_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,-1), BEIGE),
        ("TOPPADDING",   (0,0), (-1,-1), 12),
        ("BOTTOMPADDING",(0,0), (-1,-1), 12),
        ("LEFTPADDING",  (0,0), (-1,-1), 16),
        ("RIGHTPADDING", (0,0), (-1,-1), 16),
        ("VALIGN",       (0,0), (-1,-1), "TOP"),
    ]))
    story.append(meta_tbl)

    # ─ Nota de cierre ────────────────────────────────────────────────────────
    story.append(Spacer(1, 20))
    nota_data = [[
        "",
        Paragraph(
            "Esta cotización tiene carácter informativo y está sujeta a disponibilidad de "
            "materiales. El aroma y el diseño del empaque deberán confirmarse antes de iniciar "
            "la fabricación. Una vez recibido el abono del 60%, se inicia el proceso productivo "
            "y se coordina la entrega.",
            S_close
        )
    ]]
    nota_tbl = Table(nota_data, colWidths=[6, cw - 6])
    nota_tbl.setStyle(TableStyle([
        ("LINEBEFORE",   (0,0), (0,-1), 1.5, TAN),
        ("LEFTPADDING",  (1,0), (1,-1), 12),
        ("LEFTPADDING",  (0,0), (0,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("TOPPADDING",   (0,0), (-1,-1), 0),
        ("BOTTOMPADDING",(0,0), (-1,-1), 0),
        ("VALIGN",       (0,0), (-1,-1), "TOP"),
    ]))
    story.append(nota_tbl)

    doc.build(story)
    print(f"PDF generado: {OUTPUT_PATH}")


if __name__ == "__main__":
    # Verificar Pillow
    try:
        import PIL
    except ImportError:
        import subprocess, sys
        print("Instalando Pillow...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])

    build()
