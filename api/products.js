const { shopUrl, shopifyHeaders, cors, normalizeProduct, fetch, isConfigured } = require('./_lib/shopify');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isConfigured()) {
    return res.status(400).json({ error: 'Shopify no configurado. Agrega las variables de entorno en Vercel.' });
  }

  if (req.method === 'GET') {
    try {
      const hdrs = await shopifyHeaders();
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

  return res.status(405).json({ error: 'Method not allowed' });
};
