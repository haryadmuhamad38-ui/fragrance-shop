// =============================================
//  ADMIN.JS — Admin panel with Supabase
// =============================================

(function () {

  // ---- PASSWORD ----
  const overlay = document.getElementById('passwordOverlay');

  function checkAuth() {
    if (sessionStorage.getItem('adminOK') === 'yes') {
      overlay.style.display = 'none';
      init();
    }
  }

  document.getElementById('passwordSubmit').addEventListener('click', () => {
    const val = document.getElementById('passwordInput').value;
    if (val === CONFIG.ADMIN_PASSWORD) {
      sessionStorage.setItem('adminOK', 'yes');
      overlay.style.display = 'none';
      init();
    } else {
      document.getElementById('passwordError').style.display = 'block';
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordInput').focus();
    }
  });

  document.getElementById('passwordInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('passwordSubmit').click();
  });

  checkAuth();

  // ---- MAIN INIT ----
  function init() {
    renderTable();
    bindEvents();
  }

  // ---- RENDER TABLE ----
  async function renderTable() {
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#6B6055;">Loading...</td></tr>';

    try {
      const products = await DB.getProducts();

      // Stats
      const total  = products.length;
      const active = products.filter(p => p.available).length;
      document.getElementById('statsRow').innerHTML = `
        <div class="stat-card"><span class="stat-num">${total}</span><span class="stat-label">Total Fragrances</span></div>
        <div class="stat-card"><span class="stat-num">${active}</span><span class="stat-label">Live in Shop</span></div>
        <div class="stat-card"><span class="stat-num">${total - active}</span><span class="stat-label">Hidden</span></div>
      `;

      tbody.innerHTML = '';

      if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:60px;color:#6B6055;font-family:Cormorant Garamond,serif;font-size:20px;font-style:italic;">No fragrances yet. Add your first one!</td></tr>';
        return;
      }

      products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="table-product-name">
              <div class="table-emoji" style="background:${p.bg || '#C9A96E33'}">${p.emoji || '🌸'}</div>
              ${p.name}
            </div>
          </td>
          <td>${p.notes || '—'}</td>
          <td>
            <div class="price-edit-wrap">
              <span class="table-price" id="pd-${p.id}">${formatPrice(p.price)}</span>
              <input class="price-input" id="pi-${p.id}" type="number" value="${p.price}" min="0"/>
              <button class="btn-price-edit" id="pe-${p.id}" onclick="startEdit(${p.id})">Edit</button>
              <button class="btn-price-save" id="ps-${p.id}" onclick="savePrice(${p.id})">Save</button>
            </div>
          </td>
          <td>
            <div class="toggle-wrap">
              <label class="toggle">
                <input type="checkbox" ${p.available ? 'checked' : ''} onchange="toggleAvail(${p.id}, this.checked)"/>
                <span class="toggle-slider"></span>
              </label>
              <span class="badge ${p.available ? 'badge-available' : 'badge-hidden'}">${p.available ? 'Live' : 'Hidden'}</span>
            </div>
          </td>
          <td>
            <div class="action-btns">
              <button class="btn-edit-row" onclick="openEdit(${p.id})">✏️ Edit</button>
              <button class="btn-delete-row" onclick="openDelete(${p.id}, '${p.name.replace(/'/g,"\\'")}')">🗑️</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

    } catch(e) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#B72B1A;">Error loading products. Check your Supabase config.</td></tr>`;
    }
  }

  // ---- INLINE PRICE EDIT ----
  window.startEdit = function(id) {
    document.getElementById('pd-'+id).style.display = 'none';
    document.getElementById('pi-'+id).style.display = 'block';
    document.getElementById('pe-'+id).style.display = 'none';
    document.getElementById('ps-'+id).style.display = 'block';
    document.getElementById('pi-'+id).focus();
  };

  window.savePrice = async function(id) {
    const val = parseFloat(document.getElementById('pi-'+id).value);
    if (isNaN(val) || val < 0) return;
    try {
      await DB.updateProduct(id, { price: val });
      renderTable();
    } catch(e) { alert('Failed to update price.'); }
  };

  // ---- TOGGLE ----
  window.toggleAvail = async function(id, val) {
    try {
      await DB.updateProduct(id, { available: val });
      renderTable();
    } catch(e) { alert('Failed to update.'); }
  };

  // ---- ADD/EDIT MODAL ----
  const productModal = document.getElementById('productModal');

  function openAddModal() {
    document.getElementById('productModalTitle').textContent = 'Add New Fragrance';
    document.getElementById('pEditId').value = '';
    document.getElementById('pName').value   = '';
    document.getElementById('pPrice').value  = '';
    document.getElementById('pNotes').value  = '';
    document.getElementById('pDesc').value   = '';
    document.getElementById('pEmoji').value  = '🌸';
    document.getElementById('pBadge').value  = '';
    document.getElementById('pAvailable').value = 'true';
    document.getElementById('saveError').style.display = 'none';
    productModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  window.openEdit = async function(id) {
    const products = await DB.getProducts();
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('productModalTitle').textContent = 'Edit Fragrance';
    document.getElementById('pEditId').value  = id;
    document.getElementById('pName').value    = p.name;
    document.getElementById('pPrice').value   = p.price;
    document.getElementById('pNotes').value   = p.notes || '';
    document.getElementById('pDesc').value    = p.description || '';
    document.getElementById('pEmoji').value   = p.emoji || '🌸';
    document.getElementById('pBadge').value   = p.badge || '';
    document.getElementById('pAvailable').value = p.available ? 'true' : 'false';
    const bgSel = document.getElementById('pBg');
    for (let o of bgSel.options) { if (o.value === p.bg) { bgSel.value = o.value; break; } }
    document.getElementById('saveError').style.display = 'none';
    productModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeProductModal() {
    productModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('btnSaveProduct').addEventListener('click', async () => {
    const name  = document.getElementById('pName').value.trim();
    const price = parseFloat(document.getElementById('pPrice').value);
    const errEl = document.getElementById('saveError');

    if (!name) { errEl.textContent = 'Please enter a name.'; errEl.style.display = 'block'; return; }
    if (isNaN(price) || price < 0) { errEl.textContent = 'Please enter a valid price.'; errEl.style.display = 'block'; return; }

    const data = {
      name,
      price,
      notes:       document.getElementById('pNotes').value.trim(),
      description: document.getElementById('pDesc').value.trim(),
      emoji:       document.getElementById('pEmoji').value.trim() || '🌸',
      badge:       document.getElementById('pBadge').value.trim(),
      bg:          document.getElementById('pBg').value,
      available:   document.getElementById('pAvailable').value === 'true',
    };

    const btn = document.getElementById('btnSaveProduct');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
      const editId = document.getElementById('pEditId').value;
      if (editId) {
        await DB.updateProduct(parseInt(editId), data);
      } else {
        await DB.addProduct(data);
      }
      closeProductModal();
      renderTable();
    } catch(e) {
      errEl.textContent = 'Failed to save. Check your Supabase setup.';
      errEl.style.display = 'block';
    } finally {
      btn.textContent = 'Save Fragrance';
      btn.disabled = false;
    }
  });

  // ---- DELETE MODAL ----
  const deleteModal = document.getElementById('deleteModal');
  let pendingDeleteId = null;

  window.openDelete = function(id, name) {
    pendingDeleteId = id;
    document.getElementById('deleteProductName').textContent = `"${name}" will be permanently removed.`;
    deleteModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeDeleteModal() {
    deleteModal.classList.remove('open');
    document.body.style.overflow = '';
    pendingDeleteId = null;
  }

  document.getElementById('deleteConfirm').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    try {
      await DB.deleteProduct(pendingDeleteId);
      closeDeleteModal();
      renderTable();
    } catch(e) { alert('Failed to delete.'); }
  });

  // ---- BIND EVENTS ----
  function bindEvents() {
    document.getElementById('btnAddProduct').addEventListener('click', openAddModal);
    document.getElementById('productModalClose').addEventListener('click', closeProductModal);
    document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteCancel').addEventListener('click', closeDeleteModal);
    productModal.addEventListener('click', e => { if (e.target === productModal) closeProductModal(); });
    deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeProductModal(); closeDeleteModal(); }});
  }

})();
