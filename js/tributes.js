/**
 * Palestinian Souls (Remember Gaza) - Tributes & Candles Engine
 * Integrates real database storage via BackendAPI (Supabase/Postgres RPCs) for candle lighting,
 * user comments, rate limiting, and real-time updates.
 */

class TributesEngine {
  constructor() {
    this.storageKey = 'martyr_tributes';
    this.data = this.loadStorage();
  }

  loadStorage() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('[Tributes] Storage read error:', e);
      return {};
    }
  }

  saveStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error('[Tributes] Storage write error:', e);
    }
  }

  async lightCandle(martyrId) {
    if (!martyrId) return 0;

    if (window.BackendAPI) {
      const res = await window.BackendAPI.lightCandle(martyrId);
      if (res && typeof res.candles !== 'undefined') {
        if (!this.data[martyrId]) {
          this.data[martyrId] = { candles: 0, comments: [] };
        }
        this.data[martyrId].candles = res.candles;
        this.saveStorage();
        return res.candles;
      }
    }

    // Local increment fallback
    if (!this.data[martyrId]) {
      this.data[martyrId] = { candles: 0, comments: [] };
    }
    this.data[martyrId].candles = (this.data[martyrId].candles || 0) + 1;
    this.saveStorage();
    return this.data[martyrId].candles;
  }

  async addComment(martyrId, author, text, location = '') {
    if (!martyrId || !text || !text.trim()) return false;

    if (window.BackendAPI) {
      const res = await window.BackendAPI.addComment(martyrId, author, text, location);
      if (res.success && res.comment) {
        if (!this.data[martyrId]) {
          this.data[martyrId] = { candles: 0, comments: [] };
        }
        this.data[martyrId].comments.push(res.comment);
        this.saveStorage();
        return res.comment;
      }
    }

    // Fallback local insertion
    if (!this.data[martyrId]) {
      this.data[martyrId] = { candles: 0, comments: [] };
    }
    const newComment = {
      id: Date.now(),
      author: (author && author.trim()) || 'فاعل خير',
      text: text.trim(),
      location: location || '',
      date: new Date().toISOString()
    };
    this.data[martyrId].comments.push(newComment);
    this.saveStorage();
    return newComment;
  }

  async getCandlesCount(martyrId) {
    if (!martyrId) return 0;
    if (window.BackendAPI) {
      const remoteCount = await window.BackendAPI.getCandlesCount(martyrId);
      if (typeof remoteCount === 'number') return remoteCount;
    }
    return this.data[martyrId] ? (this.data[martyrId].candles || 0) : 0;
  }

  async getComments(martyrId) {
    if (!martyrId) return [];
    if (window.BackendAPI) {
      const remoteComments = await window.BackendAPI.getComments(martyrId);
      if (Array.isArray(remoteComments) && remoteComments.length > 0) {
        return remoteComments;
      }
    }
    return this.data[martyrId] ? (this.data[martyrId].comments || []) : [];
  }
}

window.tributesEngine = new TributesEngine();
