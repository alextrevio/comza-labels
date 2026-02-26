const fetch = require('node-fetch');

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VER = '2024-01';
const COMPANY = process.env.COMPANY_NAME || 'COMZA';

function shopUrl(endpoint) {
  return `https://${DOMAIN}.myshopify.com/admin/api/${API_VER}/${endpoint}`;
}

function headers() {
  return {
    'X-Shopify-Access-Token': TOKEN,
    'Content-Type': 'application/json',
  };
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

module.exports = {
  DOMAIN, TOKEN, COMPANY,
  shopUrl, headers, cors, normalizeProduct, fetch,
};
