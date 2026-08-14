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
    let modal = document.getElementById('i18n-language-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'i18n-language-modal';
      modal.className = 'fixed inset-0 z-[9999] hidden flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-all duration-300';
      document.body.appendChild(modal);
    }

    const currentDict = this.translations[this.currentLang] || {};
    const titleText = currentDict['select_language'] || 'Select Language / اختر اللغة';
    const searchPlaceholder = currentDict['search_language'] || 'Search language...';

    modal.innerHTML = `
      <div class="bg-gray-900 border border-gray-700/80 rounded-2xl p-6 max-w-md w-full text-white shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button id="i18n-modal-close" class="absolute top-4 ${this.isRTL() ? 'left-4' : 'right-4'} text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors">&times;</button>

        <h3 class="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-800 pb-3">
          <span>🌐</span> <span>${titleText}</span>
        </h3>

        <div class="mb-4 relative">
          <input type="text" id="i18n-search-input" placeholder="${searchPlaceholder}" class="w-full bg-gray-800/90 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/70 transition-colors" />
        </div>

        <div id="i18n-lang-list" class="max-h-80 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          ${SUPPORTED_LANGUAGES.map(lang => `
            <button data-lang="${lang.code}" class="i18n-lang-btn w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between text-sm transition-all duration-150 ${this.currentLang === lang.code ? 'bg-red-600/20 text-red-400 border border-red-500/30 font-semibold' : 'hover:bg-gray-800/80 text-gray-200'}">
              <span>${lang.name} <span class="text-xs text-gray-400 uppercase ml-1">(${lang.code})</span></span>
              ${this.currentLang === lang.code ? '<span class="text-red-400 font-bold">✓</span>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');

    const closeBtn = document.getElementById('i18n-modal-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.closeLanguageModal();
    }

    modal.onclick = (e) => {
      if (e.target === modal) this.closeLanguageModal();
    };

    const searchInput = document.getElementById('i18n-search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.i18n-lang-btn').forEach(btn => {
          const code = btn.getAttribute('data-lang');
          const langObj = SUPPORTED_LANGUAGES.find(l => l.code === code);
          const name = langObj ? langObj.name.toLowerCase() : '';
          if (name.includes(query) || code.includes(query)) {
            btn.style.display = 'flex';
          } else {
            btn.style.display = 'none';
          }
        });
      };
    }

    document.querySelectorAll('.i18n-lang-btn').forEach(btn => {
      btn.onclick = async () => {
        const selectedCode = btn.getAttribute('data-lang');
        await this.setLanguage(selectedCode);
        this.closeLanguageModal();
      };
    });
  }

  closeLanguageModal() {
    const modal = document.getElementById('i18n-language-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }
}

window.i18n = new I18nEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.i18n.init();
});
