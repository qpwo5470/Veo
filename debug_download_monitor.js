// Debug Download Monitor - Comprehensive debugging for download detection
console.log('=== DEBUG DOWNLOAD MONITOR STARTING ===');

// Track all network activity
window._debugNetworkLog = [];
window._debugClickLog = [];
window._debugDownloadAttempts = [];

// Function to log with timestamp
function debugLog(category, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, category, message, data };
    
    console.log(`[${category}] ${message}`, data || '');
    
    // Store in appropriate log
    if (category === 'NETWORK') {
        window._debugNetworkLog.push(logEntry);
    } else if (category === 'CLICK') {
        window._debugClickLog.push(logEntry);
    } else if (category === 'DOWNLOAD') {
        window._debugDownloadAttempts.push(logEntry);
    }
}

// Monitor ALL fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const options = args[1] || {};
    
    debugLog('NETWORK', 'Fetch request', {
        url: url,
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body ? (typeof options.body === 'string' ? options.body.substring(0, 200) : 'FormData') : null
    });
    
    return originalFetch.apply(this, args).then(response => {
        const clonedResponse = response.clone();
        
        // Log response details
        debugLog('NETWORK', 'Fetch response', {
            url: url,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            contentType: response.headers.get('content-type'),
            contentDisposition: response.headers.get('content-disposition')
        });
        
        // Check if this might be a download
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition && contentDisposition.includes('attachment')) {
            debugLog('DOWNLOAD', 'Download detected via Content-Disposition', {
                url: url,
                contentDisposition: contentDisposition
            });
        }
        
        return clonedResponse;
    });
};

// Monitor XMLHttpRequest
const XHROpen = XMLHttpRequest.prototype.open;
const XHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._debugUrl = url;
    this._debugMethod = method;
    return XHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(body) {
    const xhr = this;
    
    debugLog('NETWORK', 'XHR request', {
        url: xhr._debugUrl,
        method: xhr._debugMethod,
        body: body ? (typeof body === 'string' ? body.substring(0, 200) : 'FormData') : null
    });
    
    // Monitor response
    const originalOnLoad = xhr.onload;
    xhr.onload = function() {
        debugLog('NETWORK', 'XHR response', {
            url: xhr._debugUrl,
            status: xhr.status,
            responseHeaders: xhr.getAllResponseHeaders()
        });
        
        if (originalOnLoad) originalOnLoad.apply(this, arguments);
    };
    
    return XHRSend.apply(this, [body]);
};

// Monitor ALL clicks
document.addEventListener('click', function(e) {
    const target = e.target;
    
    const clickInfo = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        text: target.textContent?.substring(0, 100),
        role: target.getAttribute('role'),
        ariaLabel: target.getAttribute('aria-label'),
        href: target.href || target.closest('a')?.href,
        isButton: target.tagName === 'BUTTON' || target.closest('button') !== null,
        isMenuItem: target.getAttribute('role') === 'menuitem' || target.getAttribute('role') === 'option'
    };
    
    debugLog('CLICK', 'Element clicked', clickInfo);
    
    // Check if it's a download-related click
    const text = target.textContent?.toLowerCase() || '';
    if (text.includes('download') || text.includes('다운로드') || 
        text.includes('mp4') || text.includes('mov') || text.includes('gif')) {
        debugLog('DOWNLOAD', 'Potential download click detected', clickInfo);
    }
}, true);

// Monitor window.open
const originalOpen = window.open;
window.open = function(url, ...args) {
    debugLog('DOWNLOAD', 'window.open called', { url, args });
    return originalOpen.apply(this, [url, ...args]);
};

// Monitor anchor clicks
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href) {
        debugLog('DOWNLOAD', 'Link clicked', {
            href: link.href,
            download: link.download,
            target: link.target
        });
    }
}, true);

