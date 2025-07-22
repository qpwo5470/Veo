// Dynamic upload handler - uses the correct port from service
console.log('[DYNAMIC UPLOAD] Handler starting...');

// Use only port 8888
const UPLOAD_PORT = 8888;
console.log(`[DYNAMIC UPLOAD] Using port ${UPLOAD_PORT}`);

// Check for uploaded files periodically
let lastUploadCheck = null;

async function checkForUploads() {
    try {
        // Check for latest upload data
        const response = await fetch(`http://localhost:${UPLOAD_PORT}/latest_upload.json?` + Date.now());
        if (response.ok) {
            const data = await response.json();
            
            // Check if this is a new upload
            if (data.timestamp !== lastUploadCheck) {
                lastUploadCheck = data.timestamp;
                console.log('[DYNAMIC UPLOAD] New upload detected:', data.link);
                
                // Show QR code if function exists
                if (window.showQROverlay) {
                    window.showQROverlay(data.link);
                } else {
                    // Fallback: show simple alert
                    showUploadNotification(data.link);
                }
            }
        }
    } catch (error) {
        // Ignore errors - file might not exist yet
    }
}

// Simple notification for upload success
function showUploadNotification(link) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        z-index: 999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">✅ Video Uploaded to Google Drive!</div>
        <div style="word-break: break-all; font-size: 12px; opacity: 0.9;">${link}</div>
        <button onclick="window.open('${link}', '_blank')" 
                style="margin-top: 10px; background: white; color: #4CAF50; 
                       border: none; padding: 8px 16px; border-radius: 5px; 
                       cursor: pointer; font-weight: bold;">
            Open Link
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
        notification.style.transition = 'opacity 0.5s';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 10000);
}

// Monitor for download completion
let downloadMonitorInterval = null;

function startDownloadMonitor() {
    // Check every 2 seconds
    downloadMonitorInterval = setInterval(checkForUploads, 2000);
    
    // Also check immediately
    checkForUploads();
}

// Stop monitoring when leaving the page
window.addEventListener('beforeunload', () => {
    if (downloadMonitorInterval) {
        clearInterval(downloadMonitorInterval);
    }
});

// Enhanced download detection
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    
    // Detect video downloads
    if (url.includes('drum.usercontent.google.com/download/') || 
        url.includes('/download/video/') ||
        (args[0]?.method === 'POST' && url.includes('/generate'))) {
        
        console.log('[DYNAMIC UPLOAD] Potential download detected:', url);
        
        // Start monitoring for uploads
        if (!downloadMonitorInterval) {
            startDownloadMonitor();
        }
    }
    
    return originalFetch.apply(this, args);
};

// Also monitor XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (url && (url.includes('/download/') || url.includes('/generate'))) {
        console.log('[DYNAMIC UPLOAD] XHR download detected:', url);
        
        // Start monitoring for uploads
        if (!downloadMonitorInterval) {
            startDownloadMonitor();
        }
    }
    
    return originalXHROpen.apply(this, [method, url, ...rest]);
};

// Monitor blob creation for video downloads
const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function(blob) {
    if (blob && blob.type && blob.type.startsWith('video/')) {
        console.log('[DYNAMIC UPLOAD] Video blob created, size:', blob.size);
        
        // Start monitoring for uploads
        if (!downloadMonitorInterval) {
            startDownloadMonitor();
        }
    }
    
    return originalCreateObjectURL.call(this, blob);
};

// Start monitoring immediately if on Flow page
if (window.location.href.includes('labs.google')) {
    console.log('[DYNAMIC UPLOAD] On Google Labs page, starting monitor...');
    startDownloadMonitor();
}

console.log('[DYNAMIC UPLOAD] Handler ready - will detect downloads and show upload results automatically');