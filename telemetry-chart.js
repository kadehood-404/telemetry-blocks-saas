// telemetry-chart.js
class TelemetryChart {
    constructor(canvasId, maxPoints = 80, themeColor = '#00ffcc', fillAlpha = 0.12) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.maxPoints = maxPoints;
        this.data = new Float32Array(maxPoints);
        this.head = 0;
        this.count = 0;
        
        // Dynamic structural themes based on configuration parameters
        this.colors = {
            line: themeColor,
            grid: 'rgba(255, 255, 255, 0.03)',
            text: '#475569',
            fillStart: themeColor + Math.floor(fillAlpha * 255).toString(16).padStart(2, '0'),
            fillEnd: themeColor + '00'
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        const dpr = window.devicePixelRatio || 1;
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
        
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    push(value) {
        this.data[this.head] = value;
        this.head = (this.head + 1) % this.maxPoints;
        if (this.count < this.maxPoints) this.count++;
    }

    drawGrid(yMin, yMax) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.font = '9px monospace';
        this.ctx.fillStyle = this.colors.text;

        const lines = 3;
        for (let i = 0; i <= lines; i++) {
            const y = (this.height / lines) * i;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();

            const val = yMax - ((yMax - yMin) / lines) * i;
            this.ctx.fillText(Math.floor(val).toString(), this.width - 24, y - 4);
        }
    }

    render() {
        if (!this.ctx || this.count === 0) return;
        
        this.ctx.clearRect(0, 0, this.width, this.height);

        let yMin = Infinity;
        let yMax = -Infinity;
        for (let i = 0; i < this.count; i++) {
            const val = this.data[i];
            if (val < yMin) yMin = val;
            if (val > yMax) yMax = val;
        }
        
        if (yMax === yMin) { yMax += 5; yMin -= 5; }
        const yRange = yMax - yMin;

        this.drawGrid(yMin, yMax);

        const stepX = this.width / (this.maxPoints - 1);
        const startIndex = this.count === this.maxPoints ? this.head : 0;

        const path = new Path2D();
        for (let i = 0; i < this.count; i++) {
            const bufferIndex = (startIndex + i) % this.maxPoints;
            const val = this.data[bufferIndex];
            
            const x = i * stepX;
            const y = this.height - ((val - yMin) / yRange) * this.height;

            if (i === 0) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }
        }

        if (this.count > 1) {
            const fillPath = new Path2D(path);
            const lastX = (this.count - 1) * stepX;
            fillPath.lineTo(lastX, this.height);
            fillPath.lineTo(0, this.height);
            fillPath.closePath();

            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, this.colors.fillStart);
            gradient.addColorStop(1, this.colors.fillEnd);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill(fillPath);
        }

        this.ctx.lineWidth = 1.75;
        this.ctx.strokeStyle = this.colors.line;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.stroke(path);
    }
}

// ============================================================================
// CLIENT SIMULATION METRICS RUNTIME
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Instantiate 3 unique, isolated canvas charts
    const chartOps = new TelemetryChart('canvasOps', 90, '#00ffcc', 0.12);
    const chartLatency = new TelemetryChart('canvasLatency', 90, '#a855f7', 0.10);
    const chartErrors = new TelemetryChart('canvasErrors', 90, '#f43f5e', 0.08);

    // Cache structural DOM element hooks
    const domOps = document.getElementById('opsValue');
    const domLatency = document.getElementById('latencyValue');
    const domErrors = document.getElementById('errorValue');
    const domErrorPill = document.getElementById('errorStatusPill');

    let tick = 0;

    function pipelineSimulatorLoop() {
        tick += 0.03;

        // 1. Ingest Throughput Engine Calculation
        const baseOps = 1450 + Math.sin(tick) * 350 + Math.cos(tick * 2.5) * 120;
        const currentOps = Math.floor(baseOps + (Math.random() - 0.5) * 60);
        chartOps.push(currentOps);
        if (domOps) domOps.textContent = currentOps.toLocaleString();

        // 2. Latency Pipeline Simulation (with periodic random lag spike jumps)
        let currentLatency = Math.floor(22 + (Math.sin(tick * 0.8) * 8) + (Math.random() * 4));
        if (Math.random() > 0.97) { 
            currentLatency += Math.floor(45 + Math.random() * 60); // Simulated garbage collection freeze
        }
        chartLatency.push(currentLatency);
        if (domLatency) domLatency.textContent = currentLatency.toString();

        // 3. Error Rate Delta calculation 
        let errorRate = Math.abs(Math.sin(tick * 0.4) * Math.cos(tick * 0.4) * 1.8) + (Math.random() * 0.15);
        if (currentLatency > 50) errorRate += (Math.random() * 2.2); // Spikes on heavy network lag load
        chartErrors.push(errorRate);
        if (domErrors) domErrors.textContent = errorRate.toFixed(2);

        // Update state color indicator tags dynamically
        if (domErrorPill) {
            if (errorRate > 1.5) {
                domErrorPill.textContent = 'Degraded';
                domErrorPill.style.background = 'rgba(244,63,94,0.2)';
            } else {
                domErrorPill.textContent = 'Nominal';
                domErrorPill.style.background = 'rgba(0,255,204,0.1)';
                domErrorPill.style.color = '#00ffcc';
            }
        }

        // Render all instances simultaneously 
        chartOps.render();
        chartLatency.render();
        chartErrors.render();

        requestAnimationFrame(pipelineSimulatorLoop);
    }

    // Launch pipeline
    pipelineSimulatorLoop();
});
