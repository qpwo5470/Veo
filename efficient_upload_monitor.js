// Efficient upload monitoring with exponential backoff and smart port detection

(function() {
    // Configuration
    const INITIAL_INTERVAL = 500;    // Start with 0.5 second
    const MAX_INTERVAL = 10000;      // Max 10 seconds between checks
    const BACKOFF_MULTIPLIER = 1.5;  // Increase interval by 50% each time
    const MAX_CONSECUTIVE_FAILURES = 3;  // Stop after 3 failures
    const MONITORING_TIMEOUT = 120000;   // Stop monitoring after 2 minutes
    
    // State
    let currentInterval = INITIAL_INTERVAL;
    let activePort = null;
    let consecutiveFailures = 0;
    let monitoringTimeout = null;
    let checkTimeout = null;
    let isMonitoring = false;
    let lastSuccessfulCheck = null;
    
    // Keep track of shown uploads
    const shownUploads = new Set();
    
    // Efficient port checking - only check known working port or scan once
    async function findActivePort() {
        // If we know the active port, use it
        if (activePort) {
            try {
                // Create abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000);
                
                try {
                    const response = await fetch(`http://localhost:${activePort}/latest_upload.json?${Date.now()}`, {
                        method: 'GET',
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        return activePort;
                    }
                } catch (e) {
                    clearTimeout(timeoutId);
                    throw e;
                }
            } catch (e) {
                // Port no longer working
                activePort = null;
            }
        }
        
        // Only scan ports if we don't have an active one
        const ports = [8890, 8889, 8891, 8892];
        for (const port of ports) {
            try {
                // Create abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 500);
                
                try {
                    const response = await fetch(`http://localhost:${port}/latest_upload.json?${Date.now()}`, {
                        method: 'GET',
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        activePort = port;
                        return port;
                    }
                } catch (e) {
                    clearTimeout(timeoutId);
                    // Continue to next port
                }
            } catch (e) {
                // Continue to next port
            }
        }
        
        return null;
    }
    
    // Check for uploads with intelligent retry
    async function checkForUpload() {
        if (!isMonitoring) return;
        
        try {
            const port = await findActivePort();
            
            if (!port) {
                consecutiveFailures++;
                
                // Stop monitoring if too many failures
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    stopMonitoring();
                    return;
                }
                
                // Exponential backoff
                currentInterval = Math.min(currentInterval * BACKOFF_MULTIPLIER, MAX_INTERVAL);
                scheduleNextCheck();
                return;
            }
            
            // Success - reset failure count and reduce interval
            consecutiveFailures = 0;
            currentInterval = Math.max(INITIAL_INTERVAL, currentInterval / BACKOFF_MULTIPLIER);
            
            // Fetch upload data
            const response = await fetch(`http://localhost:${port}/latest_upload.json?${Date.now()}`);
            const data = await response.json();
            
            if (data.timestamp) {
                const uploadKey = `${data.timestamp}_${data.link || 'loading'}`;
                
                if (!shownUploads.has(uploadKey)) {
                    // Check if recent (within 60 seconds)
                    const uploadTime = new Date(data.timestamp);
                    const now = new Date();
                    const ageSec = (now - uploadTime) / 1000;
                    
                    if (ageSec < 60) {
                        shownUploads.add(uploadKey);
                        lastSuccessfulCheck = now;
                        
                        if (data.loading && window.showUploadLoadingSpinner) {
                            window.showUploadLoadingSpinner();
                            // Check more frequently while loading
                            currentInterval = INITIAL_INTERVAL;
                        } else if (data.link && window.showUploadQRDialog) {
                            window.showUploadQRDialog(data.link);
                            // Can check less frequently after success
                            currentInterval = MAX_INTERVAL;
                        }
                    }
                }
            }
            
            scheduleNextCheck();
            
        } catch (error) {
            consecutiveFailures++;
            currentInterval = Math.min(currentInterval * BACKOFF_MULTIPLIER, MAX_INTERVAL);
            scheduleNextCheck();
        }
    }
    
    // Schedule next check with current interval
    function scheduleNextCheck() {
        if (!isMonitoring) return;
        
        if (checkTimeout) {
            clearTimeout(checkTimeout);
        }
        
        checkTimeout = setTimeout(checkForUpload, currentInterval);
    }
    
    // Start monitoring
    function startMonitoring() {
        if (isMonitoring) return;
        
        isMonitoring = true;
        consecutiveFailures = 0;
        currentInterval = INITIAL_INTERVAL;
        
        // Set overall timeout
        monitoringTimeout = setTimeout(() => {
            stopMonitoring();
        }, MONITORING_TIMEOUT);
        
        // Start checking
        checkForUpload();
    }
    
    // Stop monitoring
    function stopMonitoring() {
        isMonitoring = false;
        
        if (checkTimeout) {
            clearTimeout(checkTimeout);
            checkTimeout = null;
        }
        
        if (monitoringTimeout) {
            clearTimeout(monitoringTimeout);
            monitoringTimeout = null;
        }
        
        // Reset state
        consecutiveFailures = 0;
        currentInterval = INITIAL_INTERVAL;
    }
    
    // Expose functions
    window.startUploadMonitoring = startMonitoring;
    window.stopUploadMonitoring = stopMonitoring;
    
    // Clean up on page unload
    window.addEventListener('beforeunload', stopMonitoring);
    
})();