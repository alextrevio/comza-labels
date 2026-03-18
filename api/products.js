const { shopUrl, shopifyHeaders, cors, normalizeProduct, fetch, isConfigured } = require('./_lib/shopify');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isConfigured()) {
    return res.status(400).json({ error: 'Shopify no configurado. Agrega las variables de entorno en Vercel.' });
  }

  const hdrs = await shopifyHeaders();

  // ── GET: Obtener productos y sus Metacampos de forma automática ──
  if (req.method === 'GET') {
    try {
      let all = [];
      let url = shopUrl('products.json?limit=250&status=active');

      // 1. Obtener todos los productos (Vía REST normal)
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

      // 2. Obtener los Metacampos de la sección "custom" (Vía GraphQL súper rápido)
      let metafieldsMap = {};
      let hasNext = true;
      let cursor = null;
      const gqlUrl = shopUrl('graphql.json');

      while (hasNext) {
        const query = `
          query {
            products(first: 250${cursor ? `, after: "${cursor}"` : ''}) {
              pageInfo { hasNextPage endCursor }
              edges {
                node {
                  legacyResourceId
                  voltaje: metafield(namespace: "custom", key: "voltaje") { value }
                  capacidad: metafield(namespace: "custom", key: "capacidad") { value }
                  tipo_de_gas: metafield(namespace: "custom", key: "tipo_de_gas") { value }
                }
              }
            }
          }
        `;
        
        const gr = await fetch(gqlUrl, {
          method: 'POST',
          headers: { ...hdrs, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });

        if (gr.ok) {
          const gdata = await gr.json();
          const productsNode = gdata.data?.products;
          if (productsNode) {
            productsNode.edges.forEach(edge => {
              metafieldsMap[edge.node.legacyResourceId] = {
                voltaje: edge.node.voltaje?.value || '',
                capacidad: edge.node.capacidad?.value || '',
                tipo_de_gas: edge.node.tipo_de_gas?.value || ''
              };
            });
            hasNext = productsNode.pageInfo.hasNextPage;
            cursor = productsNode.pageInfo.endCursor;
          } else {
            hasNext = false;
          }
        } else {
          hasNext = false; // Falla silenciosa si GraphQL no responde
        }
      }

      // 3. Fusionar la información antes de mandarla a la web
      const finalProducts = all.map(p => {
        const np = normalizeProduct(p);
        // Le inyectamos los metacampos que encontramos
        np.metafields = { custom: metafieldsMap[p.id] || {} };
        return np;
      });

      return res.json({ products: finalProducts, total: all.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST: Crear un nuevo producto en Shopify ──
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

      // Se guardan los metacampos técnicos y administrativos correctamente
      if (metafields && Object.keys(metafields).length > 0) {
        payload.product.metafields = [];
        for (const [key, value] of Object.entries(metafields)) {
          if (key === 'custom' && typeof value === 'object') {
            for (const [cKey, cValue] of Object.entries(value)) {
              if (cValue) {
                payload.product.metafields.push({
                  namespace: 'custom',
                  key: cKey,
                  value: String(cValue),
                  type: 'single_line_text_field',
                });
              }
            }
          } else {
            payload.product.metafields.push({
              namespace: 'comza',
              key,
              value: String(value),
              type: 'single_line_text_field',
            });
          }
        }
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
