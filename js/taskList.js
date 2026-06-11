// ============================================
// Task List Module — Search, Filter, Sort
// ============================================

const TaskList = {
  _currentSearch: '',
  _currentStatus: 'All',
  _currentDate: 'All',
  _currentSort: 'date-desc',

  /**
   * Render the task list view
   */
  render() {
    const container = document.getElementById('view-tasks');

    container.innerHTML = `
      <div class="task-list-view">
        <div class="task-list-view__header">
          <h2 class="task-list-view__title">All Tasks</h2>

          <div class="task-list-view__toolbar">
            <!-- Search -->
            <div class="search-bar">
              <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                class="search-bar__input"
                id="task-search"
                placeholder="Search tasks, people, projects..."
                value="${Utils.escapeHtml(this._currentSearch)}"
                autocomplete="off"
              />
              <button class="search-bar__clear" onclick="TaskList.clearSearch()" aria-label="Clear search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Filters -->
            <div class="task-list-view__filters">
              <!-- Status filters -->
              <div class="filter-group" id="status-filters">
                ${['All', 'Pending', 'In Progress', 'Completed', 'On Hold']
                  .map(
                    (s) =>
                      `<button class="filter-chip ${this._currentStatus === s ? 'active' : ''}" data-status="${s}" onclick="TaskList.filterByStatus('${s}')">${s}</button>`
                  )
                  .join('')}
              </div>

              <!-- Date filters -->
              <div class="filter-group" id="date-filters">
                ${['All', 'Today', 'This Week', 'This Month']
                  .map(
                    (d) =>
                      `<button class="filter-chip ${this._currentDate === d ? 'active' : ''}" data-date="${d}" onclick="TaskList.filterByDate('${d}')">${d}</button>`
                  )
                  .join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="task-list-view__count" id="task-count"></div>

        <div class="task-grid stagger-children" id="task-grid">
        </div>
      </div>
    `;

    // Attach search handler
    const searchInput = document.getElementById('task-search');
    searchInput.addEventListener(
      'input',
      Utils.debounce((e) => {
        this._currentSearch = e.target.value;
        this._renderTasks();
      }, 200)
    );

    // Render tasks
    this._renderTasks();
  },

  /**
   * Render filtered & sorted task cards
   */
  _renderTasks() {
    let tasks = Store.searchTasks(this._currentSearch);
    tasks = Store.filterTasks(tasks, {
      status: this._currentStatus,
      dateRange: this._currentDate === 'All' ? null : this._currentDate,
    });
    tasks = Store.sortTasks(tasks, this._currentSort);

    const grid = document.getElementById('task-grid');
    const countEl = document.getElementById('task-count');

    if (countEl) {
      countEl.innerHTML = `Showing <strong>${tasks.length}</strong> task${tasks.length !== 1 ? 's' : ''}`;
    }

    if (tasks.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </div>
          <div class="empty-state__title">No tasks found</div>
          <div class="empty-state__text">${
            this._currentSearch
              ? 'Try a different search term'
              : 'No tasks match the selected filters'
          }</div>
          <button class="btn btn--primary" onclick="App.navigate('add')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Task
          </button>
        </div>
      `;
      grid.classList.remove('stagger-children');
      return;
    }

    grid.classList.add('stagger-children');
    grid.innerHTML = tasks.map((task) => this._renderTaskCard(task)).join('');
  },

  /**
   * Render a task card for the list
   */
  _renderTaskCard(task) {
    const statusClass = Utils.getStatusClass(task.status);

    return `
      <div class="task-card--list card--clickable" onclick="App.navigate('task/${task.id}')">
        <div class="task-card__accent task-card__accent--${statusClass}"></div>
        <div class="task-card__body">
          <div class="task-card__top">
            <div class="task-card__title">${Utils.escapeHtml(task.title)}</div>
            <span class="badge-status badge-status--${statusClass}">
              <span class="badge-status__dot"></span>
              ${task.status}
            </span>
          </div>
          ${task.description ? `<div class="task-card__desc">${Utils.escapeHtml(task.description)}</div>` : ''}
          <div class="task-card__footer">
            <div class="task-card__tags">
              <span class="task-card__tag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${Utils.escapeHtml(task.collaboratedWith)}
              </span>
              ${
                task.project
                  ? `<span class="task-card__tag">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                      ${Utils.escapeHtml(task.project)}
                    </span>`
                  : ''
              }
            </div>
            <span class="task-card__date">${Utils.formatDate(task.date)}</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Filter by status
   */
  filterByStatus(status) {
    this._currentStatus = status;
    // Update active chip
    document.querySelectorAll('#status-filters .filter-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.status === status);
    });
    this._renderTasks();
  },

  /**
   * Filter by date range
   */
  filterByDate(dateRange) {
    this._currentDate = dateRange;
    document.querySelectorAll('#date-filters .filter-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.date === dateRange);
    });
    this._renderTasks();
  },

  /**
   * Clear search
   */
  clearSearch() {
    this._currentSearch = '';
    const input = document.getElementById('task-search');
    if (input) {
      input.value = '';
      input.focus();
    }
    this._renderTasks();
  },

  /**
   * Reset all filters
   */
  resetFilters() {
    this._currentSearch = '';
    this._currentStatus = 'All';
    this._currentDate = 'All';
    this._currentSort = 'date-desc';
  },
};
