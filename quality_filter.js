// Quality filter - hide 270p and 1080p options

// Function to hide unwanted quality options
function filterQualityOptions() {
    // Find all menu items that might be quality options
    const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], li[data-value]');
    
    let hiddenCount = 0;
    menuItems.forEach(item => {
        const text = item.textContent || '';
        // Check if this is a 270p or 1080p option
        if (text.includes('270p') || text.includes('270P') || 
            text.includes('1080p') || text.includes('1080P')) {
            // Hide the option
            item.style.display = 'none';
            item.style.visibility = 'hidden';
            item.setAttribute('aria-hidden', 'true');
            item.style.pointerEvents = 'none';
            hiddenCount++;
        }
    });
}

// Monitor for dropdown menus opening
const observer = new MutationObserver((mutations) => {
    // Check if any dropdown menu was added or modified
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            // Check if any of the added nodes might be a dropdown menu
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    // Check if it's a menu or contains menu items
                    if (node.getAttribute('role') === 'menu' || 
                        node.querySelector('[role="menuitem"]') ||
                        node.querySelector('[role="option"]')) {
                        // Filter quality options with a small delay to ensure rendering
                        setTimeout(filterQualityOptions, 10);
                    }
                }
            });
        }
    }
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Also monitor click events on download buttons
document.addEventListener('click', function(e) {
    const target = e.target;
    const button = target.closest('button');
    
    if (button) {
        // Check if it's a download button
        const icon = button.querySelector('i.google-symbols') || button.querySelector('i');
        if (icon && icon.textContent === 'download') {
            // Filter options after dropdown opens
            setTimeout(filterQualityOptions, 100);
            setTimeout(filterQualityOptions, 300);
            setTimeout(filterQualityOptions, 500);
        }
    }
}, true);

// Quality option filter ready - 270p and 1080p will be hidden