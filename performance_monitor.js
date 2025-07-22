// Performance Monitor - Identifies CPU bottlenecks
(function() {
    window.performanceMonitor = {
        observers: [],
        intervals: [],
        timeouts: [],
        eventListeners: [],
        animationFrames: [],
        isMonitoring: false,
        
        // Start monitoring
        start() {
            if (this.isMonitoring) {
                console.log('Performance monitoring already active');
                return;
            }
            
            this.isMonitoring = true;
            console.log('🔍 Starting performance monitoring...');
            
            // Monitor DOM mutations
            this.monitorMutations();
            
            // Monitor timers
            this.monitorTimers();
            
            // Monitor event listeners
            this.monitorEvents();
            
            // Monitor animations
            this.monitorAnimations();
            
            // Monitor long tasks
            this.monitorLongTasks();
            
            // Monitor memory
            this.monitorMemory();
            
            // Start periodic reports
            this.startReporting();
        },
        
        // Monitor DOM mutations
        monitorMutations() {
            const originalMutationObserver = window.MutationObserver;
            const self = this;
            
            window.MutationObserver = function(...args) {
                const observer = new originalMutationObserver(...args);
                self.observers.push({
                    observer: observer,
                    callback: args[0],
                    stack: new Error().stack
                });
                return observer;
            };
        },
        
        // Monitor timers
        monitorTimers() {
            const self = this;
            
            // Monitor setInterval
            const originalSetInterval = window.setInterval;
            window.setInterval = function(fn, delay, ...args) {
                const id = originalSetInterval(fn, delay, ...args);
                self.intervals.push({
                    id: id,
                    delay: delay,
                    fn: fn.toString().substring(0, 100),
                    stack: new Error().stack
                });
                return id;
            };
            
            // Monitor setTimeout
            const originalSetTimeout = window.setTimeout;
            window.setTimeout = function(fn, delay, ...args) {
                const id = originalSetTimeout(fn, delay, ...args);
                self.timeouts.push({
                    id: id,
                    delay: delay,
                    fn: fn.toString().substring(0, 100),
                    stack: new Error().stack
                });
                return id;
            };
        },
        
        // Monitor event listeners
        monitorEvents() {
            const self = this;
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                self.eventListeners.push({
                    target: this.tagName || this.constructor.name,
                    type: type,
                    capture: options?.capture || false,
                    passive: options?.passive || false,
                    stack: new Error().stack
                });
                return originalAddEventListener.call(this, type, listener, options);
            };
        },
        
        // Monitor animation frames
        monitorAnimations() {
            const self = this;
            const originalRAF = window.requestAnimationFrame;
            
            window.requestAnimationFrame = function(callback) {
                self.animationFrames.push({
                    callback: callback.toString().substring(0, 100),
                    timestamp: performance.now()
                });
                return originalRAF(callback);
            };
        },
        
        // Monitor long tasks using Performance Observer
        monitorLongTasks() {
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.duration > 50) {
                                console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
                            }
                        }
                    });
                    observer.observe({ entryTypes: ['longtask'] });
                } catch (e) {
                    console.log('Long task monitoring not supported');
                }
            }
        },
        
        // Monitor memory usage
        monitorMemory() {
            if (performance.memory) {
                this.initialMemory = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize
                };
            }
        },
        
        // Generate report
        generateReport() {
            console.group('📊 Performance Report');
            
            // Mutation Observers
            console.group('🔄 Mutation Observers (' + this.observers.length + ')');
            this.observers.forEach((obs, i) => {
                console.log(`Observer ${i}:`, obs.callback.toString().substring(0, 100));
            });
            console.groupEnd();
            
            // Active Intervals
            const activeIntervals = this.intervals.filter(i => i.delay < 5000);
            if (activeIntervals.length > 0) {
                console.group('⏰ Active Intervals (< 5s): ' + activeIntervals.length);
                activeIntervals.forEach(interval => {
                    console.log(`Interval (${interval.delay}ms):`, interval.fn);
                });
                console.groupEnd();
            }
            
            // Event Listeners
            const nonPassiveListeners = this.eventListeners.filter(e => !e.passive);
            if (nonPassiveListeners.length > 0) {
                console.group('👂 Non-passive Event Listeners: ' + nonPassiveListeners.length);
                const grouped = {};
                nonPassiveListeners.forEach(listener => {
                    const key = `${listener.type} on ${listener.target}`;
                    grouped[key] = (grouped[key] || 0) + 1;
                });
                console.table(grouped);
                console.groupEnd();
            }
            
            // Animation Frames
            if (this.animationFrames.length > 0) {
                console.log('🎬 Animation Frames:', this.animationFrames.length);
            }
            
            // Memory Usage
            if (performance.memory) {
                const current = performance.memory.usedJSHeapSize;
                const initial = this.initialMemory.usedJSHeapSize;
                const diff = current - initial;
                console.log('💾 Memory:', {
                    current: (current / 1048576).toFixed(2) + ' MB',
                    initial: (initial / 1048576).toFixed(2) + ' MB',
                    difference: (diff / 1048576).toFixed(2) + ' MB'
                });
            }
            
            console.groupEnd();
        },
        
        // Start periodic reporting
        startReporting() {
            // Report every 10 seconds
            setInterval(() => {
                if (this.isMonitoring) {
                    this.generateReport();
                }
            }, 10000);
        },
        
        // Find heavy scripts
        findHeavyScripts() {
            console.group('🔥 Heavy Script Analysis');
            
            // Check for scripts with frequent timers
            const frequentTimers = this.intervals.filter(i => i.delay < 1000);
            if (frequentTimers.length > 0) {
                console.warn('Scripts with frequent timers (<1s):', frequentTimers);
            }
            
            // Check for multiple observers on same element
            const observerTargets = {};
            document.querySelectorAll('*').forEach(el => {
                const observers = this.observers.filter(o => {
                    // This is a simplified check
                    return true;
                });
                if (observers.length > 1) {
                    observerTargets[el.tagName] = observers.length;
                }
            });
            if (Object.keys(observerTargets).length > 0) {
                console.warn('Elements with multiple observers:', observerTargets);
            }
            
            console.groupEnd();
        },
        
        // Stop monitoring
        stop() {
            this.isMonitoring = false;
            console.log('🛑 Performance monitoring stopped');
        }
    };
    
    // Auto-start monitoring
    window.performanceMonitor.start();
    
    // Expose commands
    console.log('📊 Performance Monitor Commands:');
    console.log('- performanceMonitor.generateReport() - Generate current report');
    console.log('- performanceMonitor.findHeavyScripts() - Find CPU-heavy scripts');
    console.log('- performanceMonitor.stop() - Stop monitoring');
})();