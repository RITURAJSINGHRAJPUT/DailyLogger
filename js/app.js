// ============================================
// App — Router, Navigation & Shell
// ============================================

const App = {
  _currentView: 'dashboard',
  _deferredPrompt: null,

  /**
   * Initialize the app
   */
  init() {
    // Seed sample data on first run
    Store.seedSampleData();

    // Register service worker
    this._registerSW();

    // Handle PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._deferredPrompt = e;
    });

    // Listen for hash changes
    window.addEventListener('hashchange', () => this._handleRoute());

    // Listen for data changes
    Store.onChange(() => {
      if (this._currentView === 'dashboard') {
        Dashboard.render();
      }
    });

    // Initial route
    this._handleRoute();

    // Setup global click handler for closing dropdowns
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dot-menu-btn') && !e.target.closest('.dropdown-menu')) {
        document.querySelectorAll('.dropdown-menu').forEach((m) => m.remove());
      }
    });
  },

  /**
   * Handle hash-based routing
   */
  _handleRoute() {
    const hash = location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);
    const route = parts[0] || 'dashboard';
    const param = parts[1] || null;

    // Hide all views
    document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));

    // Update navigation
    this._updateNav(route);

    switch (route) {
      case 'dashboard':
        this._showView('view-dashboard');
        this._currentView = 'dashboard';
        Dashboard.render();
        break;

      case 'tasks':
        this._showView('view-tasks');
        this._currentView = 'tasks';
        TaskList.render();
        break;

      case 'add':
        this._showView('view-form');
        this._currentView = 'form';
        TaskForm.render();
        break;

      case 'edit':
        if (param) {
          this._showView('view-form');
          this._currentView = 'form';
          TaskForm.render(param);
        }
        break;

      case 'task':
        if (param) {
          this._showView('view-detail');
          this._currentView = 'detail';
          TaskDetail.render(param);
        }
        break;

      case 'summary':
        this._showView('view-summary');
        this._currentView = 'summary';
        DailySummary.render();
        break;

      case 'reports':
        this._showView('view-reports');
        this._currentView = 'reports';
        ExportManager.render();
        break;

      case 'settings':
        this._showView('view-settings');
        this._currentView = 'settings';
        this._renderSettings();
        break;

      default:
        this.navigate('dashboard');
        break;
    }

    // Scroll to top
    window.scrollTo(0, 0);
  },

  /**
   * Show a specific view
   */
  _showView(viewId) {
    const view = document.getElementById(viewId);
    if (view) {
      view.classList.remove('hidden');
      view.style.animation = 'fadeIn 200ms ease';
    }
  },

  /**
   * Navigate to a route
   */
  navigate(route) {
    location.hash = `#/${route}`;
  },

  /**
   * Update active navigation state
   */
  _updateNav(route) {
    // Bottom nav
    document.querySelectorAll('.bottom-nav__item').forEach((item) => {
      item.classList.toggle('active', item.dataset.route === route);
    });

    // Desktop nav
    document.querySelectorAll('.desktop-nav__item').forEach((item) => {
      item.classList.toggle('active', item.dataset.route === route);
    });

    // Sidebar nav (mobile drawer)
    document.querySelectorAll('.sidebar__nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.route === route);
    });
  },

  // ---------- Modal ----------

  /**
   * Close the modal
   */
  closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    backdrop.classList.remove('active');
  },

  // ---------- Sidebar Drawer ----------

  /**
   * Open the mobile sidebar drawer
   */
  openSidebar() {
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) {
      backdrop.classList.add('active');
      // Highlight current route item
      const hash = location.hash.slice(1) || '/';
      const parts = hash.split('/').filter(Boolean);
      const route = parts[0] || 'dashboard';
      backdrop.querySelectorAll('.sidebar__nav-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.route === route);
      });
    }
  },

  /**
   * Close the mobile sidebar drawer
   */
  closeSidebar() {
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
    }
  },

  /**
   * Show delete confirmation
   */
  confirmDelete(taskId) {
    const task = Store.getTaskById(taskId);
    if (!task) return;

    const backdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById('modal-container');

    modal.innerHTML = `
      <div class="modal__handle"></div>
      <div style="text-align:center;padding:var(--space-md) 0;">
        <div style="width:56px;height:56px;border-radius:50%;background:#fdf2f2;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-md);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </div>
        <h3 style="font-size:var(--font-lg);font-weight:700;margin-bottom:var(--space-sm);">Delete Task?</h3>
        <p style="font-size:var(--font-sm);color:var(--text-secondary);max-width:280px;margin:0 auto;">
          Are you sure you want to delete "<strong>${Utils.escapeHtml(task.title)}</strong>"? This action cannot be undone.
        </p>
      </div>
      <div class="modal__actions">
        <button class="btn btn--secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn" style="background:#e74c3c;color:white;" onclick="App._deleteTask('${taskId}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          Delete
        </button>
      </div>
    `;

    backdrop.classList.add('active');
  },

  /**
   * Delete a task and navigate
   */
  _deleteTask(taskId) {
    Store.deleteTask(taskId);
    this.closeModal();
    this.showToast('Task deleted successfully', 'success');
    this.navigate('tasks');
  },

  // ---------- Toast ----------

  /**
   * Show a toast notification
   */
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');

    const iconMap = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f39c12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${iconMap[type] || iconMap.success}</span>
      <span>${message}</span>
      <button class="toast__close" onclick="this.closest('.toast').remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    container.appendChild(toast);

    // Auto-remove after 3s
    setTimeout(() => {
      toast.style.animation = 'fadeIn 200ms ease reverse';
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  },

  // ---------- Search Overlay ----------

  /**
   * Open search overlay
   */
  openSearch() {
    const overlay = document.getElementById('search-overlay');
    overlay.classList.add('active');
    setTimeout(() => {
      const input = overlay.querySelector('.search-bar__input');
      if (input) input.focus();
    }, 100);

    // Render search UI
    overlay.innerHTML = `
      <div class="search-overlay__header">
        <button class="btn--icon" onclick="App.closeSearch()" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="search-bar" style="flex:1;">
          <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="search-bar__input" id="global-search-input" placeholder="Search tasks..." autocomplete="off" />
        </div>
      </div>
      <div class="search-overlay__results" id="global-search-results">
        <p class="text-secondary" style="padding:var(--space-xl);text-align:center;font-size:var(--font-sm);">Start typing to search...</p>
      </div>
    `;

    const input = document.getElementById('global-search-input');
    input.focus();
    input.addEventListener(
      'input',
      Utils.debounce((e) => {
        this._renderSearchResults(e.target.value);
      }, 200)
    );
  },

  /**
   * Close search overlay
   */
  closeSearch() {
    const overlay = document.getElementById('search-overlay');
    overlay.classList.remove('active');
  },

  /**
   * Render search results
   */
  _renderSearchResults(query) {
    const results = document.getElementById('global-search-results');
    if (!query.trim()) {
      results.innerHTML = '<p class="text-secondary" style="padding:var(--space-xl);text-align:center;font-size:var(--font-sm);">Start typing to search...</p>';
      return;
    }

    const tasks = Store.searchTasks(query);
    if (tasks.length === 0) {
      results.innerHTML = `
        <div class="empty-state" style="padding:var(--space-xl) 0;">
          <div class="empty-state__title">No results</div>
          <div class="empty-state__text">No tasks match "${Utils.escapeHtml(query)}"</div>
        </div>
      `;
      return;
    }

    results.innerHTML = tasks
      .slice(0, 10)
      .map((task) => {
        const statusClass = Utils.getStatusClass(task.status);
        return `
          <div class="task-card card--clickable" onclick="App.closeSearch(); App.navigate('task/${task.id}')" style="margin-bottom:var(--space-sm);">
            <div class="task-card__accent task-card__accent--${statusClass}"></div>
            <div class="task-card__content">
              <div class="task-card__title">${Utils.escapeHtml(task.title)}</div>
              <div class="task-card__meta">
                <span>${Utils.escapeHtml(task.collaboratedWith)}</span>
                <span class="task-card__meta-sep"></span>
                <span>${Utils.formatDate(task.date)}</span>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  },

  // ---------- Settings ----------

  /**
   * Render settings view
   */
  _renderSettings() {
    const container = document.getElementById('view-settings');
    const taskCount = Store.getAllTasks().length;

    container.innerHTML = `
      <div class="settings-view">
        <h2 class="settings-view__title">Settings</h2>

        <div class="settings-group">
          <div class="settings-group__title">Data</div>

          <div class="settings-item" onclick="ExportManager.exportJSON()">
            <div class="settings-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <div class="settings-item__info">
              <div class="settings-item__label">Export Data</div>
              <div class="settings-item__desc">${taskCount} tasks stored locally</div>
            </div>
            <div class="settings-item__arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>

          <div class="settings-item" onclick="App._showImportModal()">
            <div class="settings-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div class="settings-item__info">
              <div class="settings-item__label">Import Data</div>
              <div class="settings-item__desc">Restore from backup file</div>
            </div>
            <div class="settings-item__arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group__title">App</div>

          <div class="settings-item" id="install-app-btn" onclick="App._installApp()" style="${this._deferredPrompt ? '' : 'display:none;'}">
            <div class="settings-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <div class="settings-item__info">
              <div class="settings-item__label">Install App</div>
              <div class="settings-item__desc">Add to home screen for quick access</div>
            </div>
            <div class="settings-item__arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group__title">Danger Zone</div>

          <div class="settings-item settings-item--danger" onclick="App._confirmClearData()">
            <div class="settings-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </div>
            <div class="settings-item__info">
              <div class="settings-item__label">Clear All Data</div>
              <div class="settings-item__desc">Permanently delete all tasks and activity</div>
            </div>
            <div class="settings-item__arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        </div>

        <div class="settings-version">
          <p>Daily Logger v1.0.0</p>
          <p style="margin-top:4px;">Made with ❤️ for productivity</p>
        </div>
      </div>
    `;
  },

  /**
   * Install PWA
   */
  async _installApp() {
    if (!this._deferredPrompt) return;
    this._deferredPrompt.prompt();
    const { outcome } = await this._deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.showToast('App installed!', 'success');
    }
    this._deferredPrompt = null;
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) installBtn.style.display = 'none';
  },

  /**
   * Show import modal
   */
  _showImportModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById('modal-container');

    modal.innerHTML = `
      <div class="modal__handle"></div>
      <div class="modal__header">
        <h3 class="modal__title">Import Data</h3>
        <button class="modal__close" onclick="App.closeModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="form">
        <div class="form-group">
          <label class="form-group__label">Select Backup File</label>
          <input type="file" id="import-file" class="form-input" accept=".json" style="padding:10px;" />
          <div class="form-group__hint">Select a JSON backup file previously exported from this app</div>
        </div>
      </div>
      <div class="modal__actions">
        <button class="btn btn--secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn--primary" onclick="App._handleImport()">Import</button>
      </div>
    `;

    backdrop.classList.add('active');
  },

  /**
   * Handle import
   */
  _handleImport() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    if (!file) {
      this.showToast('Please select a file', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const success = Store.importData(e.target.result);
      if (success) {
        this.showToast('Data imported successfully!', 'success');
        this.closeModal();
        this.navigate('dashboard');
      } else {
        this.showToast('Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
  },

  /**
   * Confirm clear all data
   */
  _confirmClearData() {
    const backdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById('modal-container');

    modal.innerHTML = `
      <div class="modal__handle"></div>
      <div style="text-align:center;padding:var(--space-md) 0;">
        <div style="width:56px;height:56px;border-radius:50%;background:#fdf2f2;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-md);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h3 style="font-size:var(--font-lg);font-weight:700;margin-bottom:var(--space-sm);">Clear All Data?</h3>
        <p style="font-size:var(--font-sm);color:var(--text-secondary);max-width:280px;margin:0 auto;">
          This will permanently delete all tasks, activity history, and settings. This cannot be undone.
        </p>
      </div>
      <div class="modal__actions">
        <button class="btn btn--secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn--danger" onclick="Store.clearAllData(); App.closeModal(); App.showToast('All data cleared', 'success'); App.navigate('dashboard');">
          Clear Everything
        </button>
      </div>
    `;

    backdrop.classList.add('active');
  },

  // ---------- Service Worker ----------

  /**
   * Register service worker
   */
  async _registerSW() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('./sw.js');
        console.log('Service Worker registered');

        // Reload the page when a new service worker takes control (automatic updates)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      } catch (err) {
        console.log('SW registration failed:', err);
      }
    }
  },
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
