// Fixed download monitor - shows spinner for all quality options
if (window.downloadMonitorInit) return;
window.downloadMonitorInit = true;

console.log('Download monitor loaded - will show spinner on quality selection');

// Track state
let downloadBtn = null;
let monitorActive = false;

// Monitor all clicks
document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Check for download button click
    const btn = target.closest('button');
    if (btn) {
        const icon = btn.querySelector('i, .material-icons, .google-symbols');
        if (icon && icon.textContent === 'download') {
            console.log('Download button clicked - waiting for quality selection');
            downloadBtn = btn;
            monitorActive = true;
            
            // Auto-disable after 10s
            setTimeout(() => {
                if (monitorActive) {
                    console.log('Download monitor timeout - resetting');
                    monitorActive = false;
                    downloadBtn = null;
                }
            }, 10000);
            return;
        }
    }
    
    // Check for quality/format selection
    if (!monitorActive) return;
    
    // Check if clicking on any menu item
    const menuItem = target.closest('[role="menuitem"], [role="option"], li, .menu-item, .dropdown-item');
    if (menuItem) {
        const text = (menuItem.textContent || '').toLowerCase();
        console.log('Menu item clicked:', text);
        
        // Check for any quality option or download format
        // Include 360p, 480p, 720p (since 270p and 1080p are hidden)
        if (text.match(/\b(240p|360p|480p|720p|mp4|mov|webm|gif)\b/) || 
            text.includes('다운로드') || 
            text.includes('download') ||
            text.includes('quality')) {
            
            console.log('Quality/format selected:', text);
            
            // Show spinner immediately
            if (window.showUploadLoadingSpinner) {
                console.log('Showing upload spinner...');
                window.showUploadLoadingSpinner(downloadBtn);
            } else {
                console.error('showUploadLoadingSpinner function not found!');
            }
            
            // Start upload monitoring
            if (window.startUploadMonitoring) {
                console.log('Starting upload monitoring...');
                window.startUploadMonitoring();
            } else {
                console.error('startUploadMonitoring function not found!');
            }
            
            // Reset state
            monitorActive = false;
            downloadBtn = null;
        }
    }
}, { passive: true, capture: true });

// Also monitor fetch for download requests
const origFetch = window.fetch;
window.fetch = function(...args) {
    const url = args[0]?.url || args[0];
    
    // Check if this is a download-related request
    if (typeof url === 'string' && 
        (url.includes('download') || 
         url.includes('export') || 
         url.includes('render') ||
         url.includes('transcode'))) {
        
        console.log('Download-related fetch detected:', url);
        window._expectingDownload = true;
        
        // Clear flag after 5 seconds
        setTimeout(() => {
            window._expectingDownload = false;
        }, 5000);
    }
    
    return origFetch.apply(this, args);
};

// Debug function
window.testDownloadMonitor = function() {
    console.log('=== Download Monitor Status ===');
    console.log('Monitor active:', monitorActive);
    console.log('Download button:', downloadBtn);
    console.log('showUploadLoadingSpinner exists:', typeof window.showUploadLoadingSpinner === 'function');
    console.log('startUploadMonitoring exists:', typeof window.startUploadMonitoring === 'function');
    console.log('===============================');
};

console.log('Download monitor ready - Click download button then select quality');