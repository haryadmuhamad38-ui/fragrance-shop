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

  // ---- STATE ----
  let selectedImageFile = null;
  let pendingDeleteId   = null;

  // ---- INIT ----
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
      const total  = products.length;
      const active = products.filter(p => p.available).length;

      document.getElementById('statsRow').innerHTML = `
        <div class="stat-card"><span class="stat-num">${total}</span><span class="stat-label">Total</span></div>
        <div class="stat-card"><span class="stat-num">${active}</span><span class="stat-label">Live in Shop</span></div>
        <div class="stat-card"><span class="stat-num">${total - active}</span><span class="stat-label">Hidden</span></div>
      `;

      tbody.innerHTML = '';

      if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:60px;color:#6B6055;font-family:Cormorant Garamond,serif;font-size:20px;font-style:italic;">No fragrances yet. Add your first one!</td></tr>';
        return;
      }

      products.forEach(p => {
        const thumb = p.image_url
          ? `<img src="${p.image_url}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;"/>`
          : `<div class="table-emoji" style="background:#C9A96E33">🌸</div>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><div class="table-product-name">${thumb} ${p.name}</div></td>
          <td>${p.notes || '—'}</td>
          <td>
            <div class="price-edit-wrap">
              <span class="table-price" id="pd-${p.id}">${formatPrice(p.price)}</span>
              <input class="price-input" id="pi-${p.id}" type="number" value="${p.price}" min="0"/>
              <button class="btn-price-edit" id="pe-${p.id}">Edit</button>
              <button class="btn-price-save" id="ps-${p.id}" style="display:none">Save</button>
            </div>
          </td>
          <td>
            <div class="toggle-wrap">
              <label class="toggle">
                <input type="checkbox" ${p.available ? 'checked' : ''}/>
                <span class="toggle-slider"></span>
              </label>
              <span class="badge ${p.available ? 'badge-available' : 'badge-hidden'}">${p.available ? 'Live' : 'Hidden'}</span>
            </div>
          </td>
          <td>
            <div class="action-btns">
              <button class="btn-edit-row" data-id="${p.id}">✏️ Edit</button>
              <button class="btn-delete-row" data-id="${p.id}" data-name="${p.name.replace(/"/g, '&quot;')}">🗑️</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);

        // Price edit
        tr.querySelector('#pe-' + p.id).addEventListener('click', () => {
          document.getElementById('pd-' + p.id).style.display = 'none';
          document.getElementById('pi-' + p.id).style.display = 'block';
          document.getElementById('pe-' + p.id).style.display = 'none';
          document.getElementById('ps-' + p.id).style.display = 'block';
          document.getElementById('pi-' + p.id).focus();
        });

        tr.querySelector('#ps-' + p.id).addEventListener('click', async () => {
          const val = parseFloat(document.getElementById('pi-' + p.id).value);
          if (isNaN(val) || val < 0) return;
          try {
            await DB.updateProduct(p.id, { price: val });
            renderTable();
          } catch(e) { alert('Failed to update price.'); }
        });

        // Toggle availability
        tr.querySelector('input[type="checkbox"]').addEventListener('change', async function() {
          try {
            await DB.updateProduct(p.id, { available: this.checked });
            renderTable();
          } catch(e) { alert('Failed to update.'); this.checked = !this.checked; }
        });

        // Edit button
        tr.querySelector('.btn-edit-row').addEventListener('click', () => openEditModal(p));

        // Delete button
        tr.querySelector('.btn-delete-row').addEventListener('click', () => {
          pendingDeleteId = p.id;
          document.getElementById('deleteProductName').textContent = `"${p.name}" will be permanently removed.`;
          document.getElementById('deleteModal').classList.add('open');
          document.body.style.overflow = 'hidden';
        });
      });

    } catch(e) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#B72B1A;">Error loading products. Check your Supabase config.</td></tr>`;
    }
  }

  // ---- PRODUCT MODAL ----
  const productModal = document.getElementById('productModal');

  function openAddModal() {
    selectedImageFile = null;

    document.getElementById('productModalTitle').textContent = 'Add New Fragrance';
    document.getElementById('pEditId').value        = '';
    document.getElementById('pExistingImage').value = '';
    document.getElementById('pName').value          = '';
    document.getElementById('pPrice').value         = '';
    document.getElementById('pNotes').value         = '';
    document.getElementById('pDesc').value          = '';
    document.getElementById('pBadge').value         = '';
    document.getElementById('pAvailable').value     = 'true';
    document.getElementById('saveError').style.display = 'none';
    document.getElementById('imageStatus').textContent  = '';

    // Reset image preview
    const preview     = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imageUploadPlaceholder');
    const input       = document.getElementById('imageInput');
    preview.src       = '';
    preview.style.display     = 'none';
    placeholder.style.display = 'flex';
    input.value = '';

    productModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function openEditModal(p) {
    selectedImageFile = null;

    document.getElementById('productModalTitle').textContent = 'Edit Fragrance';
    document.getElementById('pEditId').value        = p.id;
    document.getElementById('pExistingImage').value = p.image_url || '';
    document.getElementById('pName').value          = p.name;
    document.getElementById('pPrice').value         = p.price;
    document.getElementById('pNotes').value         = p.notes || '';
    document.getElementById('pDesc').value          = p.description || '';
    document.getElementById('pBadge').value         = p.badge || '';
    document.getElementById('pAvailable').value     = p.available ? 'true' : 'false';
    document.getElementById('saveError').style.display = 'none';

    const preview     = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imageUploadPlaceholder');
    const input       = document.getElementById('imageInput');
    input.value = '';

    if (p.image_url) {
      preview.src               = p.image_url;
      preview.style.display     = 'block';
      placeholder.style.display = 'none';
      document.getElementById('imageStatus').textContent = '✓ Current photo loaded';
    } else {
      preview.src               = '';
      preview.style.display     = 'none';
      placeholder.style.display = 'flex';
      document.getElementById('imageStatus').textContent = '';
    }

    productModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    productModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Save product
  document.getElementById('btnSaveProduct').addEventListener('click', async () => {
    const name  = document.getElementById('pName').value.trim();
    const price = parseFloat(document.getElementById('pPrice').value);
    const errEl = document.getElementById('saveError');

    errEl.style.display = 'none';

    if (!name)  { errEl.textContent = 'Please enter a fragrance name.'; errEl.style.display = 'block'; return; }
    if (isNaN(price) || price < 0) { errEl.textContent = 'Please enter a valid price.'; errEl.style.display = 'block'; return; }

    const btn = document.getElementById('btnSaveProduct');
    btn.textContent = 'Saving...';
    btn.disabled    = true;

    try {
      let image_url = document.getElementById('pExistingImage').value || null;

      if (selectedImageFile) {
        document.getElementById('imageStatus').textContent = '⏳ Uploading photo...';
        image_url = await DB.uploadImage(selectedImageFile);
        document.getElementById('imageStatus').textContent = '✓ Photo uploaded!';
      }

      const data = {
        name,
        price,
        image_url,
        notes:       document.getElementById('pNotes').value.trim() || null,
        description: document.getElementById('pDesc').value.trim()  || null,
        badge:       document.getElementById('pBadge').value.trim() || null,
        available:   document.getElementById('pAvailable').value === 'true',
        emoji: '🌸',
        bg:    'linear-gradient(135deg,#1A1209 0%,#2E1A0E 100%)',
      };

      const editId = document.getElementById('pEditId').value;
      if (editId) {
        await DB.updateProduct(parseInt(editId), data);
      } else {
        await DB.addProduct(data);
      }

      closeProductModal();
      renderTable();

    } catch(e) {
      errEl.textContent = 'Failed to save: ' + e.message;
      errEl.style.display = 'block';
    } finally {
      btn.textContent = 'Save Fragrance';
      btn.disabled    = false;
    }
  });

  // ---- DELETE MODAL ----
  const deleteModal = document.getElementById('deleteModal');

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
    } catch(e) { alert('Failed to delete product.'); }
  });

  // ---- BIND ALL EVENTS ----
  function bindEvents() {
    // Add button
    document.getElementById('btnAddProduct').addEventListener('click', openAddModal);

    // Close modals
    document.getElementById('productModalClose').addEventListener('click', closeProductModal);
    document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteCancel').addEventListener('click', closeDeleteModal);

    // Click outside modal to close
    productModal.addEventListener('click', e => { if (e.target === productModal) closeProductModal(); });
    deleteModal.addEventListener('click',  e => { if (e.target === deleteModal)  closeDeleteModal();  });

    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeProductModal(); closeDeleteModal(); }
    });

    // Image upload — only bound ONCE here
    document.getElementById('imageInput').addEventListener('change', function() {
      const file = this.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        document.getElementById('imageStatus').textContent = '❌ File too large. Max 5MB.';
        selectedImageFile = null;
        return;
      }
      selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = e => {
        const preview = document.getElementById('imagePreview');
        preview.src           = e.target.result;
        preview.style.display = 'block';
        document.getElementById('imageUploadPlaceholder').style.display = 'none';
        document.getElementById('imageStatus').textContent = '✓ Photo ready: ' + file.name;
      };
      reader.readAsDataURL(file);
    });
  }

})();
