/**
 * Names Behind Numbers Children Only Web Component (<names-behind-numbers-mf>)
 * Displays a rolling ticker / showcase of martyred children names
 */
class NamesBehindNumbersMF extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const sampleNames = [
      'الطفل الشهيد علي إياد أبو حطب (عام واحد)',
      'الطفلة الشهيدة لسيان عبد الهادي (3 أعوام)',
      'الطفل الشهيد يوسف أحمد النجار (5 أعوام)',
      'الطفلة الشهيدة مريم محمود عودة (عامان)',
      'الطفل الشهيد أنس حسن سليمان (4 أعوام)',
      'الطفلة الشهيدة شام محمد الكرد (عام واحد)'
    ];

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          margin: 20px 0;
          font-family: 'Cairo', sans-serif;
        }
        .widget-card {
          background: rgba(15, 15, 15, 0.9);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          color: #ffffff;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
        .title {
          font-size: 0.9rem;
          color: #f87171;
          font-weight: 700;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .ticker {
          font-size: 0.85rem;
          color: #d1d5db;
          font-weight: 600;
          background: rgba(0, 0, 0, 0.4);
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      </style>
      <div class="widget-card">
        <div class="title">
          <span>👶</span> <span>أسماء خلف الأرقام (الأطفال الشهداء)</span>
        </div>
        <div class="ticker" id="names-ticker">
          ${sampleNames[0]}
        </div>
      </div>
    `;

    let index = 0;
    const tickerEl = this.shadowRoot.getElementById('names-ticker');
    setInterval(() => {
      index = (index + 1) % sampleNames.length;
      if (tickerEl) tickerEl.textContent = sampleNames[index];
    }, 4000);
  }
}

if (!customElements.get('names-behind-numbers-mf')) {
  customElements.define('names-behind-numbers-mf', NamesBehindNumbersMF);
}
