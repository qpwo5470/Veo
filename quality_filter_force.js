// Force quality filter - aggressive hiding of 270p and 1080p
(function() {
    let filterActive = false;
    let checkInterval = null;
    
    function forceHideQualityOptions() {
        // All possible selectors for dropdown items
        const items = document.querySelectorAll(`
            [role="menuitem"],
            [role="option"],
            [data-value],
            .menu-item,
            .dropdown-item,
            li[data-value],
            [class*="option"],
            [class*="item"],
            [class*="menu"] li,
            [class*="dropdown"] li,
            div[role="option"],
            button[role="menuitem"]
        `);
        
        let hiddenCount = 0;
        
        items.forEach(item => {
            const text = (item.textContent || '').trim();
            // More aggressive matching
            if (text === '270p' || text === '1080p' || 
                text.includes('270p') || text.includes('1080p')) {
                
                // Force hide with multiple methods
                item.style.cssText = 'display: none !important; visibility: hidden !important; height: 0 !important; opacity: 0 !important; position: absolute !important; left: -9999px !important;';
                item.setAttribute('hidden', 'true');
                item.setAttribute('aria-hidden', 'true');
                
                // Also hide parent if it only contains this option
                const parent = item.parentElement;
                if (parent && parent.children.length === 1) {
                    parent.style.display = 'none';
                }
                
                hiddenCount++;
            }
        });
        
        if (hiddenCount > 0) {
            console.log(`✓ Hidden ${hiddenCount} quality options (270p/1080p)`);
        }
        
        return hiddenCount;
    }
    
    // Start filtering when download button is clicked
    function startFiltering() {
        if (filterActive) return;
        
        filterActive = true;
        console.log('Quality filtering activated');
        
        // Initial hide
        forceHideQualityOptions();
        
        // Keep checking for 3 seconds
        let checks = 0;
        checkInterval = setInterval(() => {
            forceHideQualityOptions();
            checks++;
            
            if (checks > 30) { // 3 seconds
                clearInterval(checkInterval);
                filterActive = false;
                console.log('Quality filtering deactivated');
            }
        }, 100);
    }
    
    // Monitor all clicks
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Check for download button click
        const button = target.closest('button');
        if (button) {
            const hasDownloadIcon = button.querySelector('i')?.textContent === 'download' ||
                                  button.querySelector('.material-icons')?.textContent === 'download' ||
                                  button.querySelector('.google-symbols')?.textContent === 'download';
            
            if (hasDownloadIcon) {
                console.log('Download button detected - starting quality filter');
                startFiltering();
            }
        }
        
        // Also filter if clicking in a menu
        if (target.closest('[role="menu"]') || 
            target.closest('.dropdown') ||
            target.closest('[class*="menu"]')) {
            forceHideQualityOptions();
        }
    }, true);
    
    // Monitor for dropdowns appearing
    const observer = new MutationObserver(() => {
        if (filterActive) {
            forceHideQualityOptions();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });
    
    console.log('Force quality filter ready - 270p and 1080p will be hidden');
    
    // Test function
    window.testQualityFilter = function() {
        console.log('Testing quality filter...');
        startFiltering();
    };
})();