/**
 * Palestinian Souls (Remember Gaza) - Central Audit Logger & Security Audit Module
 */

class AuditLoggerEngine {
  constructor() {
    this.storageKey = 'rg_security_audit_logs';
  }

  getLogs() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  log(action, details = '') {
    const logs = this.getLogs();
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      role: window.BackendAPI ? window.BackendAPI.getUserRole() : 'System',
      action: action,
      details: window.Utils ? window.Utils.escapeHTML(details) : details,
      userAgent: navigator.userAgent
    };

    logs.unshift(entry);
    // Keep last 200 audit events
    if (logs.length > 200) logs.pop();
    localStorage.setItem(this.storageKey, JSON.stringify(logs));
  }

  clearLogs() {
    if (window.BackendAPI && window.BackendAPI.getUserRole() === 'Administrator') {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
      return true;
    }
    return false;
  }
}

window.AuditLogger = new AuditLoggerEngine();
