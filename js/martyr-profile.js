/**
 * Palestinian Souls (Remember Gaza) - Centralized Martyr Documentation Engine
 * Single-point of truth for rendering professional martyr documentation records across all categories.
 */

class MartyrProfileEngine {
  constructor() {
    this.i18nDict = {
      ar: {
        doc_card_title: 'بطاقة توثيق الشهيد',
        doc_id: 'رقم التوثيق',
        personal_data: 'البيانات الشخصية',
        martyrdom_data: 'بيانات الاستشهاد',
        biography: 'نبذة عن الشهيد',
        sources: 'المصادر الموثقة',
        suggest_edit: '✏️ اقتراح تعديل على البيانات',
        share_doc: '🔗 مشاركة التوثيق',
        light_candle: '🕯️ إضاءة شمعة',
        listen_bio: '🔊 استماع للسيرة',
        age: 'العمر',
        dob: 'تاريخ الميلاد',
        gender: 'الجنس',
        id_number: 'رقم الهوية',
        residence: 'مكان السكن / المحافظة',
        profession: 'المهنة / العمل',
        workplace: 'جهة العمل',
        martyrdom_date: 'تاريخ الاستشهاد',
        martyrdom_location: 'مكان الاستشهاد',
        governorate: 'المحافظة',
        method: 'طريقة الاستشهاد',
        attacker: 'جهة الاستهداف',
        close: 'إغلاق',
        copied: 'تم نسخ رابط التوثيق المباشر!'
      },
      en: {
        doc_card_title: 'Martyr Documentation Record',
        doc_id: 'Documentation ID',
        personal_data: 'Personal Information',
        martyrdom_data: 'Martyrdom Details',
        biography: 'Biography & Story',
        sources: 'Verified Sources',
        suggest_edit: '✏️ Suggest Data Edit',
        share_doc: '🔗 Share Record',
        light_candle: '🕯️ Light Candle',
        listen_bio: '🔊 Listen',
        age: 'Age',
        dob: 'Date of Birth',
        gender: 'Gender',
        id_number: 'ID Number',
        residence: 'Residence / Governorate',
        profession: 'Profession',
        workplace: 'Workplace',
        martyrdom_date: 'Date of Martyrdom',
        martyrdom_location: 'Location',
        governorate: 'Governorate',
        method: 'Method of Attack',
        attacker: 'Attacker / Force',
        close: 'Close',
        copied: 'Direct record link copied!'
      },
      fr: {
        doc_card_title: 'Fiche de documentation du martyr',
        doc_id: 'N° de documentation',
        personal_data: 'Informations personnelles',
        martyrdom_data: 'Détails du martyre',
        biography: 'Biographie et histoire',
        sources: 'Sources vérifiées',
        suggest_edit: '✏️ Proposer une modification',
        share_doc: '🔗 Partager la fiche',
        light_candle: '🕯️ Allumer une bougie',
        listen_bio: '🔊 Écouter',
        age: 'Âge',
        dob: 'Date de naissance',
        gender: 'Genre',
        id_number: 'N° d’identité',
        residence: 'Résidence / Gouvernorat',
        profession: 'Profession',
        workplace: 'Lieu de travail',
        martyrdom_date: 'Date du martyre',
        martyrdom_location: 'Lieu du martyre',
        governorate: 'Gouvernorat',
        method: 'Méthode d’attaque',
        attacker: 'Auteur de l’attaque',
        close: 'Fermer',
        copied: 'Lien direct copié !'
      },
      es: {
        doc_card_title: 'Ficha de documentación del mártir',
        doc_id: 'Nº de documentación',
        personal_data: 'Información personal',
        martyrdom_data: 'Detalles del martirio',
        biography: 'Biografía e historia',
        sources: 'Fuentes verificadas',
        suggest_edit: '✏️ Sugerir edición',
        share_doc: '🔗 Compartir registro',
        light_candle: '🕯️ Encender vela',
        listen_bio: '🔊 Escuchar',
        age: 'Edad',
        dob: 'Fecha de nacimiento',
        gender: 'Género',
        id_number: 'Nº de identidad',
        residence: 'Residencia / Gobernación',
        profession: 'Profesión',
        workplace: 'Lugar de trabajo',
        martyrdom_date: 'Fecha del martirio',
        martyrdom_location: 'Lugar del martirio',
        governorate: 'Gobernación',
        method: 'Método de ataque',
        attacker: 'Atacante',
        close: 'Cerrar',
        copied: '¡Enlace directo copiado!'
      }
    };
  }

