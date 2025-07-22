// Ultimate fix - Direct DOM manipulation and event interception
(function() {
    console.log('🔧 Ultimate fix activated');
    
    // 1. QUALITY FILTER - Direct style injection
    const injectQualityHider = () => {
        // Remove any existing style
        const existingStyle = document.getElementById('quality-filter-ultimate');
        if (existingStyle) existingStyle.remove();
        
        // Create new style that hides elements containing 270p or 1080p
        const style = document.createElement('style');
        style.id = 'quality-filter-ultimate';
        style.textContent = `
            /* Hide any element containing 270p or 1080p text */
            *:not(script):not(style) {
                visibility: visible !important;
            }
            
            /* Use JavaScript to hide specific elements */
        `;
        document.head.appendChild(style);
        
        // Function to hide quality options
        const hideQualities = () => {
            const allElements = document.getElementsByTagName('*');
            for (let el of allElements) {
                if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                    const text = el.textContent.trim();
                    if (text === '270p' || text === '1080p') {
                        el.style.cssText = 'display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; position: absolute !important; left: -9999px !important;';
                        const parent = el.parentElement;
                        if (parent && (parent.getAttribute('role') === 'option' || parent.getAttribute('role') === 'menuitem')) {
                            parent.style.cssText = 'display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; position: absolute !important; left: -9999px !important;';
                        }
                        console.log(`✅ Hidden quality: ${text}`);
                    }
                }
            }
        };
        
        // Run continuously
        hideQualities();
        setInterval(hideQualities, 200);
    };
    
    // 2. SPINNER FIX - Create our own spinner system
    let spinnerVisible = false;
    
    const createSpinner = () => {
        // Remove existing spinner
        const existing = document.getElementById('ultimate-spinner');
        if (existing) existing.remove();
        
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.id = 'ultimate-spinner';
        spinnerOverlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.7) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 2147483647 !important;
            pointer-events: all !important;
        `;
        
        const spinnerContent = document.createElement('div');
        spinnerContent.style.cssText = `
            background: white !important;
            border-radius: 12px !important;
            padding: 40px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 20px !important;
        `;
        
        // Spinner animation
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 50px !important;
            height: 50px !important;
            border: 4px solid #e0e0e0 !important;
            border-top: 4px solid #4285f4 !important;
            border-radius: 50% !important;
            animation: ultimate-spin 1s linear infinite !important;
        `;
        
        const text = document.createElement('div');
        text.textContent = '링크를 생성하고 있습니다...';
        text.style.cssText = `
            font-family: Arial, sans-serif !important;
            font-size: 16px !important;
            color: #333 !important;
        `;
        
        spinnerContent.appendChild(spinner);
        spinnerContent.appendChild(text);
        spinnerOverlay.appendChild(spinnerContent);
        
        // Add animation
        const animStyle = document.createElement('style');
        animStyle.textContent = `
            @keyframes ultimate-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(animStyle);
        
        document.body.appendChild(spinnerOverlay);
        spinnerVisible = true;
        console.log('✅ Spinner displayed');
        
        // Auto-hide after 30 seconds as fallback
        setTimeout(() => {
            if (spinnerVisible) {
                spinnerOverlay.remove();
                spinnerVisible = false;
            }
        }, 30000);
    };
    
    // 3. CLICK INTERCEPTION - Capture all clicks
    let waitingForQuality = false;
    let downloadButtonClicked = false;
    
    // Override addEventListener to intercept all event listeners
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'click') {
            const wrappedListener = function(event) {
                const target = event.target;
                const text = target.textContent || '';
                
                // Check for download button
                if (target.closest('button')) {
                    const btn = target.closest('button');
                    const hasDownloadIcon = Array.from(btn.querySelectorAll('*')).some(el => 
                        el.textContent.trim() === 'download'
                    );
                    
                    if (hasDownloadIcon) {
                        console.log('🎯 Download button clicked');
                        downloadButtonClicked = true;
                        waitingForQuality = true;
                        
                        // Reset after 5 seconds
                        setTimeout(() => {
                            waitingForQuality = false;
                        }, 5000);
                    }
                }
                
                // Check for quality selection
                if (waitingForQuality && (
                    text.includes('720p') || 
                    text.includes('480p') || 
                    text.includes('360p') || 
                    text.includes('240p') ||
                    text.includes('mp4') ||
                    text.includes('mov')
                )) {
                    console.log(`🎯 Quality selected: ${text}`);
                    createSpinner();
                    waitingForQuality = false;
                    
                    // Start monitoring
                    if (window.startUploadMonitoring) {
                        window.startUploadMonitoring();
                    }
                }
                
                // Call original listener
                return listener.apply(this, arguments);
            };
            
            return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        
        return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Also add direct click listener
    document.addEventListener('click', function(e) {
        const target = e.target;
        const text = (target.textContent || '').trim();
        
        // Download button detection
        const button = target.closest('button');
        if (button) {
            const icons = button.querySelectorAll('i, [class*="icon"]');
            for (let icon of icons) {
                if (icon.textContent.trim() === 'download') {
                    console.log('📥 Download button detected via direct listener');
                    waitingForQuality = true;
                    setTimeout(() => waitingForQuality = false, 5000);
                    break;
                }
            }
        }
        
        // Quality selection detection
        if (waitingForQuality) {
            if (text.match(/\b(240p|360p|480p|720p|mp4|mov)\b/)) {
                console.log(`📥 Quality detected via direct listener: ${text}`);
                createSpinner();
                waitingForQuality = false;
                
                if (window.startUploadMonitoring) {
                    window.startUploadMonitoring();
                }
            }
        }
    }, true);
    
    // 4. Override showUploadQRDialog to hide spinner
    const originalShowQR = window.showUploadQRDialog;
    window.showUploadQRDialog = function(...args) {
        console.log('📱 QR dialog triggered - hiding spinner');
        const spinner = document.getElementById('ultimate-spinner');
        if (spinner) {
            spinner.remove();
            spinnerVisible = false;
        }
        if (originalShowQR) {
            return originalShowQR.apply(this, args);
        }
    };
    
    // 5. Start quality filter
    injectQualityHider();
    
    // 6. Manual triggers
    window.ultimateTest = {
        showSpinner: createSpinner,
        hideQualities: () => {
            const elements = document.querySelectorAll('*');
            let count = 0;
            elements.forEach(el => {
                const text = el.textContent?.trim();
                if (text === '270p' || text === '1080p') {
                    el.remove();
                    count++;
                }
            });
            console.log(`Removed ${count} quality options`);
        },
        debug: () => {
            console.log('Waiting for quality:', waitingForQuality);
            console.log('Spinner visible:', spinnerVisible);
            console.log('Download clicked:', downloadButtonClicked);
        }
    };
    
    console.log('🔧 Ultimate fix ready!');
    console.log('Commands: ultimateTest.showSpinner(), ultimateTest.hideQualities(), ultimateTest.debug()');
})();