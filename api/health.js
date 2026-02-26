const { DOMAIN, TOKEN, COMPANY, cors } = require('./_lib/shopify');

module.exports = (req, res) => {
  cors(res);
  res.json({
    status: 'ok',
    connected: !!(DOMAIN && TOKEN),
    store: DOMAIN ? `${DOMAIN}.myshopify.com` : null,
    company: COMPANY,
  });
};
