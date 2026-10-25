class TelemetryCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._value = 0;
    
    // Internal template with minimal footprint
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: system-ui, -apple-system, sans-serif;
          width: 100%;
          max-width: 280px;
        }
        .card {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .label {
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .value {
          color: #f8fafc;
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 8px;
          transition: color 0.2s ease;
        }
        .status-up { color: #10b981; }
        .status-down { color: #ef4444; }
      </style>
      <div class="card">
        <div class="label"><slot name="title">Metric</slot></div>
        <div id="metric-val" class="value">0</div>
      </div>
    `;
  }

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' && oldValue !== newValue) {
      this._value = newValue;
      this.updateUI(Number(oldValue) < Number(newValue));
    }
  }

  updateUI(isUp) {
    const valEl = this.shadowRoot.getElementById('metric-val');
    if (!valEl) return;

    // Direct DOM manipulation ensures speed under continuous streaming data
    valEl.textContent = this._value;
    
    // Quick micro-animation signaling data direction shifts
    const flashClass = isUp ? 'status-up' : 'status-down';
    valEl.classList.add(flashClass);
    setTimeout(() => valEl.classList.remove(flashClass), 300);
  }
}

customElements.define('telemetry-card', TelemetryCard);
