// Silent upload handler - no console logs
// Set window.DEBUG_UPLOADS = true in console to enable logging

const DEBUG = window.DEBUG_UPLOADS || false;
const log = DEBUG ? console.log : () => {};

// Check for uploaded files periodically
let lastUploadCheck = null;

async function checkForUploads() {
    try {
        // Try multiple ports
        const ports = [8889, 8890, 8891, 8892];
        
        for (const port of ports) {
            try {
                const response = await fetch(`http://localhost:${port}/latest_upload.json?` + Date.now());
                if (response.ok) {
                    const data = await response.json();
                    
                    // Check if this is a new upload
                    if (data.timestamp !== lastUploadCheck) {
                        lastUploadCheck = data.timestamp;
                        log('[UPLOAD] New upload detected:', data.link);
                        
                        // Show QR dialog for completed uploads
                        if (data.link && window.showUploadQRDialog) {
                            window.showUploadQRDialog(data.link);
                        }
                    }
                    // Found working server, stop checking other ports
                    return;
                }
            } catch (error) {
                // Silently try next port
            }
        }
    } catch (error) {
        // Silently ignore all errors
    }
}

// Check every 2 seconds
let uploadCheckInterval = setInterval(checkForUploads, 2000);

// Also check immediately
checkForUploads();

// Stop monitoring when leaving the page
window.addEventListener('beforeunload', () => {
    if (uploadCheckInterval) {
        clearInterval(uploadCheckInterval);
    }
});

// Silent monitoring active - no logs unless DEBUG is enabled