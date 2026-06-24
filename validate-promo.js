// api/validate-promo.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { promoCode, total } = req.body;
  if (!promoCode) return res.status(400).json({ error: 'Code manquant' });

  const promoCodes = {};
  if (process.env.PROMO_CODES) {
    for (const entry of process.env.PROMO_CODES.split(',')) {
      const [code, discount] = entry.trim().split('=');
      if (code && discount) promoCodes[code.toUpperCase()] = parseFloat(discount);
    }
  }

  const code = promoCode.trim().toUpperCase();
  if (promoCodes[code] === undefined)
    return res.status(400).json({ error: 'Code promo invalide' });

  const discountFraction = promoCodes[code];

  // Si le total est fourni, on calcule le montant exact au centime côté serveur
  const discountAmount = typeof total === 'number'
    ? Math.round(total * discountFraction * 10) / 10
    : null;

  return res.status(200).json({
    valid: true,
    code,
    discountPercent: discountFraction,          // ex. 0.2
    discountPercentDisplay: Math.round(discountFraction * 100), // ex. 20
    ...(discountAmount !== null && { discountAmount }), // montant précis au centime
  });
}
