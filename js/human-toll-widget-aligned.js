/**
 * Human Toll Widget Aligned Web Component (<human-toll-widget>)
 * Displays aligned human toll metric cards
 */
class HumanTollWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          margin: 20px 0;
          font-family: 'Cairo', sans-serif;
        }
        .toll-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .toll-card {
          background: rgba(18, 18, 18, 0.9);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 12px;
          text-align: center;
        }
        .label {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 4px;
        }
        .val {
          font-size: 1.2rem;
          font-weight: 900;
          color: #ef4444;
        }
      </style>
      <div class="toll-grid">
        <div class="toll-card">
          <div class="label">إجمالي الحصيلة البشرية</div>
          <div class="val">+73,000 شهيد ومفقود</div>
        </div>
        <div class="toll-card">
          <div class="label">نسبة استهداف الأطفال والنساء</div>
          <div class="val">70% من الإجمالي</div>
        </div>
        <div class="toll-card">
          <div class="label">عائلات أُبيدت بالكامل</div>
          <div class="val">+2,700 عائلة</div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('human-toll-widget')) {
  customElements.define('human-toll-widget', HumanTollWidget);
}
