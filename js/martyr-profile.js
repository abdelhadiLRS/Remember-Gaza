/**
 * Palestinian Souls (Remember Gaza) - Centralized Martyr Documentation Engine
 * Single-point of truth for rendering professional martyr documentation records across all categories.
 */

function resolveMartyrId(martyr) {
  if (!martyr) return null;
  if (typeof martyr === 'string' || typeof martyr === 'number') return String(martyr);

  const id = martyr.id ??
             martyr.ID ??
             martyr.id_number ??
             martyr.record_id ??
             martyr.uuid ??
             martyr.martyr_id ??
             martyr.profile;

  if (!id) return null;

  let cleanId = String(id);
  if (cleanId.includes('/')) {
    const parts = cleanId.split('/');
    cleanId = parts[parts.length - 1];
  }
  return cleanId;
}

function openMartyrPage(martyr) {
  const id = resolveMartyrId(martyr);
  if (!id) {
    console.error('[MartyrProfile] Missing martyr ID:', martyr);
    return;
  }
  window.location.href = `martyr.html?id=${encodeURIComponent(id)}`;
}

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

    const id = resolveMartyrId(rawData) || ('RG-' + Math.floor(Math.random() * 899999 + 100000));
    const rawName = rawData.name || rawData.ar_name || rawData.en_name || 'شهيد بلا اسم';

    let cleanName = rawName;
    if (cleanName.includes('|')) {
      const parts = cleanName.split('|');
      cleanName = parts[1] ? parts[1].split('Killed')[0].trim() : parts[0].trim();
    } else if (cleanName.includes('Killed by')) {
      cleanName = cleanName.split('Killed by')[0].trim();
    }

    const enName = rawData.en_name || rawData.name_en || '';

    let category = 'شهيد من غزة';
    let ageNum = rawData.age !== undefined && rawData.age !== null ? parseInt(rawData.age, 10) : null;

    if (ageNum && ageNum < 18) {
      category = 'شهيد طفل';
    } else if (rawData.profile || rawData.notes || rawData.image || (rawData.source && String(rawData.source).includes('press'))) {
      if ((cleanName + ' ' + (rawData.notes || '')).match(/(صحفي|صحفية|مراسل|مصور|إعلامي|صحافة|journalist|press|reporter|media)/i)) {
        category = 'شهيد صحفي';
      }
    }

    if (rawData.profession && String(rawData.profession).match(/(طبيب|دكتور|ممرض|مسعف|كوادر طبية|صحة|doctor|nurse|paramedic|medic)/i)) {
      category = 'شهيد من الكوادر الطبية';
    }

    if (rawData.category) {
      category = rawData.category;
    }

    const photo = rawData.photo || rawData.photo_url || rawData.image || rawData.image_url || 'favicon.png';

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
    openMartyrPage(rawData);
  }

  openSuggestEditModal(id) {
    window.location.href = `edit-martyr.html?id=${encodeURIComponent(id)}`;
  }

  shareMartyrRecord(id) {
    const url = `${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, '/')}` + `martyr.html?id=${encodeURIComponent(id)}`;
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
}

window.martyrProfileEngine = new MartyrProfileEngine();
function openMartyrProfile(martyr) {
  openMartyrPage(martyr);
}
