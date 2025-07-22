// Debug quality filter - helps identify why 270p/1080p aren't hidden
window.debugQualityFilter = function() {
    console.log('=== Quality Filter Debug ===');
    
    // Find all possible dropdown items
    const selectors = [
        '[role="menuitem"]',
        '[role="option"]',
        '[data-value]',
        '.menu-item',
        '.dropdown-item',
        'li',
        'button',
        'div'
    ];
    
    console.log('Searching for quality options...');
    
    selectors.forEach(selector => {
        const items = document.querySelectorAll(selector);
        items.forEach(item => {
            const text = (item.textContent || '').trim();
            if (text.includes('p') && text.match(/\d+p/)) {
                console.log(`Found quality option:`, {
                    selector: selector,
                    text: text,
                    element: item,
                    role: item.getAttribute('role'),
                    classes: item.className,
                    display: getComputedStyle(item).display,
                    visibility: getComputedStyle(item).visibility,
                    parent: item.parentElement
                });
                
                // Highlight the element
                item.style.border = '2px solid red';
                
                // Try to hide if it's 270p or 1080p
                if (text.includes('270p') || text.includes('1080p')) {
                    console.log(`Attempting to hide: ${text}`);
                    item.style.display = 'none';
                    console.log('Hidden successfully?', getComputedStyle(item).display === 'none');
                }
            }
        });
    });
    
    // Check for download buttons
    const downloadButtons = document.querySelectorAll('button');
    let foundDownload = false;
    downloadButtons.forEach(btn => {
        const icon = btn.querySelector('i, .material-icons, .google-symbols');
        if (icon && icon.textContent === 'download') {
            console.log('Found download button:', btn);
            foundDownload = true;
        }
    });
    
    if (!foundDownload) {
        console.log('No download buttons found on page');
    }
    
    console.log('=== End Debug ===');
};

// Auto-run when dropdown appears
const debugObserver = new MutationObserver(() => {
    const hasDropdown = document.querySelector('[role="menu"], [role="listbox"], .dropdown');
    if (hasDropdown) {
        console.log('Dropdown detected - running debug');
        window.debugQualityFilter();
        debugObserver.disconnect();
    }
});

debugObserver.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('Quality filter debugger loaded - will auto-run when dropdown appears');
console.log('Or run manually: window.debugQualityFilter()');