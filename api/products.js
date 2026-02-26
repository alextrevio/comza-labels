const { DOMAIN, TOKEN, shopUrl, headers, cors, normalizeProduct, fetch } = require('./_lib/shopify');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!DOMAIN || !TOKEN) {
    return res.status(400).json({ error: 'Shopify no configurado. Agrega las variables de entorno en Vercel.' });
  }

  // ── GET: List all products with pagination ──
  if (req.method === 'GET') {
    try {
      let all = [];
      let url = shopUrl('products.json?limit=250&status=active');

      while (url) {
        const r = await fetch(url, { headers: headers() });

        if (!r.ok) {
          const err = await r.text();
          return res.status(r.status).json({ error: `Shopify: ${r.status}`, details: err });
        }

        const data = await r.json();
        all = all.concat(data.products || []);

        // Pagination via Link header
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
