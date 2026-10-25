class TelemetryChart extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.maxPoints = 40; // Max horizontal points before rolling off
    this.dataGrid = [];
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          max-width: 600px;
        }
        .container {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
        }
        canvas {
          display: block;
          width: 100%;
          height: 200px;
        }
      </style>
      <div class="container">
        <canvas id="chart"></canvas>
      </div>
    `;
  }

  connectedCallback() {
    this.canvas = this.shadowRoot.getElementById('chart');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    this.drawEmpty();
  }

  static get observedAttributes() {
    return ['stream-value'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'stream-value' && newValue !== null) {
      this.addDataPoint(Number(newValue));
    }
  }

  resizeCanvas() {
    // Corrects for high DPI / Retina displays to prevent blurriness
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = 200 * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `200px`;
  }

  addDataPoint(val) {
    this.dataGrid.push(val);
    if (this.dataGrid.length > this.maxPoints) {
      this.dataGrid.shift(); // Evict old metrics to prevent memory bloat
    }
    this.renderChart();
  }

  renderChart() {
    if (!this.ctx || this.dataGrid.length === 0) return;
    
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = 200;
    const padding = 20;
    
    this.ctx.clearRect(0, 0, w, h);

    // Calculate structural metrics boundaries dynamically
    const maxVal = Math.max(...this.dataGrid, 10);
    const minVal = Math.min(...this.dataGrid, 0);
    const range = maxVal - minVal;

    // Plotting vectors
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#10b981'; // Sleek telemetry green
    this.ctx.lineWidth = 2.5;
    this.ctx.lineJoin = 'round';

    for (let i = 0; i < this.dataGrid.length; i++) {
      const x = (i / (this.maxPoints - 1)) * w;
      const y = h - padding - ((this.dataGrid[i] - minVal) / range) * (h - padding * 2);
      
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();

    // Draw clean ambient glow under the telemetry line
    this.ctx.lineTo((this.dataGrid.length - 1) / (this.maxPoints - 1) * w, h);
    this.ctx.lineTo(0, h);
    const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  drawEmpty() {
    this.ctx.fillStyle = '#475569';
    this.ctx.font = '14px system-ui';
    this.ctx.fillText('Awaiting stream transmission telemetry data...', 20, 100);
  }
}

customElements.define('telemetry-chart', TelemetryChart);
