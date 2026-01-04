/**
 * Task Registry
 *
 * All tasks are registered here. Each task module exports:
 * - id: unique identifier
 * - name: display name
 * - description: what the task does
 * - fields: array of required parameter names (optional)
 * - execute: async function(page, params) that runs the task
 */

const gmailTask = require('./gmail');

// Account-based tasks (require a Google account)
const accountTasks = {
  none: {
    id: 'none',
    name: 'None',
    description: 'No automated task',
    execute: async () => ({ success: true })
  },
  gmail_send: gmailTask
};

// Standalone tasks (no account required)
const standaloneTasks = {
  none: {
    id: 'none',
    name: 'None',
    description: 'Just open browser'
  }
  // Add more standalone tasks here as needed
  // screenshot: require('./screenshot'),
  // scrape: require('./scrape'),
};

// Get task by ID
function getAccountTask(taskId) {
  return accountTasks[taskId] || null;
}

function getStandaloneTask(taskId) {
  return standaloneTasks[taskId] || null;
}

// Get all tasks for API responses
function getAllAccountTasks() {
  return Object.values(accountTasks).map(task => ({
    id: task.id,
    name: task.name,
    description: task.description,
    fields: task.fields || []
  }));
}

function getAllStandaloneTasks() {
  return Object.values(standaloneTasks).map(task => ({
    id: task.id,
    name: task.name,
    description: task.description
  }));
}

// Execute a task
async function executeAccountTask(taskId, page, params) {
  const task = accountTasks[taskId];
  if (!task || !task.execute) {
    return { success: false, error: 'Task not found' };
  }
  return await task.execute(page, params);
}

module.exports = {
  accountTasks,
  standaloneTasks,
  getAccountTask,
  getStandaloneTask,
  getAllAccountTasks,
  getAllStandaloneTasks,
  executeAccountTask
};
