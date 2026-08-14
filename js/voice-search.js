/**
 * Palestinian Souls - Voice Search Engine
 * Speech Recognition matching active locale
 */

const VOICE_LANG_MAP = {
  ar: 'ar-SA',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  tr: 'tr-TR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  id: 'id-ID',
  ms: 'ms-MY',
  ur: 'ur-PK',
  fa: 'fa-IR',
  nl: 'nl-NL',
  ru: 'ru-RU',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR'
};

class VoiceSearchEngine {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VoiceSearch] Web Speech API not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateUIStatus(true);
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = transcript;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    this.recognition.onerror = (event) => {
      console.error('[VoiceSearch] Error:', event.error);
      this.isListening = false;
      this.updateUIStatus(false);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateUIStatus(false);
    };
  }

  toggle() {
    if (!this.recognition) {
      alert(window.i18n ? window.i18n.t('voice_not_supported', 'البحث الصوتي غير مدعوم في متصفحك') : 'البحث الصوتي غير مدعوم في متصفحك');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      const currentLang = window.i18n ? window.i18n.currentLang : 'ar';
      this.recognition.lang = VOICE_LANG_MAP[currentLang] || 'ar-SA';
      this.recognition.start();
    }
  }

  updateUIStatus(listening) {
    const btn = document.getElementById('voice-search-btn');
    if (!btn) return;

    if (listening) {
      btn.classList.add('animate-pulse', 'text-red-500', 'border-red-500');
      btn.title = window.i18n ? window.i18n.t('listening', 'جاري الاستماع...') : 'جاري الاستماع...';
    } else {
      btn.classList.remove('animate-pulse', 'text-red-500', 'border-red-500');
      btn.title = window.i18n ? window.i18n.t('voice_search', 'البحث الصوتي') : 'البحث الصوتي';
    }
  }
}

window.voiceSearch = new VoiceSearchEngine();
