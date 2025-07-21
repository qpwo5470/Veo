// Aggressive console filter to suppress network logs
(function() {
    // Store original console methods
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalDebug = console.debug;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Filter function - much more aggressive
    function shouldFilter(args) {
        if (!args || args.length === 0) return false;
        
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ').toLowerCase();
        
        // Filter any message containing port numbers or network-related terms
        return message.includes('fetch') || 
               message.includes('xhr') ||
               message.includes('network') ||
               message.includes('request') ||
               message.includes('api call') ||
               message.includes('http') ||
               message.includes('8888') ||
               message.includes('8889') ||
               message.includes('8890') ||
               message.includes('8881') ||
               message.includes('localhost') ||
               message.includes('127.0.0.1') ||
               message.includes(':88') ||
               message.includes('port') ||
               message.includes('download') ||
               message.includes('upload') ||
               message.includes('drive.google') ||
               message.includes('drum.usercontent') ||
               message.includes('GET ') ||
               message.includes('POST ') ||
               message.includes('OPTIONS ') ||
               message.includes('status:') ||
               message.includes('response:') ||
               message.includes('headers:') ||
               message.includes('blob:') ||
               message.includes('websocket') ||
               message.includes('ws://') ||
               message.includes('wss://');
    }
    
    // Override all console methods
    console.log = function(...args) {
        if (!shouldFilter(args)) {
            originalLog.apply(console, args);
        }
    };
    
    console.info = function(...args) {
        if (!shouldFilter(args)) {
            originalInfo.apply(console, args);
        }
    };
    
    console.debug = function(...args) {
        if (!shouldFilter(args)) {
            originalDebug.apply(console, args);
        }
    };
    
    console.warn = function(...args) {
        if (!shouldFilter(args)) {
            originalWarn.apply(console, args);
        }
    };
    
    // Only filter network-related errors
    console.error = function(...args) {
        if (!shouldFilter(args)) {
            originalError.apply(console, args);
        }
    };
})();

// Console filter active - network logs aggressively suppressed