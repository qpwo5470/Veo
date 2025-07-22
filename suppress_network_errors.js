// Suppress Network Errors - Specifically for localhost:8888
(function() {
    console.log('🔇 Suppressing network error logs...');
    
    // Override console.error to filter out specific network errors
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    const filterPatterns = [
        'ERR_CONNECTION_REFUSED',
        'Failed to load resource',
        'net::ERR_',
        'localhost:8888',
        'latest_upload',
        'NetworkError',
        'Failed to fetch',
        '404 (Not Found)',
        'GET http://localhost'
    ];
    
    function shouldFilter(args) {
        const message = args.map(arg => String(arg)).join(' ');
        return filterPatterns.some(pattern => message.includes(pattern));
    }
    
    console.error = function(...args) {
        if (!shouldFilter(args)) {
            originalError.apply(console, args);
        }
    };
    
    console.warn = function(...args) {
        if (!shouldFilter(args)) {
            originalWarn.apply(console, args);
        }
    };
    
    console.log = function(...args) {
        if (!shouldFilter(args)) {
            originalLog.apply(console, args);
        }
    };
    
    // Also suppress fetch errors for localhost:8888
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('localhost:8888')) {
            try {
                return await originalFetch.apply(this, args);
            } catch (error) {
                // Silently fail for localhost:8888
                return new Response('{}', {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        return originalFetch.apply(this, args);
    };
    
    // Suppress XMLHttpRequest errors
    const XHR = XMLHttpRequest.prototype;
    const originalOpen = XHR.open;
    const originalSend = XHR.send;
    
    XHR.open = function(method, url, ...args) {
        this._url = url;
        return originalOpen.apply(this, [method, url, ...args]);
    };
    
    XHR.send = function(...args) {
        if (this._url && this._url.includes('localhost:8888')) {
            // Override error handler for localhost:8888
            this.addEventListener('error', function(e) {
                e.stopPropagation();
                e.preventDefault();
            }, true);
        }
        return originalSend.apply(this, args);
    };
    
    console.log('✅ Network error suppression active');
})();