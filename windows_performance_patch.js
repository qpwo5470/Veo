// Windows Performance Patch - Aggressive fix for framework lag
(function() {
    console.log('🚀 Windows Performance Patch Activating...');
    
    // Only apply on Windows
    if (!navigator.platform.includes('Win')) {
        console.log('Not Windows, skipping performance patch');
        return;
    }
    
    // 1. Override all functions matching obfuscated pattern
    let patchedCount = 0;
    const slowFunctions = new Set();
    
    function patchObfuscatedFunctions() {
        // Search all global objects
        const searchTargets = [window];
        
        // Add all window properties
        try {
            Object.keys(window).forEach(key => {
                if (window[key] && typeof window[key] === 'object') {
                    searchTargets.push(window[key]);
                }
            });
        } catch (e) {}
        
        searchTargets.forEach(target => {
            if (!target) return;
            
            try {
                Object.keys(target).forEach(key => {
                    // Match obfuscated function patterns
                    if (key.match(/^_0x[a-f0-9]+$/i) || key.match(/^[a-zA-Z]{1,2}$/)) {
                        const func = target[key];
                        if (typeof func === 'function') {
                            // Wrap the function
                            target[key] = function(...args) {
                                const start = performance.now();
                                
                                // Skip if already identified as slow
                                if (slowFunctions.has(key)) {
                                    console.log(`Skipping slow function ${key}`);
                                    return undefined;
                                }
                                
                                try {
                                    const result = func.apply(this, args);
                                    const duration = performance.now() - start;
                                    
                                    if (duration > 100) {
                                        console.error(`🚨 Slow function ${key}: ${duration.toFixed(2)}ms`);
                                        slowFunctions.add(key);
                                        
                                        // If extremely slow, disable it
                                        if (duration > 500) {
                                            console.error(`💀 Disabling function ${key} (${duration}ms)`);
                                            target[key] = () => undefined;
                                        }
                                    }
                                    
                                    return result;
                                } catch (e) {
                                    console.error(`Error in ${key}:`, e);
                                    slowFunctions.add(key);
                                    return undefined;
                                }
                            };
                            patchedCount++;
                        }
                    }
                });
            } catch (e) {}
        });
        
        console.log(`Patched ${patchedCount} obfuscated functions`);
    }
    
    // 2. Disable specific problematic features
    function disableProblematicFeatures() {
        // Disable ResizeObserver on Windows (often causes lag)
        if (window.ResizeObserver) {
            window.ResizeObserver = class {
                observe() {}
                unobserve() {}
                disconnect() {}
            };
            console.log('✅ Disabled ResizeObserver');
        }
        
        // Limit IntersectionObserver
        const originalIO = window.IntersectionObserver;
        if (originalIO) {
            let ioCount = 0;
            window.IntersectionObserver = function(...args) {
                ioCount++;
                if (ioCount > 5) {
                    return {
                        observe: () => {},
                        unobserve: () => {},
                        disconnect: () => {}
                    };
                }
                return new originalIO(...args);
            };
            console.log('✅ Limited IntersectionObserver');
        }
        
        // Disable smooth scrolling (causes lag on Windows)
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.scrollBehavior = 'auto';
    }
    
    // 3. Force GPU acceleration
    function forceGPUAcceleration() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-transform: translateZ(0);
                -moz-transform: translateZ(0);
                -ms-transform: translateZ(0);
                -o-transform: translateZ(0);
                transform: translateZ(0);
                
                -webkit-backface-visibility: hidden;
                -moz-backface-visibility: hidden;
                -ms-backface-visibility: hidden;
                backface-visibility: hidden;
                
                -webkit-perspective: 1000;
                -moz-perspective: 1000;
                -ms-perspective: 1000;
                perspective: 1000;
            }
            
            /* Disable animations on Windows */
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Forced GPU acceleration and disabled animations');
    }
    
    // 4. Emergency stop for runaway functions
    let emergencyStop = false;
    
    function installEmergencyStop() {
        // Override setTimeout/setInterval to prevent infinite loops
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        
        window.setTimeout = function(fn, delay, ...args) {
            if (emergencyStop) return -1;
            
            // Limit minimum delay
            const safeDelay = Math.max(delay || 0, 10);
            
            return originalSetTimeout.call(window, function() {
                if (!emergencyStop) {
                    try {
                        fn.apply(this, args);
                    } catch (e) {
                        console.error('Error in setTimeout:', e);
                    }
                }
            }, safeDelay);
        };
        
        window.setInterval = function(fn, delay, ...args) {
            if (emergencyStop) return -1;
            
            // Limit minimum interval
            const safeDelay = Math.max(delay || 0, 100);
            
            return originalSetInterval.call(window, function() {
                if (!emergencyStop) {
                    try {
                        fn.apply(this, args);
                    } catch (e) {
                        console.error('Error in setInterval:', e);
                    }
                }
            }, safeDelay);
        };
    }
    
    // 5. Apply all patches
    console.log('🔧 Applying Windows performance patches...');
    
    patchObfuscatedFunctions();
    disableProblematicFeatures();
    forceGPUAcceleration();
    installEmergencyStop();
    
    // Re-patch every 10 seconds to catch dynamically loaded code
    setInterval(() => {
        if (slowFunctions.size > 0) {
            console.log(`🔄 Re-patching (${slowFunctions.size} slow functions identified)`);
            patchObfuscatedFunctions();
        }
    }, 10000);
    
    // Emergency controls
    window.winPerf = {
        stop: () => {
            emergencyStop = true;
            console.log('🛑 Emergency stop activated');
        },
        
        report: () => {
            console.log('🐌 Slow functions:', Array.from(slowFunctions));
            console.log('📊 Patched functions:', patchedCount);
        },
        
        reset: () => {
            slowFunctions.clear();
            emergencyStop = false;
            patchedCount = 0;
            console.log('♻️ Performance patch reset');
        }
    };
    
    console.log('✅ Windows Performance Patch Ready');
    console.log('Commands: winPerf.stop(), winPerf.report(), winPerf.reset()');
})();