// ============================================
// Task Detail Module
// ============================================

const TaskDetail = {
  /**
   * Render task detail view
   */
  render(taskId) {
    const task = Store.getTaskById(taskId);
    const container = document.getElementById('view-detail');

    if (!task) {
      container.innerHTML = `
        <div class="task-detail-view">
          <div class="empty-state">
            <div class="empty-state__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div class="empty-state__title">Task not found</div>
            <div class="empty-state__text">This task may have been deleted</div>
            <button class="btn btn--primary" onclick="App.navigate('tasks')">View All Tasks</button>
          </div>
        </div>
      `;
      return;
    }

    const statusClass = Utils.getStatusClass(task.status);

    container.innerHTML = `
      <div class="task-detail-view">
        <!-- Header -->
        <div class="task-detail__header">
          <button class="task-detail__back" onclick="history.back()" aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="task-detail__header-info">
            <h2 class="task-detail__title">${Utils.escapeHtml(task.title)}</h2>
            <span class="badge-status badge-status--${statusClass}">
              <span class="badge-status__dot"></span>
              ${task.status}
            </span>
          </div>
        </div>

        <!-- Main Info Card -->
        <div class="task-detail__card">
          <div class="task-detail__field">
            <div class="task-detail__label">Project</div>
            <div class="task-detail__value">${Utils.escapeHtml(task.project || 'Not specified')}</div>
          </div>

          <div class="task-detail__field-row">
            <div class="task-detail__field">
              <div class="task-detail__label">Date</div>
              <div class="task-detail__value">${Utils.formatDateLong(task.date)}</div>
            </div>
            <div class="task-detail__field">
              <div class="task-detail__label">Time Captured</div>
              <div class="task-detail__value">${Utils.formatTime(task.createdAt)}</div>
            </div>
          </div>

          <div class="task-detail__field" style="margin-bottom:0;">
            <div class="task-detail__label">Audit Details</div>
            <div class="task-detail__value" style="font-size:var(--font-sm);color:var(--text-secondary);">
              Task ID: ${task.id}
              ${task.updatedAt !== task.createdAt ? `<br>Last updated: ${Utils.getRelativeTime(task.updatedAt)}` : ''}
            </div>
          </div>
        </div>

        <!-- Quick Status Change -->
        <div class="task-detail__card" style="padding:var(--space-md);">
          <div style="font-size:var(--font-sm);font-weight:600;margin-bottom:var(--space-sm);">Quick Status Change</div>
          <div class="filter-group">
            ${['Pending', 'In Progress', 'Completed', 'On Hold']
              .map(
                (s) =>
                  `<button class="filter-chip ${task.status === s ? 'active' : ''}" onclick="TaskDetail.changeStatus('${task.id}', '${s}')">${s}</button>`
              )
              .join('')}
          </div>
        </div>

        <!-- Actions -->
        <div class="task-detail__actions">
          <button class="btn btn--primary btn--lg" onclick="App.navigate('edit/${task.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Task
          </button>
          <button class="btn btn--outline btn--lg" style="border-color:#e74c3c;color:#e74c3c;" onclick="App.confirmDelete('${task.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            Delete
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Quick status change
   */
  changeStatus(taskId, newStatus) {
    Store.updateTask(taskId, { status: newStatus });
    App.showToast(`Status changed to ${newStatus}`, 'success');
    this.render(taskId);
  },
};
