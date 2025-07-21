// Google Flow API monitor - captures actual export/download API calls
console.log('Flow API monitor starting...');

// Store original fetch
const originalFetch = window.fetch;

// Track API calls and their responses
window._apiCalls = [];

// Override fetch to monitor API calls
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const options = args[1] || {};
    
    // Log all API calls
    if (url && (url.includes('/_api/') || url.includes('/v1/') || url.includes('/api/'))) {
        console.log('API Call:', options.method || 'GET', url);
        
        // Check request body for export/render operations
        if (options.body) {
            try {
                const bodyStr = typeof options.body === 'string' ? options.body : '';
                if (bodyStr.includes('export') || bodyStr.includes('render') || bodyStr.includes('download')) {
                    console.log('Export/render request detected:', bodyStr.substring(0, 200));
                }
            } catch (e) {}
        }
    }
    
    // Call original fetch
    return originalFetch.apply(this, args).then(async response => {
        // Clone response to read it
        const cloned = response.clone();
        
        // Check if this is an export/render response
        if (url && (
            url.includes('export') ||
            url.includes('render') ||
            url.includes('transcode') ||
            url.includes('generate') ||
            url.includes('create_download')
        )) {
            try {
                const text = await cloned.text();
                const data = JSON.parse(text);
                console.log('Export API response:', data);
                
                // Look for various URL fields
                const possibleUrls = [
                    data.url,
                    data.downloadUrl,
                    data.download_url,
                    data.exportUrl,
                    data.export_url,
                    data.outputUrl,
                    data.output_url,
                    data.signedUrl,
                    data.signed_url,
                    data.publicUrl,
                    data.public_url,
                    data.mediaUrl,
                    data.media_url,
                    data.fileUrl,
                    data.file_url,
                    data.result?.url,
                    data.result?.downloadUrl,
                    data.output?.url,
                    data.output?.downloadUrl,
                    data.media?.url,
                    data.media?.downloadUrl
                ];
                
                // Find the first valid URL
                const downloadUrl = possibleUrls.find(u => u && u.startsWith('http'));
                
                if (downloadUrl) {
                    console.log('Found actual download URL:', downloadUrl);
                    if (window.showQROverlay) {
                        window.showQROverlay(downloadUrl);
                    }
                } else {
                    console.log('No download URL found in response, full data:', data);
                }
            } catch (e) {
                console.log('Error parsing export response:', e);
            }
        }
        
        // Also check for operation status responses
        if (url && url.includes('operations/')) {
            try {
                const text = await cloned.text();
                const data = JSON.parse(text);
                
                if (data.done && data.response) {
                    console.log('Operation completed:', data);
                    
                    // Check for URLs in the response
                    const response = data.response;
                    const downloadUrl = response.url || response.downloadUrl || response.outputUrl;
                    
                    if (downloadUrl) {
                        console.log('Found download URL in operation response:', downloadUrl);
                        if (window.showQROverlay) {
                            window.showQROverlay(downloadUrl);
                        }
                    }
                }
            } catch (e) {}
        }
        
        return response;
    });
};

// Monitor XHR as well
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    this._method = method;
    
    if (url && (url.includes('/_api/') || url.includes('/v1/') || url.includes('/api/'))) {
        console.log('XHR API Call:', method, url);
    }
    
    return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(body) {
    const xhr = this;
    
    // Log request body for export operations
    if (body && this._url && (this._url.includes('export') || this._url.includes('render'))) {
        console.log('Export XHR request body:', body);
    }
    
    // Add response listener
    const originalOnLoad = xhr.onload;
    xhr.onload = function() {
        if (xhr._url && (
            xhr._url.includes('export') ||
            xhr._url.includes('render') ||
            xhr._url.includes('operations/')
        )) {
            try {
                const data = JSON.parse(xhr.responseText);
                console.log('Export XHR response:', data);
                
                // Look for download URLs
                const downloadUrl = data.url || data.downloadUrl || data.output_url || 
                                  data.signedUrl || data.response?.url;
                
                if (downloadUrl && downloadUrl.startsWith('http')) {
                    console.log('Found download URL in XHR response:', downloadUrl);
                    if (window.showQROverlay) {
                        window.showQROverlay(downloadUrl);
                    }
                }
            } catch (e) {}
        }
        
        if (originalOnLoad) originalOnLoad.apply(this, arguments);
    };
    
    return originalXHRSend.apply(this, [body]);
};

// Monitor for Google's specific download patterns
document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Check for menu items with specific text
    const menuItem = target.closest('[role="menuitem"], [role="option"], .menu-item');
    if (menuItem) {
        const text = menuItem.textContent || '';
        if (text.match(/MP4|MOV|GIF|WEBM|다운로드|Download|내보내기|Export/i)) {
            console.log('Export menu item clicked:', text);
            window._expectingExport = true;
            window._exportFormat = text;
            
            // Monitor closely for the next few seconds
            setTimeout(() => {
                window._expectingExport = false;
            }, 10000);
        }
    }
}, true);

console.log('Flow API monitor ready - monitoring actual API calls for download URLs');