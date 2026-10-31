// Telemetry Data Engine & UI Card Sync
(function () {
    const state = {
        currentOps: 0,
        maxTarget: 1200,
        noiseFactor: 0.15
    };

    const counterEl = document.getElementById('ops-counter');
    const progressEl = document.getElementById('ops-progress');

    // High performance integer interpolation loop
    function updateMetrics() {
        // Base baseline target curve oscillating via time loop
        const timeFactor = Math.sin(Date.now() / 5000) * 300 + 700;
        // Inject high-frequency noise variation
        const randomNoise = (Math.random() - 0.5) * state.maxTarget * state.noiseFactor;
        
        state.currentOps = Math.max(0, Math.floor(timeFactor + randomNoise));

        // Format integer cleanly with commas
        counterEl.textContent = state.currentOps.toLocaleString();
        
        // Map current throughput ratio to design element width
        const fillPercentage = Math.min(100, (state.currentOps / state.maxTarget) * 100);
        progressEl.style.width = `${fillPercentage}%`;

        // Dispatch state outward so chart modules can tap into it downstream
        window.dispatchEvent(new CustomEvent('telemetryTick', { detail: { value: state.currentOps } }));
    }

    // Initialize 200ms polling rate interval for numeric readability
    setInterval(updateMetrics, 200);
    updateMetrics();
})();
