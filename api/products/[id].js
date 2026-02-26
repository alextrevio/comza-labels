const { shopUrl, shopifyHeaders, cors, normalizeProduct, fetch, isConfigured } = require('../_lib/shopify');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isConfigured()) {
    return res.status(400).json({ error: 'Shopify no configurado' });
  }

  const { id } = req.query;
  const hdrs = await shopifyHeaders();

  if (req.method === 'GET') {
    try {
      const r = await fetch(shopUrl(`products/${id}.json`), { headers: hdrs });
      if (!r.ok) return res.status(r.status).json({ error: 'Producto no encontrado' });
      const data = await r.json();
      return res.json({ product: normalizeProduct(data.product) });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { title, vendor, product_type, tags, variants } = body;

      const payload = {
        product: { id: parseInt(id), title, vendor, product_type, tags }
      };

      if (variants && variants.length > 0) {
        payload.product.variants = variants.map(v => ({
          id: v.id, sku: v.sku, price: v.price, compare_at_price: v.compare_at_price,
        }));
      }

      const r = await fetch(shopUrl(`products/${id}.json`), {
        method: 'PUT', headers: hdrs, body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const err = await r.json();
        return res.status(r.status).json({ error: err.errors || 'Error al actualizar' });
      }

      const data = await r.json();
      return res.json({ product: normalizeProduct(data.product) });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
