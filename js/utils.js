// ============================================
// Utility Functions
// ============================================

const Utils = {
  /**
   * Generate a UUID v4
   */
  generateUUID() {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Format date to locale-aware string
   */
  formatDate(dateStr, options = {}) {
    const date = new Date(dateStr + 'T00:00:00');
    const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', { ...defaults, ...options });
  },

  /**
   * Format date as "11 June 2026"
   */
  formatDateLong(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  },

  /**
   * Format date as YYYY-MM-DD
   */
  formatDateISO(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Get today's date as YYYY-MM-DD
   */
  getToday() {
    return this.formatDateISO(new Date());
  },

  /**
   * Get relative time string
   */
  getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return this.formatDate(this.formatDateISO(new Date(timestamp)));
  },

  /**
   * Get week range (Monday to Sunday)
   */
  getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start: this.formatDateISO(start),
      end: this.formatDateISO(end),
    };
  },

  /**
   * Get month range
   */
  getMonthRange(date = new Date()) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      start: this.formatDateISO(start),
      end: this.formatDateISO(end),
    };
  },

  /**
   * Debounce function
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Get status color class suffix
   */
  getStatusClass(status) {
    const map = {
      Completed: 'completed',
      'In Progress': 'inprogress',
      Pending: 'pending',
      'On Hold': 'onhold',
    };
    return map[status] || 'pending';
  },

  /**
   * Format time from date string for display
   */
  formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  },

  /**
   * Animate a number counting up
   */
  animateNumber(element, target, duration = 600) {
    const start = 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + (target - start) * eased);
      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },

  tasksToCSV(tasks) {
    const headers = [
      'Date',
      'Time',
      'Title',
      'Project',
      'Status',
    ];
    const rows = tasks.map((t) =>
      [
        t.date,
        this.formatTime(t.createdAt),
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.project || '').replace(/"/g, '""')}"`,
        t.status,
      ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  },

  /**
   * Download a file
   */
  downloadFile(content, filename, type = 'text/csv') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Get project list
   */
  getProjects() {
    return [
      'ERP Implementation',
      'HRMS',
      'Budget Planning',
      'Product Strategy',
      'Internal Dev',
      'Other',
    ];
  },
};
