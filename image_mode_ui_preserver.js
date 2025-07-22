// Image Mode UI Preserver
// Ensures input box buttons are preserved in image-to-video mode

(function() {
    console.log('🖼️ Image Mode UI Preserver starting...');
    
    // Function to check if we're in image/asset mode
    function isImageMode() {
        return sessionStorage.getItem('veo_flow_mode') === 'asset' ||
               window.location.hash.includes('veo_mode=asset');
    }
    
    // Function to preserve input box buttons
    function preserveInputButtons() {
        if (!isImageMode()) {
            console.log('Not in image mode, skipping preservation');
            return;
        }
        
        console.log('Image mode detected - preserving input box buttons');
        
        // Create style to ensure buttons are visible
        const styleId = 'veo-image-mode-preserver';
        let style = document.getElementById(styleId);
        
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
        
        style.textContent = `
            /* Preserve input box and its buttons in image mode */
            .gxAzIM {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            /* Ensure input area is visible */
            .input-container,
            [class*="input"],
            [class*="Input"] {
                display: flex !important;
                visibility: visible !important;
            }
            
            /* Preserve file upload and other buttons */
            button[class*="upload"],
            button[class*="Upload"],
            button[aria-label*="upload"],
            button[aria-label*="Upload"],
            .gxAzIM button {
                display: inline-flex !important;
                visibility: visible !important;
                pointer-events: auto !important;
            }
            
            /* Ensure the toolbar containing buttons is visible */
            .toolbar,
            [class*="toolbar"],
            [class*="Toolbar"] {
                display: flex !important;
                visibility: visible !important;
            }
        `;
        
        console.log('✅ Input box buttons preserved for image mode');
    }
    
    // Monitor for mode changes
    function startMonitoring() {
        // Initial check
        preserveInputButtons();
        
        // Check periodically
        setInterval(preserveInputButtons, 2000);
        
        // Also monitor for URL changes
        let lastHash = window.location.hash;
        setInterval(() => {
            if (window.location.hash !== lastHash) {
                lastHash = window.location.hash;
                console.log('URL hash changed, checking mode...');
                setTimeout(preserveInputButtons, 100);
            }
        }, 500);
        
        // Monitor DOM for toolbar removal
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'style' &&
                    mutation.target.classList?.contains('gxAzIM')) {
                    
                    if (isImageMode()) {
                        console.log('Toolbar style changed in image mode - preserving!');
                        preserveInputButtons();
                    }
                }
            }
        });
        
        // Start observing when DOM is ready
        setTimeout(() => {
            const toolbar = document.querySelector('.gxAzIM');
            if (toolbar) {
                observer.observe(toolbar, {
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
            }
            
            // Also observe parent containers
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style']
            });
        }, 1000);
    }
    
    // Start monitoring
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMonitoring);
    } else {
        startMonitoring();
    }
    
    // Debug functions
    window.imageModePreserver = {
        check: () => {
            console.log('Is image mode:', isImageMode());
            console.log('Toolbar:', document.querySelector('.gxAzIM'));
            preserveInputButtons();
        },
        forcePreserve: () => {
            sessionStorage.setItem('veo_flow_mode', 'asset');
            preserveInputButtons();
        }
    };
    
    console.log('✅ Image Mode UI Preserver ready');
})();