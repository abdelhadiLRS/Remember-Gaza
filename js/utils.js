/**
 * Palestinian Souls (Remember Gaza) - Utility Helper Module
 * Input Sanitization, XSS Encoding, Safe URL Parsing & Helpers
 */

class UtilsEngine {
  static escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static sanitizeUrl(url) {
    if (!url) return '';
    const cleanUrl = String(url).trim();
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('/')) {
      return cleanUrl;
    }
    return '';
  }

  static formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('ar-EG');
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

window.Utils = UtilsEngine;
