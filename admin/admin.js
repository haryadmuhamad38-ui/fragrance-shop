// =============================================
//  ADMIN.JS — Admin panel logic
// =============================================

(function () {

  // ---- PASSWORD PROTECTION ----
  const ADMIN_PASSWORD = '@m el_la00900';
  const SESSION_KEY = 'adminUnlocked';

  function checkPassword() {
    if (sessionStorage.getItem(SESSION_KEY) === 'yes') return;
    document.getElementById('passwordOverlay').style.display = 'flex';
  }

  document.getElementById('passwordSubmit').addEventListener('click', () => {
    const val = document.getElementById('passwordInput').value;
    if (val === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'yes');
      document.getElementById('passwordOverlay').style.display = 'none';
    } else {
      document.getElementById('passwordError').style.display = 'block';
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordInput').focus();
    }
  });

  document.getElementById('passwordInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('passwordSubmit').click();
  });

  checkPassword();

  // ---- TAB NAVIGATION ----
  document.querySelectorAll('.sn-item[data-tab]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const tab = item.dataset.tab;

      document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');

      if (tab === 'settings') loadSettings();
    });
  });

  // ---- STATS ----
  function renderStats() {
    const products = getProducts();
    const settings = getSettings();
    const total    = products.length;
    const active   = products.filter(p => p.available).length;
    const hidden   = total - active;
    const avgPrice = total ? Math.round(products.reduce((s, p) => s + Number(p.price), 0) / total) : 0;

    document.getElementById('statsRow').innerHTML = `
      <div class="stat-card"><span class="stat-num">${total}</span><span class="stat-label">Total Fragrances</span></div>
      <div class="stat-card"><span class="stat-num">${active}</span><span class="stat-label">Live in Shop</span></div>
      <div class="stat-card"><span class="stat-num">${hidden}</span><span class="stat-label">Hidden</span></div>
      <div class="stat-card"><span class="stat-num">${formatPrice(avgPrice, settings.currency)}</span><span class="stat-label">Avg. Price</span></div>
    `;
  }

  // ---- PRODUCT TABLE ----
  function renderTable() {
    const products = getProducts();
    const settings = getSettings();
    const tbody    = document.getElementById('adminTableBody');
    tbody.innerHTML = '';

    if (!products.length) {
      tbody.innerHTML = '<tr class="empty-table-row"><td colspan="5">No fragrances yet. Add your first one!</td></tr>';
      return;
    }

    products.forEach(p => {
      const tr = document.createElement('tr');
      tr.dataset.id = p.id;
      tr.innerHTML = `
        <td>
          <div class="table-product-name">
            <div class="table-emoji" style="background: ${p.bg || '#C9A96E33'}">${p.emoji || '🌸'}</div>
            ${p.name}
          </div>
        </td>
        <td>${p.notes || '—'}</td>
        <td>
          <div class="price-edit-wrap">
            <span class="table-price" id="priceDisplay-${p.id}">${formatPrice(p.price, settings.currency)}</span>
            <input class="price-input" id="priceInput-${p.id}" type="number" value="${p.price}" min="0"/>
            <button class="btn-price-edit" id="priceEditBtn-${p.id}" onclick="startPriceEdit(${p.id})">Edit</button>
            <button class="btn-price-save" id="priceSaveBtn-${p.id}" onclick="savePriceEdit(${p.id})">Save</button>
          </div>
        </td>
        <td>
          <div class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" ${p.available ? 'checked' : ''} onchange="toggleAvailability(${p.id}, this.checked)"/>
              <span class="toggle-slider"></span>
            </label>
            <span class="badge ${p.available ? 'badge-available' : 'badge-hidden'}">
              ${p.available ? 'Live' : 'Hidden'}
            </span>
          </div>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-edit-row" onclick="openEditModal(${p.id})">✏️ Edit</button>
            <button class="btn-delete-row" onclick="openDeleteModal(${p.id})">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    renderStats();
  }

  // ---- INLINE PRICE EDIT ----
  window.startPriceEdit = function (id) {
    document.getElementById('priceDisplay-' + id).style.display = 'none';
    document.getElementById('priceInput-'   + id).style.display = 'block';
    document.getElementById('priceEditBtn-' + id).style.display = 'none';
    document.getElementById('priceSaveBtn-' + id).style.display = 'block';
    document.getElementById('priceInput-'   + id).focus();
  };

  window.savePriceEdit = function (id) {
    const newPrice = parseFloat(document.getElementById('priceInput-' + id).value);
    if (isNaN(newPrice) || newPrice < 0) return;

    updateProduct(id, { price: newPrice });
    renderTable();
  };

  // ---- TOGGLE AVAILABILITY ----
  window.toggleAvailability = function (id, available) {
    updateProduct(id, { available });
    renderTable();
  };

  // ---- ADD / EDIT MODAL ----
  const productModal = document.getElementById('productModal');
  const productModalClose = document.getElementById('productModalClose');

  document.getElementById('btnAddProduct').addEventListener('click', () => openAddModal());
  productModalClose.addEventListener('click', closeProductModal);
  productModal.addEventListener('click', e => { if (e.target === productModal) closeProductModal(); });

  function openAddModal() {
    document.getElementById('productModalTitle').textContent = 'Add New Fragrance';
    document.getElementById('pEditId').value = '';
    document.getElementById('pName').value   = '';
    document.getElementById('pPrice').value  = '';
    document.getElementById('pNotes').value  = '';
    document.getElementById('pDesc').value   = '';
    document.getElementById('pEmoji').value  = '🌸';
    document.getElementById('pBadge').value  = '';
    document.getElementById('pBg').value     = 'linear-gradient(135deg,#1A1209 0%,#2E1A0E 100%)';
    document.getElementById('pAvailable').value = 'true';
    productModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  window.openEditModal = function (id) {
    const p = getProducts().find(x => x.id === id);
    if (!p) return;

    document.getElementById('productModalTitle').textContent = 'Edit Fragrance';
    document.getElementById('pEditId').value  = id;
    document.getElementById('pName').value    = p.name;
    document.getElementById('pPrice').value   = p.price;
    document.getElementById('pNotes').value   = p.notes || '';
    document.getElementById('pDesc').value    = p.desc  || '';
    document.getElementById('pEmoji').value   = p.emoji || '🌸';
    document.getElementById('pBadge').value   = p.badge || '';
    document.getElementById('pAvailable').value = p.available ? 'true' : 'false';

    // Set background select
    const bgSelect = document.getElementById('pBg');
    let matched = false;
    for (let opt of bgSelect.options) {
      if (opt.value === p.bg) { bgSelect.value = opt.value; matched = true; break; }
    }
    if (!matched) bgSelect.selectedIndex = 0;

    productModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeProductModal() {
    productModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('btnSaveProduct').addEventListener('click', () => {
    const name  = document.getElementById('pName').value.trim();
    const price = parseFloat(document.getElementById('pPrice').value);

    if (!name) { alert('Please enter a fragrance name.'); return; }
    if (isNaN(price) || price < 0) { alert('Please enter a valid price.'); return; }

    const data = {
      name,
      price,
      notes:     document.getElementById('pNotes').value.trim(),
      desc:      document.getElementById('pDesc').value.trim(),
      emoji:     document.getElementById('pEmoji').value.trim() || '🌸',
      badge:     document.getElementById('pBadge').value.trim(),
      bg:        document.getElementById('pBg').value,
      available: document.getElementById('pAvailable').value === 'true',
    };

    const editId = document.getElementById('pEditId').value;
    if (editId) {
      updateProduct(parseInt(editId), data);
    } else {
      addProduct(data);
    }

    closeProductModal();
    renderTable();
  });

  // ---- DELETE MODAL ----
  const deleteModal = document.getElementById('deleteModal');
  let pendingDeleteId = null;

  window.openDeleteModal = function (id) {
    const p = getProducts().find(x => x.id === id);
    if (!p) return;
    pendingDeleteId = id;
    document.getElementById('deleteProductName').textContent = `"${p.name}" will be permanently removed.`;
    deleteModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeDeleteModal() {
    deleteModal.classList.remove('open');
    document.body.style.overflow = '';
    pendingDeleteId = null;
  }

  document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteCancel').addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

  document.getElementById('deleteConfirm').addEventListener('click', () => {
    if (pendingDeleteId === null) return;
    deleteProduct(pendingDeleteId);
    closeDeleteModal();
    renderTable();
  });

  // ---- SETTINGS ----
  function loadSettings() {
    const s = getSettings();
    document.getElementById('settingWhatsapp').value  = s.whatsappNumber || '';
    document.getElementById('settingShopName').value  = s.shopName || '';
    document.getElementById('settingCurrency').value  = s.currency || 'USD';
  }

  document.getElementById('btnSaveSettings').addEventListener('click', () => {
    const settings = {
      whatsappNumber: document.getElementById('settingWhatsapp').value.trim(),
      shopName:       document.getElementById('settingShopName').value.trim() || 'My Fragrance Shop',
      currency:       document.getElementById('settingCurrency').value,
    };

    if (!settings.whatsappNumber) {
      alert('Please enter your WhatsApp number.');
      return;
    }

    saveSettings(settings);
    const msg = document.getElementById('saveMsg');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 3000);
  });

  // Escape to close any modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeProductModal();
      closeDeleteModal();
    }
  });

  // ---- INIT ----
  renderTable();
  loadSettings();

})();
