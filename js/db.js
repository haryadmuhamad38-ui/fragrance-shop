// =============================================
//  DB.JS — Supabase database + image storage
// =============================================

const DB = {
  headers: {
    'apikey': CONFIG.SUPABASE_KEY,
    'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },

  base() { return `${CONFIG.SUPABASE_URL}/rest/v1`; },
  storageBase() { return `${CONFIG.SUPABASE_URL}/storage/v1`; },

  async getProducts() {
    const res = await fetch(`${this.base()}/products?order=created_at.asc`, { headers: this.headers });
    if (!res.ok) throw new Error('Failed to load products');
    return await res.json();
  },

  async addProduct(product) {
    const res = await fetch(`${this.base()}/products`, {
      method: 'POST', headers: this.headers, body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to add product');
    return await res.json();
  },

  async updateProduct(id, updates) {
    const res = await fetch(`${this.base()}/products?id=eq.${id}`, {
      method: 'PATCH', headers: this.headers, body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update product');
    return await res.json();
  },

  async deleteProduct(id) {
    const res = await fetch(`${this.base()}/products?id=eq.${id}`, {
      method: 'DELETE', headers: this.headers
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return true;
  },

  async uploadImage(file) {
    const ext = file.name.split('.').pop();
    const fileName = `product-${Date.now()}.${ext}`;
    const uploadHeaders = {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
      'Content-Type': file.type,
      'Cache-Control': '3600',
      'x-upsert': 'true'
    };
    const res = await fetch(`${this.storageBase()}/object/product-images/${fileName}`, {
      method: 'POST', headers: uploadHeaders, body: file
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error('Image upload failed: ' + err);
    }
    return `${this.storageBase()}/object/public/product-images/${fileName}`;
  }
};

function formatPrice(price) {
  return `${CONFIG.CURRENCY}${Number(price).toLocaleString()}`;
}
