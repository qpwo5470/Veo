// Proper download interceptor - captures the actual download URL
console.log('Proper download interceptor initializing...');

// Store the original fetch to use later
const originalFetch = window.fetch;

// Track download URLs
window._downloadUrls = new Map();

// Override fetch to capture download URLs
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const request = args[0];
    
    // Log all fetches for debugging
    console.log('Fetch:', url);
    
    // Check if this is a download request by looking at the URL pattern
    if (url && (
        url.includes('/v1/projects/') && url.includes('/export') || // Export API
        url.includes('/export?') || // Export with parameters
        url.includes('download=true') || // Download parameter
        url.includes('drum.usercontent.google.com/download/') || // Google download server
        url.includes('export_format=') // Export format parameter
    )) {
        console.log('Download request detected:', url);
        
        // Show QR code for the download URL
        if (window.showQROverlay) {
            window.showQROverlay(url);
        }
        
        // Return a fake response to prevent actual download
        return Promise.resolve(new Response('', { status: 200 }));
    }
    
    // For video URLs, store them but don't show QR
    if (url && url.includes('lh3.googleusercontent.com')) {
        const videoId = url.match(/video\/([^\/\?]+)/)?.[1];
        if (videoId) {
            window._downloadUrls.set(videoId, url);
        }
    }
    
    return originalFetch.apply(this, args);
};

// Override XMLHttpRequest for download requests
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._method = method;
    this._url = url;
    
    console.log('XHR:', method, url);
    
    // Check if this is a download request
    if (url && (
        url.includes('/export') ||
        url.includes('download=true') ||
        (method === 'POST' && url.includes('/v1/projects/'))
    )) {
        this._isDownloadRequest = true;
        console.log('Download XHR detected:', url);
    }
    
    return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(body) {
    if (this._isDownloadRequest) {
        console.log('Intercepting download XHR');
        
        // Parse the request to get more info if needed
        let requestInfo = {
            url: this._url,
            method: this._method,
            body: body
        };
        
        // For POST requests, the body might contain export parameters
        if (body) {
            try {
                const bodyData = JSON.parse(body);
                console.log('Download request body:', bodyData);
            } catch (e) {
                // Not JSON
            }
        }
        
        // Show QR code
        if (window.showQROverlay) {
            // Build the full download URL
            const downloadUrl = this._url.startsWith('http') ? this._url : window.location.origin + this._url;
            window.showQROverlay(downloadUrl);
        }
        
        // Fake the response
        this.readyState = 4;
        this.status = 200;
        this.responseText = '';
        if (this.onreadystatechange) this.onreadystatechange();
        if (this.onload) this.onload();
        
        return;
    }
    
    return originalXHRSend.apply(this, [body]);
};

// Monitor clicks to detect what happens when download button is clicked
document.addEventListener('click', function(e) {
    const target = e.target;
    const downloadButton = target.closest('[aria-label*="다운로드"]') || 
                         target.closest('[aria-label*="Download"]');
    
    if (downloadButton) {
        console.log('Download button clicked, monitoring network...');
        
        // Set a flag to capture the next request
        window._captureNextRequest = true;
        
        // Monitor for download URLs in the next few seconds
        setTimeout(() => {
            window._captureNextRequest = false;
        }, 3000);
    }
}, true);

// Enhanced fetch wrapper to capture requests after button click
const enhancedFetch = window.fetch;
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    
    if (window._captureNextRequest && url) {
        console.log('Capturing request after download click:', url);
        
        // Any request after download button click might be the download
        if (!url.includes('.js') && !url.includes('.css') && !url.includes('fonts')) {
            console.log('Potential download URL:', url);
            
            // Show QR for this URL
            if (window.showQROverlay) {
                window.showQROverlay(url);
                window._captureNextRequest = false;
            }
        }
    }
    
    return enhancedFetch.apply(this, args);
};

console.log('Proper download interceptor ready');