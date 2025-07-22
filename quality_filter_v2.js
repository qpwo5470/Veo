// Quality filter v2 - hide 270p and 1080p options with better detection

console.log('[QUALITY FILTER] Initializing quality filter v2...');

// Function to hide unwanted quality options
function filterQualityOptions() {
    console.log('[QUALITY FILTER] Filtering quality options...');
    
    // Multiple selectors to catch different menu implementations
    const selectors = [
        '[role="menuitem"]',
        '[role="option"]',
        'li[data-value]',
        '.MuiMenuItem-root',  // Material UI
        'div[class*="menu-item"]',
        'div[class*="option"]',
        'button[class*="menu"]',
        'div[role="listbox"] > div',
        '[class*="quality"]',
        '[class*="download"]'
    ];
    
    const menuItems = document.querySelectorAll(selectors.join(', '));
    console.log(`[QUALITY FILTER] Found ${menuItems.length} potential menu items`);
    
    let hiddenCount = 0;
    menuItems.forEach(item => {
        const text = (item.textContent || '').toLowerCase();
        const value = item.getAttribute('data-value') || '';
        
        // More comprehensive check
        if (text.includes('270p') || text.includes('270 p') || 
            text.includes('1080p') || text.includes('1080 p') ||
            value.includes('270') || value.includes('1080')) {
            
            console.log(`[QUALITY FILTER] Hiding option: "${item.textContent}"`);
            
            // Multiple methods to ensure hiding
            item.style.cssText = 'display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important;';
            item.setAttribute('aria-hidden', 'true');
            item.setAttribute('disabled', 'true');
            item.style.pointerEvents = 'none';
            
            // Also try to remove the element if possible
            try {
                item.remove();
            } catch (e) {
                // If removal fails, hiding should still work
            }
            
            hiddenCount++;
        }
    });
    
    if (hiddenCount > 0) {
        console.log(`[QUALITY FILTER] Hidden ${hiddenCount} quality options`);
    }
}

// Enhanced mutation observer
const observer = new MutationObserver((mutations) => {
    let shouldFilter = false;
    
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    // Check if it's any kind of menu or dropdown
                    const nodeHTML = node.outerHTML || '';
                    if (nodeHTML.includes('menu') || nodeHTML.includes('dropdown') || 
                        nodeHTML.includes('option') || nodeHTML.includes('quality') ||
                        nodeHTML.includes('download') || nodeHTML.includes('270') ||
                        nodeHTML.includes('1080')) {
                        shouldFilter = true;
                    }
                }
            });
        }
        
        // Also check attribute changes that might indicate dropdown state
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'aria-expanded' || 
             mutation.attributeName === 'open' ||
             mutation.attributeName === 'data-state')) {
            shouldFilter = true;
        }
    }
    
    if (shouldFilter) {
        // Multiple delayed attempts to catch async rendering
        filterQualityOptions();
        setTimeout(filterQualityOptions, 50);
        setTimeout(filterQualityOptions, 150);
        setTimeout(filterQualityOptions, 300);
    }
});

// Observe everything
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-expanded', 'open', 'data-state']
});

// Also monitor all clicks
document.addEventListener('click', function(e) {
    // Filter after any click that might open a menu
    setTimeout(filterQualityOptions, 100);
    setTimeout(filterQualityOptions, 300);
    setTimeout(filterQualityOptions, 500);
}, true);

// Run initial filter
filterQualityOptions();

console.log('[QUALITY FILTER] Quality filter v2 ready');