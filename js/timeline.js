/**
 * Palestinian Souls - Multi-Language Timeline Engine
 */

class TimelineEngine {
  constructor() {
    this.events = [];
  }

  async initTimeline(lang = 'ar') {
    if (!window.dataLoader) return;
    try {
      this.events = await window.dataLoader.loadTimeline(lang);
      this.renderTimeline();
    } catch (err) {
      console.error('[TimelineEngine] Failed to load timeline data:', err);
    }
  }

  renderTimeline() {
    const container = document.getElementById('timeline-container') || document.getElementById('milestone-timeline-container');
    if (!container) return;

    if (!this.events || this.events.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-400">لا توجد أحداث تاريخية مسجلة</p>';
      return;
    }

    const isRTL = window.i18n ? window.i18n.isRTL() : true;
    const t = key => window.i18n ? window.i18n.t(key) : key;

    container.innerHTML = this.events.map(item => {
      if (item.type === 'decade') {
        return `
          <div class="decade-header my-8 text-center">
            <span class="px-6 py-2 bg-red-600/20 border border-red-500/40 text-red-400 rounded-full font-black text-lg">
              ${item.decade}s
            </span>
          </div>
        `;
      }

      return `
        <div id="${item.id}" class="timeline-item bg-gray-900/90 border border-gray-800 rounded-2xl p-6 my-6 shadow-xl relative backdrop-blur-md hover:border-red-500/40 transition-all duration-300">
          <div class="flex flex-col md:flex-row gap-6 items-center">
            ${item.image ? `<div class="w-full md:w-1/3 rounded-xl overflow-hidden border border-gray-800"><img src="${item.image}" alt="${item.title}" class="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" onerror="this.style.display='none'" /></div>` : ''}
            <div class="w-full md:w-2/3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-red-500 bg-red-600/10 border border-red-500/30 px-3 py-1 rounded-full">${item.year}</span>
                ${item.stat ? `<span class="text-xs font-semibold text-gray-300 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">${item.stat}</span>` : ''}
              </div>
              <h3 class="text-xl font-bold text-white mb-2">${item.title}</h3>
              <p class="text-sm text-gray-300 leading-relaxed mb-4">${item.excerpt}</p>

              <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
                <button type="button" onclick="timelineShowOnMap('${(item.title || '').replace(/'/g, "\\'")}')" class="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                  <span>️</span> <span>${t('view_on_map')}</span>
                </button>
                ${item.sourceUrl ? `
                  <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                    <span></span> <span>${item.sourceName || t('sources')}</span>
                  </a>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.timelineEngine = new TimelineEngine();

window.timelineShowOnMap = function(milestoneTitle) {
  if (window.location.pathname.includes('map.html')) {
    if (typeof window.highlightMapPoint === 'function') {
      window.highlightMapPoint(milestoneTitle);
    }
  } else {
    window.location.href = `map.html?query=${encodeURIComponent(milestoneTitle)}`;
  }
};
