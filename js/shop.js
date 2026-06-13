// =============================================
//  SHOP.JS — Customer-facing logic
// =============================================

(function () {
  const grid    = document.getElementById('productGrid');
  const modal   = document.getElementById('orderModal');
  let currentProduct = null;

  async function renderProducts() {
    try {
      const products = await DB.getProducts();
      const available = products.filter(p => p.available);

      grid.innerHTML = '';

      if (!available.length) {
        grid.innerHTML = '<p class="empty-state">No fragrances available right now. Check back soon.</p>';
        return;
      }

      available.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <div class="product-thumb" style="background:${p.bg || 'linear-gradient(135deg,#C9A96E,#9B7A3F)'}">
            <span style="font-size:64px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3))">${p.emoji || '🌸'}</span>
            ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
          </div>
          <div class="product-body">
            <p class="product-notes">${p.notes || ''}</p>
            <h3 class="product-name">${p.name}</h3>
            <p class="product-desc">${p.description || ''}</p>
            <div class="product-footer">
              <p class="product-price">${formatPrice(p.price)} <span>/ bottle</span></p>
              <button class="btn-order" data-id="${p.id}">Order Now</button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });

      grid.querySelectorAll('.btn-order').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = available.find(x => x.id == btn.dataset.id);
          if (p) openModal(p);
        });
      });

    } catch (e) {
      grid.innerHTML = '<p class="empty-state">Could not load products. Please try again later.</p>';
    }
  }

  function openModal(p) {
    currentProduct = p;
    document.getElementById('modalProductName').textContent = p.name;
    document.getElementById('modalProductPrice').textContent = formatPrice(p.price);
    document.getElementById('orderName').value = '';
    document.getElementById('orderNotes').value = '';
    document.getElementById('orderQty').value = 1;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    currentProduct = null;
  }

  document.getElementById('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  document.getElementById('sendOrderBtn').addEventListener('click', () => {
    if (!currentProduct) return;
    const name  = document.getElementById('orderName').value.trim();
    const size  = document.getElementById('orderSize').value;
    const qty   = document.getElementById('orderQty').value;
    const notes = document.getElementById('orderNotes').value.trim();

    if (!name) {
      document.getElementById('orderName').style.borderColor = '#e74c3c';
      document.getElementById('orderName').focus();
      return;
    }

    const total = formatPrice(currentProduct.price * parseInt(qty));
    let msg = `🛍️ *New Order — ${CONFIG.SHOP_NAME}*\n\n`;
    msg += `👤 *Customer:* ${name}\n`;
    msg += `🌸 *Fragrance:* ${currentProduct.name}\n`;
    msg += `📏 *Size:* ${size}\n`;
    msg += `🔢 *Quantity:* ${qty}\n`;
    msg += `💰 *Price per bottle:* ${formatPrice(currentProduct.price)}\n`;
    msg += `💳 *Total:* ${total}\n`;
    if (notes) msg += `📝 *Notes:* ${notes}\n`;
    msg += `\n_Sent from ${CONFIG.SHOP_NAME} website_`;

    window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    closeModal();
  });

  renderProducts();
})();
