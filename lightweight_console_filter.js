// Lightweight console filter - minimal overhead
(function() {
    // Only filter the most common spam patterns
    const spamPatterns = /8888|8889|8890|8891|localhost.*latest_upload|fetch.*json|ERR_CONNECTION_REFUSED/i;
    
    // Store originals
    const log = console.log;
    const error = console.error;
    
    // Simple filter
    console.log = function() {
        if (!spamPatterns.test(Array.prototype.join.call(arguments, ' '))) {
            log.apply(console, arguments);
        }
    };
    
    console.error = function() {
        if (!spamPatterns.test(Array.prototype.join.call(arguments, ' '))) {
            error.apply(console, arguments);
        }
    };
})();