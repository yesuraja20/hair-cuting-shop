/**
 * AUREUS & BLADE - ADMIN PORTAL CONTROLLER
 * Full administrative control for customer bookings, pricing, images, and gateway settings.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const authScreen = document.getElementById('admin-auth-screen');
  const loginForm = document.getElementById('admin-login-form');
  const logoutBtn = document.getElementById('btn-admin-logout');
  const dbStatusBadge = document.getElementById('db-status-badge');
  const dbStatusText = document.getElementById('db-status-text');

  // Metrics Elements
  const metricTotalBookings = document.getElementById('metric-total-bookings');
  const metricTotalRevenue = document.getElementById('metric-total-revenue');
  const metricConfirmed = document.getElementById('metric-confirmed-bookings');
  const metricPending = document.getElementById('metric-pending-bookings');

  // Tabs
  const tabs = document.querySelectorAll('.dash-tab');
  const panels = document.querySelectorAll('.tab-panel');

  // Bookings Elements
  const bookingsTableBody = document.getElementById('bookings-table-body');
  const bookingsSearch = document.getElementById('bookings-search');
  const bookingsFilterStatus = document.getElementById('bookings-filter-status');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnRefreshBookings = document.getElementById('btn-refresh-bookings');

  // Services Elements
  const servicesContainer = document.getElementById('services-admin-container');
  const btnAddNewService = document.getElementById('btn-add-new-service');
  const editServiceModal = document.getElementById('edit-service-modal');
  const btnCloseServiceModal = document.getElementById('btn-close-service-modal');
  const formEditService = document.getElementById('form-edit-service');
  const modalServiceHeading = document.getElementById('modal-service-heading');

  // Images Elements
  const imagesContainer = document.getElementById('images-admin-container');
  const btnSaveAllImages = document.getElementById('btn-save-all-images');

  // Settings Forms
  const formSupabase = document.getElementById('form-settings-supabase');
  const formPayment = document.getElementById('form-settings-payment');
  const formAdmin = document.getElementById('form-settings-admin');

  let cachedBookings = [];
  let cachedServices = [];
  let cachedImages = {};

  // ============================================================================
  // 1. AUTHENTICATION CONTROLLER
  // ============================================================================
  function checkAuth() {
    if (window.AureusDB && window.AureusDB.isAdminLoggedIn()) {
      authScreen.style.display = 'none';
      initializeDashboard();
    } else {
      authScreen.style.display = 'flex';
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const pass = document.getElementById('auth-pass').value;

      const submitBtn = document.getElementById('btn-login-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'AUTHENTICATING...';

      const res = await window.AureusDB.adminLogin(email, pass);
      submitBtn.disabled = false;
      submitBtn.textContent = 'ACCESS ATELIER CONSOLE →';

      if (res.success) {
        showToast('Welcome back, Master Barber.', 'success');
        authScreen.style.display = 'none';
        initializeDashboard();
      } else {
        showToast(res.error || 'Access denied.', 'error');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.AureusDB.adminLogout();
      authScreen.style.display = 'flex';
      showToast('Signed out of Atelier Command.', 'success');
    });
  }

  // ============================================================================
  // 2. DASHBOARD INITIALIZATION & STATUS
  // ============================================================================
  function updateDbStatus() {
    if (!dbStatusBadge || !dbStatusText) return;
    if (window.AureusDB.isConfigured()) {
      dbStatusBadge.classList.remove('local');
      dbStatusText.textContent = 'Supabase Connected';
    } else {
      dbStatusBadge.classList.add('local');
      dbStatusText.textContent = 'Local Mode (Ready for Supabase)';
    }
  }

  async function initializeDashboard() {
    updateDbStatus();
    await loadBookings();
    await loadServices();
    await loadImages();
    loadSettingsInputs();
  }

  // Tabs Switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      panels.forEach(p => p.classList.remove('active'));
      const activePanel = document.getElementById(target);
      if (activePanel) activePanel.classList.add('active');
    });
  });

  // ============================================================================
  // 3. BOOKINGS MANAGEMENT (TAB 1)
  // ============================================================================
  async function loadBookings() {
    bookingsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Fetching client reservations...</td></tr>`;
    cachedBookings = await window.AureusDB.getBookings();
    renderBookings();
    updateMetrics();
  }

  function updateMetrics() {
    const total = cachedBookings.length;
    const confirmed = cachedBookings.filter(b => b.status === 'confirmed').length;
    const pending = cachedBookings.filter(b => b.status === 'pending').length;
    const revenue = cachedBookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

    const currencySymbol = (window.AUREUS_CONFIG && window.AUREUS_CONFIG.payment && window.AUREUS_CONFIG.payment.currencySymbol) || '$';

    if (metricTotalBookings) metricTotalBookings.textContent = total;
    if (metricTotalRevenue) metricTotalRevenue.textContent = `${currencySymbol}${revenue.toFixed(0)}`;
    if (metricConfirmed) metricConfirmed.textContent = confirmed;
    if (metricPending) metricPending.textContent = pending;
  }

  function renderBookings() {
    const searchVal = (bookingsSearch ? bookingsSearch.value : '').toLowerCase().trim();
    const filterVal = (bookingsFilterStatus ? bookingsFilterStatus.value : 'all');

    let filtered = cachedBookings.filter(b => {
      const matchesFilter = filterVal === 'all' || b.status === filterVal;
      const matchesSearch = !searchVal ||
        (b.client_name && b.client_name.toLowerCase().includes(searchVal)) ||
        (b.client_phone && b.client_phone.includes(searchVal)) ||
        (b.confirmation_code && b.confirmation_code.toLowerCase().includes(searchVal)) ||
        (b.service_name && b.service_name.toLowerCase().includes(searchVal));
      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      bookingsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
            No client reservations found matching your criteria.
          </td>
        </tr>
      `;
      return;
    }

    const currencySymbol = (window.AUREUS_CONFIG && window.AUREUS_CONFIG.payment && window.AUREUS_CONFIG.payment.currencySymbol) || '$';

    bookingsTableBody.innerHTML = filtered.map(b => {
      const dateFormatted = b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
      const isPaid = b.payment_status === 'paid';

      return `
        <tr data-id="${b.id}">
          <td>
            <strong style="color: var(--gold);">${b.confirmation_code || '#AB-0000'}</strong>
            <br>
            <small style="color: var(--text-muted);">${dateFormatted}</small>
          </td>
          <td>
            <strong>${escapeHtml(b.client_name)}</strong>
            <br>
            <a href="tel:${escapeHtml(b.client_phone)}" style="color: var(--text-muted); text-decoration: none; font-size: 0.75rem;">
              📞 ${escapeHtml(b.client_phone)}
            </a>
          </td>
          <td>
            <span style="font-weight: 600;">${escapeHtml(b.service_name)}</span>
          </td>
          <td>
            <span>${escapeHtml(b.barber_name)}</span>
            <br>
            <small style="color: var(--gold);">${b.booking_date} @ ${b.time_slot}</small>
          </td>
          <td>
            <strong>${currencySymbol}${Number(b.total_price || 0).toFixed(2)}</strong>
            <br>
            <span class="badge-payment ${isPaid ? 'paid' : 'pending'}">
              ${isPaid ? '✓ PAID' : 'PENDING'} (${b.payment_method === 'online' ? 'Online' : 'Atelier'})
            </span>
          </td>
          <td>
            <span class="badge-status ${b.status}">${b.status}</span>
          </td>
          <td>
            <div class="table-actions">
              ${b.status !== 'confirmed' ? `<button class="btn-tbl-action" onclick="window.setBookingStatus('${b.id}', 'confirmed')" title="Confirm">Confirm</button>` : ''}
              ${b.status !== 'completed' ? `<button class="btn-tbl-action" onclick="window.setBookingStatus('${b.id}', 'completed')" title="Complete">Done</button>` : ''}
              ${b.status !== 'cancelled' ? `<button class="btn-tbl-action" onclick="window.setBookingStatus('${b.id}', 'cancelled')" title="Cancel">Cancel</button>` : ''}
              <button class="btn-tbl-action delete" onclick="window.removeBooking('${b.id}')" title="Delete">🗑</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.setBookingStatus = async function(id, newStatus) {
    await window.AureusDB.updateBookingStatus(id, newStatus);
    const item = cachedBookings.find(b => b.id === id);
    if (item) item.status = newStatus;
    renderBookings();
    updateMetrics();
    showToast(`Appointment status updated to ${newStatus}.`, 'success');
  };

  window.removeBooking = async function(id) {
    if (!confirm('Are you sure you want to permanently delete this reservation record?')) return;
    await window.AureusDB.deleteBooking(id);
    cachedBookings = cachedBookings.filter(b => b.id !== id);
    renderBookings();
    updateMetrics();
    showToast('Reservation deleted.', 'success');
  };

  if (bookingsSearch) bookingsSearch.addEventListener('input', renderBookings);
  if (bookingsFilterStatus) bookingsFilterStatus.addEventListener('change', renderBookings);
  if (btnRefreshBookings) btnRefreshBookings.addEventListener('click', loadBookings);

  // CSV Export
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      if (!cachedBookings.length) {
        showToast('No bookings to export.', 'error');
        return;
      }
      const headers = ['Code', 'Created At', 'Client Name', 'Client Phone', 'Service', 'Barber', 'Booking Date', 'Time Slot', 'Price', 'Payment Method', 'Payment Status', 'Status'];
      const rows = cachedBookings.map(b => [
        b.confirmation_code,
        b.created_at,
        `"${(b.client_name || '').replace(/"/g, '""')}"`,
        `"${b.client_phone}"`,
        `"${(b.service_name || '').replace(/"/g, '""')}"`,
        `"${(b.barber_name || '').replace(/"/g, '""')}"`,
        b.booking_date,
        b.time_slot,
        b.total_price,
        b.payment_method,
        b.payment_status,
        b.status
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `aureus-blade-bookings-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Bookings exported to CSV.', 'success');
    });
  }

  // ============================================================================
  // 4. SERVICES & PRICING MANAGEMENT (TAB 2)
  // ============================================================================
  async function loadServices() {
    cachedServices = await window.AureusDB.getServices();
    renderServices();
  }

  function renderServices() {
    const currencySymbol = (window.AUREUS_CONFIG && window.AUREUS_CONFIG.payment && window.AUREUS_CONFIG.payment.currencySymbol) || '$';

    servicesContainer.innerHTML = cachedServices.map(s => {
      return `
        <div class="service-admin-card" data-service-id="${s.id}">
          <div>
            <div class="service-admin-header">
              <h4 class="service-admin-title">${escapeHtml(s.title)}</h4>
              <span class="service-admin-price">${currencySymbol}${Number(s.price).toFixed(0)}</span>
            </div>
            <div class="service-admin-meta">
              <span>⏱ ${escapeHtml(s.duration || '45 MIN')}</span>
              <span>•</span>
              <span style="font-family: monospace; color: var(--text-muted); font-size: 0.7rem;">ID: ${s.id}</span>
            </div>
            <p class="service-admin-desc">${escapeHtml(s.description || '')}</p>
          </div>

          <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button type="button" class="btn-admin-action" style="flex: 1; justify-content: center;" onclick="window.openEditService('${s.id}')">
              ✏ Edit Ritual &amp; Price
            </button>
            <button type="button" class="btn-admin-action delete" style="padding: 0.45rem 0.75rem;" onclick="window.removeService('${s.id}')" title="Delete Ritual">
              🗑
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.openEditService = function(id) {
    const service = cachedServices.find(s => s.id === id);
    if (!service) return;

    modalServiceHeading.textContent = 'Edit Grooming Ritual';
    document.getElementById('edit-service-id').value = service.id;
    document.getElementById('edit-service-title').value = service.title;
    document.getElementById('edit-service-price').value = service.price;
    document.getElementById('edit-service-duration').value = service.duration;
    document.getElementById('edit-service-desc').value = service.description || '';

    editServiceModal.classList.add('active');
  };

  window.removeService = async function(id) {
    if (!confirm('Are you sure you want to remove this service ritual?')) return;
    await window.AureusDB.deleteService(id);
    cachedServices = cachedServices.filter(s => s.id !== id);
    renderServices();
    showToast('Service ritual removed.', 'success');
  };

  if (btnAddNewService) {
    btnAddNewService.addEventListener('click', () => {
      modalServiceHeading.textContent = 'Add New Bespoke Ritual';
      document.getElementById('edit-service-id').value = '';
      document.getElementById('edit-service-title').value = '';
      document.getElementById('edit-service-price').value = 60;
      document.getElementById('edit-service-duration').value = '45 MIN';
      document.getElementById('edit-service-desc').value = '';
      editServiceModal.classList.add('active');
    });
  }

  if (btnCloseServiceModal) {
    btnCloseServiceModal.addEventListener('click', () => {
      editServiceModal.classList.remove('active');
    });
  }

  if (formEditService) {
    formEditService.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-service-id').value;
      const title = document.getElementById('edit-service-title').value.trim();
      const price = Number(document.getElementById('edit-service-price').value);
      const duration = document.getElementById('edit-service-duration').value.trim();
      const description = document.getElementById('edit-service-desc').value.trim();

      if (id) {
        // Update existing
        await window.AureusDB.updateService(id, { title, price, duration, description });
        const item = cachedServices.find(s => s.id === id);
        if (item) Object.assign(item, { title, price, duration, description });
        showToast(`Updated pricing and details for "${title}".`, 'success');
      } else {
        // Add new
        const newObj = await window.AureusDB.addService({
          title,
          price,
          duration,
          description,
          features: ['Artisan Scissor & Razor Consultation', 'Scalp Refresh', 'Hot Towel Finish']
        });
        cachedServices.push(newObj);
        showToast(`Created new ritual "${title}".`, 'success');
      }

      renderServices();
      editServiceModal.classList.remove('active');
    });
  }

  // ============================================================================
  // 5. WEBSITE IMAGES MANAGER (TAB 3)
  // ============================================================================
  const IMAGE_LABELS = {
    hero_bg: { title: 'Hero Background Atelier Interior', category: 'Hero Showcase' },
    barber_marcus: { title: 'Marcus Vance Portrait', category: 'Master Barber' },
    barber_julian: { title: 'Julian Drake Portrait', category: 'Master Barber' },
    barber_alexander: { title: 'Alexander Roy Portrait', category: 'Master Barber' },
    gallery_1: { title: 'Portfolio Item 1: Razor Fade', category: 'Gallery Portfolio' },
    gallery_2: { title: 'Portfolio Item 2: Hot Towel Shave', category: 'Gallery Portfolio' },
    gallery_3: { title: 'Portfolio Item 3: Japanese Shears', category: 'Gallery Portfolio' },
    gallery_4: { title: 'Portfolio Item 4: Sovereign Pompadour', category: 'Gallery Portfolio' },
    gallery_5: { title: 'Portfolio Item 5: Heritage Lounge', category: 'Gallery Portfolio' },
    gallery_6: { title: 'Portfolio Item 6: Low Drop Fade', category: 'Gallery Portfolio' }
  };

  async function loadImages() {
    cachedImages = await window.AureusDB.getImages();
    renderImages();
  }

  function renderImages() {
    imagesContainer.innerHTML = Object.keys(IMAGE_LABELS).map(key => {
      const meta = IMAGE_LABELS[key];
      const currentUrl = cachedImages[key] || 'assets/images/hero.jpg';

      return `
        <div class="image-admin-card" data-image-key="${key}">
          <div class="image-preview-wrapper">
            <img src="${escapeHtml(currentUrl)}" alt="${escapeHtml(meta.title)}" class="image-preview-img" id="preview-${key}" onerror="this.src='assets/images/hero.jpg'">
          </div>
          <div class="image-card-body">
            <div>
              <div class="image-label-title">${meta.title}</div>
              <div class="image-key-tag">${key} &bull; ${meta.category}</div>
            </div>

            <input type="text" class="image-url-input" id="input-img-${key}" value="${escapeHtml(currentUrl)}" placeholder="assets/images/... or https://..." onchange="window.previewImageChange('${key}')">

            <div style="display: flex; gap: 0.5rem;">
              <button type="button" class="btn-admin-action" style="flex: 1; justify-content: center;" onclick="window.saveSingleImage('${key}')">
                Save Visual
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.previewImageChange = function(key) {
    const input = document.getElementById('input-img-' + key);
    const preview = document.getElementById('preview-' + key);
    if (input && preview) {
      preview.src = input.value;
    }
  };

  window.saveSingleImage = async function(key) {
    const input = document.getElementById('input-img-' + key);
    if (!input) return;
    const url = input.value.trim();
    if (!url) {
      showToast('Image URL cannot be empty.', 'error');
      return;
    }
    await window.AureusDB.updateImage(key, url);
    cachedImages[key] = url;
    showToast(`Visual updated for ${IMAGE_LABELS[key] ? IMAGE_LABELS[key].title : key}.`, 'success');
  };

  if (btnSaveAllImages) {
    btnSaveAllImages.addEventListener('click', async () => {
      btnSaveAllImages.disabled = true;
      btnSaveAllImages.textContent = 'SAVING VISUALS...';

      for (const key of Object.keys(IMAGE_LABELS)) {
        const input = document.getElementById('input-img-' + key);
        if (input) {
          const url = input.value.trim();
          if (url) {
            await window.AureusDB.updateImage(key, url);
            cachedImages[key] = url;
          }
        }
      }

      btnSaveAllImages.disabled = false;
      btnSaveAllImages.textContent = '💾 Save All Visuals';
      showToast('All website images successfully synchronized.', 'success');
    });
  }

  // ============================================================================
  // 6. SETTINGS & PAYMENT GATEWAY (TAB 4)
  // ============================================================================
  function loadSettingsInputs() {
    const cfg = window.AUREUS_CONFIG || {};

    // Supabase
    if (document.getElementById('cfg-sb-url')) document.getElementById('cfg-sb-url').value = cfg.supabaseUrl || '';
    if (document.getElementById('cfg-sb-key')) document.getElementById('cfg-sb-key').value = cfg.supabaseAnonKey || '';

    // Payment
    if (cfg.payment) {
      if (document.getElementById('cfg-pay-provider')) document.getElementById('cfg-pay-provider').value = cfg.payment.provider || 'razorpay';
      if (document.getElementById('cfg-pay-mode')) document.getElementById('cfg-pay-mode').value = cfg.payment.mode || 'test';
      if (document.getElementById('cfg-pay-key')) document.getElementById('cfg-pay-key').value = cfg.payment.keyId || '';
      if (document.getElementById('cfg-pay-curr')) document.getElementById('cfg-pay-curr').value = cfg.payment.currency || 'USD';
    }

    // Admin
    if (cfg.admin) {
      if (document.getElementById('cfg-admin-email')) document.getElementById('cfg-admin-email').value = cfg.admin.email || 'admin@aureusblade.com';
    }
  }

  if (formSupabase) {
    formSupabase.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = document.getElementById('cfg-sb-url').value.trim();
      const key = document.getElementById('cfg-sb-key').value.trim();

      window.saveAureusConfig({
        supabaseUrl: url,
        supabaseAnonKey: key
      });

      updateDbStatus();
      showToast('Supabase database credentials saved.', 'success');
    });
  }

  if (formPayment) {
    formPayment.addEventListener('submit', (e) => {
      e.preventDefault();
      const provider = document.getElementById('cfg-pay-provider').value;
      const mode = document.getElementById('cfg-pay-mode').value;
      const keyId = document.getElementById('cfg-pay-key').value.trim();
      const currency = document.getElementById('cfg-pay-curr').value;
      const currencySymbol = currency === 'INR' ? '₹' : (currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : '$'));

      window.saveAureusConfig({
        payment: {
          provider,
          mode,
          keyId,
          currency,
          currencySymbol,
          enableOnlinePayment: true,
          enablePayAtAtelier: true
        }
      });

      showToast('Payment gateway configuration saved.', 'success');
    });
  }

  if (formAdmin) {
    formAdmin.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('cfg-admin-email').value.trim();
      const newPass = document.getElementById('cfg-admin-pass').value;

      const adminUpdate = { email };
      if (newPass) adminUpdate.password = newPass;

      window.saveAureusConfig({ admin: adminUpdate });
      showToast('Admin access credentials updated.', 'success');
    });
  }

  // ============================================================================
  // 7. TOAST NOTIFICATION UTILITY
  // ============================================================================
  function showToast(msg, type = 'success') {
    const container = document.getElementById('admin-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    const icon = type === 'success' ? '✓' : '⚠';
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(msg)}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run initial Auth Check
  checkAuth();
});
