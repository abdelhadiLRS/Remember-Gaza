/**
 * Palestinian Souls (Remember Gaza) - Central Audit Logger & Security Audit Module
 * Synchronizes administrative and operational logs to both remote database and local storage.
 */

class AuditLoggerEngine {
  constructor() {
    this.storageKey = 'rg_security_audit_logs';
  }

  getLogs() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  async log(action, details = '') {
    const role = window.BackendAPI ? window.BackendAPI.getUserRole() : 'System';
    const cleanDetails = window.Utils ? window.Utils.escapeHTML(details) : details;

    const entry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      role: role,
      action: action,
      details: cleanDetails,
      userAgent: navigator.userAgent
    };

    // Save to LocalStorage
    const logs = this.getLogs();
    logs.unshift(entry);
    if (logs.length > 300) logs.pop();
    localStorage.setItem(this.storageKey, JSON.stringify(logs));

    // Async sync to Supabase database if available
    if (window.BackendAPI && window.BackendAPI.supabaseUrl && window.BackendAPI.supabaseKey) {
      try {
        await fetch(`${window.BackendAPI.supabaseUrl}/rest/v1/audit_logs`, {
          method: 'POST',
          headers: window.BackendAPI.getAuthHeader(),
          body: JSON.stringify({
            username: role,
            role: role,
            action: action,
            details: cleanDetails,
            user_agent: navigator.userAgent
          })
        });
      } catch (e) {
        // Silent catch for remote log sync
      }
    }
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
