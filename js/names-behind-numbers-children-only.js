/**
 * Names Behind Numbers Children Only Web Component (<names-behind-numbers-mf>)
 * Displays responsive side-by-side cards for martyred boys and girls with interactive cycling.
 */
class NamesBehindNumbersMF extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.boysIndex = 0;
    this.girlsIndex = 0;

    this.boysData = [
      { name: 'محمد علي النجار', id: '9041285' },
      { name: 'يوسف أحمد أبو حطب', id: '9082341' },
      { name: 'علي إياد سليمان', id: '9120482' },
      { name: 'أنس حسن الكرد', id: '9158392' },
      { name: 'عمر محمود العفيفي', id: '9091244' }
    ];

    this.girlsData = [
      { name: 'ملاك خالد عودة', id: '9051120' },
      { name: 'ليان عبد الهادي', id: '9073381' },
      { name: 'شام محمد الشاعر', id: '9139942' },
      { name: 'جنى إبراهيم الشيخ', id: '9110294' },
      { name: 'مريم يوسف رضوان', id: '9087113' }
    ];
  }

  connectedCallback() {
    this.render();
  }

  cycleNames() {
    this.boysIndex = (this.boysIndex + 1) % this.boysData.length;
    this.girlsIndex = (this.girlsIndex + 1) % this.girlsData.length;
    this.render();
  }

  render() {
    const currentBoy = this.boysData[this.boysIndex];
    const currentGirl = this.girlsData[this.girlsIndex];

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          max-width: 900px;
          margin: 25px auto;
          font-family: 'Cairo', sans-serif;
          box-sizing: border-box;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 640px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
        .gender-card {
          background: rgba(18, 18, 18, 0.95);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .badge {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1px;
          color: #f87171;
          text-transform: uppercase;
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 4px 12px;
          border-radius: 20px;
        }
        .child-name {
          font-size: 1.15rem;
          font-weight: 900;
          color: #ffffff;
          margin: 6px 0 2px 0;
        }
        .child-id {
          font-size: 0.85rem;
          color: #9ca3af;
          font-family: monospace;
          background: rgba(0, 0, 0, 0.4);
          padding: 2px 8px;
          border-radius: 6px;
        }
        .btn-container {
          text-align: center;
          margin-top: 16px;
        }
        .refresh-btn {
          background: rgba(239, 68, 68, 0.15);
          color: #ffffff;
          border: 1px solid rgba(239, 68, 68, 0.4);
          padding: 8px 20px;
          border-radius: 25px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Cairo', sans-serif;
        }
        .refresh-btn:hover {
          background: #dc2626;
          box-shadow: 0 0 15px rgba(220, 38, 38, 0.4);
        }
      </style>

      <div class="cards-grid">
        <!-- Boys Card -->
        <div class="gender-card">
          <div class="badge">CHILDREN · BOYS / أطفال · ذكور</div>
          <div class="child-name">${currentBoy.name}</div>
          <div class="child-id">ID / رقم الهوية: ${currentBoy.id}</div>
        </div>

        <!-- Girls Card -->
        <div class="gender-card">
          <div class="badge">CHILDREN · GIRLS / أطفال · إناث</div>
          <div class="child-name">${currentGirl.name}</div>
          <div class="child-id">ID / رقم الهوية: ${currentGirl.id}</div>
        </div>
      </div>

      <div class="btn-container">
        <button class="refresh-btn" id="cycle-btn">
          <span>↻</span> <span>عرض أسماء أخرى / Show other names</span>
        </button>
      </div>
    `;

    const cycleBtn = this.shadowRoot.getElementById('cycle-btn');
    if (cycleBtn) {
      cycleBtn.onclick = () => this.cycleNames();
    }
  }
}

if (!customElements.get('names-behind-numbers-mf')) {
  customElements.define('names-behind-numbers-mf', NamesBehindNumbersMF);
}
