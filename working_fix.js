// Working fix - Non-invasive approach that doesn't break functionality
(function() {
    console.log('✅ Working fix activated');
    
    // 1. QUALITY FILTER - Hide 270p and 1080p
    function hideQualityOptions() {
        // Find all elements that might be quality options
        const elements = document.querySelectorAll('*');
        let hiddenCount = 0;
        
        elements.forEach(el => {
            // Only check text nodes to avoid breaking functionality
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                const text = el.textContent.trim();
                if (text === '270p' || text === '1080p') {
                    // Hide the element
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                    
                    // Also hide parent if it's a menu item
                    const parent = el.parentElement;
                    if (parent && (parent.getAttribute('role') === 'menuitem' || 
                                  parent.getAttribute('role') === 'option')) {
                        parent.style.display = 'none';
                        parent.style.visibility = 'hidden';
                    }
                    
                    hiddenCount++;
                }
            }
        });
        
        if (hiddenCount > 0) {
            console.log(`✅ Hidden ${hiddenCount} quality options`);
        }
    }
    
    // Run quality filter periodically
    setInterval(hideQualityOptions, 300);
    
    // 2. SPINNER DISPLAY - Non-invasive monitoring
    let downloadButtonClicked = false;
    let lastDownloadButton = null;
    
    // Monitor clicks without interfering
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Check if download button was clicked
        const button = target.closest('button');
        if (button) {
            const hasDownloadIcon = Array.from(button.querySelectorAll('*')).some(el => 
                el.textContent.trim() === 'download'
            );
            
            if (hasDownloadIcon) {
                console.log('📥 Download button clicked');
                downloadButtonClicked = true;
                lastDownloadButton = button;
                
                // Reset after 10 seconds
                setTimeout(() => {
                    downloadButtonClicked = false;
                    lastDownloadButton = null;
                }, 10000);
            }
        }
        
        // Check if quality option was clicked
        if (downloadButtonClicked) {
            const text = target.textContent || '';
            const menuItem = target.closest('[role="menuitem"], [role="option"], li');
            
            if (menuItem || text.match(/\b(240p|360p|480p|720p|mp4|mov)\b/)) {
                console.log(`📥 Quality selected: ${text}`);
                
                // Show spinner using existing function
                if (window.showUploadLoadingSpinner) {
                    console.log('🔄 Showing spinner...');
                    try {
                        window.showUploadLoadingSpinner(lastDownloadButton);
                    } catch (err) {
                        console.error('Error showing spinner:', err);
                        // Fallback: create simple spinner
                        showFallbackSpinner();
                    }
                } else {
                    console.log('🔄 Using fallback spinner...');
                    showFallbackSpinner();
                }
                
                // Start monitoring
                if (window.startUploadMonitoring) {
                    window.startUploadMonitoring();
                }
                
                // Reset state
                downloadButtonClicked = false;
            }
        }
    }, false); // Use bubble phase, not capture
    
    // 3. FALLBACK SPINNER
    function showFallbackSpinner() {
        // Remove any existing spinner
        const existing = document.getElementById('fallback-spinner');
        if (existing) existing.remove();
        
        const spinner = document.createElement('div');
        spinner.id = 'fallback-spinner';
        spinner.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 999999;
            text-align: center;
        `;
        
        spinner.innerHTML = `
            <div style="
                width: 50px;
                height: 50px;
                border: 3px solid #e0e0e0;
                border-top: 3px solid #4285f4;
                border-radius: 50%;
                margin: 0 auto 20px;
                animation: spin 1s linear infinite;
            "></div>
            <div style="
                font-family: Arial, sans-serif;
                font-size: 16px;
                color: #333;
            ">링크를 생성하고 있습니다...</div>
        `;
        
        // Add animation
        if (!document.getElementById('spinner-animation')) {
            const style = document.createElement('style');
            style.id = 'spinner-animation';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(spinner);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            const spinner = document.getElementById('fallback-spinner');
            if (spinner) spinner.remove();
        }, 30000);
    }
    
    // 4. Hide spinner when QR shows
    const originalShowQR = window.showUploadQRDialog;
    if (originalShowQR) {
        window.showUploadQRDialog = function(...args) {
            // Remove fallback spinner
            const spinner = document.getElementById('fallback-spinner');
            if (spinner) spinner.remove();
            
            // Call original
            return originalShowQR.apply(this, args);
        };
    }
    
    // 5. Debug functions
    window.workingFix = {
        testSpinner: () => {
            console.log('Testing spinner...');
            if (window.showUploadLoadingSpinner) {
                window.showUploadLoadingSpinner();
            } else {
                showFallbackSpinner();
            }
        },
        hideQualities: () => {
            hideQualityOptions();
        },
        status: () => {
            console.log('Download clicked:', downloadButtonClicked);
            console.log('Last button:', lastDownloadButton);
            console.log('Spinner function:', typeof window.showUploadLoadingSpinner);
        }
    };
    
    console.log('✅ Working fix ready - Download buttons should work normally');
    console.log('Commands: workingFix.testSpinner(), workingFix.hideQualities(), workingFix.status()');
})();