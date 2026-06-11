// ============================================
// Data Store — LocalStorage CRUD & Queries
// ============================================

const Store = {
  STORAGE_KEY: 'dailylogger_tasks',
  ACTIVITY_KEY: 'dailylogger_activity',
  _listeners: [],

  // ---------- Core CRUD ----------

  /**
   * Get all tasks from storage
   */
  getAllTasks() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading tasks:', e);
      return [];
    }
  },

  /**
   * Save all tasks to storage
   */
  _saveTasks(tasks) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
      this._notify();
    } catch (e) {
      console.error('Error saving tasks:', e);
    }
  },

  /**
   * Get a single task by ID
   */
  getTaskById(id) {
    return this.getAllTasks().find((t) => t.id === id) || null;
  },

  /**
   * Create a new task
   */
  createTask(taskData) {
    const tasks = this.getAllTasks();
    const newTask = {
      id: Utils.generateUUID(),
      title: taskData.title.trim(),
      project: (taskData.project || '').trim(),
      status: taskData.status || 'Pending',
      date: taskData.date || Utils.getToday(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    this._saveTasks(tasks);
    this.addActivity(`Created task <strong>${Utils.escapeHtml(newTask.title)}</strong>`);
    return newTask;
  },

  /**
   * Update an existing task
   */
  updateTask(id, updates) {
    const tasks = this.getAllTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const oldTask = { ...tasks[index] };
    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this._saveTasks(tasks);

    // Log activity for status changes
    if (updates.status && updates.status !== oldTask.status) {
      this.addActivity(
        `Marked <strong>${Utils.escapeHtml(tasks[index].title)}</strong> as ${updates.status.toLowerCase()}`
      );
    }

    return tasks[index];
  },

  /**
   * Delete a task
   */
  deleteTask(id) {
    const tasks = this.getAllTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return false;

    const filtered = tasks.filter((t) => t.id !== id);
    this._saveTasks(filtered);
    this.addActivity(`Deleted task <strong>${Utils.escapeHtml(task.title)}</strong>`);
    return true;
  },

  // ---------- Queries ----------

  /**
   * Search tasks by query string
   */
  searchTasks(query) {
    if (!query || !query.trim()) return this.getAllTasks();
    const q = query.toLowerCase().trim();
    return this.getAllTasks().filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.project && t.project.toLowerCase().includes(q))
    );
  },

  /**
   * Filter tasks by status and/or date range
   */
  filterTasks(tasks, { status, dateRange } = {}) {
    let result = [...tasks];

    // Status filter
    if (status && status !== 'All') {
      result = result.filter((t) => t.status === status);
    }

    // Date range filter
    if (dateRange) {
      const today = Utils.getToday();
      switch (dateRange) {
        case 'Today':
          result = result.filter((t) => t.date === today);
          break;
        case 'This Week': {
          const { start, end } = Utils.getWeekRange();
          result = result.filter((t) => t.date >= start && t.date <= end);
          break;
        }
        case 'This Month': {
          const { start, end } = Utils.getMonthRange();
          result = result.filter((t) => t.date >= start && t.date <= end);
          break;
        }
      }
    }

    return result;
  },

  /**
   * Sort tasks
   */
  sortTasks(tasks, sortBy = 'date-desc') {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.date.localeCompare(a.date) || new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return a.date.localeCompare(b.date) || new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  },

  /**
   * Get tasks for today
   */
  getTodayTasks() {
    const today = Utils.getToday();
    return this.getAllTasks().filter((t) => t.date === today);
  },

  // ---------- Statistics ----------

  /**
   * Get dashboard statistics
   */
  getTaskStats() {
    const tasks = this.getAllTasks();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    const onHold = tasks.filter((t) => t.status === 'On Hold').length;
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, onHold, efficiency };
  },

  /**
   * Get daily summary data
   */
  getDailySummary(date) {
    const tasks = this.getAllTasks().filter((t) => t.date === date);
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    const onHold = tasks.filter((t) => t.status === 'On Hold').length;

    // Unique projects
    const projects = [...new Set(tasks.map((t) => t.project).filter(Boolean))];

    return {
      date,
      total: tasks.length,
      completed,
      inProgress,
      pending,
      onHold,
      projects,
      tasks,
    };
  },

  // ---------- Activity Log ----------

  /**
   * Get all activity entries
   */
  getActivities() {
    try {
      const data = localStorage.getItem(this.ACTIVITY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Add an activity entry
   */
  addActivity(text) {
    const activities = this.getActivities();
    activities.unshift({
      id: Utils.generateUUID(),
      text,
      timestamp: new Date().toISOString(),
    });
    // Keep only last 50 activities
    const trimmed = activities.slice(0, 50);
    try {
      localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Error saving activity:', e);
    }
  },

  // ---------- Event System ----------

  /**
   * Subscribe to data changes
   */
  onChange(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== callback);
    };
  },

  /**
   * Notify listeners of data changes
   */
  _notify() {
    this._listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  },

  // ---------- Data Management ----------

  /**
   * Export all data as JSON
   */
  exportData() {
    return JSON.stringify(
      {
        tasks: this.getAllTasks(),
        activities: this.getActivities(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  },

  /**
   * Import data from JSON
   */
  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks && Array.isArray(data.tasks)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.tasks));
      }
      if (data.activities && Array.isArray(data.activities)) {
        localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(data.activities));
      }
      this._notify();
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },

  /**
   * Clear all data
   */
  clearAllData() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ACTIVITY_KEY);
    // Set seeded flag so that the app stays empty on reload
    localStorage.setItem('dailylogger_seeded', 'true');
    this._notify();
  },

  /**
   * Seed with sample data for demo
   */
  seedSampleData() {
    if (localStorage.getItem('dailylogger_seeded') || this.getAllTasks().length > 0) return;

    localStorage.setItem('dailylogger_seeded', 'true');

    const today = Utils.getToday();
    const yesterday = Utils.formatDateISO(new Date(Date.now() - 86400000));
    const twoDaysAgo = Utils.formatDateISO(new Date(Date.now() - 172800000));

    const sampleTasks = [
      {
        title: 'Q3 Budget Review Meeting',
        project: 'Budget Planning',
        status: 'Completed',
        date: today,
      },
      {
        title: 'Update Project Roadmap',
        project: 'Product Strategy',
        status: 'In Progress',
        date: today,
      },
      {
        title: 'Client Feedback Integration',
        project: 'ERP Implementation',
        status: 'Pending',
        date: today,
      },
      {
        title: 'Sprint Planning Session',
        project: 'ERP Implementation',
        status: 'Completed',
        date: today,
      },
      {
        title: 'UI Audit Review',
        project: 'HRMS',
        status: 'Completed',
        date: today,
      },
      {
        title: 'Stakeholder Presentation',
        project: 'ERP Implementation',
        status: 'Completed',
        date: today,
      },
      {
        title: 'Database Schema Review',
        project: 'HRMS',
        status: 'Completed',
        date: yesterday,
      },
      {
        title: 'Requirement Gathering - Phase 2',
        project: 'ERP Implementation',
        status: 'Completed',
        date: yesterday,
      },
      {
        title: 'Weekly Team Sync',
        project: 'HRMS',
        status: 'Completed',
        date: yesterday,
      },
      {
        title: 'API Documentation Update',
        project: 'ERP Implementation',
        status: 'In Progress',
        date: today,
      },
      {
        title: 'Quarterly Sync Preparation',
        project: 'HRMS',
        status: 'On Hold',
        date: today,
      },
      {
        title: 'Testing Review - Module 3',
        project: 'ERP Implementation',
        status: 'Completed',
        date: twoDaysAgo,
      },
    ];

    sampleTasks.forEach((task) => this.createTask(task));

    // Add sample activities
    const activities = [
      { text: 'Marked <strong>UI Audit</strong> as completed', timestamp: new Date(Date.now() - 900000).toISOString() },
      { text: 'Created task <strong>Q3 Budget Review Meeting</strong>', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { text: 'Started a new log for <strong>Quarterly Sync</strong>', timestamp: new Date(Date.now() - 14400000).toISOString() },
      { text: 'Completed <strong>Sprint Planning Session</strong>', timestamp: new Date(Date.now() - 18000000).toISOString() },
      { text: 'Created task <strong>API Documentation Update</strong>', timestamp: new Date(Date.now() - 21600000).toISOString() },
    ];

    localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(activities));
  },
};
