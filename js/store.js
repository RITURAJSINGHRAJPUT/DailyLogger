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
      description: taskData.description.trim(),
      collaboratedWith: taskData.collaboratedWith.trim(),
      project: (taskData.project || '').trim(),
      department: taskData.department || '',
      status: taskData.status || 'Pending',
      date: taskData.date || Utils.getToday(),
      notes: (taskData.notes || '').trim(),
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
        t.collaboratedWith.toLowerCase().includes(q) ||
        (t.project && t.project.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
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

    // Unique collaborators
    const collaborators = [
      ...new Set(tasks.map((t) => t.collaboratedWith).filter(Boolean)),
    ];

    // Unique projects
    const projects = [...new Set(tasks.map((t) => t.project).filter(Boolean))];

    // Unique departments
    const departments = [
      ...new Set(tasks.map((t) => t.department).filter(Boolean)),
    ];

    return {
      date,
      total: tasks.length,
      completed,
      inProgress,
      pending,
      onHold,
      collaborators,
      projects,
      departments,
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
        description: 'Reviewed quarterly budget allocations with finance team. Discussed resource planning for upcoming sprint.',
        collaboratedWith: 'Sarah Jenkins',
        project: 'Budget Planning',
        department: 'Finance',
        status: 'Completed',
        date: today,
        notes: 'Follow up on revised estimates by Friday',
      },
      {
        title: 'Update Project Roadmap',
        description: 'Updated the product roadmap with new feature priorities based on client feedback.',
        collaboratedWith: 'Self',
        project: 'Product Strategy',
        department: 'Product',
        status: 'In Progress',
        date: today,
        notes: '',
      },
      {
        title: 'Client Feedback Integration',
        description: 'Reviewed and categorized client feedback from last release. Created action items for development team.',
        collaboratedWith: 'Dev Team',
        project: 'ERP Implementation',
        department: 'Development',
        status: 'Pending',
        date: today,
        notes: 'Due by 5:00 PM',
      },
      {
        title: 'Sprint Planning Session',
        description: 'Conducted sprint planning for Sprint 14. Assigned user stories and estimated effort.',
        collaboratedWith: 'QA Team',
        project: 'ERP Implementation',
        department: 'Development',
        status: 'Completed',
        date: today,
        notes: '',
      },
      {
        title: 'UI Audit Review',
        description: 'Performed comprehensive UI audit of the dashboard module. Documented inconsistencies.',
        collaboratedWith: 'Mike Ross',
        project: 'HRMS',
        department: 'Design',
        status: 'Completed',
        date: today,
        notes: 'Shared audit report with design lead',
      },
      {
        title: 'Stakeholder Presentation',
        description: 'Prepared and delivered project status presentation to stakeholders.',
        collaboratedWith: 'Management Team',
        project: 'ERP Implementation',
        department: 'Administration',
        status: 'Completed',
        date: today,
        notes: 'Positive feedback received',
      },
      {
        title: 'Database Schema Review',
        description: 'Reviewed proposed schema changes for the user management module.',
        collaboratedWith: 'Accounts Team',
        project: 'HRMS',
        department: 'Development',
        status: 'Completed',
        date: yesterday,
        notes: '',
      },
      {
        title: 'Requirement Gathering - Phase 2',
        description: 'Collected detailed requirements for ERP Phase 2 from accounts department.',
        collaboratedWith: 'Accounts Team',
        project: 'ERP Implementation',
        department: 'Accounts',
        status: 'Completed',
        date: yesterday,
        notes: 'Awaiting approval from department head',
      },
      {
        title: 'Weekly Team Sync',
        description: 'Conducted weekly sync meeting with cross-functional team members.',
        collaboratedWith: 'Development Team',
        project: 'HRMS',
        department: 'Development',
        status: 'Completed',
        date: yesterday,
        notes: '',
      },
      {
        title: 'API Documentation Update',
        description: 'Updated REST API documentation for the payment gateway integration.',
        collaboratedWith: 'Dev Team',
        project: 'ERP Implementation',
        department: 'Development',
        status: 'In Progress',
        date: today,
        notes: 'Pending review from tech lead',
      },
      {
        title: 'Quarterly Sync Preparation',
        description: 'Prepared agenda and materials for the quarterly departmental sync.',
        collaboratedWith: 'HR Team',
        project: 'HRMS',
        department: 'HR',
        status: 'On Hold',
        date: today,
        notes: 'Rescheduled to next week',
      },
      {
        title: 'Testing Review - Module 3',
        description: 'Reviewed test cases and results for Module 3 of the ERP system.',
        collaboratedWith: 'QA Team',
        project: 'ERP Implementation',
        department: 'QA',
        status: 'Completed',
        date: twoDaysAgo,
        notes: 'All critical bugs resolved',
      },
    ];

    sampleTasks.forEach((task) => this.createTask(task));

    // Add sample activities
    const activities = [
      { text: 'Marked <strong>UI Audit</strong> as completed', timestamp: new Date(Date.now() - 900000).toISOString() },
      { text: 'Added collaborator <strong>Mike Ross</strong> to project X', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { text: 'Started a new log for <strong>Quarterly Sync</strong>', timestamp: new Date(Date.now() - 14400000).toISOString() },
      { text: 'Completed <strong>Sprint Planning Session</strong>', timestamp: new Date(Date.now() - 18000000).toISOString() },
      { text: 'Created task <strong>API Documentation Update</strong>', timestamp: new Date(Date.now() - 21600000).toISOString() },
    ];

    localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(activities));
  },
};
