const { DOMAIN, COMPANY, cors, isConfigured } = require('./_lib/shopify');

module.exports = (req, res) => {
  cors(res);
  res.json({
    status: 'ok',
    connected: isConfigured(),
    store: DOMAIN ? `${DOMAIN}.myshopify.com` : null,
    company: COMPANY,
  });
};
