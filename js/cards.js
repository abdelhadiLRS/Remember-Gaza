/**
 * Palestinian Souls - Dynamic Person Profile Engine & Card Generator
 * Provides unified profile view, schema normalization, direct URL deep-linking,
 * keyboard accessibility, Web Share API, and PNG image card export.
 */

const DEFAULT_AVATAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="%236b7280"><rect width="100%" height="100%" fill="%2318181b"/><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;

class CardsEngine {
  constructor() {
    this.currentPerson = null;
    this.modalId = 'person-profile-modal';
    this.allLoadedData = [];
    this.initListeners();
  }

  initListeners() {
    // Listen for browser Back/Forward navigation
    window.addEventListener('popstate', () => this.checkURLDirectLink());
    window.addEventListener('hashchange', () => this.checkURLDirectLink());

    // Listen for Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });

    // Check direct URL on initial DOM readiness
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.checkURLDirectLink());
    } else {
      setTimeout(() => this.checkURLDirectLink(), 300);
    }
  }

  /**
   * Registers dataset arrays for deep-link lookup
   */
  registerData(dataArray) {
    if (Array.isArray(dataArray) && dataArray.length > 0) {
      this.allLoadedData = this.allLoadedData.concat(dataArray);
      this.checkURLDirectLink();
    }
  }

  /**
   * Normalizes raw object from any dataset (victims, journalists, press, etc.)
   */
  normalizePerson(raw) {
    if (!raw) return null;

    let id = raw.id || raw.id_number || raw.dob;
    let nameAr = raw.name || raw.name_ar || raw.ar_name || '';
    let nameEn = raw.en_name || raw.name_en || '';
    let notes = raw.story || raw.notes || raw.bio || raw.description || raw.about || '';
    let image = raw.photo || raw.image || raw.avatar || raw.img || '';

    // Parse complex journalist strings if present e.g. "Islam Quneita | إسلام قنيطة Killed by an Airstrike"
    if (typeof raw.name === 'string' && raw.name.includes('|')) {
      const parts = raw.name.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        if (!nameEn) nameEn = parts[0];
        const secondPart = parts[1];
        // Split cause of death if appended
        const arMatch = secondPart.match(/^([\u0600-\u06FF\s]+)(.*)$/);
        if (arMatch) {
          if (!nameAr) nameAr = arMatch[1].trim();
          if (!notes && arMatch[2].trim()) notes = arMatch[2].trim();
        } else {
          if (!nameAr) nameAr = secondPart;
        }
      }
    }

    if (!id && (nameAr || nameEn)) {
      id = encodeURIComponent((nameAr || nameEn).toLowerCase().replace(/\s+/g, '-'));
    }

    // Determine category
    let category = raw.category || raw.role || raw.profession || '';
    if (!category) {
      if (raw.profile || raw.image || raw.notes) {
        category = 'صحفي / إعلامي';
      } else {
        category = 'شهيد';
      }
    }

    // Map source
    let sources = raw.sources || raw.source || [];
    if (typeof sources === 'string') sources = [sources];
    if (raw.source === 'u') sources = ['وزارة الصحة الفلسطينية / السجل المدني'];

    return {
      id: String(id || ''),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      image: image.trim(),
      age: (raw.age !== undefined && raw.age !== null && raw.age !== '') ? raw.age : null,
      dob: raw.dob || raw.date_of_birth || null,
      dod: raw.dod || raw.date_of_death || raw.date || raw.martyrdom_date || null,
      sex: raw.sex || raw.gender || null,
      city: raw.city || raw.district || raw.governorate || raw.location || raw.place_of_death || null,
      placeOfBirth: raw.place_of_birth || raw.pob || null,
      profession: raw.profession || raw.job || null,
      status: raw.status || raw.state || null,
      story: notes.trim(),
      sources: sources.filter(Boolean),
      profileUrl: raw.profile || raw.links || null,
      raw: raw
    };
  }

  /**
   * Main method to display a person profile
   */
  showMartyrCard(rawPerson) {
    const person = this.normalizePerson(rawPerson);
    if (!person) return;

    this.currentPerson = person;
    this.updateURL(person.id);

    let modal = document.getElementById(this.modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = this.modalId;
      document.body.appendChild(modal);
    }

    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto transition-opacity duration-300';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const lang = (window.i18n && window.i18n.currentLang) ? window.i18n.currentLang : 'ar';
    const isRTL = window.i18n ? window.i18n.isRTL() : true;
    const t = (key, fallback) => (window.i18n ? window.i18n.t(key, fallback) : fallback);

    // Primary display name based on current language
    const primaryName = (lang === 'ar' ? (person.nameAr || person.nameEn) : (person.nameEn || person.nameAr)) || '—';
    const secondaryName = (lang === 'ar' ? person.nameEn : person.nameAr) || '';

    // Handle Image URL
    let photoUrl = person.image;
    if (photoUrl && photoUrl.startsWith('/storage/')) {
      photoUrl = 'https://palestiniansouls.com' + photoUrl;
    }
    const displayPhoto = photoUrl || DEFAULT_AVATAR_SVG;

    // Format fields (only build if present!)
    const badges = [];

    if (person.age !== null) {
      const ageStr = `${person.age} ${t('years_old', 'سنة')}`;
      badges.push({ label: t('age', 'العمر'), value: ageStr, icon: '🎂' });
    }

    if (person.id && !person.id.includes('%')) {
      badges.push({ label: t('id_number', 'رقم الهوية'), value: person.id, icon: '🆔', mono: true });
    }

    if (person.city) {
      badges.push({ label: t('city', 'المنطقة'), value: person.city, icon: '📍' });
    }

    if (person.dod) {
      badges.push({ label: t('date', 'تاريخ الاستشهاد'), value: person.dod, icon: '📅' });
    }

    if (person.dob) {
      badges.push({ label: t('birth_date', 'تاريخ الميلاد'), value: person.dob, icon: '👶' });
    }

    if (person.sex) {
      const sexLabel = person.sex === 'm' ? t('male', 'ذكر') : person.sex === 'f' ? t('female', 'أنثى') : person.sex;
      badges.push({ label: t('sex', 'الجنس'), value: sexLabel, icon: '👤' });
    }

    if (person.profession) {
      badges.push({ label: t('profession', 'المهنة'), value: person.profession, icon: '💼' });
    }

    if (person.status) {
      badges.push({ label: t('status', 'الحالة'), value: person.status, icon: 'ℹ️' });
    }

    // Build Badges HTML
    const badgesHtml = badges.map(b => `
      <div class="flex items-center gap-2 bg-gray-800/80 border border-gray-700/60 px-3 py-2 rounded-xl text-xs sm:text-sm">
        <span class="text-base">${b.icon}</span>
        <div class="${isRTL ? 'text-right' : 'text-left'}">
          <span class="text-gray-400 block text-[10px] uppercase tracking-wider">${this.escapeHTML(b.label)}</span>
          <strong class="${b.mono ? 'font-mono text-red-400' : 'text-gray-100'} font-semibold">${this.escapeHTML(String(b.value))}</strong>
        </div>
      </div>
    `).join('');

    // Story HTML
    const storyHtml = person.story ? `
      <div class="mt-5 bg-gray-800/40 border border-gray-700/50 rounded-2xl p-4 sm:p-5">
        <h4 class="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
          <span>📖</span> <span>${t('story_title', 'النبذة والقصة')}</span>
        </h4>
        <p class="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">${this.escapeHTML(person.story)}</p>
      </div>
    ` : '';

    // Sources HTML
    const sourcesHtml = (person.sources && person.sources.length > 0) ? `
      <div class="mt-4 bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-xs text-gray-400">
        <strong class="text-gray-300 block mb-1">📌 ${t('sources', 'المصادر والتوثيق')}:</strong>
        <ul class="list-disc list-inside space-y-1">
          ${person.sources.map(s => `<li>${this.escapeHTML(s)}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    // Inner modal layout
    modal.innerHTML = `
      <div class="bg-gray-900 border border-gray-700/80 rounded-3xl p-4 sm:p-8 max-w-4xl w-full text-white shadow-2xl relative my-auto animate-in fade-in zoom-in duration-200" dir="${isRTL ? 'rtl' : 'ltr'}">

        <!-- Header Bar -->
        <div class="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-semibold rounded-full">
              ${this.escapeHTML(person.category)}
            </span>
            <span class="px-2.5 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1">
              <span>✓</span> <span>${t('verified', 'موثق')}</span>
            </span>
          </div>

          <button id="person-profile-close" aria-label="${t('close', 'إغلاق')}" class="text-gray-400 hover:text-white text-2xl font-bold w-9 h-9 flex items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors cursor-pointer">
            &times;
          </button>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">

          <!-- Image Column -->
          <div class="md:col-span-5 flex flex-col items-center">
            <div class="w-full max-w-[280px] sm:max-w-full aspect-[4/5] rounded-2xl border-2 border-red-500/30 overflow-hidden shadow-2xl bg-gray-950 relative group">
              <img src="${this.escapeHTML(displayPhoto)}" alt="${this.escapeHTML(primaryName)}"
                   class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                   onerror="this.src='${DEFAULT_AVATAR_SVG}'"
                   loading="lazy" />
              <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-60"></div>
            </div>
          </div>

          <!-- Info Column -->
          <div class="md:col-span-7 flex flex-col justify-start">
            <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              ${this.escapeHTML(primaryName)}
            </h2>
            ${secondaryName ? `<p class="text-sm text-gray-400 mt-1 font-medium">${this.escapeHTML(secondaryName)}</p>` : ''}

            <!-- Badges -->
            <div class="flex flex-wrap gap-2.5 mt-4">
              ${badgesHtml}
            </div>

            <!-- Story / Bio -->
            ${storyHtml}

            <!-- Sources -->
            ${sourcesHtml}
          </div>

        </div>

        <!-- Action Footer -->
        <div class="mt-8 pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button id="person-share-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer">
              <span>🔗</span> <span>${t('share', 'مشاركة الملف')}</span>
            </button>
            <button id="person-copy-link-btn" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer">
              <span>📋</span> <span>${t('copy_link', 'نسخ الرابط')}</span>
            </button>
          </div>

          <button id="person-download-png-btn" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer">
            <span>📷</span> <span>${t('download_png', 'حفظ كصورة')}</span>
          </button>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Bind event handlers
    const closeBtn = document.getElementById('person-profile-close');
    if (closeBtn) closeBtn.onclick = () => this.closeModal();

    modal.onclick = (e) => {
      if (e.target === modal) this.closeModal();
    };

    const shareBtn = document.getElementById('person-share-btn');
    if (shareBtn) shareBtn.onclick = () => this.sharePersonProfile();

    const copyBtn = document.getElementById('person-copy-link-btn');
    if (copyBtn) copyBtn.onclick = () => this.copyPersonLink();

    const dlBtn = document.getElementById('person-download-png-btn');
    if (dlBtn) dlBtn.onclick = () => this.downloadCardPNG(primaryName);
  }

  closeModal() {
    const modal = document.getElementById(this.modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
    document.body.style.overflow = '';
    this.currentPerson = null;

    // Clear hash/query if person parameter was set
    const url = new URL(window.location.href);
    if (url.searchParams.has('person') || url.searchParams.has('id')) {
      url.searchParams.delete('person');
      url.searchParams.delete('id');
      window.history.pushState({}, '', url.pathname + url.search);
    } else if (window.location.hash.startsWith('#person/')) {
      window.history.pushState({}, '', url.pathname + url.search);
    }
  }

  updateURL(personId) {
    if (!personId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('person', personId);
    window.history.pushState({ personId }, '', url.toString());
  }

  getShareURL() {
    if (!this.currentPerson) return window.location.href;
    const url = new URL(window.location.href);
    url.searchParams.set('person', this.currentPerson.id);
    return url.toString();
  }

  async sharePersonProfile() {
    const shareUrl = this.getShareURL();
    const title = this.currentPerson ? (this.currentPerson.nameAr || this.currentPerson.nameEn) : 'Remember Gaza';
    const text = `تخليد الذكرى والتوثيق | ${title}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Share error:', err);
      }
    }
    this.copyPersonLink();
  }

  copyPersonLink() {
    const shareUrl = this.getShareURL();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('تم نسخ رابط الملف الشخصي بنجاح!');
      }).catch(() => {
        prompt('رابط الملف الشخصي:', shareUrl);
      });
    } else {
      prompt('رابط الملف الشخصي:', shareUrl);
    }
  }

  async downloadCardPNG(filename) {
    const modalContent = document.querySelector(`#${this.modalId} > div`);
    if (!modalContent || !window.html2canvas) {
      alert('ميزة التقاط الصورة كـ PNG تتطلب أداء html2canvas.');
      return;
    }

    try {
      const canvas = await window.html2canvas(modalContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#09090b'
      });
      const link = document.createElement('a');
      link.download = `توثيق_${(filename || 'person').replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('[Cards] PNG export error:', err);
    }
  }

  checkURLDirectLink(allData = null) {
    const dataSet = allData || this.allLoadedData;
    const urlParams = new URLSearchParams(window.location.search);
    let targetId = urlParams.get('person') || urlParams.get('id');

    if (!targetId && window.location.hash.startsWith('#person/')) {
      targetId = decodeURIComponent(window.location.hash.replace('#person/', ''));
    }

    if (targetId && dataSet.length > 0) {
      const found = dataSet.find(m => {
        const norm = this.normalizePerson(m);
        return norm && (
          norm.id === targetId ||
          norm.nameAr === targetId ||
          norm.nameEn === targetId ||
          String(m.id) === String(targetId) ||
          String(m.id_number) === String(targetId)
        );
      });

      if (found) {
        this.showMartyrCard(found);
      }
    }
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Global Singleton
window.cardsEngine = new CardsEngine();
