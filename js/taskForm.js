// ============================================
// Task Form Module — Add / Edit
// ============================================

const TaskForm = {
  /**
   * Render the add/edit task form
   */
  render(taskId = null) {
    const isEdit = !!taskId;
    const task = isEdit ? Store.getTaskById(taskId) : null;

    if (isEdit && !task) {
      App.navigate('tasks');
      App.showToast('Task not found', 'error');
      return;
    }

    const projects = Utils.getProjects();
    const container = document.getElementById('view-form');

    container.innerHTML = `
      <div class="form-view">
        <div class="form-view__header">
          <button class="form-view__back" onclick="history.back()" aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 class="form-view__title">${isEdit ? 'Edit Task' : 'New Task'}</h2>
        </div>

        <form class="form" id="task-form" novalidate>
          <input type="hidden" id="form-task-id" value="${isEdit ? task.id : ''}" />
          ${isEdit ? `<input type="hidden" id="form-date" value="${task.date}" />` : ''}

          <!-- Task Title -->
          <div class="form-group">
            <label class="form-group__label" for="form-title">
              Task Title <span class="required">*</span>
            </label>
            <input
              type="text"
              id="form-title"
              class="form-input"
              placeholder="e.g., Q3 Budget Review Meeting"
              value="${isEdit ? Utils.escapeHtml(task.title) : ''}"
              required
              autocomplete="off"
            />
            <span class="form-group__error hidden" id="error-title"></span>
          </div>

          <!-- Project & Status (side by side) -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-group__label" for="form-project">
                Project Name <span class="required">*</span>
              </label>
              <select id="form-project" class="form-input" required>
                <option value="">Select Project</option>
                ${projects.map((p) => `<option value="${p}" ${isEdit && task.project === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
              <span class="form-group__error hidden" id="error-project"></span>
            </div>
            
            <div class="form-group">
              <label class="form-group__label" for="form-status">
                Status <span class="required">*</span>
              </label>
              <select id="form-status" class="form-input" required>
                <option value="Pending" ${isEdit && task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="In Progress" ${isEdit && task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Completed" ${isEdit && task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                <option value="On Hold" ${isEdit && task.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
              </select>
              <span class="form-group__error hidden" id="error-status"></span>
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn--secondary" onclick="history.back()">Cancel</button>
            <button type="submit" class="btn btn--primary btn--lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              ${isEdit ? 'Update Task' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    `;

    // Attach form submit handler
    document.getElementById('task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit(isEdit);
    });
  },

  /**
   * Handle form submission
   */
  _handleSubmit(isEdit) {
    // Clear previous errors
    document.querySelectorAll('.form-group__error').forEach((el) => {
      el.classList.add('hidden');
      el.textContent = '';
    });
    document.querySelectorAll('.form-input--error').forEach((el) => {
      el.classList.remove('form-input--error');
    });

    // Gather values
    const title = document.getElementById('form-title').value.trim();
    const project = document.getElementById('form-project').value;
    const status = document.getElementById('form-status').value;
    const date = isEdit ? document.getElementById('form-date').value : Utils.getToday();

    // Validate
    let isValid = true;

    if (!title) {
      this._showError('title', 'Task title is required');
      isValid = false;
    }
    if (!project) {
      this._showError('project', 'Project Name is required');
      isValid = false;
    }

    if (!isValid) return;

    const taskData = { title, project, status, date };

    if (isEdit) {
      const taskId = document.getElementById('form-task-id').value;
      Store.updateTask(taskId, taskData);
      App.showToast('Task updated successfully!', 'success');
      App.navigate(`task/${taskId}`);
    } else {
      const newTask = Store.createTask(taskData);
      App.showToast('Task created successfully!', 'success');
      App.navigate('dashboard');
    }
  },

  /**
   * Show field error
   */
  _showError(field, message) {
    const input = document.getElementById(`form-${field}`);
    const error = document.getElementById(`error-${field}`);
    if (input) input.classList.add('form-input--error');
    if (error) {
      error.textContent = message;
      error.classList.remove('hidden');
    }
  },
};
