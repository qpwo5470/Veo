// Robust quality filter - hides 270p and 1080p options reliably
(function() {
    console.log('Quality filter loaded - will hide 270p and 1080p');
    
    function hideQualityOptions() {
        // Find all dropdown items
        const selectors = [
            '[role="menuitem"]',
            '[role="option"]',
            '[data-value]',
            '.menu-item',
            '.dropdown-item',
            'li[data-value]',
            '[class*="option"]',
            '[class*="item"]'
        ];
        
        let hiddenCount = 0;
        
        selectors.forEach(selector => {
            const items = document.querySelectorAll(selector);
            items.forEach(item => {
                const text = item.textContent || '';
                // Check for 270p or 1080p in the text
                if (text.match(/\b270p\b|\b1080p\b/i)) {
                    item.style.display = 'none';
                    item.style.visibility = 'hidden';
                    item.style.height = '0';
                    item.style.overflow = 'hidden';
                    item.style.opacity = '0';
                    item.style.pointerEvents = 'none';
                    hiddenCount++;
                    console.log(`Hidden quality option: ${text.trim()}`);
                }
            });
        });
        
        if (hiddenCount > 0) {
            console.log(`Quality filter: hidden ${hiddenCount} options`);
        }
        
        return hiddenCount;
    }
    
    // Monitor for download button clicks
    document.addEventListener('click', function(e) {
        const target = e.target;
        const button = target.closest('button');
        
        // Check if it's a download button
        if (button) {
            const icon = button.querySelector('i, .material-icons, .google-symbols');
            if (icon && icon.textContent === 'download') {
                console.log('Download button clicked - will filter quality options');
                
                // Apply filter multiple times to catch dynamic content
                setTimeout(hideQualityOptions, 50);
                setTimeout(hideQualityOptions, 150);
                setTimeout(hideQualityOptions, 300);
                setTimeout(hideQualityOptions, 500);
                setTimeout(hideQualityOptions, 1000);
            }
        }
        
        // Also check if clicking inside a dropdown
        if (target.closest('[role="menu"]') || target.closest('.dropdown')) {
            setTimeout(hideQualityOptions, 50);
        }
    }, true);
    
    // Also monitor for any dropdown opening
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // Check if a dropdown was added
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.matches && (
                            node.matches('[role="menu"]') ||
                            node.matches('.dropdown') ||
                            node.querySelector('[role="menuitem"]') ||
                            node.querySelector('[role="option"]')
                        )) {
                            console.log('Dropdown detected - filtering quality options');
                            hideQualityOptions();
                            setTimeout(hideQualityOptions, 100);
                        }
                    }
                });
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initial check
    hideQualityOptions();
    
    // Add CSS to ensure hidden items stay hidden
    const style = document.createElement('style');
    style.textContent = `
        [role="menuitem"]:has-text("270p"),
        [role="menuitem"]:has-text("1080p"),
        [role="option"]:has-text("270p"),
        [role="option"]:has-text("1080p"),
        *:has-text("270p"):is([role="menuitem"], [role="option"]),
        *:has-text("1080p"):is([role="menuitem"], [role="option"]) {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            opacity: 0 !important;
        }
    `;
    document.head.appendChild(style);
})();