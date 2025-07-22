// Upload monitor with multi-port detection - Windows compatible
(function() {
    let isMonitoring = false;
    let lastCheck = 0;
    let activePort = null;
    let checkInterval = null;
    
    // Possible server ports
    const POSSIBLE_PORTS = [8889, 8890, 8891, 8892];
    
    async function findActivePort() {
        // If we already found an active port, use it
        if (activePort) {
            return activePort;
        }
        
        // Try each port
        for (const port of POSSIBLE_PORTS) {
            try {
                const response = await fetch(`http://localhost:${port}/latest_upload.json?t=${Date.now()}`, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    console.log(`Found upload server on port ${port}`);
                    activePort = port;
                    return port;
                }
            } catch (e) {
                // This port didn't work, try next
            }
        }
        
        return null;
    }
    
    async function checkOnce() {
        if (!isMonitoring) return;
        
        const now = Date.now();
        if (now - lastCheck < 3000) return; // Min 3 seconds between checks
        lastCheck = now;
        
        try {
            const port = await findActivePort();
            if (!port) {
                console.log('No upload server found on any port');
                return;
            }
            
            const response = await fetch(`http://localhost:${port}/latest_upload.json?t=${now}`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Upload data received:', data);
                
                if (data.link && window.showUploadQRDialog) {
                    console.log('Showing QR dialog with link:', data.link);
                    window.showUploadQRDialog(data.link);
                    stopMonitoring();
                }
            }
        } catch (e) {
            console.error('Error checking upload:', e);
        }
    }
    
    function startMonitoring() {
        if (isMonitoring) return;
        
        console.log('Starting upload monitoring...');
        isMonitoring = true;
        
        // First check immediately
        checkOnce();
        
        // Then check every 3 seconds
        checkInterval = setInterval(() => {
            if (!isMonitoring) {
                clearInterval(checkInterval);
                return;
            }
            checkOnce();
        }, 3000);
        
        // Auto-stop after 2 minutes
        setTimeout(() => {
            if (isMonitoring) {
                console.log('Upload monitoring timeout reached');
                stopMonitoring();
            }
        }, 120000);
    }
    
    function stopMonitoring() {
        console.log('Stopping upload monitoring');
        isMonitoring = false;
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
    }
    
    // Expose functions globally
    window.startUploadMonitoring = startMonitoring;
    window.stopUploadMonitoring = stopMonitoring;
    
    console.log('Upload monitor with multi-port detection ready');
})();