// CPU Usage Detector - Identifies what's causing high CPU
(function() {
    window.cpuDetector = {
        samples: [],
        isRunning: false,
        
        // Detect render-blocking operations
        detectRenderBlocking() {
            const results = {
                forcedReflows: 0,
                layoutThrashing: [],
                heavyStyles: []
            };
            
            // Monitor for layout thrashing
            const properties = ['offsetWidth', 'offsetHeight', 'offsetTop', 'offsetLeft', 
                              'scrollWidth', 'scrollHeight', 'clientWidth', 'clientHeight'];
            
            properties.forEach(prop => {
                const elements = document.querySelectorAll('*');
                let readCount = 0;
                
                // Check if properties are being read excessively
                const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, prop);
                if (descriptor && descriptor.get) {
                    Object.defineProperty(Element.prototype, prop, {
                        get: function() {
                            readCount++;
                            if (readCount > 100) {
                                results.layoutThrashing.push({
                                    property: prop,
                                    count: readCount
                                });
                            }
                            return descriptor.get.call(this);
                        }
                    });
                }
            });
            
            return results;
        },
        
        // Sample CPU usage over time
        startSampling() {
            if (this.isRunning) return;
            this.isRunning = true;
            
            const sample = () => {
                if (!this.isRunning) return;
                
                const startTime = performance.now();
                
                // Measure main thread blocking
                requestAnimationFrame(() => {
                    const frameTime = performance.now() - startTime;
                    
                    this.samples.push({
                        timestamp: Date.now(),
                        frameTime: frameTime,
                        blocked: frameTime > 16.67 // More than one frame
                    });
                    
                    // Keep only last 100 samples
                    if (this.samples.length > 100) {
                        this.samples.shift();
                    }
                    
                    // Continue sampling
                    setTimeout(sample, 100);
                });
            };
            
            sample();
            console.log('CPU sampling started');
        },
        
        // Analyze what's running
        analyzeRuntime() {
            const analysis = {
                activeTimers: [],
                activeObservers: [],
                eventListenerCount: 0,
                animationCount: 0
            };
            
            // Check for active timers (this is a heuristic)
            for (let i = 1; i < 10000; i++) {
                try {
                    clearTimeout(i);
                    clearInterval(i);
                } catch (e) {
                    // Timer exists
                    analysis.activeTimers.push(i);
                }
            }
            
            // Count event listeners
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                // This is an approximation
                const listeners = getEventListeners ? getEventListeners(el) : {};
                analysis.eventListenerCount += Object.keys(listeners).length;
            });
            
            return analysis;
        },
        
        // Find elements causing repaints
        findRepaintCausers() {
            const suspects = [];
            
            // Check for animated elements
            document.querySelectorAll('*').forEach(el => {
                const style = getComputedStyle(el);
                
                // Check for animations
                if (style.animation !== 'none' || style.transition !== 'none') {
                    suspects.push({
                        element: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className : ''),
                        animation: style.animation,
                        transition: style.transition
                    });
                }
                
                // Check for transforms
                if (style.transform !== 'none') {
                    suspects.push({
                        element: el.tagName,
                        transform: style.transform
                    });
                }
            });
            
            return suspects;
        },
        
        // Generate CPU usage report
        generateReport() {
            console.group('🔥 CPU Usage Analysis');
            
            // Frame time analysis
            if (this.samples.length > 0) {
                const blockedFrames = this.samples.filter(s => s.blocked).length;
                const avgFrameTime = this.samples.reduce((sum, s) => sum + s.frameTime, 0) / this.samples.length;
                
                console.group('📊 Frame Time Analysis');
                console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms`);
                console.log(`Blocked frames: ${blockedFrames}/${this.samples.length} (${(blockedFrames/this.samples.length*100).toFixed(1)}%)`);
                console.groupEnd();
            }
            
            // Runtime analysis
            console.group('⚙️ Runtime Analysis');
            const runtime = this.analyzeRuntime();
            console.log(`Active timers: ${runtime.activeTimers.length}`);
            console.log(`Event listeners: ${runtime.eventListenerCount}`);
            console.groupEnd();
            
            // Repaint analysis
            console.group('🎨 Repaint Causers');
            const repainters = this.findRepaintCausers();
            if (repainters.length > 0) {
                console.table(repainters);
            } else {
                console.log('No obvious repaint causers found');
            }
            console.groupEnd();
            
            // Heavy operations
            console.group('⚠️ Heavy Operations Detected');
            this.detectHeavyOperations();
            console.groupEnd();
            
            console.groupEnd();
        },
        
        // Detect specific heavy operations
        detectHeavyOperations() {
            // Check for large DOM
            const domSize = document.querySelectorAll('*').length;
            if (domSize > 1500) {
                console.warn(`Large DOM size: ${domSize} elements`);
            }
            
            // Check for deep nesting
            let maxDepth = 0;
            function checkDepth(el, depth = 0) {
                maxDepth = Math.max(maxDepth, depth);
                Array.from(el.children).forEach(child => checkDepth(child, depth + 1));
            }
            checkDepth(document.body);
            if (maxDepth > 20) {
                console.warn(`Deep DOM nesting: ${maxDepth} levels`);
            }
            
            // Check for complex selectors in use
            const styles = document.styleSheets;
            let complexSelectors = 0;
            try {
                Array.from(styles).forEach(sheet => {
                    if (sheet.cssRules) {
                        Array.from(sheet.cssRules).forEach(rule => {
                            if (rule.selectorText && rule.selectorText.includes('*')) {
                                complexSelectors++;
                            }
                        });
                    }
                });
                if (complexSelectors > 0) {
                    console.warn(`Universal selectors found: ${complexSelectors}`);
                }
            } catch (e) {
                // Cross-origin styles
            }
        },
        
        // Stop sampling
        stopSampling() {
            this.isRunning = false;
            console.log('CPU sampling stopped');
        }
    };
    
    // Auto-start sampling
    window.cpuDetector.startSampling();
    
    console.log('🔥 CPU Detector Commands:');
    console.log('- cpuDetector.generateReport() - Generate CPU usage report');
    console.log('- cpuDetector.findRepaintCausers() - Find elements causing repaints');
    console.log('- cpuDetector.detectHeavyOperations() - Detect heavy DOM operations');
    console.log('- cpuDetector.stopSampling() - Stop CPU sampling');
})();