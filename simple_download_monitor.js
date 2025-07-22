// Simple download monitor - only monitors network requests without interfering
if (window.simpleDownloadMonitorInitialized) {
    return;
}
window.simpleDownloadMonitorInitialized = true;

// Removed showQROverlay function - no longer showing download link dialog

// Only monitor fetch requests without modifying them
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const options = args[1] || {};
    
    // Removed fetch logging to reduce console noise
    
    // Call original fetch
    return originalFetch.apply(this, args).then(response => {
        // Check if this might be a download response
        if (window._expectingDownload || (url && (
            url.includes('/render') ||
            url.includes('/transcode') ||
            url.includes('/export') ||
            url.includes('/download') ||
            url.includes('output_format=') ||
            url.includes('export_format=') ||
            url.includes('/v1/') || // API endpoints
            url.includes('_api/')
        ))) {
            // Potential download response detected
            
            // Clone response to read it
            const cloned = response.clone();
            
            // Check response headers for download indication
            const contentDisposition = response.headers.get('content-disposition');
            if (contentDisposition && contentDisposition.includes('attachment')) {
                // Download detected via Content-Disposition header
                // No longer showing download dialog
                window._expectingDownload = false;
            } else {
                // Try to parse response body
                cloned.text().then(text => {
                    try {
                        const data = JSON.parse(text);
                        // Look for download URL in response
                        if (data.downloadUrl || data.url || data.output_url || data.exportUrl || 
                            data.download_url || data.signed_url || data.signedUrl) {
                            const downloadUrl = data.downloadUrl || data.url || data.output_url || 
                                              data.exportUrl || data.download_url || data.signed_url || 
                                              data.signedUrl;
                            // Found download URL in response
                            // No longer showing download dialog
                            window._expectingDownload = false;
                        }
                    } catch (e) {
                        // Not JSON or error parsing
                        if (window._expectingDownload && text.includes('http')) {
                            // Try to extract URL from text
                            const urlMatch = text.match(/(https?:\/\/[^\s"'<>]+)/);
                            if (urlMatch) {
                                // Extracted URL from response
                                // No longer showing download dialog
                                window._expectingDownload = false;
                            }
                        }
                    }
                }).catch(() => {});
            }
        }
        
        return response;
    });
};

// Also monitor XMLHttpRequest for download URLs
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    this._method = method;
    // Removed XHR logging to reduce console noise
    return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(body) {
    const xhr = this;
    
    // Add response listener
    const originalOnLoad = xhr.onload;
    xhr.onload = function() {
        if (xhr._url && (
            xhr._url.includes('/render') ||
            xhr._url.includes('/transcode') ||
            xhr._url.includes('/export') ||
            xhr._url.includes('/download')
        )) {
            try {
                const data = JSON.parse(xhr.responseText);
                if (data.downloadUrl || data.url || data.output_url || data.exportUrl || data.download_url) {
                    const downloadUrl = data.downloadUrl || data.url || data.output_url || data.exportUrl || data.download_url;
                    // Found download URL in XHR response
                    // No longer showing download dialog
                }
            } catch (e) {
                // Not JSON
            }
        }
        
        if (originalOnLoad) originalOnLoad.apply(this, arguments);
    };
    
    return originalXHRSend.apply(this, [body]);
};

// Store reference to the download button that was clicked
let lastClickedDownloadButton = null;

// Monitor for dropdown menu clicks (quality selection)
document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Check if clicking on a dropdown menu item (including spans and divs inside menu items)
    const menuItem = target.closest('[role="menuitem"], [role="option"], .menu-item, .dropdown-item') || 
                    target.closest('li[data-value]') || target.closest('[class*="menu"]');
    if (menuItem) {
        const text = (menuItem.textContent || '').toLowerCase();
        // Check for quality options (240p, 720p, 1080p) or format options
        if (text.includes('240p') || text.includes('720p') || text.includes('1080p') ||
            text.includes('mp4') || text.includes('mov') || text.includes('gif') || 
            text.includes('다운로드') || text.includes('download')) {
            // Download quality/format selected
            
            // Set flag to capture next download request
            window._expectingDownload = true;
            window._downloadFormat = text;
            
            // Show loading spinner immediately on quality/format selection
            if (typeof window.showUploadLoadingSpinner === 'function') {
                // Pass the download button reference to find the associated video
                window.showUploadLoadingSpinner(lastClickedDownloadButton);
            }
            
            // Reset flag after timeout
            setTimeout(() => {
                window._expectingDownload = false;
                lastClickedDownloadButton = null;
            }, 10000);
        }
    }
}, true);

// Monitor download button clicks (but don't show spinner yet - wait for quality selection)
document.addEventListener('click', function(e) {
    const target = e.target;
    const button = target.closest('button');
    
    if (button) {
        // Check if it's a download button by looking for download icon
        const downloadIcon = button.querySelector('.google-symbols') || button.querySelector('i');
        if (downloadIcon && downloadIcon.textContent === 'download') {
            // Store reference to this download button
            lastClickedDownloadButton = button;
            window._expectingDownload = true;
            
            setTimeout(() => {
                window._expectingDownload = false;
                if (lastClickedDownloadButton === button) {
                    lastClickedDownloadButton = null;
                }
            }, 10000);
        }
    }
}, true);

// Add manual trigger for testing (Alt+D)
document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'd') {
        e.preventDefault();
        // Manual download test triggered
        // Testing spinner instead of download dialog
        if (typeof window.showUploadLoadingSpinner === 'function') {
            window.showUploadLoadingSpinner();
        }
    }
});

// Simple download monitor ready - Press Alt+D to test