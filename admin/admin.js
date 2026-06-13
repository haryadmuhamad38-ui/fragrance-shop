(function () {

  // ---- PASSWORD ----
  const overlay = document.getElementById('passwordOverlay');
  function checkAuth() {
    if (sessionStorage.getItem('adminOK') === 'yes') { overlay.style.display = 'none'; init(); }
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

  // ---- IMAGE PREVIEW ----
  document.getElementById('imageInput').addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      document.getElementById('imageStatus').textContent = '❌ File too large. Max 5MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('imagePreview').src = e.target.result;
      document.getElementById('imagePreview').style.display = 'block';
      document.getElementById('imageUploadPlaceholder').style.display = 'none';
      document.getElementById('imageStatus').textContent = '✓ Photo selected: ' + file.name;
    };
    reader.readAsDataURL(file);
  });

  // ---- INIT ----
  function init() { renderTable(); bindEvents(); }

  // ---- RENDER TABLE ----
  async function renderTable() {
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#6B6055;">Loading...</td></tr>';
    try {
      const products = await DB.getProducts();
      const total = products.length;
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
        const thumbHtml = p.image_url
          ? `<img src="${p.image_url}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;"/>`
          : `<div class="table-emoji" style="background:${p.bg||'#C9A96E33'}">${p.emoji||'🌸'}</div>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><div class="table-product-name">${thumbHtml} ${p.name}</div></td>
          <td>${p.notes||'—'}</td>
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
                <input type="checkbox" ${p.available?'checked':''} onchange="toggleAvail(${p.id}, this.checked)"/>
                <span class="toggle-slider"></span>
              </label>
              <span class="badge ${p.available?'badge-available':'badge-hidden'}">${p.available?'Live':'Hidden'}</span>
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
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#B72B1A;">Error loading. Check Supabase config.</td></tr>`;
    }
  }

  window.startEdit = id => {
    document.getElementById('pd-'+id).style.display='none';
    document.getElementById('pi-'+id).style.display='block';
    document.getElementById('pe-'+id).style.display='none';
    document.getElementById('ps-'+id).style.display='block';
    document.getElementById('pi-'+id).focus();
  };
  window.savePrice = async id => {
    const val = parseFloat(document.getElementById('pi-'+id).value);
    if (isNaN(val)||val<0) return;
    try { await DB.updateProduct(id,{price:val}); renderTable(); }
    catch(e) { alert('Failed to update price.'); }
  };
  window.toggleAvail = async (id,val) => {
    try { await DB.updateProduct(id,{available:val}); renderTable(); }
    catch(e) { alert('Failed to update.'); }
  };

  // ---- ADD/EDIT MODAL ----
  const productModal = document.getElementById('productModal');

  function resetModal() {
    document.getElementById('pEditId').value = '';
    document.getElementById('pExistingImage').value = '';
    document.getElementById('pName').value = '';
    document.getElementById('pPrice').value = '';
    document.getElementById('pNotes').value = '';
    document.getElementById('pDesc').value = '';
    document.getElementById('pBadge').value = '';
    document.getElementById('pAvailable').value = 'true';
    document.getElementById('imageInput').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imagePreview').src = '';
    document.getElementById('imageUploadPlaceholder').style.display = 'flex';
    document.getElementById('imageStatus').textContent = '';
    document.getElementById('saveError').style.display = 'none';
  }

  function openAddModal() {
    resetModal();
    document.getElementById('productModalTitle').textContent = 'Add New Fragrance';
    productModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  window.openEdit = async id => {
    const products = await DB.getProducts();
    const p = products.find(x => x.id === id);
    if (!p) return;
    resetModal();
    document.getElementById('productModalTitle').textContent = 'Edit Fragrance';
    document.getElementById('pEditId').value  = id;
    document.getElementById('pName').value    = p.name;
    document.getElementById('pPrice').value   = p.price;
    document.getElementById('pNotes').value   = p.notes||'';
    document.getElementById('pDesc').value    = p.description||'';
    document.getElementById('pBadge').value   = p.badge||'';
    document.getElementById('pAvailable').value = p.available?'true':'false';
    if (p.image_url) {
      document.getElementById('pExistingImage').value = p.image_url;
      document.getElementById('imagePreview').src = p.image_url;
      document.getElementById('imagePreview').style.display = 'block';
      document.getElementById('imageUploadPlaceholder').style.display = 'none';
      document.getElementById('imageStatus').textContent = '✓ Current photo loaded';
    }
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
    if (!name) { errEl.textContent='Please enter a name.'; errEl.style.display='block'; return; }
    if (isNaN(price)||price<0) { errEl.textContent='Please enter a valid price.'; errEl.style.display='block'; return; }

    const btn = document.getElementById('btnSaveProduct');
    btn.textContent = 'Saving...';
    btn.disabled = true;
    errEl.style.display = 'none';

    try {
      let image_url = document.getElementById('pExistingImage').value || null;
      const imageFile = document.getElementById('imageInput').files[0];
      if (imageFile) {
        document.getElementById('imageStatus').textContent = '⏳ Uploading photo...';
        image_url = await DB.uploadImage(imageFile);
        document.getElementById('imageStatus').textContent = '✓ Photo uploaded!';
      }

      const data = {
        name, price, image_url,
        notes:       document.getElementById('pNotes').value.trim(),
        description: document.getElementById('pDesc').value.trim(),
        badge:       document.getElementById('pBadge').value.trim(),
        available:   document.getElementById('pAvailable').value === 'true',
        emoji: '🌸', bg: 'linear-gradient(135deg,#1A1209 0%,#2E1A0E 100%)'
      };

      const editId = document.getElementById('pEditId').value;
      if (editId) { await DB.updateProduct(parseInt(editId), data); }
      else { await DB.addProduct(data); }

      closeProductModal();
      renderTable();
    } catch(e) {
      errEl.textContent = 'Failed to save: ' + e.message;
      errEl.style.display = 'block';
    } finally {
      btn.textContent = 'Save Fragrance';
      btn.disabled = false;
    }
  });

  // ---- DELETE ----
  const deleteModal = document.getElementById('deleteModal');
  let pendingDeleteId = null;

  window.openDelete = (id, name) => {
    pendingDeleteId = id;
    document.getElementById('deleteProductName').textContent = `"${name}" will be permanently removed.`;
    deleteModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  function closeDeleteModal() { deleteModal.classList.remove('open'); document.body.style.overflow=''; pendingDeleteId=null; }

  document.getElementById('deleteConfirm').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    try { await DB.deleteProduct(pendingDeleteId); closeDeleteModal(); renderTable(); }
    catch(e) { alert('Failed to delete.'); }
  });

  function bindEvents() {
    document.getElementById('btnAddProduct').addEventListener('click', openAddModal);
    document.getElementById('productModalClose').addEventListener('click', closeProductModal);
    document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteCancel').addEventListener('click', closeDeleteModal);
    productModal.addEventListener('click', e => { if(e.target===productModal) closeProductModal(); });
    deleteModal.addEventListener('click', e => { if(e.target===deleteModal) closeDeleteModal(); });
    document.addEventListener('keydown', e => { if(e.key==='Escape'){closeProductModal();closeDeleteModal();} });
  }

})();
