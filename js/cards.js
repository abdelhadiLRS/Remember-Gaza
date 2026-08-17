/**
 * Palestinian Souls - Martyr Card Generator & PNG Downloader
 * Integrated with Centralized Documentation Engine (js/martyr-profile.js)
 */

class CardsEngine {
  constructor() {
    this.currentMartyr = null;
  }

  showMartyrCard(martyrData) {
    this.currentMartyr = martyrData;
    if (window.martyrProfileEngine) {
      window.martyrProfileEngine.openMartyrProfile(martyrData);
    } else if (typeof openMartyrProfile === 'function') {
      openMartyrProfile(martyrData);
    }
  }

  checkURLDirectLink(allData = []) {
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('martyr') || urlParams.get('id') || urlParams.get('person');
    if (targetId && allData.length > 0) {
      const found = allData.find(m => String(m.id) === String(targetId) || String(m.record_id) === String(targetId) || String(m.id_number) === String(targetId));
      if (found) {
        this.showMartyrCard(found);
      }
    }
  }
}

window.cardsEngine = new CardsEngine();
