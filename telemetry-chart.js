// High-Frequency Canvas Stream Pipeline
(function () {
    const canvas = document.getElementById('telemetryCanvas');
    const ctx = canvas.getContext('2d');
    
    let history = new Float32Array(150); // Store up to 150 historical ticks
    let maxVal = 1200;

    // Adjust canvas resolution dynamically to enforce sharp rendering on retina screens
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);
    resize();

    // Listen to data loop ticks and slide history matrix arrays array left
    window.addEventListener('telemetryTick', (e) => {
        history.set(history.subarray(1)); 
        history[history.length - 1] = e.detail.value;
    });

    // Main render pipeline running at display's native fresh rate
    function draw() {
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        
        ctx.clearRect(0, 0, w, h);

        if (history.length === 0) {
            requestAnimationFrame(draw);
            return;
        }

        // Draw structural horizontal grid rules
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const yPos = (h / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(w, yPos);
            ctx.stroke();
        }

        // Generate line path coordinates mapped across data matrix indices
        ctx.beginPath();
        const step = w / (history.length - 1);
        
        for (let i = 0; i < history.length; i++) {
            // Protect against zero metrics during load state initialization
            const val = history[i] || 600; 
            const x = i * step;
            const y = h - (val / maxVal) * (h * 0.8) - (h * 0.1); // Safe 10% bounds padding

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        // Render Stroke Line
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Render Under-Area Linear Gradient Fill
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.00)');
        ctx.fillStyle = gradient;
        ctx.fill();

        requestAnimationFrame(draw);
    }

    // Kick off animation loop immediately
    requestAnimationFrame(draw);
})();
