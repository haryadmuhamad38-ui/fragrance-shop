// =============================================
//  PRODUCTS DATA — Shared between Shop & Admin
//  Uses localStorage for persistence
// =============================================

const STORAGE_KEY = 'maisonLumiere_products';
const SETTINGS_KEY = 'maisonLumiere_settings';

// Default products (shown on first load)
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Oud Noir Absolu',
    notes: 'Oud · Sandalwood · Musk',
    desc: 'A commanding darkness balanced by creamy sandalwood and an animalic musk drydown. Lasts 12+ hours.',
    price: 185,
    currency: 'USD',
    emoji: '🖤',
    badge: 'Bestseller',
    bg: 'linear-gradient(135deg, #1A1209 0%, #2E1A0E 100%)',
    available: true
  },
  {
    id: 2,
    name: 'Rose de Grasse',
    notes: 'Rose · Bergamot · Patchouli',
    desc: 'An opulent May rose at its peak — dewy, slightly spiced, with an earthy patchouli base that grounds the bloom.',
    price: 145,
    currency: 'USD',
    emoji: '🌹',
    badge: 'New',
    bg: 'linear-gradient(135deg, #5E1224 0%, #8B3A52 100%)',
    available: true
  },
  {
    id: 3,
    name: 'Ambre Nomade',
    notes: 'Amber · Vanilla · Labdanum',
    desc: 'Warm desert resin translated into a silky amber composition. Addictive and deeply comforting.',
    price: 120,
    currency: 'USD',
    emoji: '✨',
    badge: '',
    bg: 'linear-gradient(135deg, #7B4A0F 0%, #C9A96E 100%)',
    available: true
  },
  {
    id: 4,
    name: 'Sel Marin',
    notes: 'Sea Salt · Vetiver · Cedar',
    desc: 'The cool briskness of coastal air — marine minerality on a vetiver and cedar foundation. Effortlessly wearable.',
    price: 95,
    currency: 'USD',
    emoji: '🌊',
    badge: '',
    bg: 'linear-gradient(135deg, #0F3A5E 0%, #2A6B9C 100%)',
    available: true
  },
  {
    id: 5,
    name: 'Iris Précieux',
    notes: 'Iris · Violet · White Musk',
    desc: 'Cold, powdery iris root — the scent of couture houses and silk gloves. Understated prestige.',
    price: 210,
    currency: 'USD',
    emoji: '💜',
    badge: 'Limited',
    bg: 'linear-gradient(135deg, #3B1F4E 0%, #7B5EA7 100%)',
    available: true
  },
  {
    id: 6,
    name: 'Bois de Paradis',
    notes: 'Cedarwood · Guaiac · Smoke',
    desc: 'Crackling fireside in a forest clearing. Guaiac wood smoke wraps around a sturdy cedarwood spine.',
    price: 160,
    currency: 'USD',
    emoji: '🌲',
    badge: '',
    bg: 'linear-gradient(135deg, #1E3C1A 0%, #4A7A40 100%)',
    available: true
  }
];

const DEFAULT_SETTINGS = {
  whatsappNumber: '9647709730735',
  shopName: 'Maison Lumière',
  currency: 'USD'
};

// ---- API ----

function getProducts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveProducts(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  }
  return JSON.parse(raw);
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function getSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return JSON.parse(raw);
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function addProduct(product) {
  const products = getProducts();
  const id = Date.now();
  products.push({ ...product, id });
  saveProducts(products);
  return id;
}

function updateProduct(id, updates) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return false;
  products[idx] = { ...products[idx], ...updates };
  saveProducts(products);
  return true;
}

function deleteProduct(id) {
  let products = getProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);
}

function formatPrice(price, currency) {
  const symbols = { USD: '$', EUR: '€', GBP: '£', SAR: 'SR ', AED: 'AED ' };
  const sym = symbols[currency] || currency + ' ';
  return `${sym}${Number(price).toLocaleString()}`;
}
