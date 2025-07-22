// Framework Performance Fix - Identifies and patches performance issues
(function() {
    console.log('🔧 Framework Performance Fix Loading...');
    
    // 1. Function execution timer
    const functionTimings = new Map();
    let slowFunctionFound = false;
    
    // 2. Wrap functions to measure execution time
    function wrapFunction(obj, funcName, threshold = 50) {
        const original = obj[funcName];
        if (typeof original !== 'function') return;
        
        obj[funcName] = function(...args) {
            const start = performance.now();
            const result = original.apply(this, args);
            const duration = performance.now() - start;
            
            // Track timing
            if (!functionTimings.has(funcName)) {
                functionTimings.set(funcName, {
                    count: 0,
                    totalTime: 0,
                    maxTime: 0,
                    avgTime: 0
                });
            }
            
            const stats = functionTimings.get(funcName);
            stats.count++;
            stats.totalTime += duration;
            stats.maxTime = Math.max(stats.maxTime, duration);
            stats.avgTime = stats.totalTime / stats.count;
            
            // Alert if slow
            if (duration > threshold) {
                console.warn(`⚠️ Slow function ${funcName}: ${duration.toFixed(2)}ms`);
                if (duration > 500 && !slowFunctionFound) {
                    slowFunctionFound = true;
                    console.error(`🚨 CRITICAL: Function ${funcName} took ${duration.toFixed(2)}ms!`);
                    console.log('Stack trace:', new Error().stack);
                    
                    // Try to identify what the function does
                    console.log('Function details:', {
                        name: funcName,
                        args: args,
                        result: result,
                        functionString: original.toString().substring(0, 200)
                    });
                }
            }
            
            return result;
        };
    }
    
    // 3. Find and patch the problematic function
    function findAndPatchSlowFunction() {
        console.log('🔍 Searching for _0x4fef57 function...');
        
        // Search in global scope
        for (let key in window) {
            if (key.includes('_0x') || key.includes('0x4fef57')) {
                console.log(`Found suspicious function: ${key}`);
                wrapFunction(window, key);
            }
        }
        
        // Search in common framework locations
        const searchLocations = [
            window,
            window.React,
            window.ReactDOM,
            window.Next,
            document
        ];
        
        searchLocations.forEach(obj => {
            if (!obj) return;
            
            try {
                Object.keys(obj).forEach(key => {
                    if (key.includes('_0x') || key.includes('4fef57')) {
                        console.log(`Found in ${obj.constructor.name}: ${key}`);
                        wrapFunction(obj, key);
                    }
                });
            } catch (e) {
                // Some objects might not be enumerable
            }
        });
    }
    
    // 4. Patch requestAnimationFrame to detect frame issues
    const originalRAF = window.requestAnimationFrame;
    let frameCount = 0;
    let lastFrameTime = performance.now();
    
    window.requestAnimationFrame = function(callback) {
        return originalRAF.call(window, function(timestamp) {
            const frameStart = performance.now();
            
            // Call original callback
            const result = callback(timestamp);
            
            const frameDuration = performance.now() - frameStart;
            const timeSinceLastFrame = frameStart - lastFrameTime;
            
            frameCount++;
            
            // Detect slow frames
            if (frameDuration > 16.67) { // More than 1 frame (60fps)
                console.warn(`🐌 Slow frame #${frameCount}: ${frameDuration.toFixed(2)}ms`);
                
                if (frameDuration > 500) {
                    console.error(`🚨 CRITICAL FRAME LAG: ${frameDuration.toFixed(2)}ms`);
                    
                    // Try to capture what's running
                    if (window.performanceMonitor) {
                        window.performanceMonitor.generateReport();
                    }
                }
            }
            
            lastFrameTime = frameStart;
            return result;
        });
    };
    
    // 5. Disable expensive operations
    function disableExpensiveOperations() {
        console.log('🛡️ Disabling potentially expensive operations...');
        
        // Disable excessive DOM observations
        const originalMO = window.MutationObserver;
        let moCount = 0;
        
        window.MutationObserver = function(callback) {
            moCount++;
            if (moCount > 10) {
                console.warn(`⚠️ Too many MutationObservers (${moCount}), blocking new ones`);
                return {
                    observe: () => {},
                    disconnect: () => {},
                    takeRecords: () => []
                };
            }
            return new originalMO(callback);
        };
        
        // Throttle scroll events
        let scrollThrottle = false;
        window.addEventListener('scroll', function(e) {
            if (scrollThrottle) {
                e.stopImmediatePropagation();
                return;
            }
            scrollThrottle = true;
            setTimeout(() => { scrollThrottle = false; }, 16);
        }, true);
    }
    
    // 6. Performance report
    window.frameworkPerf = {
        report: () => {
            console.group('📊 Framework Performance Report');
            
            // Show slow functions
            const slowFuncs = Array.from(functionTimings.entries())
                .filter(([name, stats]) => stats.maxTime > 50)
                .sort((a, b) => b[1].maxTime - a[1].maxTime);
            
            if (slowFuncs.length > 0) {
                console.table(slowFuncs.map(([name, stats]) => ({
                    Function: name,
                    'Max Time (ms)': stats.maxTime.toFixed(2),
                    'Avg Time (ms)': stats.avgTime.toFixed(2),
                    'Call Count': stats.count,
                    'Total Time (ms)': stats.totalTime.toFixed(2)
                })));
            } else {
                console.log('No slow functions detected yet');
            }
            
            console.groupEnd();
        },
        
        disable: () => {
            disableExpensiveOperations();
        },
        
        findSlow: () => {
            findAndPatchSlowFunction();
        }
    };
    
    // 7. Auto-detect on Windows
    if (navigator.platform.includes('Win')) {
        console.log('🖥️ Windows detected - applying performance patches');
        
        // Start monitoring
        findAndPatchSlowFunction();
        disableExpensiveOperations();
        
        // Check every 5 seconds for new slow functions
        setInterval(() => {
            if (slowFunctionFound) {
                console.log('🔄 Checking for performance issues...');
                findAndPatchSlowFunction();
            }
        }, 5000);
    }
    
    console.log('🔧 Framework Performance Fix Ready');
    console.log('Commands:');
    console.log('- frameworkPerf.report() - Show performance report');
    console.log('- frameworkPerf.disable() - Disable expensive operations');
    console.log('- frameworkPerf.findSlow() - Find slow functions');
})();