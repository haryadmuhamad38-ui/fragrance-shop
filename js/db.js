// =============================================
//  DB.JS — Supabase database functions
// =============================================

const DB = {
  headers: {
    'apikey': CONFIG.SUPABASE_KEY,
    'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },

  base() {
    return `${CONFIG.SUPABASE_URL}/rest/v1`;
  },

  async getProducts() {
    const res = await fetch(`${this.base()}/products?order=created_at.asc`, {
      headers: this.headers
    });
    if (!res.ok) throw new Error('Failed to load products');
    return await res.json();
  },

  async addProduct(product) {
    const res = await fetch(`${this.base()}/products`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to add product');
    return await res.json();
  },

  async updateProduct(id, updates) {
    const res = await fetch(`${this.base()}/products?id=eq.${id}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update product');
    return await res.json();
  },

  async deleteProduct(id) {
    const res = await fetch(`${this.base()}/products?id=eq.${id}`, {
      method: 'DELETE',
      headers: this.headers
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return true;
  }
};

function formatPrice(price) {
  return `${CONFIG.CURRENCY}${Number(price).toLocaleString()}`;
}
