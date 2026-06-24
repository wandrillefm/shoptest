const { DESIGNS, TYPES, COLORS, SIZES, getProductPrice } = require('../catalogue.js');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { items, promoCode } = req.body;

  // Format : "TRASCO=0.2,SCOUT10=0.1"  (fraction, 0.2 = 20%)
  const promoCodes = {};
  if (process.env.PROMO_CODES) {
    for (const entry of process.env.PROMO_CODES.split(',')) {
      const [code, discount] = entry.trim().split('=');
      if (code && discount) promoCodes[code.toUpperCase()] = parseFloat(discount);
    }
  }

  let discountPercent = 0;
  let appliedPromo    = null;

  if (promoCode) {
    const code = promoCode.trim().toUpperCase();
    if (promoCodes[code] !== undefined) {
      discountPercent = promoCodes[code];
      appliedPromo    = code;
    } else {
      return res.status(400).json({ error: 'Code promo invalide' });
    }
  }

  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Panier vide' });

  for (const item of items) {
    const design = DESIGNS.find(d => d.id === item.design);
    if (!design)                              return res.status(400).json({ error: 'Design invalide' });
    if (!design.types.includes(item.type))   return res.status(400).json({ error: 'Type non disponible pour ce design' });
    if (!design.colors.includes(item.color)) return res.status(400).json({ error: 'Couleur non disponible pour ce design' });
    if (!SIZES.includes(item.size))          return res.status(400).json({ error: 'Taille invalide' });
    
    const envPrice = process.env[`PRICE_${item.type.toUpperCase()}`];
    const initialPrice = envPrice ? parseFloat(envPrice) : getProductPrice(design.key, item.type);
    
    const expectedPrice = Math.round(initialPrice * (1 - discountPercent) * 10) / 10;
    if (item.price !== expectedPrice)
      
      return res.status(400).json({ error: `Prix invalide pour ${item.type} (attendu: ${expectedPrice}€)` });
  }

  const typeLabels   = Object.fromEntries(TYPES.map(t => [t.id, t.label]));
  const designLabels = Object.fromEntries(DESIGNS.map(d => [d.id, d.label]));

  // Grouper les articles identiques
  const grouped = {};
  for (const item of items) {
    const key = `${item.type}-${item.size}-${item.color}-${item.design}`;
    if (!grouped[key]) grouped[key] = { ...item, qty: 0 };
    grouped[key].qty++;
  }

  const promoLabel = appliedPromo ? ` [${appliedPromo} −${Math.round(discountPercent * 100)}%]` : '';
  const lineItemsParams = {};
  Object.values(grouped).forEach((item, i) => {
    const name = `${typeLabels[item.type]} — ${designLabels[item.design]}`;
    const desc = `Couleur: ${item.color} | Taille: ${item.size}${promoLabel}`;
    lineItemsParams[`line_items[${i}][price_data][currency]`]                  = 'eur';
    lineItemsParams[`line_items[${i}][price_data][product_data][name]`]        = name;
    lineItemsParams[`line_items[${i}][price_data][product_data][description]`] = desc;
    lineItemsParams[`line_items[${i}][price_data][unit_amount]`]               = String(Math.round(item.price * 100));
    lineItemsParams[`line_items[${i}][quantity]`]                              = String(item.qty);
  });

  let session;
  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        ...lineItemsParams,
        'payment_method_types[]': 'card',
        'mode': 'payment',
        'success_url': `${process.env.BASE_URL}/success.html`,
        'cancel_url': `${process.env.BASE_URL}/`,
        'shipping_address_collection[allowed_countries][]': 'FR',
        'phone_number_collection[enabled]': 'true',
      }).toString()
    });
    if (!stripeRes.ok) {
      const errData = await stripeRes.json();
      console.error('Stripe error:', errData);
      return res.status(500).json({ error: errData.error?.message || 'Erreur Stripe' });
    }
    session = await stripeRes.json();
  } catch (err) {
    console.error('Stripe fetch error:', err);
    return res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }

  try {
    const totalFull     = items.reduce((s, i) => s + Math.round(i.price / (1 - discountPercent)), 0);
    const totalFacturé  = items.reduce((s, i) => s + i.price, 0);
    const supabaseRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/commandes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        stripe_session_id:   session.id,
        articles: items.map(i => ({
          type:    i.type,
          taille:  i.size,
          couleur: i.color,
          design:  designLabels[i.design],
          prix:    i.price,
        })),
        total:               totalFacturé,
        nb_articles:         items.length,
        statut:              'en_attente',
        code_promo:          appliedPromo ?? null,
        remise_pourcentage:  discountPercent > 0 ? discountPercent : null,
      })
    });
    if (!supabaseRes.ok) console.error('Supabase error:', await supabaseRes.text());
  } catch (err) {
    console.error('Supabase fetch error:', err);
  }

  return res.status(200).json({
    url: session.url,
    promoApplied: appliedPromo ? { code: appliedPromo, discountPercent } : null
  });
}
