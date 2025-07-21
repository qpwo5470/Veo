// Console filter to remove fetch logs
(function() {
    // Store original console methods
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalDebug = console.debug;
    
    // Filter function
    function shouldFilter(args) {
        const message = args.map(arg => String(arg)).join(' ').toLowerCase();
        return message.includes('fetch') || 
               message.includes('xhr') ||
               message.includes('network') ||
               message.includes('request') ||
               message.includes('api call');
    }
    
    // Override console.log
    console.log = function(...args) {
        if (!shouldFilter(args)) {
            originalLog.apply(console, args);
        }
    };
    
    // Override console.info
    console.info = function(...args) {
        if (!shouldFilter(args)) {
            originalInfo.apply(console, args);
        }
    };
    
    // Override console.debug
    console.debug = function(...args) {
        if (!shouldFilter(args)) {
            originalDebug.apply(console, args);
        }
    };
})();

// Console filter active - fetch logs suppressed