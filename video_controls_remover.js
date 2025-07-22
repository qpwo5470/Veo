// Video Controls Remover - Continuously removes video control divs
(function() {
    console.log('🎬 Video Controls Remover starting...');
    
    // Function to remove video controls
    function removeVideoControls() {
        let removed = 0;
        
        // Method 1: Remove by class pattern matching
        // Look for divs with classes that match the video control pattern
        const classPatterns = [
            'fVWDse', 'bQJdRs', 'jhEDTx', 'gSKfXm',
            'sc-efbf4cd9', 'sc-c194362c', 'sc-95c4f607'
        ];
        
        classPatterns.forEach(pattern => {
            const elements = document.querySelectorAll(`[class*="${pattern}"]`);
            elements.forEach(el => {
                // Check if this is likely a video control
                if (el.querySelector('i.google-symbols') || 
                    el.querySelector('input[type="range"]') ||
                    el.querySelector('[aria-label*="오디오"]') ||
                    el.querySelector('[aria-label*="audio"]') ||
                    el.textContent.includes('play_arrow')) {
                    
                    // Find the top-level control container
                    let container = el;
                    while (container.parentElement && 
                           !container.parentElement.querySelector('video') &&
                           container.parentElement.childElementCount < 5) {
                        container = container.parentElement;
                    }
                    
                    container.style.display = 'none';
                    container.remove();
                    removed++;
                }
            });
        });
        
        // Method 2: Remove by structure detection
        // Find all divs containing play_arrow icon
        const playIcons = document.querySelectorAll('i.google-symbols');
        playIcons.forEach(icon => {
            if (icon.textContent.includes('play_arrow') || 
                icon.textContent.includes('pause') ||
                icon.textContent.includes('volume')) {
                
                // Go up to find the control container
                let parent = icon.parentElement;
                while (parent && parent.tagName !== 'BODY') {
                    // Check if this looks like a control bar
                    const hasRange = parent.querySelector('input[type="range"]');
                    const hasTime = parent.querySelector('p') && 
                                  parent.querySelector('p').textContent.match(/\d+:\d+/);
                    
                    if (hasRange || hasTime) {
                        parent.style.display = 'none';
                        parent.remove();
                        removed++;
                        break;
                    }
                    parent = parent.parentElement;
                }
            }
        });
        
        // Method 3: Remove by time display pattern
        const timeDivs = document.querySelectorAll('p');
        timeDivs.forEach(p => {
            // Check if it shows time format like "0:08"
            if (p.textContent.match(/^\d+:\d+$/)) {
                // Find parent control container
                let parent = p.parentElement;
                while (parent && parent.tagName !== 'BODY') {
                    if (parent.querySelector('input[type="range"]') ||
                        parent.querySelector('.google-symbols')) {
                        parent.style.display = 'none';
                        parent.remove();
                        removed++;
                        break;
                    }
                    parent = parent.parentElement;
                }
            }
        });
        
        // Method 4: Remove range inputs that are likely video controls
        const rangeInputs = document.querySelectorAll('input[type="range"]');
        rangeInputs.forEach(input => {
            const label = input.getAttribute('aria-label') || '';
            if (label.includes('오디오') || label.includes('audio') || 
                label.includes('시간') || label.includes('time') ||
                label.includes('video') || label.includes('비디오')) {
                
                // Find the control container
                let parent = input.parentElement;
                while (parent && parent.tagName !== 'BODY') {
                    // Stop at a reasonable container level
                    if (parent.childElementCount > 1 && parent.childElementCount < 10) {
                        parent.style.display = 'none';
                        parent.remove();
                        removed++;
                        break;
                    }
                    parent = parent.parentElement;
                }
            }
        });
        
        // Method 5: Hide by CSS (backup method)
        if (!document.getElementById('video-controls-hide-css')) {
            const style = document.createElement('style');
            style.id = 'video-controls-hide-css';
            style.textContent = `
                /* Hide video controls by class patterns */
                [class*="sc-efbf4cd9"]:has(.google-symbols),
                [class*="sc-c194362c"]:has(input[type="range"]),
                [class*="sc-95c4f607"]:has-text("play_arrow"),
                div:has(> i.google-symbols:has-text("play_arrow")),
                div:has(> input[type="range"][aria-label*="오디오"]),
                div:has(> input[type="range"][aria-label*="audio"]),
                div:has(> p:has-text(/^\\d+:\\d+$/)) {
                    display: none !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    overflow: hidden !important;
                }
                
                /* Hide specific control elements */
                .fVWDse, .bQJdRs, .jhEDTx, .gSKfXm,
                .bgdmBR, .hygSAS, .itJZsi, .jssWPd, .hTFGiW {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        if (removed > 0) {
            console.log(`🗑️ Removed ${removed} video control elements`);
        }
        
        return removed;
    }
    
    // Initial removal
    removeVideoControls();
    
    // Continuous monitoring
    setInterval(removeVideoControls, 500);
    
    // Monitor for new elements
    const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    // Check if it might be a video control
                    const className = node.className || '';
                    if (className.includes('sc-') || 
                        node.querySelector?.('.google-symbols') ||
                        node.querySelector?.('input[type="range"]')) {
                        shouldCheck = true;
                    }
                }
            });
        });
        
        if (shouldCheck) {
            removeVideoControls();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Also intercept any play/pause events
    document.addEventListener('click', function(e) {
        const target = e.target;
        if (target.classList.contains('google-symbols') && 
            (target.textContent.includes('play_arrow') || 
             target.textContent.includes('pause'))) {
            console.log('🚫 Blocked play/pause click');
            e.preventDefault();
            e.stopPropagation();
            
            // Remove the control
            let parent = target.parentElement;
            while (parent && parent.tagName !== 'BODY') {
                if (parent.querySelector('input[type="range"]')) {
                    parent.remove();
                    break;
                }
                parent = parent.parentElement;
            }
        }
    }, true);
    
    console.log('✅ Video Controls Remover active - will continuously remove video controls');
    
    // Manual trigger for debugging
    window.removeVideoControlsNow = removeVideoControls;
})();