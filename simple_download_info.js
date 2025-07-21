// Simple download information display - no server required
console.log('[DOWNLOAD INFO] Handler starting...');

// Track recent downloads
window._downloadHistory = [];

// Function to show download info
function showDownloadInfo(url, filename) {
    // Remove any existing info
    const existing = document.getElementById('veo-download-info');
    if (existing) existing.remove();
    
    const infoDiv = document.createElement('div');
    infoDiv.id = 'veo-download-info';
    infoDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border: 2px solid #4285f4;
        border-radius: 10px;
        padding: 20px;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 999999;
    `;
    
    const timestamp = new Date().toLocaleTimeString();
    const downloadDir = '~/Downloads';
    
    infoDiv.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #1a73e8;">📥 Download Complete</h3>
        <div style="margin-bottom: 15px;">
            <strong>File:</strong> ${filename || 'video.mp4'}<br>
            <strong>Time:</strong> ${timestamp}<br>
            <strong>Saved to:</strong> ${downloadDir}
        </div>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
            <strong>Manual Upload:</strong><br>
            1. Open Google Drive<br>
            2. Upload from ${downloadDir}<br>
            3. Share link with anyone
        </div>
        <button onclick="this.parentElement.remove()" 
                style="background: #4285f4; color: white; border: none; 
                       padding: 8px 16px; border-radius: 5px; cursor: pointer;">
            Close
        </button>
    `;
    
    document.body.appendChild(infoDiv);
    
    // Auto remove after 30 seconds
    setTimeout(() => {
        if (document.getElementById('veo-download-info')) {
            infoDiv.style.transition = 'opacity 0.5s';
            infoDiv.style.opacity = '0';
            setTimeout(() => infoDiv.remove(), 500);
        }
    }, 30000);
}

// Monitor fetch for downloads
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    
    if (url.includes('drum.usercontent.google.com/download/')) {
        console.log('[DOWNLOAD INFO] Download detected:', url);
        
        return originalFetch.apply(this, args).then(response => {
            // Extract filename from URL if possible
            const urlParts = url.split('/');
            const filename = `video_${Date.now()}.mp4`;
            
            // Show download info
            setTimeout(() => {
                showDownloadInfo(url, filename);
            }, 1000);
            
            return response;
        });
    }
    
    return originalFetch.apply(this, args);
};

// Also monitor blob creation
const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function(blob) {
    const blobUrl = originalCreateObjectURL.call(this, blob);
    
    if (blob && blob.type && blob.type.startsWith('video/')) {
        console.log('[DOWNLOAD INFO] Video blob created');
        
        // Check if we have a recent download
        if (window._downloadHistory.length > 0) {
            const recent = window._downloadHistory[window._downloadHistory.length - 1];
            setTimeout(() => {
                showDownloadInfo(recent.url, recent.filename);
            }, 500);
        }
    }
    
    return blobUrl;
};

// Test function
window.testDownloadInfo = function() {
    showDownloadInfo('test-url', 'test_video.mp4');
    console.log('Test download info shown');
};

console.log('[DOWNLOAD INFO] Handler ready - will show download information');
console.log('Use window.testDownloadInfo() to test');