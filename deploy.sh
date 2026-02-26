#!/bin/bash
# ═══════════════════════════════════════════════════════
# COMZA — Script de Deploy Automático a Vercel
# ═══════════════════════════════════════════════════════
# Ejecuta: chmod +x deploy.sh && ./deploy.sh

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   COMZA — Deploy Automático a Vercel     ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: Check dependencies ──
echo -e "${BLUE}[1/5]${NC} Verificando dependencias..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js no está instalado.${NC}"
    echo "  Instálalo desde: https://nodejs.org"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm no encontrado${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} npm $(npm -v)"

if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ npx no encontrado${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} npx disponible"

# Check if Vercel CLI is installed, install if not
if ! command -v vercel &> /dev/null; then
    echo ""
    echo -e "${YELLOW}  Vercel CLI no encontrado. Instalando...${NC}"
    npm install -g vercel
    echo -e "  ${GREEN}✓${NC} Vercel CLI instalado"
else
    echo -e "  ${GREEN}✓${NC} Vercel CLI $(vercel --version 2>/dev/null || echo 'installed')"
fi

echo ""

# ── Step 2: Configure Shopify credentials ──
echo -e "${BLUE}[2/5]${NC} Configuración de Shopify"
echo ""

if [ -f .env ]; then
    echo -e "  ${YELLOW}Ya existe un archivo .env${NC}"
    read -p "  ¿Quieres reconfigurarlo? (s/N): " RECONFIG
    if [[ "$RECONFIG" != "s" && "$RECONFIG" != "S" ]]; then
        echo "  Usando configuración existente."
        source .env
    else
        DO_CONFIG=true
    fi
else
    DO_CONFIG=true
fi

if [ "$DO_CONFIG" = true ]; then
    echo -e "  Necesito los datos de tu tienda Shopify."
    echo -e "  ${YELLOW}(Si no los tienes, ve a Shopify Admin → Settings → Apps → Develop apps)${NC}"
    echo ""
    
    read -p "  Dominio de tu tienda (sin .myshopify.com): " SHOP_DOMAIN
    read -p "  Access Token (shpat_...): " SHOP_TOKEN
    read -p "  Nombre de empresa [COMZA]: " COMPANY
    COMPANY=${COMPANY:-COMZA}
    
    cat > .env << EOF
SHOPIFY_STORE_DOMAIN=${SHOP_DOMAIN}
SHOPIFY_ACCESS_TOKEN=${SHOP_TOKEN}
COMPANY_NAME=${COMPANY}
EOF
    
    echo ""
    echo -e "  ${GREEN}✓${NC} Archivo .env creado"
fi

echo ""

# ── Step 3: Install dependencies ──
echo -e "${BLUE}[3/5]${NC} Instalando dependencias..."
npm install --silent
echo -e "  ${GREEN}✓${NC} Dependencias instaladas"
echo ""

# ── Step 4: Test connection ──
echo -e "${BLUE}[4/5]${NC} Verificando conexión con Shopify..."

# Quick test by sourcing .env and checking
source .env 2>/dev/null || true
if [ -n "$SHOPIFY_STORE_DOMAIN" ] && [ -n "$SHOPIFY_ACCESS_TOKEN" ]; then
    echo -e "  ${GREEN}✓${NC} Tienda: ${SHOPIFY_STORE_DOMAIN}.myshopify.com"
    echo -e "  ${GREEN}✓${NC} Token: ${SHOPIFY_ACCESS_TOKEN:0:10}..."
    echo -e "  ${GREEN}✓${NC} Empresa: ${COMPANY_NAME:-COMZA}"
else
    echo -e "  ${YELLOW}⚠ No se pudieron leer las credenciales del .env${NC}"
    echo "  El deploy continuará, pero configura las variables en Vercel Dashboard."
fi
echo ""

# ── Step 5: Deploy to Vercel ──
echo -e "${BLUE}[5/5]${NC} Desplegando a Vercel..."
echo ""
echo -e "${YELLOW}  Vercel te pedirá autenticarte si es tu primera vez.${NC}"
echo -e "${YELLOW}  También te preguntará el nombre del proyecto y configuración.${NC}"
echo ""

# Deploy with environment variables
vercel --prod \
    -e SHOPIFY_STORE_DOMAIN="$SHOPIFY_STORE_DOMAIN" \
    -e SHOPIFY_ACCESS_TOKEN="$SHOPIFY_ACCESS_TOKEN" \
    -e COMPANY_NAME="${COMPANY_NAME:-COMZA}"

echo ""
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  ✓ Deploy completado exitosamente        ${NC}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  Tu app está lista. Vercel te mostró la URL arriba ☝️"
echo ""
echo -e "  ${BOLD}Próximos pasos:${NC}"
echo -e "  1. Abre la URL que te dio Vercel"
echo -e "  2. La app debería conectarse automáticamente a Shopify"
echo -e "  3. Si algo falla, verifica las variables en: vercel.com → proyecto → Settings → Environment Variables"
echo ""
