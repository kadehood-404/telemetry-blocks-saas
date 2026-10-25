// telemetry-chart.js
class TelemetryChart {
    constructor(canvasId, maxPoints = 100) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.maxPoints = maxPoints;
        this.data = new Float32Array(maxPoints);
        this.head = 0;
        this.count = 0;
        
        // Render configuration
        this.colors = {
            line: '#00ffcc',
            grid: 'rgba(255, 255, 255, 0.05)',
            text: '#64748b',
            fillStart: 'rgba(0, 255, 204, 0.15)',
            fillEnd: 'rgba(0, 255, 204, 0)'
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
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
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = this.colors.text;

        const lines = 4;
        for (let i = 0; i <= lines; i++) {
            const y = (this.height / lines) * i;
            
            // Draw horizontal grid line
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();

            // Render matching axis metric value
            const val = yMax - ((yMax - yMin) / lines) * i;
            this.ctx.fillText(val.toFixed(1), 8, y - 4);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.count === 0) return;

        // Auto-scale bounds based on current buffer window
        let yMin = Infinity;
        let yMax = -Infinity;
        for (let i = 0; i < this.count; i++) {
            const val = this.data[i];
            if (val < yMin) yMin = val;
            if (val > yMax) yMax = val;
        }
        
        // Prevent flatline division by zero issues
        if (yMax === yMin) { yMax += 1; yMin -= 1; }
        const yRange = yMax - yMin;

        // 1. Draw Background Grid Infrastructure First
        this.drawGrid(yMin, yMax);

        // 2. Compute Transform Vectors via Single Path Loop
        this.ctx.beginPath();
        
        const stepX = this.width / (this.maxPoints - 1);
        const startIndex = this.count === this.maxPoints ? this.head : 0;

        for (let i = 0; i < this.count; i++) {
            const bufferIndex = (startIndex + i) % this.maxPoints;
            const val = this.data[bufferIndex];
            
            const x = i * stepX;
            const y = this.height - ((val - yMin) / yRange) * this.height;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        // Clone line path properties to safely paint Area Fill underneath
        const linePath = new Path2D(this.ctx);

        // 3. Render Area Fill Segment
        if (this.count > 1) {
            const lastX = (this.count - 1) * stepX;
            this.ctx.lineTo(lastX, this.height);
            this.ctx.lineTo(0, this.height);
            this.ctx.closePath();

            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, this.colors.fillStart);
            gradient.addColorStop(1, this.colors.fillEnd);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }

        // 4. Render Stroke Path Overlay Cleanly
        this.ctx.beginPath();
        this.ctx.stroke(linePath);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.colors.line;
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    }
}
