const { shopUrl, shopifyHeaders, cors, normalizeProduct, fetch, isConfigured } = require('./_lib/shopify');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isConfigured()) {
    return res.status(400).json({ error: 'Shopify no configurado. Agrega las variables de entorno en Vercel.' });
  }

  const hdrs = await shopifyHeaders();

  // ── GET: List all products with pagination ──
  if (req.method === 'GET') {
    try {
      let all = [];
      let url = shopUrl('products.json?limit=250&status=active');

      while (url) {
        const r = await fetch(url, { headers: hdrs });

        if (!r.ok) {
          const err = await r.text();
          return res.status(r.status).json({ error: `Shopify: ${r.status}`, details: err });
        }

        const data = await r.json();
        all = all.concat(data.products || []);

        url = null;
        const link = r.headers.get('link');
        if (link) {
          const next = link.match(/<([^>]+)>;\s*rel="next"/);
          if (next) url = next[1];
        }
      }

      return res.json({ products: all.map(normalizeProduct), total: all.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST: Create new product in Shopify ──
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { title, vendor, product_type, tags, sku, price, compare_at_price, metafields } = body;

      const payload = {
        product: {
          title,
          vendor: vendor || '',
          product_type: product_type || '',
          tags: tags || '',
          status: 'active',
          variants: [{
            sku: sku || '',
            price: price || '0.00',
            compare_at_price: compare_at_price || null,
            inventory_management: 'shopify',
          }],
        }
      };

      // Add metafields if provided
      if (metafields && Object.keys(metafields).length > 0) {
        payload.product.metafields = Object.entries(metafields).map(([key, value]) => ({
          namespace: 'comza',
          key,
          value: String(value),
          type: 'single_line_text_field',
        }));
      }

      const r = await fetch(shopUrl('products.json'), {
        method: 'POST', headers: hdrs, body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const err = await r.json();
        return res.status(r.status).json({ error: err.errors || 'Error al crear producto' });
      }

      const data = await r.json();
      return res.json({ product: normalizeProduct(data.product) });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
