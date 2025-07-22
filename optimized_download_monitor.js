// Optimized download monitor - minimal overhead
if (window.downloadMonitorInit) return;
window.downloadMonitorInit = true;

// Single event delegation handler
let downloadBtn = null;
let monitorActive = false;

document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Download button click
    const btn = target.closest('button');
    if (btn && btn.querySelector('i')?.textContent === 'download') {
        downloadBtn = btn;
        monitorActive = true;
        
        // Auto-disable after 10s
        setTimeout(() => {
            monitorActive = false;
            downloadBtn = null;
        }, 10000);
        return;
    }
    
    // Quality selection
    if (!monitorActive) return;
    
    const menuItem = target.closest('[role="menuitem"], [role="option"]');
    if (menuItem) {
        const text = menuItem.textContent || '';
        if (/240p|720p|1080p|mp4|mov|다운로드/i.test(text)) {
            // Show spinner
            if (window.showUploadLoadingSpinner) {
                window.showUploadLoadingSpinner(downloadBtn);
            }
            
            // Start monitoring
            if (window.startUploadMonitoring) {
                window.startUploadMonitoring();
            }
            
            // Reset
            monitorActive = false;
            downloadBtn = null;
        }
    }
}, { passive: true, capture: true });

// Minimal fetch wrapper - only for active monitoring
const origFetch = window.fetch;
window.fetch = function(...args) {
    if (!monitorActive) return origFetch.apply(this, args);
    
    const url = args[0]?.url || args[0];
    if (typeof url === 'string' && /download|export|render/i.test(url)) {
        window._expectingDownload = true;
        setTimeout(() => window._expectingDownload = false, 5000);
    }
    
    return origFetch.apply(this, args);
};