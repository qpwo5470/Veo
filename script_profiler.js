// Script Profiler - Tracks execution time of all scripts
(function() {
    window.scriptProfiler = {
        executionTimes: {},
        scriptSources: new Map(),
        
        // Profile function execution
        profileFunction(name, fn) {
            const self = this;
            return function(...args) {
                const start = performance.now();
                const result = fn.apply(this, args);
                const duration = performance.now() - start;
                
                if (!self.executionTimes[name]) {
                    self.executionTimes[name] = {
                        count: 0,
                        totalTime: 0,
                        maxTime: 0,
                        avgTime: 0
                    };
                }
                
                const stats = self.executionTimes[name];
                stats.count++;
                stats.totalTime += duration;
                stats.maxTime = Math.max(stats.maxTime, duration);
                stats.avgTime = stats.totalTime / stats.count;
                
                if (duration > 16) { // Longer than one frame
                    console.warn(`⚠️ Slow execution: ${name} took ${duration.toFixed(2)}ms`);
                }
                
                return result;
            };
        },
        
        // Find all injected scripts
        findInjectedScripts() {
            const scripts = [];
            
            // Check all script tags
            document.querySelectorAll('script').forEach(script => {
                if (!script.src) {
                    // Inline script
                    const content = script.textContent;
                    if (content.length > 50) {
                        scripts.push({
                            type: 'inline',
                            content: content.substring(0, 200) + '...',
                            size: content.length
                        });
                    }
                }
            });
            
            // Check for our known scripts
            const knownScripts = [
                'uploadQRDialogInitialized',
                'downloadMonitorInit',
                'performanceMonitor',
                'simpleDownloadMonitorInitialized',
                'veo-ui-hider',
                'logo-hider-css',
                'veo-home-button'
            ];
            
            knownScripts.forEach(scriptId => {
                if (window[scriptId] || document.getElementById(scriptId)) {
                    scripts.push({
                        type: 'known',
                        name: scriptId,
                        loaded: true
                    });
                }
            });
            
            return scripts;
        },
        
        // Monitor DOM operations
        monitorDOMOperations() {
            const operations = {
                querySelector: 0,
                querySelectorAll: 0,
                getElementById: 0,
                getElementsByClassName: 0,
                getElementsByTagName: 0
            };
            
            // Wrap DOM methods
            const originalQS = document.querySelector;
            document.querySelector = function(...args) {
                operations.querySelector++;
                return originalQS.apply(this, args);
            };
            
            const originalQSA = document.querySelectorAll;
            document.querySelectorAll = function(...args) {
                operations.querySelectorAll++;
                return originalQSA.apply(this, args);
            };
            
            return operations;
        },
        
        // Check for heavy CSS selectors
        checkHeavyCSS() {
            const styles = document.querySelectorAll('style');
            const heavySelectors = [];
            
            styles.forEach(style => {
                const content = style.textContent;
                // Check for complex selectors
                const complexPatterns = [
                    /\[class\*=["'][^"']+["']\]/g,  // Attribute contains
                    /\:has\(/g,                       // :has selector
                    /\:not\([^)]+\)/g,               // Complex :not
                    />\s*\*\s*>/g                    // Universal selector chains
                ];
                
                complexPatterns.forEach(pattern => {
                    const matches = content.match(pattern);
                    if (matches) {
                        heavySelectors.push({
                            pattern: pattern.toString(),
                            count: matches.length,
                            examples: matches.slice(0, 3)
                        });
                    }
                });
            });
            
            return heavySelectors;
        },
        
        // Generate performance profile
        generateProfile() {
            console.group('🎯 Script Performance Profile');
            
            // Execution times
            console.group('⏱️ Function Execution Times');
            const sorted = Object.entries(this.executionTimes)
                .sort((a, b) => b[1].totalTime - a[1].totalTime)
                .slice(0, 10);
            console.table(sorted.map(([name, stats]) => ({
                Function: name,
                'Total Time (ms)': stats.totalTime.toFixed(2),
                'Avg Time (ms)': stats.avgTime.toFixed(2),
                'Max Time (ms)': stats.maxTime.toFixed(2),
                'Call Count': stats.count
            })));
            console.groupEnd();
            
            // Injected scripts
            console.group('📜 Injected Scripts');
            const scripts = this.findInjectedScripts();
            console.table(scripts);
            console.groupEnd();
            
            // Heavy CSS
            console.group('🎨 Heavy CSS Selectors');
            const heavyCSS = this.checkHeavyCSS();
            if (heavyCSS.length > 0) {
                console.table(heavyCSS);
            } else {
                console.log('No heavy CSS selectors found');
            }
            console.groupEnd();
            
            console.groupEnd();
        },
        
        // Start profiling specific functions
        startProfiling() {
            // Profile common heavy operations
            if (window.showUploadQRDialog) {
                window.showUploadQRDialog = this.profileFunction('showUploadQRDialog', window.showUploadQRDialog);
            }
            
            if (window.showUploadLoadingSpinner) {
                window.showUploadLoadingSpinner = this.profileFunction('showUploadLoadingSpinner', window.showUploadLoadingSpinner);
            }
            
            if (window.startUploadMonitoring) {
                window.startUploadMonitoring = this.profileFunction('startUploadMonitoring', window.startUploadMonitoring);
            }
            
            console.log('Script profiling started');
        }
    };
    
    // Start profiling
    window.scriptProfiler.startProfiling();
    
    console.log('🎯 Script Profiler Commands:');
    console.log('- scriptProfiler.generateProfile() - Generate performance profile');
    console.log('- scriptProfiler.findInjectedScripts() - List all injected scripts');
    console.log('- scriptProfiler.checkHeavyCSS() - Find heavy CSS selectors');
})();