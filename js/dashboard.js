// ============================================
// Dashboard Module
// ============================================

const Dashboard = {
  /**
   * Render the dashboard view
   */
  render() {
    const stats = Store.getTaskStats();
    const todayTasks = Store.getTodayTasks();
    const activities = Store.getActivities().slice(0, 5);

    const container = document.getElementById('view-dashboard');
    container.innerHTML = `
      <div class="dashboard">
        <!-- Daily Overview -->
        <div class="daily-overview">
          <div class="daily-overview__label">Daily Overview</div>

          <!-- Primary Metrics -->
          <div class="metric-cards stagger-children">
            <div class="metric-card">
              <div class="metric-card__label">Total Tasks</div>
              <div class="metric-card__row">
                <span class="metric-card__value metric-card__value--total" data-count="${stats.total}">0</span>
                <div class="metric-card__icon metric-card__icon--total">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                </div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-card__label">Completed</div>
              <div class="metric-card__row">
                <span class="metric-card__value metric-card__value--completed" data-count="${stats.completed}">0</span>
                <div class="metric-card__icon metric-card__icon--completed">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-card__label">In Progress</div>
              <div class="metric-card__row">
                <span class="metric-card__value metric-card__value--inprogress" data-count="${stats.inProgress}">0</span>
                <div class="metric-card__icon metric-card__icon--inprogress">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Secondary Metrics -->
          <div class="metric-secondary stagger-children">
            <div class="metric-secondary__card">
              <div class="metric-secondary__label">Pending</div>
              <div class="metric-secondary__value metric-secondary__value--pending" data-count="${stats.pending}">0</div>
            </div>
            <div class="metric-secondary__card">
              <div class="metric-secondary__label">On Hold</div>
              <div class="metric-secondary__value metric-secondary__value--onhold" data-count="${stats.onHold}">0</div>
            </div>
            <div class="metric-secondary__card metric-secondary__card--efficiency">
              <div class="metric-secondary__label">Efficiency</div>
              <div class="metric-secondary__value" data-count="${stats.efficiency}">0%</div>
            </div>
          </div>
        </div>

        <!-- Today's Tasks -->
        <div class="today-tasks">
          <div class="section-header">
            <h3 class="section-header__title">Today's Tasks</h3>
            <button class="section-header__action" onclick="App.navigate('tasks')">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div class="today-tasks__list stagger-children" id="today-tasks-list">
            ${todayTasks.length > 0
              ? todayTasks.slice(0, 5).map((task) => this._renderTaskCard(task)).join('')
              : this._renderEmptyToday()
            }
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity">
          <div class="section-header">
            <h3 class="section-header__title">Recent Activity</h3>
          </div>
          <div class="activity-list" id="activity-list">
            ${activities.length > 0
              ? activities.map((a) => this._renderActivityItem(a)).join('')
              : '<p class="text-secondary" style="font-size:var(--font-sm);padding:var(--space-md) 0;">No recent activity</p>'
            }
          </div>
        </div>
      </div>
    `;

    // Animate numbers
    requestAnimationFrame(() => {
      container.querySelectorAll('[data-count]').forEach((el) => {
        const target = parseInt(el.dataset.count, 10);
        const isEfficiency = el.closest('.metric-secondary__card--efficiency');
        Utils.animateNumber(el, target, 600);
        if (isEfficiency) {
          setTimeout(() => { el.textContent = target + '%'; }, 620);
        }
      });
    });
  },

  /**
   * Render a single task card for dashboard
   */
  _renderTaskCard(task) {
    const statusClass = Utils.getStatusClass(task.status);
    const timeDisplay = Utils.formatTime(task.createdAt);

    return `
      <div class="task-card card--clickable" onclick="App.navigate('task/${task.id}')">
        <div class="task-card__accent task-card__accent--${statusClass}"></div>
        <div class="task-card__content">
          <div class="task-card__title">${Utils.escapeHtml(task.title)}</div>
          <div class="task-card__meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            <span>${Utils.escapeHtml(task.project)}</span>
            <span class="task-card__meta-sep"></span>
            <span class="task-card__time">${timeDisplay}</span>
          </div>
        </div>
        <div class="task-card__actions">
          <button class="dot-menu-btn" onclick="event.stopPropagation(); Dashboard.showCardMenu(this, '${task.id}')" aria-label="Task options">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Render empty today state
   */
  _renderEmptyToday() {
    return `
      <div class="empty-state" style="padding:var(--space-xl) 0;">
        <div class="empty-state__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div class="empty-state__title">No tasks today</div>
        <div class="empty-state__text">Start logging your activities for today</div>
        <button class="btn btn--primary" onclick="App.navigate('add')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Task
        </button>
      </div>
    `;
  },

  /**
   * Render activity item
   */
  _renderActivityItem(activity) {
    return `
      <div class="activity-item">
        <div class="activity-item__dot"></div>
        <div class="activity-item__content">
          <div class="activity-item__text">${activity.text}</div>
          <div class="activity-item__time">${Utils.getRelativeTime(activity.timestamp)}</div>
        </div>
      </div>
    `;
  },

  /**
   * Show card context menu
   */
  showCardMenu(btn, taskId) {
    // Remove any existing dropdown
    document.querySelectorAll('.dropdown-menu').forEach((m) => m.remove());

    const menu = document.createElement('div');
    menu.className = 'dropdown-menu active';
    menu.innerHTML = `
      <button class="dropdown-menu__item" onclick="App.navigate('task/${taskId}'); this.closest('.dropdown-menu').remove();">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        View Details
      </button>
      <button class="dropdown-menu__item" onclick="App.navigate('edit/${taskId}'); this.closest('.dropdown-menu').remove();">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Edit Task
      </button>
      <button class="dropdown-menu__item dropdown-menu__item--danger" onclick="App.confirmDelete('${taskId}'); this.closest('.dropdown-menu').remove();">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        Delete
      </button>
    `;

    btn.parentElement.appendChild(menu);

    // Close on outside click
    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
  },
};
