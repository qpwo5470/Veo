// Combined Performance Debugger - Easy to use performance analysis
(function() {
    window.perfDebug = {
        // Quick performance check
        quickCheck() {
            console.group('🚀 Quick Performance Check');
            
            // Check for obvious issues
            this.checkObviousIssues();
            
            // Show current resource usage
            this.showResourceUsage();
            
            // List active scripts
            this.listActiveScripts();
            
            console.groupEnd();
        },
        
        // Check for obvious performance issues
        checkObviousIssues() {
            console.group('⚠️ Checking for Issues...');
            
            let issues = [];
            
            // Check for MutationObservers
            if (window.MutationObserver && window.MutationObserver.toString().includes('native code') === false) {
                issues.push('MutationObserver has been overridden');
            }
            
            // Check DOM size
            const domSize = document.querySelectorAll('*').length;
            if (domSize > 2000) {
                issues.push(`Large DOM: ${domSize} elements`);
            }
            
            // Check for animations
            const animations = document.querySelectorAll('[style*="animation"], [style*="transition"]');
            if (animations.length > 10) {
                issues.push(`Many animated elements: ${animations.length}`);
            }
            
            // Check for non-passive scroll listeners
            const scrollListeners = getEventListeners ? getEventListeners(window).scroll : [];
            if (scrollListeners && scrollListeners.length > 0) {
                issues.push(`Scroll listeners detected: ${scrollListeners.length}`);
            }
            
            if (issues.length === 0) {
                console.log('✅ No obvious issues found');
            } else {
                issues.forEach(issue => console.warn(issue));
            }
            
            console.groupEnd();
        },
        
        // Show current resource usage
        showResourceUsage() {
            console.group('📊 Resource Usage');
            
            // Memory
            if (performance.memory) {
                const mem = performance.memory;
                console.log('Memory:', {
                    used: (mem.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                    total: (mem.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                    limit: (mem.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
                });
            }
            
            // Performance entries
            const entries = performance.getEntriesByType('measure');
            if (entries.length > 0) {
                console.log('Recent measures:', entries.slice(-5));
            }
            
            console.groupEnd();
        },
        
        // List active scripts
        listActiveScripts() {
            console.group('📜 Active Scripts');
            
            const scripts = {
                'QR Dialog': !!window.uploadQRDialogInitialized,
                'Download Monitor': !!window.downloadMonitorInit,
                'Upload Monitoring': typeof window.startUploadMonitoring === 'function',
                'Performance Monitor': !!window.performanceMonitor,
                'Home Button': !!document.getElementById('veo-home-button'),
                'UI Hider CSS': !!document.getElementById('veo-ui-hider-min'),
                'Logo Hider CSS': !!document.getElementById('logo-hider-css')
            };
            
            console.table(scripts);
            console.groupEnd();
        },
        
        // Monitor for specific duration
        async monitorFor(seconds = 5) {
            console.log(`📊 Monitoring performance for ${seconds} seconds...`);
            
            const startTime = performance.now();
            const samples = [];
            
            const interval = setInterval(() => {
                const sample = {
                    time: performance.now() - startTime,
                    domNodes: document.querySelectorAll('*').length,
                    memory: performance.memory ? performance.memory.usedJSHeapSize : 0
                };
                samples.push(sample);
            }, 500);
            
            await new Promise(resolve => setTimeout(resolve, seconds * 1000));
            clearInterval(interval);
            
            // Analyze samples
            console.group('📈 Monitoring Results');
            
            // DOM growth
            const domGrowth = samples[samples.length - 1].domNodes - samples[0].domNodes;
            console.log(`DOM growth: ${domGrowth} nodes`);
            
            // Memory growth
            if (performance.memory) {
                const memGrowth = (samples[samples.length - 1].memory - samples[0].memory) / 1048576;
                console.log(`Memory growth: ${memGrowth.toFixed(2)} MB`);
            }
            
            console.groupEnd();
        },
        
        // Find the heaviest operation
        async findHeaviest() {
            console.log('🔍 Finding heaviest operations...');
            
            const operations = [];
            
            // Test querySelector performance
            const qsStart = performance.now();
            for (let i = 0; i < 100; i++) {
                document.querySelector('.some-class-that-doesnt-exist');
            }
            operations.push({
                name: 'querySelector (100x)',
                time: performance.now() - qsStart
            });
            
            // Test querySelectorAll performance
            const qsaStart = performance.now();
            for (let i = 0; i < 10; i++) {
                document.querySelectorAll('*');
            }
            operations.push({
                name: 'querySelectorAll(*) (10x)',
                time: performance.now() - qsaStart
            });
            
            // Test style computation
            const styleStart = performance.now();
            document.querySelectorAll('*').forEach(el => {
                getComputedStyle(el).display;
            });
            operations.push({
                name: 'getComputedStyle (all elements)',
                time: performance.now() - styleStart
            });
            
            // Sort by time
            operations.sort((a, b) => b.time - a.time);
            console.table(operations);
        }
    };
    
    // Add keyboard shortcut
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            console.clear();
            window.perfDebug.quickCheck();
        }
    });
    
    console.log('🎯 Performance Debugger Ready!');
    console.log('Commands:');
    console.log('- perfDebug.quickCheck() - Quick performance check');
    console.log('- perfDebug.monitorFor(5) - Monitor for 5 seconds');
    console.log('- perfDebug.findHeaviest() - Find heavy operations');
    console.log('- Ctrl+Shift+P - Quick check shortcut');
})();