// ============================================
// Daily Summary Module
// ============================================

const DailySummary = {
  _selectedDate: Utils.getToday(),

  /**
   * Render the daily summary view
   */
  render() {
    const container = document.getElementById('view-summary');
    const summary = Store.getDailySummary(this._selectedDate);

    container.innerHTML = `
      <div class="summary-view">
        <div class="summary-view__header">
          <button class="task-detail__back" onclick="App.navigate('dashboard')" aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 class="summary-view__title">Daily Summary</h2>
        </div>

        <!-- Date Picker -->
        <div class="summary-card" style="padding:var(--space-md);">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:var(--font-xs);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary);margin-bottom:2px;">Selected Date</div>
              <div style="font-size:var(--font-lg);font-weight:700;">${Utils.formatDateLong(this._selectedDate)}</div>
            </div>
            <input type="date" id="summary-date" class="form-input" style="width:auto;padding:8px 12px;font-size:var(--font-sm);" value="${this._selectedDate}" />
          </div>
        </div>

        ${summary.total > 0 ? this._renderSummaryContent(summary) : this._renderEmptySummary()}
      </div>
    `;

    // Date change handler
    document.getElementById('summary-date').addEventListener('change', (e) => {
      this._selectedDate = e.target.value;
      this.render();
    });
  },

  /**
   * Render summary content when tasks exist
   */
  _renderSummaryContent(summary) {
    return `
      <!-- Stats Overview -->
      <div class="summary-card">
        <div class="summary-card__title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          Task Statistics
        </div>
        <div class="summary-stats">
          <div class="summary-stat">
            <div class="summary-stat__value" style="color:var(--accent-primary);">${summary.total}</div>
            <div class="summary-stat__label">Total Tasks</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat__value" style="color:var(--status-completed);">${summary.completed}</div>
            <div class="summary-stat__label">Completed</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat__value" style="color:var(--status-inprogress);">${summary.inProgress}</div>
            <div class="summary-stat__label">In Progress</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat__value" style="color:var(--status-pending);">${summary.pending}</div>
            <div class="summary-stat__label">Pending</div>
          </div>
        </div>
      </div>

      <!-- Projects -->
      ${
        summary.projects.length > 0
          ? `
        <div class="summary-card">
          <div class="summary-card__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            Projects Worked On
          </div>
          <div class="summary-list">
            ${summary.projects.map((p) => `
              <div class="summary-list__item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                ${Utils.escapeHtml(p)}
              </div>
            `).join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- Task List for the day -->
      <div class="summary-card">
        <div class="summary-card__title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Tasks (${summary.total})
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-sm);">
          ${summary.tasks.map((task) => {
            const statusClass = Utils.getStatusClass(task.status);
            return `
              <div class="task-card card--clickable" onclick="App.navigate('task/${task.id}')" style="margin-bottom:0;">
                <div class="task-card__accent task-card__accent--${statusClass}"></div>
                <div class="task-card__content">
                  <div class="task-card__title">${Utils.escapeHtml(task.title)}</div>
                  <div class="task-card__meta">
                    <span class="badge-status badge-status--${statusClass}" style="font-size:0.65rem;padding:2px 8px;">
                      <span class="badge-status__dot" style="width:5px;height:5px;"></span>
                      ${task.status}
                    </span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Empty state when no tasks for selected date
   */
  _renderEmptySummary() {
    return `
      <div class="empty-state" style="margin-top:var(--space-xl);">
        <div class="empty-state__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div class="empty-state__title">No tasks logged</div>
        <div class="empty-state__text">No tasks were recorded for ${Utils.formatDateLong(this._selectedDate)}</div>
      </div>
    `;
  },
};
