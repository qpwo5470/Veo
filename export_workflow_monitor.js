// Export workflow monitor - captures the complete export process
console.log('Export workflow monitor starting...');

// Track export operations
window._exportOperations = new Map();

// Original fetch
const originalFetch = window.fetch;

// Override fetch to monitor export workflow
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const options = args[1] || {};
    
    // Log API endpoints
    if (url && !url.includes('.js') && !url.includes('.css') && !url.includes('.woff')) {
        console.log(`[FETCH] ${options.method || 'GET'} ${url}`);
    }
    
    // Check for export initiation
    if (options.body) {
        try {
            const bodyStr = typeof options.body === 'string' ? options.body : '';
            if (bodyStr.includes('export') || bodyStr.includes('render') || bodyStr.includes('transcode')) {
                console.log('[EXPORT REQUEST] Body:', bodyStr.substring(0, 500));
            }
        } catch (e) {}
    }
    
    // Call original fetch
    return originalFetch.apply(this, args).then(async response => {
        const cloned = response.clone();
        
        // Special handling for different types of responses
        try {
            // Check if this is an export initiation response
            if (url && (url.includes('export') || url.includes('render') || url.includes('transcode'))) {
                const text = await cloned.text();
                try {
                    const data = JSON.parse(text);
                    console.log('[EXPORT RESPONSE]', url, data);
                    
                    // Check for operation ID (async export)
                    if (data.name || data.operationId || data.operation) {
                        const opId = data.name || data.operationId || data.operation;
                        console.log('[EXPORT OPERATION STARTED]', opId);
                        window._exportOperations.set(opId, { startTime: Date.now(), status: 'pending' });
                    }
                    
                    // Check for immediate download URL
                    checkForDownloadUrl(data, 'EXPORT RESPONSE');
                } catch (e) {
                    console.log('[EXPORT RESPONSE - NOT JSON]', text.substring(0, 200));
                }
            }
            
            // Check for operation status updates
            if (url && url.includes('operations/')) {
                const text = await cloned.text();
                try {
                    const data = JSON.parse(text);
                    console.log('[OPERATION STATUS]', url, data);
                    
                    if (data.done && data.response) {
                        console.log('[OPERATION COMPLETE]', data);
                        checkForDownloadUrl(data.response, 'OPERATION COMPLETE');
                    }
                } catch (e) {}
            }
            
            // Check for signed URL responses
            if (url && (url.includes('generateSignedUrl') || url.includes('getSignedUrl') || url.includes('signed'))) {
                const text = await cloned.text();
                try {
                    const data = JSON.parse(text);
                    console.log('[SIGNED URL RESPONSE]', data);
                    checkForDownloadUrl(data, 'SIGNED URL');
                } catch (e) {}
            }
        } catch (e) {
            console.error('[MONITOR ERROR]', e);
        }
        
        return response;
    });
};

// Function to check for download URLs in response data
function checkForDownloadUrl(data, source) {
    if (!data) return;
    
    // Recursive function to find URLs in nested objects
    function findUrls(obj, path = '') {
        if (!obj) return;
        
        if (typeof obj === 'string' && obj.startsWith('http')) {
            // Skip CDN/streaming URLs
            if (!obj.includes('lh3.google') && !obj.includes('googleusercontent.com/fife')) {
                console.log(`[FOUND URL at ${path}]`, obj);
                
                // Check if this looks like a download URL
                if (obj.includes('storage.googleapis.com') || 
                    obj.includes('download') || 
                    obj.includes('export') ||
                    obj.includes('signed') ||
                    obj.includes('token=')) {
                    console.log(`[DOWNLOAD URL from ${source}]`, obj);
                    
                    if (window.showQROverlay) {
                        window.showQROverlay(obj);
                    }
                    return true;
                }
            }
        }
        
        if (typeof obj === 'object') {
            for (const key in obj) {
                if (findUrls(obj[key], path + '.' + key)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    findUrls(data);
}

// Monitor for export button clicks
document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Look for export-related UI elements
    if (target.textContent && 
        (target.textContent.match(/export|download|save|내보내기|다운로드|저장/i) ||
         target.closest('[aria-label*="export"], [aria-label*="download"], [aria-label*="내보내기"], [aria-label*="다운로드"]'))) {
        console.log('[EXPORT UI CLICKED]', target.textContent || target.getAttribute('aria-label'));
        window._expectingExportWorkflow = true;
        
        // Reset after 30 seconds
        setTimeout(() => {
            window._expectingExportWorkflow = false;
        }, 30000);
    }
}, true);

// Also monitor form submissions
document.addEventListener('submit', function(e) {
    console.log('[FORM SUBMITTED]', e.target);
}, true);

console.log('Export workflow monitor ready - tracking complete export process');

// Debug helper
window.debugExports = function() {
    console.log('Active export operations:', Array.from(window._exportOperations.entries()));
};