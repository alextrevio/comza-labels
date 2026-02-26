const fetch = require('node-fetch');

// ─── Config ─────────────────────────────────────────────
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const LEGACY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN; // backwards compat
const COMPANY = process.env.COMPANY_NAME || 'COMZA';
const API_VER = '2024-01';

// ─── Token Cache (auto-refresh) ─────────────────────────
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Get a valid access token.
 * - New flow (Dev Dashboard): uses client_credentials grant, auto-refreshes every 24h
 * - Legacy flow: uses static SHOPIFY_ACCESS_TOKEN if set
 */
async function getAccessToken() {
  if (LEGACY_TOKEN) return LEGACY_TOKEN;

  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 300000) return cachedToken;

  if (!CLIENT_ID || !CLIENT_SECRET || !DOMAIN) {
    throw new Error('Configura SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET y SHOPIFY_STORE_DOMAIN');
  }

  const resp = await fetch(`https://${DOMAIN}.myshopify.com/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString(),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('Token error:', resp.status, err);
    throw new Error(`Error obteniendo token: ${resp.status}`);
  }

  const data = await resp.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in * 1000);
  console.log(`✓ Token OK, expira en ${Math.round(data.expires_in / 3600)}h`);
  return cachedToken;
}

function shopUrl(endpoint) {
  return `https://${DOMAIN}.myshopify.com/admin/api/${API_VER}/${endpoint}`;
}

async function shopifyHeaders() {
  const token = await getAccessToken();
  return { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function normalizeProduct(p) {
  const v = p.variants?.[0] || {};
  return {
    id: p.id,
    title: p.title,
    body_html: p.body_html || '',
    vendor: p.vendor || '',
    product_type: p.product_type || '',
    tags: p.tags || '',
    sku: v.sku || '',
    price: v.price || '0.00',
    compare_at_price: v.compare_at_price || null,
    inventory_quantity: v.inventory_quantity || 0,
    image: p.image?.src || p.images?.[0]?.src || null,
    variant_id: v.id,
    status: p.status || 'active',
    updated_at: p.updated_at,
  };
}

function isConfigured() {
  return !!(DOMAIN && (LEGACY_TOKEN || (CLIENT_ID && CLIENT_SECRET)));
}

module.exports = {
  DOMAIN, CLIENT_ID, CLIENT_SECRET, LEGACY_TOKEN, COMPANY,
  getAccessToken, shopUrl, shopifyHeaders, cors, normalizeProduct, fetch,
  isConfigured,
};
