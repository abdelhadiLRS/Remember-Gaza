/**
 * Palestinian Souls (Remember Gaza) - Secure Backend API Client Layer
 * Handles Serverless/Supabase Integration, Authentication, CSRF Protection & Input Validation
 */

class BackendAPIService {
  constructor() {
    this.baseUrl = window.API_BASE_URL || 'https://api.remember-gaza.org/v1';
    this.sessionTokenKey = 'rg_secure_session_token';
    this.csrfTokenKey = 'rg_csrf_token';
    this.initCSRF();
  }

  initCSRF() {
    if (!sessionStorage.getItem(this.csrfTokenKey)) {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(this.csrfTokenKey, token);
    }
  }

  getCSRFToken() {
    return sessionStorage.getItem(this.csrfTokenKey) || '';
  }

  getAuthHeader() {
    const token = localStorage.getItem(this.sessionTokenKey) || sessionStorage.getItem(this.sessionTokenKey);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async login(username, password) {
    if (!username || !password) {
      return { success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان.' };
    }

    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem(this.sessionTokenKey, data.token);
        sessionStorage.setItem('rg_user_role', data.role);
        return { success: true, role: data.role, token: data.token };
      }
    } catch (e) {
      console.warn('[BackendAPI] Connection error to remote authentication endpoint.');
    }

    return { success: false, message: 'بيانات الدخول غير صحيحة.' };
  }

  logout() {
    localStorage.removeItem(this.sessionTokenKey);
    sessionStorage.removeItem(this.sessionTokenKey);
    localStorage.removeItem('rg_user_role');
    sessionStorage.removeItem('rg_user_role');
  }

  isAuthenticated() {
    const token = localStorage.getItem(this.sessionTokenKey) || sessionStorage.getItem(this.sessionTokenKey);
    return !!token;
  }

  getUserRole() {
    if (!this.isAuthenticated()) return 'Visitor';
    return localStorage.getItem('rg_user_role') || sessionStorage.getItem('rg_user_role') || 'Visitor';
  }

  async submitContribution(data) {
    const sanitizedData = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      submitterName: window.Utils ? window.Utils.escapeHTML(data.submitterName || data.submitter_name) : (data.submitterName || data.submitter_name || ''),
      submitterContact: window.Utils ? window.Utils.escapeHTML(data.submitterContact || data.submitter_contact || '') : (data.submitterContact || data.submitter_contact || ''),
      martyrName: window.Utils ? window.Utils.escapeHTML(data.martyrName || data.martyr_name) : (data.martyrName || data.martyr_name || ''),
      category: data.category || 'Gazans',
      city: window.Utils ? window.Utils.escapeHTML(data.city) : (data.city || ''),
      notes: window.Utils ? window.Utils.escapeHTML(data.notes) : (data.notes || ''),
      sources: window.Utils ? window.Utils.escapeHTML(data.sources) : (data.sources || ''),
      photoUrl: data.photoUrl ? window.Utils.sanitizeUrl(data.photoUrl) : '',
      currentData: data.currentData || {},
      proposedData: data.proposedData || {},
      status: 'PENDING',
      created_at: new Date().toISOString(),
      honeypot: data.honeypot || ''
    };

    if (sanitizedData.honeypot) {
      console.warn('[BackendAPI] Spam detected via honeypot field.');
      return { success: false, message: 'تم رفض الطلب كإجراء أمني.' };
    }

    // Attempt Server Sync
    try {
      const res = await fetch(`${this.baseUrl}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: JSON.stringify(sanitizedData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback local persistence
    }

    const stored = JSON.parse(localStorage.getItem('rg_remote_submissions') || '[]');
    stored.push(sanitizedData);
    localStorage.setItem('rg_remote_submissions', JSON.stringify(stored));
    return { success: true, status: 'PENDING', data: sanitizedData };
  }

  async getSubmissions(status = 'ALL') {
    let list = JSON.parse(localStorage.getItem('rg_remote_submissions') || '[]');
    // Sync legacy localStorage submissions if available
    const legacy = JSON.parse(localStorage.getItem('crowdsourced_submissions') || '[]');
    if (legacy.length > 0) {
      legacy.forEach(item => {
        if (!list.some(s => s.id === item.id)) {
          list.push({
            id: item.id || ('legacy_' + Date.now()),
            submitterName: item.submitter || item.submitterName || '',
            martyrName: item.martyrName || '',
            category: item.category || 'Gazans',
            city: item.city || '',
            notes: item.notes || '',
            photoUrl: item.photo || item.photoUrl || '',
            status: item.status || 'PENDING',
            created_at: item.date || new Date().toISOString()
          });
        }
      });
      localStorage.setItem('rg_remote_submissions', JSON.stringify(list));
    }

    if (status !== 'ALL') {
      list = list.filter(s => s.status === status);
    }
    return list;
  }

  async updateSubmissionStatus(id, newStatus, notes = '') {
    const validStatuses = ['DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_INFORMATION'];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, message: 'حالة غير صالحة' };
    }

    if (this.getUserRole() === 'Visitor') {
      return { success: false, message: 'غير مصرح لك بهذه العملية' };
    }

    const list = await this.getSubmissions('ALL');
    const target = list.find(s => s.id === id);
    if (target) {
      const oldStatus = target.status;
      target.status = newStatus;
      target.reviewerNotes = notes || target.reviewerNotes || '';
      target.updatedAt = new Date().toISOString();
      target.updatedBy = this.getUserRole();
      localStorage.setItem('rg_remote_submissions', JSON.stringify(list));

      if (window.AuditLogger) {
        window.AuditLogger.log(`STATUS_CHANGE_${newStatus}`, `Submission ${id} status changed from ${oldStatus} to ${newStatus}. Notes: ${notes}`);
      }
      return { success: true, item: target };
    }
    return { success: false, message: 'المساهمة غير موجودة' };
  }
}

window.BackendAPI = new BackendAPIService();
