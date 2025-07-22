// Aggressive Framework Blocker - Specifically targets _0x4fef57 and similar functions
(function() {
    console.log('🔥 Aggressive Framework Blocker Initializing...');
    
    const TARGET_FUNCTIONS = ['_0x4fef57', '_0xe2830d']; // Add specific functions to target
    const MAX_EXECUTION_TIME = 200; // milliseconds
    const blockedFunctions = new Set();
    const functionCalls = new Map();
    
    // More aggressive function detection
    function findAndBlockFunction(funcName) {
        let found = false;
        const searchPlaces = [
            window,
            window.self,
            window.global,
            window.globalThis,
            document,
            window.top,
            window.parent
        ];
        
        // Search in all possible locations
        searchPlaces.forEach(place => {
            if (!place) return;
            
            // Direct property
            if (place[funcName]) {
                console.log(`🎯 Found ${funcName} directly on`, place);
                wrapOrBlock(place, funcName);
                found = true;
            }
            
            // Search in all properties
            try {
                Object.keys(place).forEach(key => {
                    const obj = place[key];
                    if (obj && typeof obj === 'object' && obj[funcName]) {
                        console.log(`🎯 Found ${funcName} in ${key}`);
                        wrapOrBlock(obj, funcName);
                        found = true;
                    }
                });
            } catch (e) {}
            
            // Search prototype chain
            try {
                let proto = place;
                while (proto) {
                    if (proto.hasOwnProperty(funcName)) {
                        console.log(`🎯 Found ${funcName} in prototype chain`);
                        wrapOrBlock(proto, funcName);
                        found = true;
                    }
                    proto = Object.getPrototypeOf(proto);
                }
            } catch (e) {}
        });
        
        // Search all global variables
        try {
            const allKeys = Object.keys(window);
            allKeys.forEach(key => {
                if (key === funcName || (window[key] && window[key][funcName])) {
                    console.log(`🎯 Found ${funcName} as/in window.${key}`);
                    if (key === funcName) {
                        wrapOrBlock(window, funcName);
                    } else {
                        wrapOrBlock(window[key], funcName);
                    }
                    found = true;
                }
            });
        } catch (e) {}
        
        return found;
    }
    
    // Wrap or immediately block function
    function wrapOrBlock(obj, funcName) {
        const original = obj[funcName];
        if (typeof original !== 'function') return;
        
        // Check if already wrapped
        if (original._isWrapped) return;
        
        console.log(`🔧 Wrapping ${funcName}...`);
        
        const wrapped = function(...args) {
            // If blocked, return immediately
            if (blockedFunctions.has(funcName)) {
                console.log(`⛔ BLOCKED: ${funcName}`);
                return undefined;
            }
            
            const callId = Date.now() + Math.random();
            const startTime = performance.now();
            
            // Track call count
            const calls = functionCalls.get(funcName) || 0;
            functionCalls.set(funcName, calls + 1);
            
            console.log(`📞 ${funcName} call #${calls + 1} starting...`);
            
            // Set hard timeout
            let timedOut = false;
            const timeout = setTimeout(() => {
                timedOut = true;
                console.error(`💀 ${funcName} TIMEOUT after ${MAX_EXECUTION_TIME}ms - BLOCKING!`);
                blockedFunctions.add(funcName);
                
                // Replace with no-op
                obj[funcName] = function() {
                    console.log(`⛔ ${funcName} is permanently blocked`);
                    return undefined;
                };
            }, MAX_EXECUTION_TIME);
            
            try {
                const result = original.apply(this, args);
                clearTimeout(timeout);
                
                const duration = performance.now() - startTime;
                console.log(`⏱️ ${funcName} completed in ${duration.toFixed(2)}ms`);
                
                if (duration > MAX_EXECUTION_TIME && !timedOut) {
                    console.error(`🐌 ${funcName} too slow (${duration.toFixed(2)}ms) - BLOCKING!`);
                    blockedFunctions.add(funcName);
                    obj[funcName] = () => undefined;
                }
                
                return result;
            } catch (e) {
                clearTimeout(timeout);
                console.error(`❌ ${funcName} error:`, e);
                blockedFunctions.add(funcName);
                obj[funcName] = () => undefined;
                throw e;
            }
        };
        
        wrapped._isWrapped = true;
        wrapped._original = original;
        obj[funcName] = wrapped;
        
        console.log(`✅ ${funcName} wrapped successfully`);
    }
    
    // Override eval to catch dynamic function creation
    const originalEval = window.eval;
    window.eval = function(code) {
        if (typeof code === 'string') {
            TARGET_FUNCTIONS.forEach(func => {
                if (code.includes(func)) {
                    console.log(`🚫 Eval contains ${func} - intercepting...`);
                    // Let it execute but immediately look for the function
                    const result = originalEval.call(this, code);
                    setTimeout(() => findAndBlockFunction(func), 0);
                    return result;
                }
            });
        }
        return originalEval.apply(this, arguments);
    };
    
    // Override Function constructor
    const OriginalFunction = window.Function;
    window.Function = new Proxy(OriginalFunction, {
        construct(target, args) {
            const code = args[args.length - 1];
            if (typeof code === 'string') {
                TARGET_FUNCTIONS.forEach(func => {
                    if (code.includes(func)) {
                        console.log(`🚫 Function constructor contains ${func}`);
                    }
                });
            }
            return new target(...args);
        }
    });
    
    // Monitor script tags
    const scriptObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'SCRIPT') {
                    console.log('📜 New script detected:', node.src || 'inline');
                    
                    // For inline scripts
                    if (!node.src && node.textContent) {
                        TARGET_FUNCTIONS.forEach(func => {
                            if (node.textContent.includes(func)) {
                                console.log(`🎯 Script contains ${func} - will intercept...`);
                                setTimeout(() => findAndBlockFunction(func), 100);
                            }
                        });
                    }
                    
                    // For external scripts
                    if (node.src && node.src.includes('framework')) {
                        console.log('🎯 Framework script detected - scanning after load...');
                        node.addEventListener('load', () => {
                            setTimeout(() => {
                                TARGET_FUNCTIONS.forEach(findAndBlockFunction);
                            }, 100);
                        });
                    }
                }
            });
        });
    });
    
    scriptObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    
    // Proxy common objects to catch property additions
    if (typeof Proxy !== 'undefined') {
        try {
            // Create a proxy for window to catch new properties
            const handler = {
                set(target, prop, value) {
                    if (TARGET_FUNCTIONS.includes(prop) && typeof value === 'function') {
                        console.log(`🎯 Intercepted ${prop} assignment to window`);
                        target[prop] = value;
                        setTimeout(() => wrapOrBlock(target, prop), 0);
                        return true;
                    }
                    target[prop] = value;
                    return true;
                }
            };
            
            // Note: We can't actually replace window, but we can monitor other objects
        } catch (e) {
            console.error('Proxy setup failed:', e);
        }
    }
    
    // Initial scan
    console.log('🔍 Starting initial scan...');
    TARGET_FUNCTIONS.forEach(func => {
        if (findAndBlockFunction(func)) {
            console.log(`✅ Found and wrapped ${func}`);
        } else {
            console.log(`❓ ${func} not found yet - will keep monitoring...`);
        }
    });
    
    // Periodic rescan
    let scanCount = 0;
    const scanInterval = setInterval(() => {
        scanCount++;
        console.log(`🔄 Rescan #${scanCount}...`);
        
        TARGET_FUNCTIONS.forEach(func => {
            if (!blockedFunctions.has(func)) {
                findAndBlockFunction(func);
            }
        });
        
        // Stop after 30 seconds
        if (scanCount > 30) {
            clearInterval(scanInterval);
            console.log('🛑 Stopping periodic scans');
        }
    }, 1000);
    
    // Emergency kill switch
    window.killFrameworkFunction = function(funcName) {
        console.log(`💀 Emergency kill for ${funcName}`);
        blockedFunctions.add(funcName);
        
        // Try to find and replace everywhere
        const places = [window, document];
        places.forEach(place => {
            if (place[funcName]) {
                place[funcName] = () => undefined;
            }
            Object.keys(place).forEach(key => {
                if (place[key] && place[key][funcName]) {
                    place[key][funcName] = () => undefined;
                }
            });
        });
        
        console.log(`✅ ${funcName} killed everywhere possible`);
    };
    
    // Status function
    window.frameworkStatus = function() {
        console.log('📊 Framework Blocker Status:');
        console.log('Blocked functions:', Array.from(blockedFunctions));
        console.log('Function calls:');
        functionCalls.forEach((count, func) => {
            console.log(`  ${func}: ${count} calls`);
        });
    };
    
    console.log('✅ Aggressive Framework Blocker Ready');
    console.log('Targeting:', TARGET_FUNCTIONS.join(', '));
    console.log('Commands: killFrameworkFunction("_0x4fef57"), frameworkStatus()');
    
    // Also try immediate aggressive blocking
    TARGET_FUNCTIONS.forEach(func => {
        console.log(`🎯 Attempting immediate block of ${func}...`);
        try {
            // Try to define it as non-configurable
            Object.defineProperty(window, func, {
                value: function() {
                    console.log(`⛔ ${func} blocked by property definition`);
                    return undefined;
                },
                writable: false,
                configurable: false
            });
        } catch (e) {
            // Property might already exist
        }
    });
})();