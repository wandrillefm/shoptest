/* ═══════════════════════════════════════════
   TRADISCOUT — script.js
   Dépend de catalogue.js (chargé avant)
   ═══════════════════════════════════════════ */

'use strict';

/* ── ÉTAT GLOBAL ─────────────────────────── */
let cart        = [];
let promoState  = { code: null, discountPercent: 0, validated: false };

// État de la page produit courante
const pdp = {
  design: null,   // objet DESIGN
  type:   null,   // string typeId
  color:  null,   // string colorId
  size:   null,   // string 'S'|'M'|'L'|'XL'
  photoIndex: 0
};

/* ────────────────────────────────────────────
   ROUTER  —  boutique.tradiscout.com/slug
              ou boutique.tradiscout.com/
   ─────────────────────────────────────────── */

function router() {
  const path    = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
  const design  = DESIGNS.find(d => d.key === path);

  if (design) {
    showProductPage(design);
  } else {
    showCataloguePage();
  }
}

function navigate(url) {
  history.pushState({}, '', url);
  router();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

window.addEventListener('popstate', router);

/* ────────────────────────────────────────────
   PAGE CATALOGUE
   ─────────────────────────────────────────── */

let activeCollection = COLLECTIONS[0].id;

function showCataloguePage() {
  document.getElementById('view-catalogue').style.display = 'block';
  document.getElementById('view-product').style.display  = 'none';
  renderTabs();
  renderGrid();
}

function renderTabs() {
  document.getElementById('collectionTabs').innerHTML = COLLECTIONS.map(c => `
    <button class="col-tab ${c.id === activeCollection ? 'active' : ''}"
            onclick="switchCollection('${c.id}')">${c.label}</button>
  `).join('');
}

function switchCollection(id) {
  activeCollection = id;
  renderTabs();
  renderGrid();
}

/* Carte produit compacte */
function renderGrid() {
  const grid     = document.getElementById('grid');
  const filtered = DESIGNS.filter(d => d.collection === activeCollection);

  grid.innerHTML = filtered.map(d => {
    const minPrice = Math.min(...d.types.map(typeId => getProductPrice(d.key, typeId)));

    // Labels des types disponibles : "T-Shirt · Sweat · Hoodie"
    const typeLabels = d.types
      .map(tid => TYPES.find(t => t.id === tid)?.label)
      .filter(Boolean)
      .join(' · ');

    // Pastilles couleurs (sans texte)
    const colorDots = d.colors.map(cid => {
      const c = COLORS.find(x => x.id === cid);
      return `<span class="color-dot dot-${cid}" title="${c ? c.label : cid}"></span>`;
    }).join('');

    return `
      <a class="grid-card" href="/${d.key}" onclick="event.preventDefault();navigate('/${d.key}')">
        <div class="grid-card-img-wrap">
          <img src="images/${d.images[0]}" alt="${d.label}" onerror="this.style.opacity='0'" loading="lazy" />
        </div>
        <div class="grid-card-info">
          <div class="grid-card-name">${d.label}</div>
          <div class="grid-card-types">${typeLabels}</div>
          <div class="grid-card-colors">${colorDots}</div>
          <div class="grid-card-price">À partir de ${minPrice.toFixed(2).replace('.',',')} €</div>
        </div>
      </a>
    `;
  }).join('');
}

/* ────────────────────────────────────────────
   PAGE PRODUIT
   ─────────────────────────────────────────── */

// Descriptions enrichies par design
const DESCRIPTIONS = {
  'st-michel': {
    intro: 'Saint Michel Archange, chef des armées célestes et patron des parachutistes, veille sur ceux qui portent l'uniforme. Ce design, imprimé en sérigraphie au dos, est une déclaration d'appartenance.',
    matiere: 'T-Shirt en 100% coton bio ringspun, 180g/m². Sweat et Hoodie en molleton lourd 300g, 80% coton / 20% polyester.',
    coupe: 'Coupe regular sur le T-Shirt, légèrement oversize sur les sweats pour un tombé naturel en milieu scout.',
    fabrication: 'Conçu en Savoie, fabriqué dans un atelier pyrénéen certifié. Impression sérigraphique haute résistance aux lavages.',
    taille: 'Taille normalement. Si vous hésitez, prenez votre taille habituelle. Pour un effet oversize assumé, montez d'une taille.'
  },
  'st-jean-marie-vianney': {
    intro: 'Curé d'Ars et saint patron des prêtres, Jean-Marie Vianney incarne la persévérance dans la vocation. Un hommage sobre et puissant, porté dos.',
    matiere: 'T-Shirt en 100% coton bio ringspun, 180g/m². Sweat et Hoodie en molleton lourd 300g, 80% coton / 20% polyester.',
    coupe: 'Coupe regular sur le T-Shirt, légèrement oversize sur les sweats.',
    fabrication: 'Conçu en Savoie, fabriqué dans un atelier pyrénéen certifié. Impression sérigraphique haute résistance.',
    taille: 'Taille normalement. Pour un effet oversize, montez d'une taille.'
  },
  'st-george': {
    intro: 'Saint Georges terrassant le dragon : le symbole universel du courage contre le mal. Patron des éclaireurs, porté dans le dos pour rappeler à quoi l'on croit.',
    matiere: 'T-Shirt en 100% coton bio ringspun, 180g/m². Sweat et Hoodie en molleton lourd 300g, 80% coton / 20% polyester.',
    coupe: 'Coupe regular sur le T-Shirt, légèrement oversize sur les sweats.',
    fabrication: 'Conçu en Savoie, fabriqué dans un atelier pyrénéen certifié. Impression sérigraphique haute résistance.',
    taille: 'Taille normalement. Pour un effet oversize, montez d'une taille.'
  },
  'lys': {
    intro: 'Cinq lys d'or sur fond marine : symbole de royauté et de pureté, hérité de la tradition royale française. Un design intemporel pour ceux qui portent leurs valeurs avec élégance.',
    matiere: 'T-Shirt en 100% coton peigné, 240g/m². Sweat Premium en molleton 350g, 100% coton bio.',
    coupe: 'Coupe oversize. Les pièces Premium sont taillées généreusement — prenez votre taille habituelle ou descendez d'une taille pour un rendu plus ajusté.',
    fabrication: 'Collection Premium. Broderie haute densité, réalisée sur place en France.',
    taille: 'Coupe oversize : si vous hésitez entre deux tailles, prenez la petite.'
  },
  'rose': {
    intro: 'La Rose Mystique, attribut de la Vierge Marie dans la litanie de Lorette. Un motif délicat et chargé de sens, brodé avec soin sur les pièces de la collection Premium.',
    matiere: 'T-Shirt en 100% coton peigné, 240g/m². Sweat Premium en molleton 350g, 100% coton bio.',
    coupe: 'Coupe oversize. Les pièces Premium sont taillées généreusement.',
    fabrication: 'Collection Premium. Broderie haute densité, réalisée en France.',
    taille: 'Coupe oversize : si vous hésitez entre deux tailles, prenez la petite.'
  },
  'corsacrum': {
    intro: '"In te confido" — J'ai confiance en toi. Le Sacré-Cœur de Jésus, tel qu'il apparut à sainte Marguerite-Marie, porté comme une bannière sur la poitrine.',
    matiere: 'T-Shirt en 100% coton peigné, 240g/m². Sweat Premium en molleton 350g, 100% coton bio.',
    coupe: 'Coupe oversize. Les pièces Premium sont taillées généreusement.',
    fabrication: 'Collection Premium. Broderie haute densité, réalisée en France.',
    taille: 'Coupe oversize : si vous hésitez entre deux tailles, prenez la petite.'
  },
  'sacrecoeur': {
    intro: '"J'ai confiance en vous." Le Sacré-Cœur rayonnant, symbole de l'amour infini du Christ. Disponible uniquement en T-Shirt, pour rester proche du cœur.',
    matiere: 'T-Shirt en 100% coton peigné, 240g/m².',
    coupe: 'Coupe oversize.',
    fabrication: 'Collection Premium. Broderie haute densité, réalisée en France.',
    taille: 'Coupe oversize : si vous hésitez entre deux tailles, prenez la petite.'
  }
};

// Specs par collection
function getSpecs(design) {
  const isPremium = design.collection === 'premium';
  return isPremium
    ? [
        { label:'Grammage',   value: '240–350g/m²' },
        { label:'Matière',    value: '100% coton bio' },
        { label:'Coupe',      value: 'Oversize' },
        { label:'Impression', value: 'Broderie' }
      ]
    : [
        { label:'Grammage',   value: '180–300g/m²' },
        { label:'Matière',    value: '80% coton bio' },
        { label:'Coupe',      value: 'Regular / Oversize' },
        { label:'Impression', value: 'Sérigraphie' }
      ];
}

function showProductPage(design) {
  document.getElementById('view-catalogue').style.display = 'none';
  document.getElementById('view-product').style.display  = 'block';

  // Init state
  pdp.design     = design;
  pdp.type       = design.types.includes('tshirt') ? 'tshirt' : design.types[0];
  pdp.color      = design.colors.includes('blanc') ? 'blanc' : design.colors[0];
  pdp.size       = null;
  pdp.photoIndex = 0;

  // Breadcrumb
  document.getElementById('breadcrumb-label').textContent = design.label;

  renderPDP();
}

function renderPDP() {
  const d    = pdp.design;
  const desc = DESCRIPTIONS[d.key] || {};

  // Nom + prix
  const price = getProductPrice(d.key, pdp.type);
  document.getElementById('pdp-name').textContent  = d.label;
  document.getElementById('pdp-price').textContent = price ? price.toFixed(2).replace('.',',') + ' €' : '';

  // Types
  document.getElementById('pdp-types').innerHTML = TYPES
    .filter(t => d.types.includes(t.id))
    .map(t => `<button class="opt-btn ${t.id === pdp.type ? 'sel' : ''}" onclick="pdpSet('type','${t.id}')">${t.label}</button>`)
    .join('');

  // Couleurs — pastilles
  document.getElementById('pdp-colors').innerHTML = COLORS
    .filter(c => d.colors.includes(c.id))
    .map(c => `<button class="color-opt-btn dot-${c.id} ${c.id === pdp.color ? 'sel' : ''}" title="${c.label}" onclick="pdpSet('color','${c.id}')"></button>`)
    .join('');

  // Tailles
  document.getElementById('pdp-sizes').innerHTML = SIZES
    .map(s => `<button class="opt-btn ${s === pdp.size ? 'sel' : ''}" onclick="pdpSet('size','${s}')">${s}</button>`)
    .join('');

  // Bouton
  const ready = pdp.type && pdp.color && pdp.size;
  document.getElementById('pdp-add').disabled = !ready;
  document.getElementById('pdp-add-msg').textContent = ready ? '' : 'Sélectionnez tous les éléments';

  // Specs
  document.getElementById('pdp-specs').innerHTML = getSpecs(d)
    .map(s => `<div class="spec-item"><span class="spec-label">${s.label}</span><span class="spec-value">${s.value}</span></div>`)
    .join('');

  // Description
  document.getElementById('pdp-desc').innerHTML = `
    <h3>Le design</h3>
    <p>${desc.intro || d.description}</p>
    ${desc.matiere ? `<h3>Matière</h3><p>${desc.matiere}</p>` : ''}
    ${desc.coupe   ? `<h3>Coupe</h3><p>${desc.coupe}</p>` : ''}
    ${desc.fabrication ? `<h3>Fabrication</h3><p>${desc.fabrication}</p>` : ''}
    ${desc.taille  ? `<h3>Conseils de taille</h3><p>${desc.taille}</p>` : ''}
  `;

  // Galerie
  renderGallery();
}

function pdpSet(cat, val) {
  pdp[cat] = val;
  renderPDP();
}

/* Galerie principale */
function renderGallery() {
  const d = pdp.design;

  // Image principale
  const mainImg = document.getElementById('pdp-main-img');
  mainImg.style.opacity = '0';
  setTimeout(() => {
    mainImg.src = 'images/' + d.images[pdp.photoIndex];
    mainImg.alt = d.label;
    mainImg.style.opacity = '1';
  }, 100);

  // Flèches nav
  const multi = d.images.length > 1;
  document.getElementById('gal-prev').style.display = multi ? 'block' : 'none';
  document.getElementById('gal-next').style.display = multi ? 'block' : 'none';

  // Miniatures
  const thumbs = document.getElementById('pdp-thumbs');
  thumbs.style.display = multi ? 'flex' : 'none';
  if (multi) {
    thumbs.innerHTML = d.images.map((img, i) => `
      <img class="product-thumb ${i === pdp.photoIndex ? 'active' : ''}"
           src="images/${img}" alt="${d.label} ${i+1}"
           onclick="galGoTo(${i})" loading="lazy" />
    `).join('');
  }
}

function galNav(dir) {
  const d = pdp.design;
  pdp.photoIndex = (pdp.photoIndex + dir + d.images.length) % d.images.length;
  renderGallery();
}

function galGoTo(i) {
  pdp.photoIndex = i;
  renderGallery();
}

/* ── PANIER ──────────────────────────────── */

function addToCartPDP() {
  const d = pdp.design;
  const t = TYPES.find(x => x.id === pdp.type);
  const c = COLORS.find(x => x.id === pdp.color);
  const price = getProductPrice(d.key, pdp.type);

  if (!pdp.type || !pdp.color || !pdp.size) return;

  cart.push({
    id: Date.now(),
    design:      d.id,
    designKey:   d.key,
    type:        pdp.type,
    color:       pdp.color,
    size:        pdp.size,
    typeLabel:   t.label,
    designLabel: d.label,
    colorLabel:  c.label,
    price:       price
  });

  renderCart();
  openCart();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

function renderCart() {
  const container   = document.getElementById('cartItems');
  const pct         = promoState.discountPercent || 0;
  const totalOrig   = cart.reduce((s, i) => s + i.price, 0);
  const discountAmt = pct > 0 ? Math.round(totalOrig * pct * 10) / 10 : 0;
  const totalFinal  = Math.round((totalOrig - discountAmt) * 10) / 10;

  // Compteurs
  [document.getElementById('cartCountDesktop'),
   document.getElementById('cartCountMobile')]
    .forEach(el => { if (el) el.textContent = cart.length; });

  // Ligne promo
  const discountRow = document.getElementById('cartDiscountRow');
  if (pct > 0 && cart.length > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('cartDiscountLabel').textContent = `${promoState.code} (−${Math.round(pct * 100)}%)`;
    document.getElementById('cartDiscountAmt').textContent   = `−${discountAmt.toFixed(1)} €`;
    document.getElementById('cartTotal').textContent         = totalFinal.toFixed(1) + ' €';
  } else {
    discountRow.style.display = 'none';
    document.getElementById('cartTotal').textContent = totalOrig.toFixed(1) + ' €';
  }

  if (!cart.length) {
    container.innerHTML = '<p style="font-size:.72rem;color:var(--gris)">Panier vide</p>';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item-row">
      <button class="cart-item-remove" onclick="removeItem(${item.id})">✕</button>
      <div class="cart-item-info">
        <div style="display:flex;justify-content:space-between;font-size:.75rem;">
          <b>${item.typeLabel}</b><span>${item.price} €</span>
        </div>
        <div style="font-size:.6rem;color:gray;margin-top:3px">
          ${item.designLabel} · ${item.size} · ${item.colorLabel}
        </div>
      </div>
    </div>
  `).join('');
}

function openCart()  {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartBg').style.display = 'block';
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartBg').style.display = 'none';
}

/* ── CODE PROMO ─────────────────────────── */

async function applyPromo() {
  const input = document.getElementById('promoInput');
  const msgEl = document.getElementById('promoMsg');
  const code  = input.value.trim().toUpperCase();
  if (!code) return;
  msgEl.textContent = 'Vérification...';
  try {
    const res  = await fetch('/api/validate-promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promoCode: code })
    });
    const data = await res.json();
    if (res.ok) {
      promoState.code = code;
      promoState.discountPercent = data.discountPercent;
      promoState.validated = true;
      msgEl.className   = 'promo-msg ok';
      msgEl.textContent = `✓ −${Math.round(data.discountPercent * 100)}% appliqué`;
    } else {
      promoState.discountPercent = 0;
      promoState.validated = false;
      msgEl.className   = 'promo-msg err';
      msgEl.textContent = data.error || 'Code invalide';
    }
    renderCart();
  } catch {
    msgEl.textContent = 'Erreur réseau';
  }
}

/* ── CHECKOUT ─────────────────────────── */

async function goToCheckout() {
  if (!cart.length) return;
  const btn  = document.getElementById('checkoutBtn');
  btn.innerText = 'Chargement...'; btn.disabled = true;

  const pct         = promoState.discountPercent || 0;
  const itemsToSend = cart.map(i => ({
    ...i,
    price: Math.round(i.price * (1 - pct) * 10) / 10
  }));

  try {
    const body = { items: itemsToSend };
    if (promoState.validated) body.promoCode = promoState.code;

    const res  = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Erreur lors du paiement');
      btn.innerText = 'Payer →'; btn.disabled = false;
      return;
    }
    const totalAmount = itemsToSend.reduce((s, i) => s + i.price, 0);
    sessionStorage.setItem('lastOrderTotal', totalAmount);
    window.location.href = data.url;
  } catch {
    alert('Erreur lors du paiement');
    btn.innerText = 'Payer →'; btn.disabled = false;
  }
}

/* ── LEGAL ───────────────────────────────── */

const LEGAL_PAGES = {
  livraison: {
    title: 'Livraison',
    content: `
      <h3>Délais</h3>
      <p>Les commandes sont expédiées sous 1 à 2 jours ouvrés puis livrées en moyenne sous 5 à 6 jours ouvrés.</p>
      <h3>Zones de livraison</h3>
      <p>Nous livrons en France métropolitaine, Belgique, Suisse et Luxembourg. Pour les autres pays, contactez-nous à tradiscout@gmail.com.</p>
      <h3>Suivi</h3>
      <p>Un email de suivi vous sera envoyé dès l'expédition de votre commande.</p>
    `
  },
  retours: {
    title: 'Retours',
    content: `
      <h3>Droit de rétractation</h3>
      <p>Conformément à la loi, vous disposez d'un délai de <strong>14 jours</strong> à compter de la réception pour exercer votre droit de rétractation.</p>
      <h3>Procédure</h3>
      <p>Contactez-nous à tradiscout@gmail.com avec votre numéro de commande. Les articles doivent être retournés en parfait état, non portés et non lavés.</p>
      <h3>Remboursement</h3>
      <p>Le remboursement sera effectué sous 14 jours après réception du retour.</p>
    `
  },
  delais: {
    title: 'Délais de fabrication',
    content: `
      <h3>Impression à la commande</h3>
      <p>Tous nos produits sont fabriqués sur commande dans notre atelier pyrénéen. Cela garantit une qualité maximale et évite le gaspillage.</p>
      <h3>Délais</h3>
      <p>Comptez 3 à 5 jours ouvrés de fabrication, auxquels s'ajoutent les délais de livraison.</p>
    `
  },
  tarifs: {
    title: 'Tarifs & paiement',
    content: `
      <h3>Prix</h3>
      <p>Tous les prix sont affichés TTC en euros.</p>
      <h3>Moyens de paiement</h3>
      <p>Paiements sécurisés avec Stripe :</p>
      <ul>
        <li>Carte bancaire (Visa, Mastercard, American Express)</li>
        <li>Link, Stripe</li>
      </ul>
      <h3>TVA</h3>
      <p>La TVA est calculée en fonction de votre adresse de livraison et est toujours incluse dans le prix final.</p>
    `
  },
  cgv: {
    title: 'Conditions Générales de Vente',
    content: `
      <h3>1. Champ d'application</h3>
      <p>Les présentes CGV régissent les relations entre Tradiscout et l'acheteur.</p>
      <h3>2. Produits et tarifs</h3>
      <p>Les prix affichés sont en euros TTC.</p>
      <h3>3. Droit de rétractation</h3>
      <p>14 jours à compter de la réception.</p>
      <h3>4. Propriété intellectuelle</h3>
      <p>Tous les éléments du site sont la propriété exclusive de Tradiscout.</p>
      <h3>5. Litiges</h3>
      <p>Les présentes CGV sont régies par la loi française. En cas de litige : tradiscout@gmail.com.</p>
    `
  },
  mentions: {
    title: 'Mentions Légales',
    content: `
      <h3>Éditeur du site</h3>
      <p><strong>Tradiscout</strong><br>SIRET : Particulier<br>Forme juridique : Entreprise individuelle</p>
      <h3>Directeur de publication</h3>
      <p>Wandrille Fernex de Mongex</p>
      <h3>Coordonnées</h3>
      <p><strong>Email :</strong> tradiscout@gmail.com</p>
      <h3>Hébergement</h3>
      <p>Vercel Inc.</p>
      <h3>Droit d'auteur</h3>
      <p>© 2026 Tradiscout. Tous droits réservés.</p>
      <h3>Protection des données</h3>
      <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression. Contact : tradiscout@gmail.com.</p>
    `
  }
};

function openLegalPage(pageId) {
  const page = LEGAL_PAGES[pageId];
  if (!page) return;
  document.getElementById('legalTitle').textContent = page.title;
  document.getElementById('legalBody').innerHTML    = page.content;
  document.getElementById('legalModal').classList.add('open');
}

function closeLegalPage(event) {
  if (event && event.target !== document.getElementById('legalModal')) return;
  document.getElementById('legalModal').classList.remove('open');
}

/* ── REVIEWS ─────────────────────────────── */

const REVIEWS = [
  { stars:5, name:'Manon Cappalesso',              date:'19 mai 2026', text:'Le sweat est trop confortable, par contre j\'aurais dû prendre la taille d\'en dessous. Je recommande vivement !' },
  { stars:5, name:'Pierre Sallès - Oczachowski',   date:'19 mai 2026', text:'Les t-shirts sont de bonne qualité, tissu agréable à porter et léger ! Design fidèle à la description !' },
  { stars:5, name:'Anne Lefevre',                  date:'17 mai 2026', text:'Commande reçue rapidement, bien emballée. Les sweats sont super confortables, ma patrouille adore !' },
  { stars:5, name:'Pierre Gauthier',               date:'17 mai 2026', text:'C\'est du sérieux : qualité premium, livraison express, communication top. Je reviendrais acheter !' },
  { stars:4, name:'Thomas Renaud',                 date:'18 mai 2026', text:'Très bonne qualité. Un petit bémol sur les délais de livraison mais le produit en vaut vraiment la peine.' },
  { stars:4, name:'Caroline Petit',                date:'14 mai 2026', text:'Très satisfaite de ma commande. Les couleurs sont fidèles aux photos. Serait parfait avec plus de choix de tailles.' },
  { stars:5, name:'Marc Dubois',                   date:'14 mai 2026', text:'Pour une association de scouts, c\'est exactement ce qu\'il nous fallait. Qualité et prix imbattables !' },
  { stars:5, name:'Julien Leclerc',                date:'9 mai 2026',  text:'Les sweats Tradiscout sont mes préférés. Confort, qualité, design impeccable. Merci !' },
  { stars:5, name:'Damien Favre',                  date:'6 mai 2026',  text:'Commande impeccable ! Arrivée avant la date prévue. Les scouts de mon groupe sont ravis du résultat.' },
  { stars:5, name:'Laurent Henry',                 date:'3 mai 2026',  text:'Fantastique ! Exactement ce que je cherchais. La qualité, le design, le service, tout est top. Bravo !' }
];

function renderReviews() {
  const sum = REVIEWS.reduce((a, r) => a + r.stars, 0);
  const avg = parseFloat((sum / REVIEWS.length).toFixed(1));
  document.getElementById('avgRating').textContent    = avg;
  document.getElementById('starsFill').style.width    = (avg / 5 * 100) + '%';
}

/* ── COOKIE ──────────────────────────────── */

(function() {
  const KEY = 'tradiscout_cookie_consent';
  function dismiss() {
    const b = document.getElementById('cookie-banner');
    b.classList.add('hide');
    setTimeout(() => { b.style.display = 'none'; }, 380);
  }
  window.cookieChoice = function(accepted) {
    localStorage.setItem(KEY, accepted ? '1' : '0');
    dismiss();
  };
  document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem(KEY) === null) {
      document.getElementById('cookie-banner').style.display = 'flex';
    }
  });
})();

/* ── FAQ ─────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => btn.parentElement.classList.toggle('active'));
  });
});

/* ── INIT ─────────────────────────────────── */

window.addEventListener('DOMContentLoaded', function() {
  renderCart();
  renderReviews();
  router();
});