  getLangDict() {
    const lang = (window.i18n && window.i18n.currentLang) ? window.i18n.currentLang : 'ar';
    return this.i18nDict[lang] || this.i18nDict['ar'];
  }

  normalizeMartyrData(rawData) {
    if (!rawData) return null;

    const id = String(rawData.id || rawData.record_id || rawData.id_number || rawData.profile || 'RG-' + Math.floor(Math.random() * 899999 + 100000));
    const rawName = rawData.name || rawData.ar_name || rawData.en_name || 'شهيد بلا اسم';

    // Parse composite press names (e.g., "Islam Quneita | إسلام قنيطة Killed by an Airstrike")
    let cleanName = rawName;
    if (cleanName.includes('|')) {
      const parts = cleanName.split('|');
      cleanName = parts[1] ? parts[1].split('Killed')[0].trim() : parts[0].trim();
    } else if (cleanName.includes('Killed by')) {
      cleanName = cleanName.split('Killed by')[0].trim();
    }

    const enName = rawData.en_name || rawData.name_en || '';

    // Determine category
    let category = 'شهيد من غزة';
    let ageNum = rawData.age !== undefined && rawData.age !== null ? parseInt(rawData.age, 10) : null;

    if (ageNum && ageNum < 18) {
      category = 'شهيد طفل';
    } else if (rawData.profile || rawData.notes || rawData.image || (rawData.source && rawData.source.includes('press'))) {
      if ((cleanName + ' ' + (rawData.notes || '')).match(/(صحفي|صحفية|مراسل|مصور|إعلامي|صحافة|journalist|press|reporter|media)/i)) {
        category = 'شهيد صحفي';
      }
    }

    if (rawData.profession && rawData.profession.match(/(طبيب|دكتور|ممرض|مسعف|كوادر طبية|صحة|doctor|nurse|paramedic|medic)/i)) {
      category = 'شهيد من الكوادر الطبية';
    }

    if (rawData.category) {
      category = rawData.category;
    }

    const photo = rawData.photo || rawData.photo_url || rawData.image || rawData.image_url || 'favicon.png';

    // Parse sources
    let sourcesList = [];
    if (rawData.source) {
      if (typeof rawData.source === 'string') {
        sourcesList.push({ name: 'سجل التوثيق الرسمي', url: rawData.source.startsWith('http') ? rawData.source : '' });
      } else if (Array.isArray(rawData.source)) {
        rawData.source.forEach(s => sourcesList.push({ name: s.name || 'مصدر موثق', url: s.url || '' }));
      }
    }
    if (rawData.notes) {
      sourcesList.push({ name: 'بيانات التوثيق والصحافة', url: '' });
    }

    return {
      id: id,
      name: cleanName,
      en_name: enName,
      category: category,
      photo: photo,
      age: (rawData.age !== undefined && rawData.age !== null) ? `${rawData.age} عام` : '',
      dob: rawData.dob || '',
      gender: rawData.sex === 'm' ? 'ذكر' : (rawData.sex === 'f' ? 'أنثى' : (rawData.gender || '')),
      id_number: rawData.id_number || (rawData.id && !isNaN(rawData.id) ? rawData.id : ''),
      residence: rawData.city || rawData.district || rawData.governorate || rawData.residence || '',
      governorate: rawData.governorate || rawData.district || '',
      city: rawData.city || '',
      profession: rawData.profession || '',
      workplace: rawData.workplace || '',
      martyrdom_date: rawData.date_of_death || rawData.date || rawData.martyrdom_date || '',
      martyrdom_location: rawData.location || rawData.death_location || rawData.place || '',
      method: rawData.method || rawData.death_status || '',
      attacker: rawData.attacker || 'قوات الاحتلال الإسرائيلي',
      biography: rawData.story || rawData.biography || rawData.notes || rawData.details || '',
      sources: sourcesList,
      audio: rawData.audio || rawData.audio_url || '',
      raw: rawData
    };
  }

