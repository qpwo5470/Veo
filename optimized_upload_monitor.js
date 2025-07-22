// Optimized upload monitor - minimal resource usage
(function() {
    let isMonitoring = false;
    let lastCheck = 0;
    let activePort = null;
    
    // Only check when actually needed
    async function checkOnce() {
        if (!isMonitoring) return;
        
        const now = Date.now();
        if (now - lastCheck < 3000) return; // Min 3 seconds between checks
        lastCheck = now;
        
        try {
            const port = activePort || 8890;
            const response = await fetch(`http://localhost:${port}/latest_upload.json?t=${now}`, {
                method: 'GET',
                mode: 'no-cors' // Faster, don't need response
            });
            
            // If we got here without error, server exists
            activePort = port;
            
            // Now do a real check
            const realResponse = await fetch(`http://localhost:${port}/latest_upload.json?t=${now}`);
            if (realResponse.ok) {
                const data = await realResponse.json();
                if (data.link && window.showUploadQRDialog) {
                    window.showUploadQRDialog(data.link);
                    stopMonitoring();
                }
            }
        } catch (e) {
            // Ignore errors silently
        }
    }
    
    function startMonitoring() {
        if (isMonitoring) return;
        isMonitoring = true;
        
        // Check every 5 seconds max
        const interval = setInterval(() => {
            if (!isMonitoring) {
                clearInterval(interval);
                return;
            }
            checkOnce();
        }, 5000);
        
        // Auto-stop after 1 minute
        setTimeout(() => {
            clearInterval(interval);
            isMonitoring = false;
        }, 60000);
    }
    
    function stopMonitoring() {
        isMonitoring = false;
    }
    
    // Only start on actual download click
    window.startUploadMonitoring = startMonitoring;
    window.stopUploadMonitoring = stopMonitoring;
})();