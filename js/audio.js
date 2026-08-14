/**
 * Palestinian Souls - Audio & Text-to-Speech Engine
 */

class AudioEngine {
  constructor() {
    this.speechSynth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.isMuted = false;
  }

  speakText(text, langCode = 'ar') {
    if (!this.speechSynth) {
      console.warn('[AudioEngine] Text-to-Speech not supported');
      return;
    }

    this.stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === 'en' ? 'en-US' : (langCode === 'fr' ? 'fr-FR' : 'ar-SA');
    utterance.rate = 0.95;

    this.currentUtterance = utterance;
    this.speechSynth.speak(utterance);
  }

  stopSpeech() {
    if (this.speechSynth && this.speechSynth.speaking) {
      this.speechSynth.cancel();
    }
  }

  toggleMusic() {
    const audioEl = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');
    if (!audioEl) return;

    if (audioEl.paused) {
      audioEl.play().then(() => {
        if (musicBtn) musicBtn.classList.add('playing');
      }).catch(err => console.log('Audio playback prevented:', err));
    } else {
      audioEl.pause();
      if (musicBtn) musicBtn.classList.remove('playing');
    }
  }
}

window.audioEngine = new AudioEngine();
