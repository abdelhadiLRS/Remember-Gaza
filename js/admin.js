/**
 * Palestinian Souls - Admin Review Panel Engine
 */

class AdminEngine {
  constructor() {
    this.submissionsEngine = window.submissionsEngine;
  }

  updateStatus(submissionId, newStatus) {
    if (!window.submissionsEngine) return false;
    const list = window.submissionsEngine.getSubmissions();
    const target = list.find(s => String(s.id) === String(submissionId));
    if (target) {
      target.status = newStatus;
      target.updatedAt = new Date().toISOString();
      window.submissionsEngine.saveSubmissions(list);
      return true;
    }
    return false;
  }

  approve(submissionId) {
    return this.updateStatus(submissionId, 'approved');
  }

  reject(submissionId) {
    return this.updateStatus(submissionId, 'rejected');
  }

  deleteSubmission(submissionId) {
    if (!window.submissionsEngine) return false;
    let list = window.submissionsEngine.getSubmissions();
    list = list.filter(s => String(s.id) !== String(submissionId));
    window.submissionsEngine.saveSubmissions(list);
    return true;
  }
}

window.adminEngine = new AdminEngine();
