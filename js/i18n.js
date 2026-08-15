/**
 * Palestinian Souls (Remember Gaza) - Internationalization (i18n) Engine
 * Supports 17 Languages with Lazy Loading, Dynamic RTL/LTR, LocalStorage Sync & Dropdown Menu
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
        this.closeLanguageDropdown();
      }
    });

    document.addEventListener('click', e => {
      const container = document.getElementById('language-dropdown-container');
      if (container && !container.contains(e.target)) {
        this.closeLanguageDropdown();
      }
    });
  }

  toggleLanguageDropdown(e) {
    if (e) e.stopPropagation();
    let menu = document.getElementById('language-dropdown-menu');
    if (!menu) {
      const container = document.getElementById('language-dropdown-container') || document.body;
      menu = document.createElement('div');
      menu.id = 'language-dropdown-menu';
      container.appendChild(menu);
    }

    const isHidden = menu.classList.contains('hidden') || menu.style.display === 'none';
    if (isHidden) {
      this.renderLanguageDropdownMenu(menu);
      menu.classList.remove('hidden');
      menu.style.display = 'block';
    } else {
      this.closeLanguageDropdown();
    }
  }

  renderLanguageDropdownMenu(menu) {
    if (!menu) menu = document.getElementById('language-dropdown-menu');
    if (!menu) return;

    const isRtl = this.isRTL();

    menu.className = `absolute ${isRtl ? 'right-0' : 'left-0'} mt-2 w-52 max-h-80 overflow-y-auto bg-[#18191c]/95 border border-white/10 rounded-2xl shadow-2xl z-[1002] py-2 font-['Cairo'] text-xs backdrop-blur-xl custom-scrollbar transition-all duration-150`;

    menu.innerHTML = SUPPORTED_LANGUAGES.map(lang => {
      const isActive = this.currentLang === lang.code;
      return `
        <button type="button" data-lang="${lang.code}" class="i18n-dropdown-item w-full flex items-center justify-between px-4 py-2.5 text-left font-['Cairo'] text-xs transition-all duration-150 ${isActive ? 'bg-red-600/20 text-red-400 font-bold' : 'text-gray-200 hover:bg-white/10 hover:text-white'}">
          <span class="truncate">${lang.name}</span>
          ${isActive ? '<span class="text-red-400 font-bold text-sm ml-2">✓</span>' : ''}
        </button>
      `;
    }).join('');

    // Ensure alignment within screen bounds for mobile responsiveness
    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth - 8) {
        menu.style.left = 'auto';
        menu.style.right = '0';
      } else if (rect.left < 8) {
        menu.style.left = '0';
        menu.style.right = 'auto';
      }
    });

    // Attach click events
    menu.querySelectorAll('.i18n-dropdown-item').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const code = btn.getAttribute('data-lang');
        if (typeof changeLanguage === 'function') {
          changeLanguage(code);
        } else {
          await this.setLanguage(code);
        }
        this.closeLanguageDropdown();
      };
    });
  }

  closeLanguageDropdown() {
    const menu = document.getElementById('language-dropdown-menu');
    if (menu) {
      menu.classList.add('hidden');
      menu.style.display = 'none';
    }
  }

  renderLanguageModal() {
    this.toggleLanguageDropdown();
  }

  closeLanguageModal() {
    this.closeLanguageDropdown();
  }
}

window.i18n = new I18nEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.i18n.init();
});
