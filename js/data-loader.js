/**
 * Palestinian Souls (Remember Gaza) - Asynchronous Data Loader Engine
 * Handles async fetching, in-memory caching, retry state management,
 * and error handling across all subpages. Zero mock data fallbacks.
 */

class DataLoaderEngine {
  constructor() {
    this.cache = new Map();
    this.loadingStates = new Map();
  }

  async loadJSON(key, url, options = {}) {
    const { force = false, retryCount = 2 } = options;

    if (!force && this.cache.has(key)) {
      return this.cache.get(key);
    }

    let attempt = 0;
    while (attempt <= retryCount) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status} fetching ${url}`);
        }
        const data = await response.json();
        this.cache.set(key, data);
        if (window.cardsEngine && Array.isArray(data)) {
          window.cardsEngine.registerData(data);
        }
        return data;
      } catch (err) {
        attempt++;
        console.warn(`[DataLoader] Fetch attempt ${attempt} failed for ${key} (${url}):`, err.message);
        if (attempt > retryCount) {
          throw err;
        }
        await new Promise(res => setTimeout(res, 500 * attempt));
      }
    }
  }

  async loadVictims(options = {}) {
    return this.loadJSON('victims', 'data/victims.json', options);
  }

  async loadJournalists(options = {}) {
    return this.loadJSON('journalists', 'data/journalists.json', options);
  }

  async loadPressGaza(options = {}) {
    return this.loadJSON('press_killed_in_gaza', 'data/press_killed_in_gaza.json', options);
  }

  async loadVillages(options = {}) {
    return this.loadJSON('villages', 'data/villages.geojson', options);
  }

  async loadTimeline(lang = 'ar', options = {}) {
    const key = `timeline_${lang}`;
    const url = `data/timeline/${lang}.json`;
    try {
      return await this.loadJSON(key, url, options);
    } catch (e) {
      console.warn(`[DataLoader] Failed to load timeline for ${lang}, falling back to ar`);
      return await this.loadJSON('timeline_ar', 'data/timeline/ar.json', options);
    }
  }

  renderErrorUI(containerId, errorMsg, onRetry) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentLang = window.i18n ? window.i18n.currentLang : 'ar';
    const isRTL = window.i18n ? window.i18n.isRTL() : true;
    const errorText = window.i18n ? window.i18n.t('error_loading', 'تعذر تحميل بيانات الأرشيف') : 'تعذر تحميل بيانات الأرشيف';
    const retryText = window.i18n ? window.i18n.t('retry', 'إعادة المحاولة') : 'إعادة المحاولة';

    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8 text-center bg-gray-900/80 border border-red-500/30 rounded-2xl max-w-md mx-auto my-8 shadow-2xl backdrop-blur-md">
        <div class="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 border border-red-500/40">
          ⚠️
        </div>
        <h4 class="text-lg font-bold text-red-400 mb-2">${errorText}</h4>
        <p class="text-xs text-gray-400 mb-6">${errorMsg || ''}</p>
        <button id="${containerId}-retry-btn" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-red-600/30 flex items-center gap-2">
          <span>🔄</span> <span>${retryText}</span>
        </button>
      </div>
    `;

    const retryBtn = document.getElementById(`${containerId}-retry-btn`);
    if (retryBtn && typeof onRetry === 'function') {
      retryBtn.onclick = () => onRetry();
    }
  }

  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

window.dataLoader = new DataLoaderEngine();
