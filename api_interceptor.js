// API interceptor - intercepts the actual download API calls
console.log('API interceptor initializing...');

// Store original functions
const originalFetch = window.fetch;
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

// Track API calls
window._apiCalls = [];

// Override fetch for API interception
window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const options = args[1] || {};
    
    // Log API calls
    console.log('API Fetch:', url, options);
    
    // Check if this is an export/download API call
    if (url && (
        url.includes('/export') ||
        url.includes('/download') ||
        url.includes('/v1/projects/') && options.method === 'POST' ||
        url.includes('output_format=') ||
        url.includes('export_format=')
    )) {
        console.log('Export API detected:', url);
        
        // Try to intercept the actual download URL from the response
        try {
            const response = await originalFetch.apply(this, args);
            const cloned = response.clone();
            
            // Try to read the response
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('json')) {
                const data = await cloned.json();
                console.log('Export API response:', data);
                
                // Look for download URL in response
                const downloadUrl = data.downloadUrl || data.url || data.exportUrl || data.output_url;
                if (downloadUrl) {
                    console.log('Found download URL in response:', downloadUrl);
                    if (window.showQROverlay) {
                        window.showQROverlay(downloadUrl);
                    }
                    // Return modified response without download URL
                    return new Response(JSON.stringify({...data, downloadUrl: null}), {
                        status: 200,
                        headers: response.headers
                    });
                }
            }
            
            return response;
        } catch (e) {
            console.log('Error intercepting export response:', e);
        }
    }
    
    // For video generation API calls
    if (url && url.includes('/v1/video/generate')) {
        console.log('Video generation API detected');
        
        try {
            const response = await originalFetch.apply(this, args);
            const cloned = response.clone();
            
            const data = await cloned.json();
            console.log('Video generation response:', data);
            
            // Store the operation ID or job ID for tracking
            if (data.operationId || data.jobId) {
                window._videoGenerationId = data.operationId || data.jobId;
                console.log('Stored generation ID:', window._videoGenerationId);
            }
            
            return response;
        } catch (e) {
            console.log('Error reading video generation response:', e);
        }
    }
    
    // For status polling API calls
    if (url && (url.includes('/status') || url.includes('/operations/'))) {
        try {
            const response = await originalFetch.apply(this, args);
            const cloned = response.clone();
            
            const data = await cloned.json();
            if (data.state === 'SUCCEEDED' && data.result?.videoUrl) {
                console.log('Video ready URL found:', data.result.videoUrl);
                // Don't show QR for status checks, wait for actual download
            }
            
            return response;
        } catch (e) {
            // Ignore errors
        }
    }
    
    return originalFetch.apply(this, args);
};

// Override XMLHttpRequest
XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._method = method;
    this._url = url;
    
    console.log('API XHR:', method, url);
    
    return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(body) {
    const url = this._url;
    const method = this._method;
    
    // Log POST body for export requests
    if (body && (url.includes('/export') || url.includes('/download'))) {
        console.log('Export request body:', body);
        
        try {
            const parsed = JSON.parse(body);
            console.log('Parsed export params:', parsed);
        } catch (e) {
            // Not JSON
        }
    }
    
    // Store original handlers
    const originalOnLoad = this.onload;
    const originalOnReadyStateChange = this.onreadystatechange;
    
    // Override onload to intercept response
    this.onload = function() {
        if (url.includes('/export') || url.includes('/download')) {
            try {
                const response = JSON.parse(this.responseText);
                console.log('Export XHR response:', response);
                
                const downloadUrl = response.downloadUrl || response.url || response.exportUrl;
                if (downloadUrl) {
                    console.log('Download URL from XHR:', downloadUrl);
                    if (window.showQROverlay) {
                        window.showQROverlay(downloadUrl);
                    }
                }
            } catch (e) {
                // Not JSON response
            }
        }
        
        if (originalOnLoad) originalOnLoad.apply(this);
    };
    
    return originalXHRSend.apply(this, [body]);
};

// Monitor for blob URLs
const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function(blob) {
    const url = originalCreateObjectURL.call(URL, blob);
    console.log('Blob URL created:', url, 'Size:', blob.size);
    
    // Check if this is a video blob
    if (blob.type && blob.type.startsWith('video/')) {
        console.log('Video blob detected, type:', blob.type);
        // Don't show QR for blob URLs as they're local
    }
    
    return url;
};

// Monitor download attribute on links
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
            const target = mutation.target;
            if (target.tagName === 'A' && target.download) {
                console.log('Download link detected:', target.href);
                
                // Replace click behavior
                if (!target._qrIntercepted) {
                    target._qrIntercepted = true;
                    target.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Download link clicked:', target.href);
                        if (window.showQROverlay) {
                            window.showQROverlay(target.href);
                        }
                    }, true);
                }
            }
        }
    });
});

observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['href', 'download']
});

console.log('API interceptor ready - monitoring export/download API calls');