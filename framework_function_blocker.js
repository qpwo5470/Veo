// Framework Function Blocker - Monitor and block slow functions from framework-3570b9d07cce9e4a.js
(function() {
    console.log('🛡️ Framework Function Blocker Initializing...');
    
    const FRAMEWORK_NAME = 'framework-3570b9d07cce9e4a.js';
    const MAX_EXECUTION_TIME = 200; // milliseconds
    const blockedFunctions = new Map(); // Track blocked functions
    const functionStats = new Map(); // Track function performance
    
    // Function to wrap and monitor a function
    function wrapFunction(obj, key, originalFunc) {
        return function(...args) {
            const funcId = `${obj.constructor?.name || 'Object'}.${key}`;
            
            // If already blocked, skip execution
            if (blockedFunctions.has(funcId)) {
                console.log(`⛔ Blocked function call: ${funcId} (previously exceeded ${MAX_EXECUTION_TIME}ms)`);
                return undefined;
            }
            
            const startTime = performance.now();
            let result;
            let error = null;
            
            try {
                // Set a timeout to interrupt if too slow
                const timeoutId = setTimeout(() => {
                    console.error(`💀 Function ${funcId} exceeded ${MAX_EXECUTION_TIME}ms - BLOCKING`);
                    blockedFunctions.set(funcId, {
                        blockedAt: new Date(),
                        lastDuration: performance.now() - startTime
                    });
                }, MAX_EXECUTION_TIME);
                
                result = originalFunc.apply(this, args);
                clearTimeout(timeoutId);
                
            } catch (e) {
                error = e;
                console.error(`❌ Function ${funcId} threw error:`, e);
            }
            
            const duration = performance.now() - startTime;
            
            // Update stats
            if (!functionStats.has(funcId)) {
                functionStats.set(funcId, {
                    calls: 0,
                    totalTime: 0,
                    maxTime: 0,
                    errors: 0
                });
            }
            
            const stats = functionStats.get(funcId);
            stats.calls++;
            stats.totalTime += duration;
            stats.maxTime = Math.max(stats.maxTime, duration);
            if (error) stats.errors++;
            
            // Check if function is too slow
            if (duration > MAX_EXECUTION_TIME) {
                console.error(`🐌 Function ${funcId} took ${duration.toFixed(2)}ms - BLOCKING FUTURE CALLS`);
                blockedFunctions.set(funcId, {
                    blockedAt: new Date(),
                    lastDuration: duration
                });
                
                // Replace the function with a no-op
                obj[key] = function() {
                    console.log(`⛔ Blocked: ${funcId}`);
                    return undefined;
                };
            } else if (duration > 100) {
                // Warn about slow functions
                console.warn(`⚠️ Function ${funcId} took ${duration.toFixed(2)}ms`);
            }
            
            if (error) throw error;
            return result;
        };
    }
    
    // Function to scan and wrap all functions in an object
    function wrapObjectFunctions(obj, objName = '') {
        if (!obj || typeof obj !== 'object') return;
        
        const wrapped = new Set();
        
        try {
            // Get all property names including non-enumerable ones
            const props = Object.getOwnPropertyNames(obj);
            
            props.forEach(key => {
                try {
                    const value = obj[key];
                    
                    // Skip if already wrapped or is a getter/setter
                    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
                    if (descriptor && (descriptor.get || descriptor.set)) return;
                    
                    if (typeof value === 'function' && !wrapped.has(key)) {
                        // Check if this might be from the framework
                        const funcString = value.toString();
                        if (funcString.includes('_0x') || key.match(/^_0x[a-f0-9]+$/)) {
                            obj[key] = wrapFunction(obj, key, value);
                            wrapped.add(key);
                        }
                    }
                } catch (e) {
                    // Ignore errors accessing properties
                }
            });
            
            if (wrapped.size > 0) {
                console.log(`📦 Wrapped ${wrapped.size} functions in ${objName || 'object'}`);
            }
        } catch (e) {
            console.error(`Error wrapping object functions:`, e);
        }
    }
    
    // Monitor script loading
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'SCRIPT' && node.src && node.src.includes(FRAMEWORK_NAME)) {
                    console.log(`🎯 Detected ${FRAMEWORK_NAME} loading...`);
                    
                    // Wait for script to execute
                    setTimeout(() => {
                        console.log('🔍 Scanning for framework functions...');
                        scanAndWrapFrameworkFunctions();
                    }, 100);
                }
            });
        });
    });
    
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    
    // Function to scan the entire window for framework functions
    function scanAndWrapFrameworkFunctions() {
        let totalWrapped = 0;
        
        // Scan window object
        Object.keys(window).forEach(key => {
            if (key.match(/^_0x[a-f0-9]+$/)) {
                const value = window[key];
                if (typeof value === 'function') {
                    window[key] = wrapFunction(window, key, value);
                    totalWrapped++;
                } else if (typeof value === 'object' && value !== null) {
                    wrapObjectFunctions(value, `window.${key}`);
                }
            }
        });
        
        // Scan for common framework patterns
        const searchTargets = [
            window,
            window.self,
            window.globalThis,
            document
        ];
        
        // Look for objects that might contain framework functions
        searchTargets.forEach(target => {
            if (!target) return;
            
            Object.keys(target).forEach(key => {
                const value = target[key];
                if (value && typeof value === 'object' && key !== 'window' && key !== 'document') {
                    // Check if this object has obfuscated function names
                    const hasObfuscated = Object.keys(value).some(k => k.match(/^_0x[a-f0-9]+$/));
                    if (hasObfuscated) {
                        wrapObjectFunctions(value, key);
                    }
                }
            });
        });
        
        console.log(`✅ Framework function monitoring active (wrapped ${totalWrapped} functions)`);
    }
    
    // Initial scan after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(scanAndWrapFrameworkFunctions, 1000);
        });
    } else {
        setTimeout(scanAndWrapFrameworkFunctions, 1000);
    }
    
    // Rescan periodically to catch dynamically added functions
    setInterval(() => {
        if (blockedFunctions.size > 0) {
            console.log(`🔄 Rescanning... (${blockedFunctions.size} functions blocked)`);
            scanAndWrapFrameworkFunctions();
        }
    }, 10000);
    
    // Global controls
    window.frameworkBlocker = {
        stats: () => {
            console.log('📊 Function Statistics:');
            functionStats.forEach((stats, funcId) => {
                const avgTime = stats.totalTime / stats.calls;
                console.log(`${funcId}: ${stats.calls} calls, avg ${avgTime.toFixed(2)}ms, max ${stats.maxTime.toFixed(2)}ms`);
            });
        },
        
        blocked: () => {
            console.log('🚫 Blocked Functions:');
            blockedFunctions.forEach((info, funcId) => {
                console.log(`${funcId}: blocked at ${info.blockedAt.toLocaleTimeString()}, last duration ${info.lastDuration.toFixed(2)}ms`);
            });
        },
        
        unblock: (funcId) => {
            if (blockedFunctions.delete(funcId)) {
                console.log(`✅ Unblocked ${funcId}`);
            } else {
                console.log(`❌ Function ${funcId} not found in blocked list`);
            }
        },
        
        unblockAll: () => {
            const count = blockedFunctions.size;
            blockedFunctions.clear();
            console.log(`✅ Unblocked ${count} functions`);
        },
        
        setMaxTime: (ms) => {
            MAX_EXECUTION_TIME = ms;
            console.log(`⏱️ Max execution time set to ${ms}ms`);
        }
    };
    
    console.log('✅ Framework Function Blocker Ready');
    console.log('Commands: frameworkBlocker.stats(), .blocked(), .unblock(funcId), .unblockAll()');
})();