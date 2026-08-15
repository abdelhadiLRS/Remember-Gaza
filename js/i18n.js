/**
 * Palestinian Souls (Remember Gaza) - Internationalization (i18n) Engine
 * Supports 17 Languages with Lazy Loading, Dynamic RTL/LTR, LocalStorage Sync & Event Listeners
 */

const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'it', name: 'Italiano', dir: 'ltr' },
  { code: 'pt', name: 'Português', dir: 'ltr' },
  { code: 'id', name: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'ms', name: 'Bahasa Melayu', dir: 'ltr' },
  { code: 'ur', name: 'اردو', dir: 'rtl' },
  { code: 'fa', name: 'فارسی', dir: 'rtl' },
  { code: 'nl', name: 'Nederlands', dir: 'ltr' },
  { code: 'ru', name: 'Русский', dir: 'ltr' },
  { code: 'zh', name: '中文', dir: 'ltr' },
  { code: 'ja', name: '日本語', dir: 'ltr' },
  { code: 'ko', name: '한국어', dir: 'ltr' }
];

class I18nEngine {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.translations = {};
    this.listeners = [];
    this.isLoaded = false;
  }

  detectLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramLang = urlParams.get('lang');
    if (paramLang && SUPPORTED_LANGUAGES.some(l => l.code === paramLang)) {
      return paramLang;
    }

    const saved = localStorage.getItem('app_lang') || localStorage.getItem('site_language');
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      return saved;
    }

    const navLang = (navigator.language || navigator.userLanguage || '').split('-')[0].toLowerCase();
    const match = SUPPORTED_LANGUAGES.find(l => l.code === navLang);
    return match ? match.code : 'ar';
  }

  async init() {
    await this.loadLanguage(this.currentLang);
    this.applyToDOM();
    this.bindEvents();
    this.isLoaded = true;
  }

  async loadLanguage(langCode) {
    if (!SUPPORTED_LANGUAGES.some(l => l.code === langCode)) {
      langCode = 'ar';
    }

    try {
      const res = await fetch(`data/languages/${langCode}.json`);
      if (res.ok) {
        this.translations[langCode] = await res.json();
      } else {
        console.warn(`[i18n] Failed to load ${langCode}, falling back to ar`);
        if (!this.translations['ar']) {
          const fallbackRes = await fetch('data/languages/ar.json');
          this.translations['ar'] = await fallbackRes.json();
        }
      }
    } catch (err) {
      console.error(`[i18n] Error loading language ${langCode}:`, err);
    }

    this.currentLang = langCode;
    localStorage.setItem('app_lang', langCode);
    localStorage.setItem('site_language', langCode);

    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode) || SUPPORTED_LANGUAGES[0];
    document.documentElement.lang = langCode;
    document.documentElement.dir = langInfo.dir;

    this.notifyListeners(langCode);
  }

  async setLanguage(langCode) {
    if (this.currentLang === langCode && this.translations[langCode]) return;
    await this.loadLanguage(langCode);
    this.applyToDOM();

    // Update query parameter without reload
    const url = new URL(window.location.href);
    url.searchParams.set('lang', langCode);
    window.history.replaceState({}, '', url);
  }

  t(key, defaultVal = '') {
    const dict = this.translations[this.currentLang] || this.translations['ar'] || {};
    return dict[key] || defaultVal || key;
  }

  getDir() {
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === this.currentLang);
    return langInfo ? langInfo.dir : 'rtl';
  }

  isRTL() {
    return this.getDir() === 'rtl';
  }

  applyToDOM() {
    const dict = this.translations[this.currentLang] || this.translations['ar'] || {};

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = dict[key];
        } else {
          el.innerText = dict[key];
        }
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key]) {
        el.title = dict[key];
      }
    });

    // Update title tag if site_title is set
    if (dict['site_title']) {
      const pageTitleEl = document.getElementById('page-title');
      if (pageTitleEl) pageTitleEl.innerText = dict['site_title'];
    }
  }

  onLanguageChange(fn) {
    this.listeners.push(fn);
  }

  notifyListeners(lang) {
    this.listeners.forEach(fn => {
      try { fn(lang); } catch (e) { console.error('[i18n] Listener error:', e); }
    });
  }

  bindEvents() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.closeLanguageModal();
      }
    });
  }

  renderLanguageModal() {
    this.toggleLanguageDropdown();
  }

  closeLanguageModal() {
    this.closeLanguageDropdown();
  }

  toggleLanguageDropdown(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const dropdown = document.getElementById('language-dropdown-menu');
    if (!dropdown) return;

    if (dropdown.classList.contains('hidden')) {
      this.openLanguageDropdown();
    } else {
      this.closeLanguageDropdown();
    }
  }

  openLanguageDropdown() {
    const dropdown = document.getElementById('language-dropdown-menu');
    const container = document.getElementById('language-dropdown-container');
    if (!dropdown) return;

    this.updateDropdownUI();
    dropdown.classList.remove('hidden');

    // Smart positioning relative to container/viewport on mobile/desktop
    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.right > window.innerWidth - 200) {
        dropdown.style.right = '0px';
        dropdown.style.left = 'auto';
      } else {
        dropdown.style.left = '0px';
        dropdown.style.right = 'auto';
      }
    }
  }

  closeLanguageDropdown() {
    const dropdown = document.getElementById('language-dropdown-menu');
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
  }

  updateDropdownUI() {
    const dropdown = document.getElementById('language-dropdown-menu');
    if (!dropdown) return;

    // Render clean YouTube-style language dropdown items without flags or heavy modals
    dropdown.innerHTML = SUPPORTED_LANGUAGES.map(lang => {
      const isSelected = this.currentLang === lang.code;
      return `
        <button
          onclick="changeLanguage('${lang.code}'); if(window.i18n) window.i18n.closeLanguageDropdown();"
          class="w-full flex items-center justify-between px-3.5 py-2 text-gray-200 hover:bg-white/10 hover:text-white transition-colors duration-150 text-xs text-start font-medium cursor-pointer ${isSelected ? 'bg-red-500/10 text-red-400 font-bold' : ''}">
          <span>${lang.name}</span>
          ${isSelected ? '<span class="text-red-400 text-sm ml-2">✓</span>' : ''}
        </button>
      `;
    }).join('');
  }
}

window.i18n = new I18nEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.i18n.init();
});
