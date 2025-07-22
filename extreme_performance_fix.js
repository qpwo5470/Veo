// Extreme Performance Fix - Target _0xe2830d specifically
(function() {
    console.log('🚨 EXTREME PERFORMANCE FIX ACTIVATING...');
    
    // Track the problematic function
    let callCount = 0;
    let totalTime = 0;
    let disabled = false;
    
    // Function to find and patch _0xe2830d
    function findAndPatchFunction() {
        const searchTargets = [window];
        
        // Search all global objects
        try {
            Object.keys(window).forEach(key => {
                if (window[key] && typeof window[key] === 'object' && key !== 'window') {
                    searchTargets.push(window[key]);
                }
            });
        } catch (e) {}
        
        let found = false;
        
        searchTargets.forEach(target => {
            if (!target || found) return;
            
            try {
                // Look for the specific function
                if (target._0xe2830d && typeof target._0xe2830d === 'function') {
                    console.log('🎯 Found _0xe2830d, applying extreme patch...');
                    
                    const original = target._0xe2830d;
                    
                    // Replace with monitoring wrapper
                    target._0xe2830d = function(...args) {
                        if (disabled) {
                            console.log('⛔ _0xe2830d BLOCKED (disabled)');
                            return undefined;
                        }
                        
                        callCount++;
                        const start = performance.now();
                        
                        // If it's been consistently slow, just skip it
                        if (callCount > 5 && totalTime / callCount > 1000) {
                            console.log('⚡ _0xe2830d SKIPPED (too slow)');
                            disabled = true;
                            return undefined;
                        }
                        
                        try {
                            // Set a timeout to kill the function if it takes too long
                            let completed = false;
                            let result;
                            
                            const timeout = setTimeout(() => {
                                if (!completed) {
                                    console.error('💀 _0xe2830d KILLED (timeout after 100ms)');
                                    disabled = true;
                                }
                            }, 100);
                            
                            result = original.apply(this, args);
                            completed = true;
                            clearTimeout(timeout);
                            
                            const duration = performance.now() - start;
                            totalTime += duration;
                            
                            if (duration > 500) {
                                console.error(`🔥 _0xe2830d took ${duration.toFixed(1)}ms (call #${callCount})`);
                                
                                // Disable after 3 slow calls
                                if (callCount >= 3) {
                                    disabled = true;
                                    console.error('🚫 _0xe2830d PERMANENTLY DISABLED');
                                    target._0xe2830d = () => undefined;
                                }
                            }
                            
                            return result;
                        } catch (e) {
                            console.error('💥 _0xe2830d crashed:', e);
                            disabled = true;
                            return undefined;
                        }
                    };
                    
                    found = true;
                    console.log('✅ _0xe2830d patched with extreme measures');
                }
                
                // Also search nested properties
                Object.keys(target).forEach(key => {
                    if (key === '_0xe2830d' && typeof target[key] === 'function' && !found) {
                        console.log(`🎯 Found _0xe2830d at ${key}`);
                        // Apply same patch as above
                        const original = target[key];
                        target[key] = function(...args) {
                            if (disabled) return undefined;
                            
                            callCount++;
                            const start = performance.now();
                            
                            if (callCount > 5 && totalTime / callCount > 1000) {
                                disabled = true;
                                return undefined;
                            }
                            
                            try {
                                const result = original.apply(this, args);
                                const duration = performance.now() - start;
                                totalTime += duration;
                                
                                if (duration > 500) {
                                    console.error(`🔥 ${key} took ${duration.toFixed(1)}ms`);
                                    if (callCount >= 3) {
                                        disabled = true;
                                        target[key] = () => undefined;
                                    }
                                }
                                
                                return result;
                            } catch (e) {
                                disabled = true;
                                return undefined;
                            }
                        };
                        found = true;
                    }
                });
            } catch (e) {}
        });
        
        if (!found) {
            console.log('❓ _0xe2830d not found yet, will retry...');
        }
        
        return found;
    }
    
    // Try to find it immediately
    findAndPatchFunction();
    
    // Retry every second for 30 seconds
    let retryCount = 0;
    const retryInterval = setInterval(() => {
        retryCount++;
        if (findAndPatchFunction() || retryCount > 30) {
            clearInterval(retryInterval);
        }
    }, 1000);
    
    // Global killswitch
    window.killSlowFunction = function() {
        disabled = true;
        console.log('🛑 Slow function killed manually');
        
        // Try to find and disable it everywhere
        const searchTargets = [window];
        Object.keys(window).forEach(key => {
            if (window[key] && typeof window[key] === 'object') {
                searchTargets.push(window[key]);
            }
        });
        
        searchTargets.forEach(target => {
            if (target && target._0xe2830d) {
                target._0xe2830d = () => undefined;
            }
            Object.keys(target || {}).forEach(key => {
                if (key === '_0xe2830d') {
                    target[key] = () => undefined;
                }
            });
        });
        
        console.log('✅ All instances of _0xe2830d disabled');
    };
    
    // Also patch any script that might define this function
    const originalEval = window.eval;
    window.eval = function(code) {
        if (code && code.includes('_0xe2830d')) {
            console.log('🚫 Blocking eval that contains _0xe2830d');
            return undefined;
        }
        return originalEval.apply(this, arguments);
    };
    
    // Monitor new scripts
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'SCRIPT' && node.textContent && node.textContent.includes('_0xe2830d')) {
                    console.log('🚫 Blocking script that contains _0xe2830d');
                    node.remove();
                }
            });
        });
    });
    
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    
    console.log('🛡️ Extreme performance fix ready');
    console.log('Use window.killSlowFunction() to manually disable the slow function');
})();