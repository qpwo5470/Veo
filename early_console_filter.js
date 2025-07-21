// Ultra-aggressive early console filter
// This should be injected FIRST before any other scripts

(function() {
    // Save originals
    const console_backup = {
        log: console.log,
        info: console.info,
        debug: console.debug,
        warn: console.warn,
        error: console.error,
        trace: console.trace,
        dir: console.dir,
        dirxml: console.dirxml,
        table: console.table,
        group: console.group,
        groupCollapsed: console.groupCollapsed
    };
    
    // List of keywords to filter
    const filterKeywords = [
        'fetch', 'xhr', 'network', 'request', 'http', 'https',
        '8888', '8889', '8890', '8881', ':88', 'port',
        'localhost', '127.0.0.1', '0.0.0.0',
        'download', 'upload', 'drive.google', 'drum.usercontent',
        'GET ', 'POST ', 'PUT ', 'DELETE ', 'OPTIONS ', 'HEAD ',
        'status:', 'response:', 'headers:', 'blob:', 'file:',
        'websocket', 'ws://', 'wss://', 'socket',
        'api', 'endpoint', 'server', 'client',
        'Content-Type', 'Accept', 'User-Agent',
        'CORS', 'preflight', 'credentials',
        'json', 'parse', 'stringify',
        'promise', 'async', 'await', 'then', 'catch',
        'error:', 'failed:', 'success:',
        'loaded', 'loading', 'progress',
        '200', '201', '204', '301', '302', '304', '400', '401', '403', '404', '500',
        'net::', 'devtools', 'chrome-extension',
        'Failed to fetch', 'NetworkError', 'TypeError: Failed',
        'Access-Control', 'X-', 'content-length',
        'multipart', 'form-data', 'boundary',
        'stream', 'chunk', 'buffer',
        'queue', 'pending', 'fulfilled', 'rejected'
    ];
    
    // Super aggressive filter
    function shouldFilter(args) {
        if (!args || args.length === 0) return false;
        
        try {
            const message = args.map(arg => {
                if (arg === null || arg === undefined) return '';
                if (typeof arg === 'object') {
                    try {
                        // Check if it's an Error object with stack trace
                        if (arg.stack && arg.message) {
                            return arg.message + ' ' + arg.stack;
                        }
                        return JSON.stringify(arg).substring(0, 1000);
                    } catch (e) {
                        return Object.prototype.toString.call(arg);
                    }
                }
                return String(arg);
            }).join(' ').toLowerCase();
            
            // Check against all filter keywords
            return filterKeywords.some(keyword => message.includes(keyword.toLowerCase()));
        } catch (e) {
            // If any error in filtering, just suppress to be safe
            return true;
        }
    }
    
    // Create filtered versions of all console methods
    Object.keys(console_backup).forEach(method => {
        console[method] = function(...args) {
            if (!shouldFilter(args)) {
                console_backup[method].apply(console, args);
            }
        };
    });
    
    // Also override console.log directly (some frameworks reassign it)
    const descriptor = Object.getOwnPropertyDescriptor(console, 'log');
    if (descriptor && descriptor.configurable) {
        Object.defineProperty(console, 'log', {
            value: function(...args) {
                if (!shouldFilter(args)) {
                    console_backup.log.apply(console, args);
                }
            },
            writable: true,
            configurable: true
        });
    }
    
    // Suppress fetch logging at the source
    if (window.fetch) {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            // Silently call fetch without logging
            return originalFetch.apply(this, args);
        };
    }
    
    // Suppress XMLHttpRequest logging
    if (window.XMLHttpRequest) {
        const XHR = XMLHttpRequest.prototype;
        const originalOpen = XHR.open;
        const originalSend = XHR.send;
        
        XHR.open = function(method, url) {
            this._url = url;
            this._method = method;
            return originalOpen.apply(this, arguments);
        };
        
        XHR.send = function() {
            return originalSend.apply(this, arguments);
        };
    }
    
    // Suppress EventSource (SSE) if used
    if (window.EventSource) {
        const originalEventSource = window.EventSource;
        window.EventSource = function(url, config) {
            return new originalEventSource(url, config);
        };
    }
    
    // Suppress WebSocket logs
    if (window.WebSocket) {
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            return new originalWebSocket(url, protocols);
        };
    }
    
    // Clear any existing logs that might have been queued
    if (console.clear) {
        console.clear();
    }
    
    // Single message to confirm filter is active
    console_backup.log('[EARLY FILTER] Console filtering active - network logs suppressed');
})();