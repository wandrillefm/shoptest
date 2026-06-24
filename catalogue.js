// ─────────────────────────────────────────────
//  CATALOGUE TRADISCOUT
//  Source de vérité unique — front + API
// ─────────────────────────────────────────────

const COLLECTIONS = [
  { id: 'premium', label: 'Premium'    },
  { id: 'scouts',  label: 'Classiques'  }
];

const TYPES = [
  { 
    id: 'tshirt', 
    label: 'T-Shirt', 
    code: '1', 
    price: { scouts: 20.25, premium: 25.2 }
  },
  { 
    id: 'sweat',  
    label: 'Sweat',  
    code: '2', 
    price: { scouts: 43.5, premium: 45.7 } 
  },
  { 
    id: 'hoodie', 
    label: 'Hoodie', 
    code: '3', 
    price: { scouts: 49.5, premium: 52.9 } 
  }
];

const COLORS = [
  { id: 'blanc', label: 'Blanc',  code: '1' },
  { id: 'bleu',  label: 'Marine', code: '2' }
];

const SIZES = ['S', 'M', 'L', 'XL'];

// ─── DESIGNS ───────────────────────────────
// Chaque produit :
//   id          → identifiant unique (string)
//   key         → slug URL-safe
//   label       → nom affiché
//   description → courte phrase affichée dans la lightbox
//   types       → sous-ensemble de TYPES disponibles
//   colors      → sous-ensemble de COLORS disponibles
//   images      → liste de noms de fichiers dans /images/
//                 (n'importe quel nom, lifestyle ou pack shot)
//   collection  → id d'une COLLECTION

const DESIGNS = [
  {
    id: '8', key: 'st-michel', label: 'St Michel',
    description: 'Saint patron des para - Dos',
    types:  ['tshirt','sweat','hoodie'],
    colors: ['blanc', 'bleu'],
    images: ['StMichelW.jpg','StMichelB.png','image 19.jpg','image20.png','image 15.jpg','image 16.png'],
    collection: 'scouts',
  },
  {
    id: '9', key: 'st-jean-marie-vianney', label: 'St Jean-Marie Vianney',
    description: 'Saint patron des prêtres - Dos',
    types:  ['tshirt','sweat','hoodie'],
    colors: ['blanc', 'bleu'],
    images: ['StVianneyW.jpg','StVianneyB.png','image 25.jpg','image 26.png','image 21.jpg','image 22.png'],
    collection: 'scouts',
  },
  {
    id: '10', key: 'st-george', label: 'St George',
    description: 'St patron des éclaireurs - Dos',
    types:  ['tshirt', 'sweat', 'hoodie'],
    colors: ['blanc', 'bleu'],
    images: ['StGeorgeW.jpg','StGeorgeB.png','image 24.jpg','image 23.png','image 18.jpg','image 17.png'],
    collection: 'scouts',
  },
  {
    id: '11', key: 'lys', label: 'Cinq Lys',
    description: 'Symbole de royauté',
    types:  ['tshirt', 'sweat'],
    colors: ['blanc', 'bleu'],
    images: ['image 79.png', 'image 80.png', 'image 83.png', 'image 81.png'],
    collection: 'premium',
  },
  {
    id: '12', key: 'rose', label: 'Rose à Marie',
    description: 'Rose mystique',
    types:  ['tshirt', 'sweat'],
    colors: ['blanc', 'bleu'],
    images: ['image 90.png', 'image 89.png', 'image 85.png', 'image 86.png'],
    collection: 'premium',
  },
  {
    id: '13', key: 'corsacrum', label: 'Cor Sacrum Jesu',
    description: 'In te confido',
    types:  ['tshirt', 'sweat'],
    colors: ['blanc', 'bleu'],
    images: ['image 94.png', 'image 95.png', 'image 98.png', 'image 99.png'],
    collection: 'premium',
  },
  {
    id: '14', key: 'sacrecoeur', label: 'Sacré-Cœur de Jésus',
    description: "J'ai confiance en vous",
    types:  ['tshirt'],
    colors: ['blanc', 'bleu'],
    images: ['image 97.png', 'image 96.png'],
    collection: 'premium',
  }
];
// ATTENTION A L'ID IL FAUT QU'IL SOIT UNIQUE POUR CHAQUE PRODUIT

// ─── HELPERS ───────────────────────────────

/** Première image d'un design (fallback carte grille) */
function coverImg(designKey) {
  const d = DESIGNS.find(x => x.key === designKey);
  return d && d.images.length ? d.images[0] : 'placeholder.png';
}

/**
 * Récupère le prix d'un produit selon son type et sa collection
 * @param {string} designKey - Le slug du design (ex: 'tradiscout' ou 'croixnika')
 * @param {string} typeId - Le type de vêtement (ex: 'tshirt', 'sweat')
 * @returns {number} Le prix correspondant ou 0 si non trouvé
 */
function getProductPrice(designKey, typeId) {
  const design = DESIGNS.find(d => d.key === designKey);
  const type = TYPES.find(t => t.id === typeId);
  
  if (!design || !type) return 0;
  
  // Récupère le prix de la collection du design, ou un fallback s'il y a un souci
  return type.price[design.collection] || 0;
}

if (typeof module !== 'undefined') {
  module.exports = { COLLECTIONS, TYPES, COLORS, SIZES, DESIGNS, coverImg, getProductPrice };
}
