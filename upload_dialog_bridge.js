// Bridge to ensure upload dialogs are shown properly

console.log('[DIALOG BRIDGE] Initializing upload dialog bridge...');

// Create a simple polling mechanism that works
let checkInterval = null;
let lastCheckTime = 0;
let consecutiveErrors = 0;

async function checkUploadStatus() {
    // Prevent checking too frequently
    const now = Date.now();
    if (now - lastCheckTime < 1000) return;
    lastCheckTime = now;
    
    // Try the known upload ports
    const ports = [8889, 8890, 8891, 8892];
    
    for (const port of ports) {
        try {
            const response = await fetch(`http://localhost:${port}/latest_upload.json?t=${now}`);
            if (response.ok) {
                const data = await response.json();
                console.log('[DIALOG BRIDGE] Got upload data:', data);
                
                // Reset error count on success
                consecutiveErrors = 0;
                
                // Show appropriate dialog based on data
                if (data && data.timestamp) {
                    // Check if this is recent (within last minute)
                    const uploadTime = new Date(data.timestamp);
                    const age = (now - uploadTime.getTime()) / 1000;
                    
                    if (age < 60) {
                        if (data.loading && !data.link) {
                            console.log('[DIALOG BRIDGE] Showing loading spinner...');
                            if (window.showUploadLoadingSpinner) {
                                window.showUploadLoadingSpinner();
                            }
                        } else if (data.link) {
                            console.log('[DIALOG BRIDGE] Showing QR dialog...');
                            if (window.showUploadQRDialog) {
                                window.showUploadQRDialog(data.link);
                            }
                            // Stop checking after showing QR
                            stopChecking();
                        }
                    }
                }
                
                // Found working port, no need to try others
                return;
            }
        } catch (error) {
            // Ignore errors, try next port
        }
    }
    
    // If we get here, no ports responded
    consecutiveErrors++;
    if (consecutiveErrors > 5) {
        console.log('[DIALOG BRIDGE] Too many errors, stopping checks');
        stopChecking();
    }
}

function startChecking() {
    if (checkInterval) return;
    
    console.log('[DIALOG BRIDGE] Starting upload status checks...');
    consecutiveErrors = 0;
    
    // Check immediately
    checkUploadStatus();
    
    // Then check every 2 seconds
    checkInterval = setInterval(checkUploadStatus, 2000);
    
    // Auto-stop after 2 minutes
    setTimeout(stopChecking, 120000);
}

function stopChecking() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        console.log('[DIALOG BRIDGE] Stopped upload status checks');
    }
}

// If efficient monitor is not loaded, use our fallback
if (!window.startUploadMonitoring) {
    window.startUploadMonitoring = startChecking;
}

// Also start checking when download button is clicked
document.addEventListener('click', function(e) {
    const target = e.target;
    const button = target.closest('button');
    
    if (button) {
        const icon = button.querySelector('i.google-symbols, i.material-icons');
        if (icon && icon.textContent.includes('download')) {
            console.log('[DIALOG BRIDGE] Download button clicked, starting monitoring...');
            if (window.startUploadMonitoring) {
                window.startUploadMonitoring();
            }
        }
    }
}, true);

// Clean up on page unload
window.addEventListener('beforeunload', stopChecking);

console.log('[DIALOG BRIDGE] Upload dialog bridge ready');