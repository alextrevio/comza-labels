# COMZA — Gestor de Etiquetas Shopify

Sistema para conectar tu tienda Shopify, ver/editar productos e imprimir etiquetas de precio.  
**Optimizado para deploy en Vercel.**

---

## 📁 Estructura

```
comza-vercel/
├── api/
│   ├── _lib/
│   │   └── shopify.js        # Helper compartido (fetch, auth, normalize)
│   ├── products/
│   │   └── [id].js           # GET/PUT /api/products/:id
│   ├── health.js             # GET /api/health
│   ├── products.js           # GET /api/products (lista todos)
│   └── inventory.js          # GET /api/inventory
├── public/
│   └── index.html            # Frontend SPA completo
├── vercel.json               # Configuración de rutas Vercel
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Deploy en Vercel — Paso a Paso

### Paso 1: Obtén tu Access Token de Shopify

1. Abre **Shopify Admin** → **Settings** → **Apps and sales channels**
2. Click **"Develop apps"** → **"Create an app"**
3. Nombre: `COMZA Labels`
4. Ve a **Configuration** → **Admin API access scopes** y activa:
   - ✅ `read_products`
   - ✅ `write_products`
   - ✅ `read_inventory`
5. Click **"Install app"**
6. Copia el **Admin API access token** (empieza con `shpat_`)

### Paso 2: Sube a GitHub

```bash
cd comza-vercel
git init
git add .
git commit -m "COMZA labels app"
git remote add origin https://github.com/TU_USUARIO/comza-labels.git
git push -u origin main
```

### Paso 3: Deploy en Vercel

1. Ve a [vercel.com](https://vercel.com) y logueate con GitHub
2. Click **"Add New Project"**
3. Importa tu repo `comza-labels`
4. En **Environment Variables** agrega:

   | Variable | Valor |
   |----------|-------|
   | `SHOPIFY_STORE_DOMAIN` | `tu-tienda` (sin .myshopify.com) |
   | `SHOPIFY_ACCESS_TOKEN` | `shpat_xxxxxxxxxxxxx` |
   | `COMPANY_NAME` | `COMZA` |

5. Click **"Deploy"**

### Paso 4: ¡Listo!

Tu app estará en `https://comza-labels.vercel.app` (o el nombre que elijas).

---

## 🔧 Desarrollo Local

```bash
# Instala Vercel CLI
npm i -g vercel

# Configura variables de entorno
cp .env.example .env
# Edita .env con tus datos reales

# Corre localmente (simula serverless)
vercel dev
```

---

## 🔗 API Endpoints

| Método | Ruta | Qué hace |
|--------|------|----------|
| `GET` | `/api/health` | Estado de la conexión |
| `GET` | `/api/products` | Lista todos los productos (paginado automático) |
| `GET` | `/api/products/:id` | Detalle de un producto |
| `PUT` | `/api/products/:id` | Actualizar producto en Shopify |
| `GET` | `/api/inventory` | Resumen de inventario completo |

---

## ✨ Features

- **Auto-conexión** → Al abrir la app verifica el backend automáticamente
- **Productos** → Grid visual con imagen, SKU, precio, stock
- **Búsqueda** → Filtra por nombre, SKU, tipo o marca
- **Editar** → Panel lateral, sincroniza cambios con Shopify al instante
- **Etiquetas** → Formato profesional idéntico a tu formato COMZA
- **Promociones** → Toggle para precios promocionales
- **Imprimir** → Ctrl+P directo al navegador
- **Descargar PNG** → Exporta etiqueta en alta resolución (3x)
- **Demo** → Prueba sin Shopify conectado

---

## ⚠️ Notas

- Las serverless functions de Vercel tienen timeout de 10s (plan free) o 60s (Pro)
- Si tienes +250 productos, la paginación funciona automáticamente
- Los cambios en variables de entorno requieren re-deploy
- El token de Shopify nunca se expone al frontend (todo pasa por el backend)

---

COMZA © 2025
