/**
 * Human Toll Counter Web Component (<human-toll-counter>)
 * Calculates and dynamically displays days of genocide with styled counter digits
 */
class HumanTollCounter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const startDate = new Date('2023-10-07T00:00:00');
    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) || 1000;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: 'Cairo', sans-serif;
        }
        .counter-container {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 900;
          color: #ef4444;
        }
        .digit {
          background: rgba(220, 38, 38, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          padding: 2px 8px;
          border-radius: 8px;
          color: #ffffff;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
        }
      </style>
      <span class="counter-container">
        <span class="digit">${diffDays}</span>
      </span>
    `;
  }
}

if (!customElements.get('human-toll-counter')) {
  customElements.define('human-toll-counter', HumanTollCounter);
}
