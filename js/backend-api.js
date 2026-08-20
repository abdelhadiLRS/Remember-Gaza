/**
 * Palestinian Souls (Remember Gaza) - Centralized Backend API & Supabase Service Layer
 * Supports Supabase REST/RPC and Express API endpoints with local persistence fallbacks,
 * CSRF Protection, Anti-Spam Rate Limiting, Input Sanitization, and Role-Based Access Control.
 */

class BackendAPIService {
  constructor() {
    this.baseUrl = window.API_BASE_URL || 'https://api.remember-gaza.org/v1';
    this.supabaseUrl = window.SUPABASE_URL || '';
    this.supabaseKey = window.SUPABASE_ANON_KEY || '';
    this.sessionTokenKey = 'rg_secure_session_token';
    this.csrfTokenKey = 'rg_csrf_token';
    this.sessionId = this.getOrCreateSessionId();
    this.initCSRF();
  }

  getOrCreateSessionId() {
    let sid = sessionStorage.getItem('rg_session_id');
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('rg_session_id', sid);
    }
    return sid;
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
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': this.getCSRFToken()
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (this.supabaseKey) {
      headers['apikey'] = this.supabaseKey;
    }
    return headers;
  }

  // Authentication & Sessions
  async login(username, password) {
    if (!username || !password) {
      return { success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان.' };
    }

    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: this.getAuthHeader(),
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem(this.sessionTokenKey, data.token);
        sessionStorage.setItem('rg_user_role', data.role || 'Administrator');
        return { success: true, role: data.role || 'Administrator', token: data.token };
      }
    } catch (e) {
      console.warn('[BackendAPI] Connection error to remote authentication endpoint.');
    }

    // Default admin fallback for review panel
    if (username === 'admin' && password === 'admin123') {
      const token = 'local_admin_token_' + Date.now();
      sessionStorage.setItem(this.sessionTokenKey, token);
      sessionStorage.setItem('rg_user_role', 'Administrator');
      return { success: true, role: 'Administrator', token };
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

  // Realtime Candles System with Anti-Spam Protection
  async lightCandle(martyrId) {
    if (!martyrId) return { success: false, candles: 0 };

    // Anti-spam rate limiting check in memory/session
    const lastLitKey = `rg_candle_last_${martyrId}`;
    const now = Date.now();
    const lastLit = parseInt(sessionStorage.getItem(lastLitKey) || '0', 10);
    const cooldownMs = 5000; // 5 seconds rate limit per martyr

    if (now - lastLit < cooldownMs) {
      const storedCount = this.getLocalCandlesCount(martyrId);
      return {
        success: false,
        rateLimited: true,
        message: 'يرجى الانتظار بضع ثوانٍ قبل إشعال شمعة أخرى',
        candles: storedCount
      };
    }

    sessionStorage.setItem(lastLitKey, String(now));

    // 1. Supabase RPC Call if configured
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/rpc/light_candle`, {
          method: 'POST',
          headers: this.getAuthHeader(),
          body: JSON.stringify({
            p_martyr_id: String(martyrId),
            p_session_id: this.sessionId
          })
        });
        if (res.ok) {
          const data = await res.json();
          this.setLocalCandlesCount(martyrId, data.candles);
          return { success: true, candles: data.candles };
        }
      } catch (e) {
        console.warn('[BackendAPI] Supabase candle RPC failed:', e);
      }
    }

    // 2. Local Fallback Persistence
    const count = this.getLocalCandlesCount(martyrId) + 1;
    this.setLocalCandlesCount(martyrId, count);

    // Save individual candle record in local storage logs
    const candleLogs = JSON.parse(localStorage.getItem('rg_candles_log') || '[]');
    candleLogs.unshift({
      id: 'candle_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      martyr_id: String(martyrId),
      session_id: this.sessionId,
      created_at: new Date().toISOString()
    });
    localStorage.setItem('rg_candles_log', JSON.stringify(candleLogs.slice(0, 500)));

    if (window.AuditLogger) {
      window.AuditLogger.log('LIGHT_CANDLE', `Lit a candle for martyr ID: ${martyrId}`);
    }

    return { success: true, candles: count };
  }

  getLocalCandlesCount(martyrId) {
    const data = JSON.parse(localStorage.getItem('martyr_tributes') || '{}');
    return data[martyrId] ? (data[martyrId].candles || 0) : 0;
  }

  setLocalCandlesCount(martyrId, count) {
    const data = JSON.parse(localStorage.getItem('martyr_tributes') || '{}');
    if (!data[martyrId]) data[martyrId] = { candles: 0, comments: [] };
    data[martyrId].candles = count;
    localStorage.setItem('martyr_tributes', JSON.stringify(data));
  }

  async getCandlesCount(martyrId) {
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/candles?martyr_id=eq.${encodeURIComponent(martyrId)}&select=id`, {
          headers: this.getAuthHeader()
        });
        if (res.ok) {
          const rows = await res.json();
          const count = rows.length;
          this.setLocalCandlesCount(martyrId, count);
          return count;
        }
      } catch (e) {
        console.warn('[BackendAPI] Supabase candles fetch failed:', e);
      }
    }
    return this.getLocalCandlesCount(martyrId);
  }

  // Realtime Comments System
  async getComments(martyrId) {
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/comments?martyr_id=eq.${encodeURIComponent(martyrId)}&status=eq.APPROVED&order=created_at.asc`, {
          headers: this.getAuthHeader()
        });
        if (res.ok) {
          const comments = await res.json();
          return comments;
        }
      } catch (e) {
        console.warn('[BackendAPI] Supabase comments fetch failed:', e);
      }
    }

    // Local Storage Fallback
    const data = JSON.parse(localStorage.getItem('martyr_tributes') || '{}');
    return data[martyrId] ? (data[martyrId].comments || []) : [];
  }

  async addComment(martyrId, author, text, location = '') {
    if (!martyrId || !text || !text.trim()) {
      return { success: false, message: 'نص التعليق مطلوب.' };
    }

    const cleanAuthor = window.Utils ? window.Utils.escapeHTML(author || 'فاعل خير') : (author || 'فاعل خير');
    const cleanText = window.Utils ? window.Utils.escapeHTML(text.trim()) : text.trim();
    const cleanLocation = window.Utils ? window.Utils.escapeHTML(location || '') : (location || '');

    const commentObj = {
      id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      martyr_id: String(martyrId),
      author_name: cleanAuthor,
      author_location: cleanLocation,
      content: cleanText,
      status: 'APPROVED',
      created_at: new Date().toISOString()
    };

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/comments`, {
          method: 'POST',
          headers: this.getAuthHeader(),
          body: JSON.stringify(commentObj)
        });
        if (res.ok) {
          if (window.AuditLogger) window.AuditLogger.log('ADD_COMMENT', `Comment added for martyr ID: ${martyrId}`);
          return { success: true, comment: commentObj };
        }
      } catch (e) {
        console.warn('[BackendAPI] Supabase comment insert failed:', e);
      }
    }

    // Local storage fallback
    const data = JSON.parse(localStorage.getItem('martyr_tributes') || '{}');
    if (!data[martyrId]) data[martyrId] = { candles: 0, comments: [] };
    const localComment = {
      id: commentObj.id,
      author: cleanAuthor,
      text: cleanText,
      location: cleanLocation,
      date: commentObj.created_at
    };
    data[martyrId].comments.push(localComment);
    localStorage.setItem('martyr_tributes', JSON.stringify(data));

    if (window.AuditLogger) window.AuditLogger.log('ADD_COMMENT', `Comment added for martyr ID: ${martyrId}`);

    return { success: true, comment: localComment };
  }

  // Edit Proposals & Submissions
  async submitContribution(data) {
    const sanitizedData = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      martyr_id: data.martyrId || data.martyr_id || null,
      submitterName: window.Utils ? window.Utils.escapeHTML(data.submitterName || data.submitter_name) : (data.submitterName || data.submitter_name || ''),
      submitterContact: window.Utils ? window.Utils.escapeHTML(data.submitterContact || data.submitter_contact || '') : (data.submitterContact || data.submitter_contact || ''),
      martyrName: window.Utils ? window.Utils.escapeHTML(data.martyrName || data.martyr_name) : (data.martyrName || data.martyr_name || ''),
      category: data.category || 'Gazans',
      city: window.Utils ? window.Utils.escapeHTML(data.city) : (data.city || ''),
      fieldName: data.fieldName || data.field_name || '',
      oldValue: data.oldValue || data.old_value || '',
      newValue: data.newValue || data.new_value || '',
      reason: window.Utils ? window.Utils.escapeHTML(data.reason) : (data.reason || ''),
      notes: window.Utils ? window.Utils.escapeHTML(data.notes) : (data.notes || ''),
      photoUrl: data.photoUrl ? window.Utils.sanitizeUrl(data.photoUrl) : '',
      currentData: data.currentData || {},
      proposedData: data.proposedData || {},
      status: 'PENDING',
      created_at: new Date().toISOString(),
      honeypot: data.honeypot || ''
    };

    if (sanitizedData.honeypot) {
      console.warn('[BackendAPI] Anti-spam honeypot triggered.');
      return { success: false, message: 'تم رفض الطلب كإجراء أمني.' };
    }

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/submissions`, {
          method: 'POST',
          headers: this.getAuthHeader(),
          body: JSON.stringify({
            martyr_id: sanitizedData.martyr_id,
            submitter_name: sanitizedData.submitterName,
            submitter_contact: sanitizedData.submitterContact,
            martyr_name: sanitizedData.martyrName,
            category: sanitizedData.category,
            city: sanitizedData.city,
            field_name: sanitizedData.fieldName,
            old_value: sanitizedData.oldValue,
            new_value: sanitizedData.newValue,
            reason: sanitizedData.reason,
            notes: sanitizedData.notes,
            photo_url: sanitizedData.photoUrl,
            proposed_data: sanitizedData.proposedData,
            current_data: sanitizedData.currentData,
            status: 'PENDING'
          })
        });
        if (res.ok) {
          if (window.AuditLogger) window.AuditLogger.log('SUBMIT_PROPOSAL', `Proposal submitted for ${sanitizedData.martyrName}`);
          return { success: true, status: 'PENDING', data: sanitizedData };
        }
      } catch (e) {
        console.warn('[BackendAPI] Supabase submission insert failed:', e);
      }
    }

    // Local persistence fallback
    const stored = JSON.parse(localStorage.getItem('rg_remote_submissions') || '[]');
    stored.push(sanitizedData);
    localStorage.setItem('rg_remote_submissions', JSON.stringify(stored));

    if (window.AuditLogger) window.AuditLogger.log('SUBMIT_PROPOSAL', `Proposal submitted for ${sanitizedData.martyrName}`);

    return { success: true, status: 'PENDING', data: sanitizedData };
  }

  async getSubmissions(status = 'ALL') {
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        let url = `${this.supabaseUrl}/rest/v1/submissions?order=created_at.desc`;
        if (status !== 'ALL') {
          url += `&status=eq.${encodeURIComponent(status)}`;
        }
        const res = await fetch(url, { headers: this.getAuthHeader() });
        if (res.ok) {
          const list = await res.json();
          return list.map(item => ({
            id: item.id,
            martyrId: item.martyr_id,
            submitterName: item.submitter_name,
            submitterContact: item.submitter_contact,
            martyrName: item.martyr_name,
            category: item.category,
            city: item.city,
            fieldName: item.field_name,
            oldValue: item.old_value,
            newValue: item.new_value,
            reason: item.reason,
            notes: item.notes,
            photoUrl: item.photo_url,
            proposedData: item.proposed_data,
            currentData: item.current_data,
            status: item.status,
            reviewerNotes: item.reviewer_notes,
            created_at: item.created_at
          }));
        }
      } catch (e) {
        console.warn('[BackendAPI] Supabase submissions fetch failed:', e);
      }
    }

    let list = JSON.parse(localStorage.getItem('rg_remote_submissions') || '[]');
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

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/submissions?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: this.getAuthHeader(),
          body: JSON.stringify({
            status: newStatus,
            reviewer_notes: notes,
            reviewed_at: new Date().toISOString(),
            reviewed_by: this.getUserRole()
          })
        });
        if (res.ok) {
          if (window.AuditLogger) window.AuditLogger.log(`STATUS_CHANGE_${newStatus}`, `Submission ${id} status changed to ${newStatus}`);
          return { success: true };
        }
      } catch (e) {
        console.warn('[BackendAPI] Supabase submission status update failed:', e);
      }
    }

    const list = await this.getSubmissions('ALL');
    const target = list.find(s => String(s.id) === String(id));
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
