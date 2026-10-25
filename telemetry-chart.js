// telemetry-chart.js
class TelemetryChart {
    constructor(canvasId, maxPoints = 100) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found.`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.maxPoints = maxPoints;
        this.data = new Float32Array(maxPoints);
        this.head = 0;
        this.count = 0;
        
        // Premium dashboard design theme parameters
        this.colors = {
            line: '#00ffcc',
            grid: 'rgba(255, 255, 255, 0.05)',
            text: '#64748b',
            fillStart: 'rgba(0, 255, 204, 0.12)',
            fillEnd: 'rgba(0, 255, 204, 0)'
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        const dpr = window.devicePixelRatio || 1;
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
        
        // Scale canvas backing store instantly for crisp rendering on high-DPI screens
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
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = this.colors.text;

        const lines = 4;
        for (let i = 0; i <= lines; i++) {
            const y = (this.height / lines) * i;
            
            // Draw clean horizontal background lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();

            // Right-aligned localized baseline axis metrics
            const val = yMax - ((yMax - yMin) / lines) * i;
            this.ctx.fillText(Math.floor(val).toString(), this.width - 28, y - 4);
        }
    }

    render() {
        if (!this.ctx || this.count === 0) return;
        
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Dynamic auto-scaling bound configurations
        let yMin = Infinity;
        let yMax = -Infinity;
        for (let i = 0; i < this.count; i++) {
            const val = this.data[i];
            if (val < yMin) yMin = val;
            if (val > yMax) yMax = val;
        }
        
        // Prevent crashes on static inputs or flatlines
        if (yMax === yMin) { yMax += 10; yMin -= 10; }
        const yRange = yMax - yMin;

        // 1. Draw Grid Underlay Layer
        this.drawGrid(yMin, yMax);

        const stepX = this.width / (this.maxPoints - 1);
        const startIndex = this.count === this.maxPoints ? this.head : 0;

        // 2. Generate Hardware Accelerated Path Construction Loop
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

        // 3. Render Area Fill Segment Below the Path
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

        // 4. Paint Primary Core Stroke Path Accent Over the Area
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.colors.line;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.stroke(path);
    }
}

// ============================================================================
// LIVE SIMULATION & DRIVER ENGINE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const canvasId = 'telemetryCanvas';
    const metricTextId = 'metricValue';
    
    // Check if the HTML anchor container placeholder exists before launching frame ticks
    if (!document.getElementById(canvasId)) {
        console.warn(`Telemetry runtime paused: '#${canvasId}' canvas element missing from template.`);
        return;
    }

    // Initialize chart with 120 tracking intervals
    const chart = new TelemetryChart(canvasId, 120);
    const metricLabelNode = document.getElementById(metricTextId);

    let tick = 0;
    
    function executionFrameLoop() {
        tick += 0.04;
        
        // Multi-frequency sinusoidal algorithms to mimic complex servers
        const coreSignal = Math.sin(tick) * 200;
        const structuralWave = Math.cos(tick * 1.7) * 80;
        const hardwareJitter = (Math.random() - 0.5) * 35;
        
        // Map calculations directly into real operations data ranges
        const generatedMetric = Math.max(150, Math.floor(650 + coreSignal + structuralWave + hardwareJitter));
        
        // Feed real data metrics array buffer window
        chart.push(generatedMetric);
        
        // Mirror current operations scale string explicitly to structural layout card text element
        if (metricLabelNode) {
            metricLabelNode.textContent = generatedMetric.toLocaleString();
        }

        // Refresh canvas surface layers
        chart.render();
        
        requestAnimationFrame(executionFrameLoop);
    }

    // Fire off telemetry processing execution loops
    executionFrameLoop();
});
