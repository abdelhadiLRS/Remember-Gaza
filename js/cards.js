/**
 * Palestinian Souls - Martyr Card Generator & PNG Downloader
 * Supports multi-language cards, html2canvas export, direct links (?id=...)
 * Ensures target legacy phrase is strictly excluded.
 */

class CardsEngine {
  constructor() {
    this.currentMartyr = null;
  }

  showMartyrCard(martyrData) {
    this.currentMartyr = martyrData;
    let modal = document.getElementById('martyr-card-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'martyr-card-modal';
      modal.className = 'fixed inset-0 z-[9999] hidden flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto';
      document.body.appendChild(modal);
    }

    const lang = window.i18n ? window.i18n.currentLang : 'ar';
    const isRTL = window.i18n ? window.i18n.isRTL() : true;

    const t = key => window.i18n ? window.i18n.t(key) : key;

    const name = martyrData.name || martyrData.en_name || 'غير محدد';
    const age = martyrData.age !== undefined && martyrData.age !== null ? `${martyrData.age} ${t('years_old')}` : t('unknown_age');
    const idNum = martyrData.id || martyrData.id_number || martyrData.dob || '—';
    const city = martyrData.city || martyrData.district || martyrData.governorate || 'غزة';
    const photo = martyrData.photo || martyrData.image || 'images/icons/avatar-placeholder.png';

    modal.innerHTML = `
      <div class="bg-gray-900 border border-gray-700/80 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
        <button id="card-modal-close" class="absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-gray-400 hover:text-white text-2xl font-bold w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors">&times;</button>

        <div id="martyr-card-export-target" class="bg-gradient-to-b from-gray-900 to-black p-6 rounded-2xl border border-gray-800 text-center relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-green-600 to-black"></div>

          <div class="w-28 h-28 mx-auto mb-4 rounded-full border-2 border-red-500/50 p-1 shadow-xl overflow-hidden bg-gray-800 flex items-center justify-center">
            <img src="${photo}" alt="${name}" class="w-full h-full object-cover rounded-full" onerror="this.src='images/icons/avatar-placeholder.png'" />
          </div>

          <h3 class="text-2xl font-black text-red-500 mb-1">${name}</h3>
          <p class="text-xs text-gray-400 mb-4">${city}</p>

          <div class="grid grid-cols-2 gap-3 bg-gray-800/60 p-4 rounded-xl border border-gray-700/50 text-sm mb-4">
            <div class="text-right">
              <span class="text-gray-400 text-xs block">${t('age')}</span>
              <strong class="text-white">${age}</strong>
            </div>
            <div class="text-right">
              <span class="text-gray-400 text-xs block">${t('id_number')}</span>
              <strong class="text-red-400 font-mono">${idNum}</strong>
            </div>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-3 justify-center">
          <button id="download-card-png-btn" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all duration-150 flex items-center gap-2 shadow-lg shadow-red-600/30">
            <span>📷</span> <span>${t('download_png')}</span>
          </button>
          <button id="share-card-btn" class="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center gap-2">
            <span>🔗</span> <span>${t('share')}</span>
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');

    const closeBtn = document.getElementById('card-modal-close');
    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');

    const dlBtn = document.getElementById('download-card-png-btn');
    if (dlBtn) {
      dlBtn.onclick = () => this.downloadCardPNG(name);
    }

    const shareBtn = document.getElementById('share-card-btn');
    if (shareBtn) {
      shareBtn.onclick = () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${idNum}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl);
          alert(t('share') + ': ' + shareUrl);
        }
      };
    }
  }

  async downloadCardPNG(filename) {
    const target = document.getElementById('martyr-card-export-target');
    if (!target || !window.html2canvas) {
      console.error('[Cards] html2canvas not available');
      return;
    }

    try {
      const canvas = await window.html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#09090b'
      });
      const link = document.createElement('a');
      link.download = `${filename || 'martyr-card'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('[Cards] PNG export error:', err);
    }
  }

  checkURLDirectLink(allData = []) {
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id');
    if (targetId && allData.length > 0) {
      const found = allData.find(m => String(m.id) === String(targetId) || String(m.id_number) === String(targetId));
      if (found) {
        this.showMartyrCard(found);
      }
    }
  }
}

window.cardsEngine = new CardsEngine();
