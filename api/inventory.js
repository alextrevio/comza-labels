const { shopUrl, shopifyHeaders, cors, fetch, isConfigured } = require('./_lib/shopify');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isConfigured()) {
    return res.status(400).json({ error: 'Shopify no configurado' });
  }

  try {
    const hdrs = await shopifyHeaders();
    const r = await fetch(
      shopUrl('products.json?limit=250&fields=id,title,variants'),
      { headers: hdrs }
    );

    if (!r.ok) return res.status(r.status).json({ error: 'Error al obtener inventario' });

    const data = await r.json();
    const items = (data.products || []).map(p => {
      const v = p.variants?.[0] || {};
      return {
        product_id: p.id,
        title: p.title,
        sku: v.sku || '',
        inventory_quantity: v.inventory_quantity || 0,
        price: v.price || '0.00',
      };
    });

    const totalUnits = items.reduce((a, i) => a + i.inventory_quantity, 0);
    const totalValue = items.reduce((a, i) => a + (i.inventory_quantity * parseFloat(i.price)), 0);

    res.json({
      items,
      summary: {
        total_products: items.length,
        total_units: totalUnits,
        total_value: totalValue,
        with_sku: items.filter(i => i.sku).length,
        without_sku: items.filter(i => !i.sku).length,
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
