/**
 * Palestinian Souls - Tributes & Candles Engine
 * Handles candle lighting, user comments/testimonies, and localStorage persistence
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

  lightCandle(martyrId) {
    if (!martyrId) return 0;
    if (!this.data[martyrId]) {
      this.data[martyrId] = { candles: 0, comments: [] };
    }
    this.data[martyrId].candles = (this.data[martyrId].candles || 0) + 1;
    this.saveStorage();
    return this.data[martyrId].candles;
  }

  addComment(martyrId, author, text) {
    if (!martyrId || !text.trim()) return false;
    if (!this.data[martyrId]) {
      this.data[martyrId] = { candles: 0, comments: [] };
    }
    const newComment = {
      id: Date.now(),
      author: author.trim() || 'فاعل خير',
      text: text.trim(),
      date: new Date().toISOString()
    };
    this.data[martyrId].comments.push(newComment);
    this.saveStorage();
    return newComment;
  }

  getCandlesCount(martyrId) {
    return this.data[martyrId] ? (this.data[martyrId].candles || 0) : 0;
  }

  getComments(martyrId) {
    return this.data[martyrId] ? (this.data[martyrId].comments || []) : [];
  }
}

window.tributesEngine = new TributesEngine();
