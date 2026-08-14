/**
 * Palestinian Souls - Utility Functions
 */

window.Utils = {
  formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString(window.i18n ? window.i18n.currentLang : 'ar');
  },

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  extractFamilyName(fullName) {
    if (!fullName) return 'غير محدد';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0];

    // Check for prefixes like "أبو", "آل", "بن"
    const last = parts[parts.length - 1];
    const prev = parts[parts.length - 2];
    if (['أبو', 'ابن', 'بن', 'آل', 'عبد'].includes(prev) && parts.length > 2) {
      return prev + ' ' + last;
    }
    return last;
  }
};
