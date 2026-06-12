// =============================================
//  SHOP.JS — Customer-facing logic
// =============================================

(function () {
  const grid       = document.getElementById('productGrid');
  const modal      = document.getElementById('orderModal');
  const modalClose = document.getElementById('modalClose');
  const sendBtn    = document.getElementById('sendOrderBtn');
  const whatsappContact = document.getElementById('whatsappContact');

  let currentProduct = null;

  // ---- Render Products ----
  function renderProducts() {
    const products = getProducts().filter(p => p.available);
    const settings = getSettings();

    // Update WhatsApp contact link
    whatsappContact.href = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent('Hello! I have a question about your fragrances.')}`;

    grid.innerHTML = '';

    if (!products.length) {
      grid.innerHTML = '<p class="empty-state">No fragrances available right now. Check back soon.</p>';
      return;
    }

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-thumb" style="background: ${p.bg || 'linear-gradient(135deg,#C9A96E,#9B7A3F)'}">
          <span style="font-size: 64px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3))">${p.emoji || '🌸'}</span>
          ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        </div>
        <div class="product-body">
          <p class="product-notes">${p.notes || ''}</p>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${p.desc || ''}</p>
          <div class="product-footer">
            <p class="product-price">${formatPrice(p.price, settings.currency)} <span>/ bottle</span></p>
            <button class="btn-order" data-id="${p.id}">Order Now</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Bind order buttons
    grid.querySelectorAll('.btn-order').forEach(btn => {
      btn.addEventListener('click', () => openModal(parseInt(btn.dataset.id)));
    });
  }

  // ---- Order Modal ----
  function openModal(productId) {
    const products = getProducts();
    const settings = getSettings();
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;

    document.getElementById('modalProductName').textContent = currentProduct.name;
    document.getElementById('modalProductPrice').textContent = formatPrice(currentProduct.price, settings.currency);
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

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // ---- Send WhatsApp Order ----
  sendBtn.addEventListener('click', () => {
    if (!currentProduct) return;

    const name  = document.getElementById('orderName').value.trim();
    const size  = document.getElementById('orderSize').value;
    const qty   = document.getElementById('orderQty').value;
    const notes = document.getElementById('orderNotes').value.trim();
    const settings = getSettings();

    if (!name) {
      document.getElementById('orderName').focus();
      document.getElementById('orderName').style.borderColor = '#e74c3c';
      return;
    }

    const total = formatPrice(currentProduct.price * parseInt(qty), settings.currency);

    let message = `🛍️ *New Order — ${settings.shopName}*\n\n`;
    message += `👤 *Customer:* ${name}\n`;
    message += `🌸 *Fragrance:* ${currentProduct.name}\n`;
    message += `📏 *Size:* ${size}\n`;
    message += `🔢 *Quantity:* ${qty}\n`;
    message += `💰 *Price per bottle:* ${formatPrice(currentProduct.price, settings.currency)}\n`;
    message += `💳 *Total:* ${total}\n`;
    if (notes) message += `📝 *Notes:* ${notes}\n`;
    message += `\n_Sent from ${settings.shopName} website_`;

    const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    closeModal();
  });

  // Escape key closes modal
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ---- Init ----
  renderProducts();
})();