// Monitor blob creation
const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function(blob) {
    const url = originalCreateObjectURL(blob);
    debugLog('DOWNLOAD', 'Blob URL created', {
        url: url,
        blobSize: blob.size,
        blobType: blob.type
    });
    return url;
};

// Monitor navigation
let lastUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== lastUrl) {
        debugLog('NAVIGATION', 'URL changed', {
            from: lastUrl,
            to: window.location.href
        });
        lastUrl = window.location.href;
    }
}, 500);

// Create debug panel
function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-download-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        max-height: 300px;
        background: rgba(0, 0, 0, 0.9);
        color: #0f0;
        font-family: monospace;
        font-size: 11px;
        padding: 10px;
        border: 1px solid #0f0;
        overflow-y: auto;
        z-index: 999999;
        display: none;
    `;
    
    document.body.appendChild(panel);
    
    // Toggle with Ctrl+D
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            if (panel.style.display === 'block') {
                updateDebugPanel();
            }
        }
    });
    
    return panel;
}

// Update debug panel
function updateDebugPanel() {
    const panel = document.getElementById('debug-download-panel');
    if (!panel) return;
    
    let html = '<h3>Download Debug Info (Ctrl+D to toggle)</h3>';
    
    // Recent downloads
    html += '<h4>Recent Download Attempts:</h4>';
    const recentDownloads = window._debugDownloadAttempts.slice(-5);
    recentDownloads.forEach(log => {
        html += `<div>${log.timestamp.split('T')[1]} - ${log.message}</div>`;
    });
    
    // Recent network requests
    html += '<h4>Recent Network (potential downloads):</h4>';
    const recentNetwork = window._debugNetworkLog
        .filter(log => log.data?.url && (
            log.data.url.includes('download') ||
            log.data.url.includes('export') ||
            log.data.url.includes('render') ||
            log.data.contentDisposition
        ))
        .slice(-5);
    
    recentNetwork.forEach(log => {
        html += `<div>${log.timestamp.split('T')[1]} - ${log.data.method} ${log.data.url?.substring(0, 50)}...</div>`;
    });
    
    // Debug commands
    html += '<h4>Debug Commands:</h4>';
    html += '<div>window.debugDownloadStatus() - Show all logs</div>';
    html += '<div>window.testDriveUpload() - Test Drive upload</div>';
    
    panel.innerHTML = html;
}

// Auto-update panel
setInterval(() => {
    const panel = document.getElementById('debug-download-panel');
    if (panel && panel.style.display !== 'none') {
        updateDebugPanel();
    }
}, 2000);

// Debug functions
window.debugDownloadStatus = function() {
    console.log('=== DOWNLOAD DEBUG STATUS ===');
    console.log('Recent Downloads:', window._debugDownloadAttempts);
    console.log('Recent Network:', window._debugNetworkLog.slice(-10));
    console.log('Recent Clicks:', window._debugClickLog.slice(-10));
    
    // Check Chrome download settings
    console.log('Download settings:', {
        userAgent: navigator.userAgent,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
    });
};

// Test Drive upload with a dummy file
window.testDriveUpload = async function() {
    console.log('Testing Drive upload...');
    
    // Create a test text file
    const blob = new Blob(['Test video file'], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test_video_' + Date.now() + '.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    console.log('Test download triggered. Check ~/Downloads folder');
    
    // Also test the server
    try {
        const response = await fetch('http://localhost:5000/health');
        const data = await response.json();
        console.log('Drive server health:', data);
    } catch (error) {
        console.error('Drive server not running:', error);
    }
};

// Monitor Chrome's download manager
if (chrome && chrome.downloads) {
    console.log('Chrome downloads API available');
} else {
    console.log('Chrome downloads API not available (expected in web context)');
}

// Create debug panel
createDebugPanel();

console.log('=== DEBUG MONITOR READY ===');
console.log('Press Ctrl+D to show debug panel');
console.log('Use window.debugDownloadStatus() for full logs');
console.log('Use window.testDriveUpload() to test');