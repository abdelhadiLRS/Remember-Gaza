/**
 * Human Toll Counter Web Component (<human-toll-counter>)
 * Calculates and dynamically displays days of genocide starting from 7 October 2023.
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
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) || 1043;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: 'Cairo', sans-serif;
        }
        .counter-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(220, 38, 38, 0.25);
          border: 1px solid rgba(239, 68, 68, 0.5);
          color: #ffffff;
          padding: 2px 14px;
          border-radius: 12px;
          font-weight: 900;
          font-size: inherit;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
          letter-spacing: 1px;
        }
      </style>
      <span class="counter-badge">${diffDays}</span>
    `;
  }
}

if (!customElements.get('human-toll-counter')) {
  customElements.define('human-toll-counter', HumanTollCounter);
}