  openMartyrProfile(rawData) {
    const martyr = this.normalizeMartyrData(rawData);
    if (!martyr) return;

    let overlay = document.getElementById('martyr-profile-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'martyr-profile-modal-overlay';
      overlay.style.cssText = 'position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; font-family: "Cairo", sans-serif; overflow-y: auto;';
      document.body.appendChild(overlay);
    }

    const dict = this.getLangDict();
    const isRTL = window.i18n ? window.i18n.isRTL() : true;
    const dir = isRTL ? 'rtl' : 'ltr';

    // Helper to render label-value pairs only if value is present
    const renderField = (label, value, fontClass = '') => {
      if (!value || value === '—' || value === 'غير متوفر') return '';
      return `
        <div class="flex justify-between items-center bg-black/30 border border-white/5 p-2.5 rounded-xl text-xs">
          <span class="text-gray-400 font-semibold">${label}:</span>
          <strong class="text-white ${fontClass}">${window.Utils ? window.Utils.escapeHTML(String(value)) : value}</strong>
        </div>
      `;
    };

    overlay.innerHTML = `
      <div class="bg-[#111114] border border-white/10 rounded-2xl max-w-3xl w-full text-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col" dir="${dir}">

        <!-- Modal Header -->
        <div class="border-b border-white/10 p-4 flex justify-between items-center bg-black/50 shrink-0">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <h2 class="font-bold text-base text-red-500 m-0">${dict.doc_card_title}</h2>
          </div>
          <div class="flex items-center gap-3">
            <span class="bg-red-950/40 border border-red-500/30 text-red-400 text-[11px] font-mono px-2.5 py-1 rounded-full">
              ${dict.doc_id}: ${martyr.id}
            </span>
            <button onclick="document.getElementById('martyr-profile-modal-overlay').style.display='none'" class="text-gray-400 hover:text-white text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition">
              ✕
            </button>
          </div>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="p-5 overflow-y-auto space-y-5 text-right flex-1 no-scrollbar">

          <!-- Profile Photo & Main Title Block -->
          <div class="flex flex-col sm:flex-row items-center gap-5 bg-black/40 p-4 rounded-2xl border border-white/5">
            <div class="w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-2xl border-2 border-red-600/60 overflow-hidden bg-stone-900 shadow-xl">
              <img src="${martyr.photo}" alt="${martyr.name}" class="w-full h-full object-cover" onerror="this.src='favicon.png'" />
            </div>
            <div class="text-center sm:text-start flex-1">
              <span class="inline-block bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold px-3 py-1 rounded-full mb-2">
                ${martyr.category}
              </span>
              <h1 class="text-2xl font-black text-white m-0 leading-tight">${martyr.name}</h1>
              ${martyr.en_name ? `<p class="text-xs text-gray-400 font-mono mt-1 m-0">${martyr.en_name}</p>` : ''}
            </div>
          </div>

          <!-- Personal Data Section -->
          <div class="space-y-2">
            <h3 class="text-xs font-bold text-red-400 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
              👤 <span>${dict.personal_data}</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${renderField(dict.age, martyr.age)}
              ${renderField(dict.dob, martyr.dob)}
              ${renderField(dict.gender, martyr.gender)}
              ${renderField(dict.id_number, martyr.id_number, 'font-mono')}
              ${renderField(dict.residence, martyr.residence)}
              ${renderField(dict.profession, martyr.profession)}
              ${renderField(dict.workplace, martyr.workplace)}
            </div>
          </div>

          <!-- Martyrdom Details Section -->
          <div class="space-y-2">
            <h3 class="text-xs font-bold text-red-400 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
              🎯 <span>${dict.martyrdom_data}</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${renderField(dict.martyrdom_date, martyr.martyrdom_date)}
              ${renderField(dict.martyrdom_location, martyr.martyrdom_location)}
              ${renderField(dict.governorate, martyr.governorate)}
              ${renderField(dict.method, martyr.method)}
              ${renderField(dict.attacker, martyr.attacker)}
            </div>
          </div>

          <!-- Biography & Narrative Section -->
          ${martyr.biography ? `
            <div class="space-y-2">
              <h3 class="text-xs font-bold text-red-400 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                📖 <span>${dict.biography}</span>
              </h3>
              <div class="bg-black/40 border border-white/5 p-4 rounded-xl text-xs text-gray-200 leading-relaxed text-justify">
                ${window.Utils ? window.Utils.escapeHTML(martyr.biography).replace(/\n/g, '<br>') : martyr.biography}
              </div>
            </div>
          ` : ''}

          <!-- Sources Section -->
          ${martyr.sources.length > 0 ? `
            <div class="space-y-2">
              <h3 class="text-xs font-bold text-red-400 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                🛡️ <span>${dict.sources}</span>
              </h3>
              <div class="space-y-1.5">
                ${martyr.sources.map(s => `
                  <div class="flex items-center justify-between bg-black/30 border border-white/5 p-2.5 rounded-xl text-xs">
                    <span class="text-gray-300">${s.name}</span>
                    ${s.url ? `<a href="${s.url}" target="_blank" class="text-red-400 hover:underline">رابط المصدر 🔗</a>` : '<span class="text-gray-500">سجل صحفي موثق</span>'}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

        </div>

        <!-- Action Footer -->
        <div class="border-t border-white/10 p-4 bg-black/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div class="flex items-center gap-2">
            <button onclick="window.martyrProfileEngine.openSuggestEditModal('${martyr.id}')" class="px-3.5 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white text-xs font-bold transition flex items-center gap-1.5">
              ${dict.suggest_edit}
            </button>

            <button onclick="window.martyrProfileEngine.shareMartyrRecord('${martyr.id}')" class="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 text-xs font-bold transition flex items-center gap-1.5">
              ${dict.share_doc}
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.martyrProfileEngine.lightCandleForMartyr('${martyr.id}')" class="px-3.5 py-2 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400 hover:bg-amber-600 hover:text-white text-xs font-bold transition">
              ${dict.light_candle}
            </button>
          </div>
        </div>

      </div>
    `;

    overlay.style.display = 'flex';

    // Sync URL without full reload
    const url = new URL(window.location.href);
    url.searchParams.set('martyr', martyr.id);
    window.history.replaceState({}, '', url);
  }

  shareMartyrRecord(id) {
    const url = `${window.location.origin}${window.location.pathname}?martyr=${encodeURIComponent(id)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      const dict = this.getLangDict();
      alert(dict.copied + '\n' + url);
    }
  }

  lightCandleForMartyr(id) {
    const key = `rg_candles_${id}`;
    let count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    localStorage.setItem(key, count);
    alert(`شكراً لإضاءتك شمعة تضامن! إجمالي الشموع للشهيد: ${count} 🕯️`);
  }

  openSuggestEditModal(id) {
    let modal = document.getElementById('suggest-edit-modal-overlay');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'suggest-edit-modal-overlay';
      modal.style.cssText = 'position: fixed; inset: 0; z-index: 10001; background: rgba(0,0,0,0.88); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; font-family: "Cairo", sans-serif; overflow-y: auto;';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-[#111114] border border-red-500/40 rounded-2xl max-w-lg w-full text-white shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-right">
        <div class="border-b border-white/10 p-4 flex justify-between items-center bg-black/50">
          <h3 class="font-bold text-sm text-red-400 m-0">✏️ نموذج اقتراح تعديل على بيانات الشهيد</h3>
          <button onclick="document.getElementById('suggest-edit-modal-overlay').style.display='none'" class="text-gray-400 hover:text-white text-base">✕</button>
        </div>

        <form onsubmit="window.martyrProfileEngine.submitEditProposal(event, '${id}')" class="p-5 space-y-3 overflow-y-auto flex-1 text-xs no-scrollbar">
          <div class="bg-red-950/20 border border-red-500/20 p-3 rounded-xl text-gray-300 leading-relaxed mb-2">
            سيتم إرسال اقتراح التعديل إلى فريق المراجعة والتوثيق للتدقيق قبل اعتماد التحديثات في البيانات الأصلية.
          </div>

          <div>
            <label class="block text-gray-400 mb-1">اسم تقديم الاقتراح / صاحب الطلب:</label>
            <input type="text" id="prop-submitter" required placeholder="اسمك الكامل" class="w-full bg-black/60 border border-white/20 text-white p-2.5 rounded-xl outline-none focus:border-red-500">
          </div>

          <div>
            <label class="block text-gray-400 mb-1">تعديل الاسم / بيانات شخصية إضافية:</label>
            <input type="text" id="prop-personal" placeholder="مثلاً: الاسم الكامل المعادل، رقم الهوية..." class="w-full bg-black/60 border border-white/20 text-white p-2.5 rounded-xl outline-none focus:border-red-500">
          </div>

          <div>
            <label class="block text-gray-400 mb-1">تعديل أو إضافات على السيرة الذاتية:</label>
            <textarea id="prop-bio" rows="3" placeholder="اكتب التفاصيل والملاحظات التوثيقية الجديدة..." class="w-full bg-black/60 border border-white/20 text-white p-2.5 rounded-xl outline-none focus:border-red-500 resize-none"></textarea>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">رابط مصدر التوثيق أو صورة جديدة:</label>
            <input type="url" id="prop-source" placeholder="https://example.com/source" class="w-full bg-black/60 border border-white/20 text-white p-2.5 rounded-xl outline-none focus:border-red-500 font-mono">
          </div>

          <button type="submit" class="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition mt-2">
            إرسال الاقتراح للمراجعة والاعتماد
          </button>
        </form>
      </div>
    `;

    modal.style.display = 'flex';
  }

  async submitEditProposal(event, martyrId) {
    event.preventDefault();
    const submitter = document.getElementById('prop-submitter').value.trim();
    const personal = document.getElementById('prop-personal').value.trim();
    const bio = document.getElementById('prop-bio').value.trim();
    const source = document.getElementById('prop-source').value.trim();

    if (window.BackendAPI) {
      const res = await window.BackendAPI.submitContribution({
        martyrId: martyrId,
        type: 'suggestion',
        submitterName: submitter,
        martyrName: personal || ('Martyr #' + martyrId),
        city: 'قطاع غزة',
        notes: `[اقتراح تعديل]: ${personal}\n[السيرة]: ${bio}\n[المصدر]: ${source}`,
        photoUrl: source.match(/\.(jpeg|jpg|png|webp)$/i) ? source : ''
      });

      if (res.success) {
        alert('تم إرسال اقتراح التعديل بنجاح إلى فريق المراجعة والتوثيق!');
        document.getElementById('suggest-edit-modal-overlay').style.display = 'none';
      }
    }
  }
}

window.martyrProfileEngine = new MartyrProfileEngine();
function openMartyrProfile(martyr) {
  window.martyrProfileEngine.openMartyrProfile(martyr);
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('martyr') || urlParams.get('person');
  if (targetId) {
    fetch('data/victims.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find(m => String(m.id) === String(targetId) || String(m.record_id) === String(targetId) || String(m.id_number) === String(targetId));
          if (found && window.martyrProfileEngine) {
            window.martyrProfileEngine.openMartyrProfile(found);
          }
        }
      }).catch(()=>{});
  }
});
