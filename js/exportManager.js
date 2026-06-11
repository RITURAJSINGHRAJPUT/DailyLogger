// ============================================
// Export Manager — PDF & CSV
// ============================================

const ExportManager = {
  /**
   * Render the reports/export view
   */
  render() {
    const container = document.getElementById('view-reports');

    container.innerHTML = `
      <div class="reports-view">
        <h2 class="reports-view__title">Reports & Export</h2>

        <!-- Daily Summary -->
        <div class="report-option" onclick="App.navigate('summary')">
          <div class="report-option__icon report-option__icon--summary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          </div>
          <div class="report-option__info">
            <div class="report-option__title">Daily Summary</div>
            <div class="report-option__desc">View detailed daily activity summary</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <!-- CSV Export -->
        <div class="report-option" onclick="ExportManager.showExportModal('csv')">
          <div class="report-option__icon report-option__icon--csv">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div class="report-option__info">
            <div class="report-option__title">Export as CSV</div>
            <div class="report-option__desc">Download spreadsheet with task data</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <!-- PDF Export -->
        <div class="report-option" onclick="ExportManager.showExportModal('pdf')">
          <div class="report-option__icon report-option__icon--pdf">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div class="report-option__info">
            <div class="report-option__title">Export as PDF</div>
            <div class="report-option__desc">Generate printable report</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <!-- Export Data -->
        <div class="report-option" onclick="ExportManager.exportJSON()">
          <div class="report-option__icon" style="background:var(--bg-tertiary);color:var(--text-secondary);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div class="report-option__info">
            <div class="report-option__title">Backup Data (JSON)</div>
            <div class="report-option__desc">Export all data for backup</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    `;
  },

  /**
   * Show export modal with date range selection
   */
  showExportModal(type) {
    const today = Utils.getToday();
    const monthStart = Utils.getMonthRange().start;

    const backdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById('modal-container');

    modal.innerHTML = `
      <div class="modal__handle"></div>
      <div class="modal__header">
        <h3 class="modal__title">Export as ${type.toUpperCase()}</h3>
        <button class="modal__close" onclick="App.closeModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="form">
        <div class="form-group">
          <label class="form-group__label">Date Range</label>
          <div class="filter-group" id="export-range-options" style="flex-wrap:wrap;">
            <button class="filter-chip active" data-range="month" onclick="ExportManager._selectRange(this, 'month')">This Month</button>
            <button class="filter-chip" data-range="week" onclick="ExportManager._selectRange(this, 'week')">This Week</button>
            <button class="filter-chip" data-range="all" onclick="ExportManager._selectRange(this, 'all')">All Time</button>
            <button class="filter-chip" data-range="custom" onclick="ExportManager._selectRange(this, 'custom')">Custom</button>
          </div>
        </div>

        <div id="custom-date-range" class="hidden">
          <div class="form-row">
            <div class="form-group">
              <label class="form-group__label">From</label>
              <input type="date" id="export-from" class="form-input" value="${monthStart}" />
            </div>
            <div class="form-group">
              <label class="form-group__label">To</label>
              <input type="date" id="export-to" class="form-input" value="${today}" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-group__label">Status Filter</label>
          <select id="export-status" class="form-input">
            <option value="All">All Statuses</option>
            <option value="Completed">Completed Only</option>
            <option value="In Progress">In Progress Only</option>
            <option value="Pending">Pending Only</option>
            <option value="On Hold">On Hold Only</option>
          </select>
        </div>
      </div>

      <div class="modal__actions">
        <button class="btn btn--secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn--primary" onclick="ExportManager._doExport('${type}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export
        </button>
      </div>
    `;

    backdrop.classList.add('active');
  },

  _selectedRange: 'month',

  /**
   * Handle range selection
   */
  _selectRange(btn, range) {
    this._selectedRange = range;
    document.querySelectorAll('#export-range-options .filter-chip').forEach((c) =>
      c.classList.toggle('active', c.dataset.range === range)
    );
    const customDiv = document.getElementById('custom-date-range');
    if (range === 'custom') {
      customDiv.classList.remove('hidden');
    } else {
      customDiv.classList.add('hidden');
    }
  },

  /**
   * Perform the export
   */
  _doExport(type) {
    const statusFilter = document.getElementById('export-status').value;
    let tasks = Store.getAllTasks();

    // Apply date filter
    switch (this._selectedRange) {
      case 'month': {
        const { start, end } = Utils.getMonthRange();
        tasks = tasks.filter((t) => t.date >= start && t.date <= end);
        break;
      }
      case 'week': {
        const { start, end } = Utils.getWeekRange();
        tasks = tasks.filter((t) => t.date >= start && t.date <= end);
        break;
      }
      case 'custom': {
        const from = document.getElementById('export-from').value;
        const to = document.getElementById('export-to').value;
        if (from && to) {
          tasks = tasks.filter((t) => t.date >= from && t.date <= to);
        }
        break;
      }
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      tasks = tasks.filter((t) => t.status === statusFilter);
    }

    // Sort by date
    tasks.sort((a, b) => a.date.localeCompare(b.date));

    if (tasks.length === 0) {
      App.showToast('No tasks match the selected criteria', 'warning');
      return;
    }

    if (type === 'csv') {
      this._exportCSV(tasks);
    } else {
      this._exportPDF(tasks);
    }

    App.closeModal();
    App.showToast(`${type.toUpperCase()} export started!`, 'success');
  },

  /**
   * Export as CSV
   */
  _exportCSV(tasks) {
    const csv = Utils.tasksToCSV(tasks);
    const filename = `work-log-${Utils.getToday()}.csv`;
    Utils.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Export as PDF (using print)
   */
  _exportPDF(tasks) {
    const stats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'Completed').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      pending: tasks.filter((t) => t.status === 'Pending').length,
      onHold: tasks.filter((t) => t.status === 'On Hold').length,
    };

    const collaborators = [...new Set(tasks.map((t) => t.collaboratedWith).filter(Boolean))];
    const projects = [...new Set(tasks.map((t) => t.project).filter(Boolean))];

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Logger Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', -apple-system, sans-serif; color: #1a2332; padding: 40px; font-size: 12px; }
          h1 { font-size: 22px; color: #1a5276; margin-bottom: 4px; }
          .subtitle { color: #5a6a7e; margin-bottom: 24px; font-size: 13px; }
          .stats { display: flex; gap: 16px; margin-bottom: 24px; }
          .stat { padding: 12px 16px; background: #f5f7fa; border-radius: 8px; text-align: center; flex: 1; }
          .stat-value { font-size: 20px; font-weight: 800; color: #1a5276; }
          .stat-label { font-size: 10px; color: #5a6a7e; text-transform: uppercase; letter-spacing: 0.05em; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: 700; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background: #1a5276; color: white; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 600; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          tr:nth-child(even) { background: #f9fafb; }
          .tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
          .tag-completed { background: #eafaf1; color: #27ae60; }
          .tag-inprogress { background: #ebf5fb; color: #2980b9; }
          .tag-pending { background: #fef5e7; color: #e67e22; }
          .tag-onhold { background: #fef9e7; color: #f39c12; }
          .list-item { padding: 4px 0; }
          .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #8e9aaf; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>📋 Daily Logger Report</h1>
        <div class="subtitle">Generated on ${Utils.formatDateLong(Utils.getToday())}</div>

        <div class="stats">
          <div class="stat"><div class="stat-value">${stats.total}</div><div class="stat-label">Total</div></div>
          <div class="stat"><div class="stat-value" style="color:#27ae60;">${stats.completed}</div><div class="stat-label">Completed</div></div>
          <div class="stat"><div class="stat-value" style="color:#2980b9;">${stats.inProgress}</div><div class="stat-label">In Progress</div></div>
          <div class="stat"><div class="stat-value" style="color:#e67e22;">${stats.pending}</div><div class="stat-label">Pending</div></div>
          <div class="stat"><div class="stat-value" style="color:#f39c12;">${stats.onHold}</div><div class="stat-label">On Hold</div></div>
        </div>

        <div class="section">
          <div class="section-title">Task Details</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Status</th>
                <th>Collaborated With</th>
                <th>Project</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map((t) => {
                const sc = Utils.getStatusClass(t.status);
                return `<tr>
                  <td>${Utils.formatDate(t.date)}</td>
                  <td><strong>${Utils.escapeHtml(t.title)}</strong></td>
                  <td><span class="tag tag-${sc}">${t.status}</span></td>
                  <td>${Utils.escapeHtml(t.collaboratedWith)}</td>
                  <td>${Utils.escapeHtml(t.project || '-')}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${collaborators.length > 0 ? `
          <div class="section">
            <div class="section-title">People Collaborated With</div>
            ${collaborators.map((c) => `<div class="list-item">• ${Utils.escapeHtml(c)}</div>`).join('')}
          </div>
        ` : ''}

        ${projects.length > 0 ? `
          <div class="section">
            <div class="section-title">Projects Worked On</div>
            ${projects.map((p) => `<div class="list-item">• ${Utils.escapeHtml(p)}</div>`).join('')}
          </div>
        ` : ''}

        <div class="footer">
          Daily Logger &bull; Generated by Daily Logger App
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  },

  /**
   * Export all data as JSON backup
   */
  exportJSON() {
    const data = Store.exportData();
    const filename = `worklog-backup-${Utils.getToday()}.json`;
    Utils.downloadFile(data, filename, 'application/json');
    App.showToast('Data backup exported!', 'success');
  },
};
