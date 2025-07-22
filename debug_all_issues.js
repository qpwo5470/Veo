// Comprehensive debug for spinner and quality filter issues
(function() {
    console.log('=== STARTING COMPREHENSIVE DEBUG ===');
    
    // 1. Check if required functions exist
    console.group('1. Function Availability Check');
    console.log('showUploadLoadingSpinner:', typeof window.showUploadLoadingSpinner);
    console.log('startUploadMonitoring:', typeof window.startUploadMonitoring);
    console.log('showUploadQRDialog:', typeof window.showUploadQRDialog);
    console.log('uploadQRDialogInitialized:', window.uploadQRDialogInitialized);
    console.log('downloadMonitorInit:', window.downloadMonitorInit);
    console.groupEnd();
    
    // 2. Find download buttons
    console.group('2. Download Button Search');
    const allButtons = document.querySelectorAll('button');
    let downloadButtons = [];
    
    allButtons.forEach((btn, index) => {
        // Check all possible icon types
        const icons = btn.querySelectorAll('i, .material-icons, .google-symbols, [class*="icon"]');
        icons.forEach(icon => {
            if (icon.textContent.trim() === 'download' || 
                icon.classList.toString().includes('download')) {
                downloadButtons.push(btn);
                console.log(`Found download button ${index}:`, {
                    button: btn,
                    icon: icon,
                    iconText: icon.textContent,
                    iconClasses: icon.className
                });
            }
        });
    });
    
    console.log(`Total download buttons found: ${downloadButtons.length}`);
    console.groupEnd();
    
    // 3. Monitor clicks globally
    let clickCount = 0;
    document.addEventListener('click', function(e) {
        clickCount++;
        console.group(`Click #${clickCount}`);
        console.log('Clicked element:', e.target);
        console.log('Tag:', e.target.tagName);
        console.log('Classes:', e.target.className);
        console.log('Text:', e.target.textContent?.substring(0, 50));
        
        // Check if it's a button
        const button = e.target.closest('button');
        if (button) {
            console.log('Button found:', button);
            const icon = button.querySelector('i, .material-icons, .google-symbols');
            if (icon) {
                console.log('Icon in button:', icon.textContent);
            }
        }
        
        // Check if it's a menu item
        const menuItem = e.target.closest('[role="menuitem"], [role="option"], li');
        if (menuItem) {
            console.log('Menu item clicked:', menuItem.textContent);
            console.log('Role:', menuItem.getAttribute('role'));
            console.log('Full element:', menuItem);
        }
        
        console.groupEnd();
    }, true);
    
    // 4. Find and analyze dropdowns
    console.group('4. Dropdown Analysis');
    
    // Look for any dropdown that might contain quality options
    setTimeout(() => {
        const dropdowns = document.querySelectorAll('[role="menu"], [role="listbox"], .dropdown, [class*="menu"], [class*="dropdown"]');
        console.log(`Found ${dropdowns.length} potential dropdowns`);
        
        dropdowns.forEach((dropdown, index) => {
            console.log(`Dropdown ${index}:`, {
                element: dropdown,
                role: dropdown.getAttribute('role'),
                classes: dropdown.className,
                visible: getComputedStyle(dropdown).display !== 'none'
            });
            
            // Find items in dropdown
            const items = dropdown.querySelectorAll('*');
            items.forEach(item => {
                const text = item.textContent?.trim();
                if (text && text.match(/\d+p|download|mp4|mov/i)) {
                    console.log('Quality/format item found:', {
                        text: text,
                        element: item,
                        tag: item.tagName,
                        role: item.getAttribute('role')
                    });
                }
            });
        });
    }, 100);
    
    console.groupEnd();
    
    // 5. Test quality filter
    console.group('5. Quality Filter Test');
    
    function findAndHideQualities() {
        const allElements = document.querySelectorAll('*');
        let found270p = false;
        let found1080p = false;
        
        allElements.forEach(el => {
            const text = el.textContent?.trim();
            if (text === '270p' || (text && text.includes('270p') && text.length < 20)) {
                console.log('Found 270p:', el);
                found270p = true;
                el.style.border = '3px solid red';
                el.style.display = 'none';
            }
            if (text === '1080p' || (text && text.includes('1080p') && text.length < 20)) {
                console.log('Found 1080p:', el);
                found1080p = true;
                el.style.border = '3px solid red';
                el.style.display = 'none';
            }
        });
        
        console.log('270p found:', found270p);
        console.log('1080p found:', found1080p);
    }
    
    // Run immediately and after delay
    findAndHideQualities();
    setTimeout(findAndHideQualities, 1000);
    
    console.groupEnd();
    
    // 6. Manual test functions
    window.manualTestSpinner = function() {
        console.log('=== Manual Spinner Test ===');
        if (window.showUploadLoadingSpinner) {
            console.log('Calling showUploadLoadingSpinner...');
            window.showUploadLoadingSpinner();
            console.log('Spinner should be visible now');
        } else {
            console.error('showUploadLoadingSpinner not found!');
        }
    };
    
    window.manualHideQualities = function() {
        console.log('=== Manual Quality Hide ===');
        const items = document.querySelectorAll('[role="menuitem"], [role="option"], li, div, button, span');
        let count = 0;
        items.forEach(item => {
            const text = (item.textContent || '').trim();
            if (text === '270p' || text === '1080p' || 
                text.includes('270p') || text.includes('1080p')) {
                item.style.display = 'none';
                item.style.visibility = 'hidden';
                item.remove(); // Nuclear option
                count++;
                console.log(`Removed: ${text}`);
            }
        });
        console.log(`Total removed: ${count}`);
    };
    
    console.log('=== Debug Functions Available ===');
    console.log('window.manualTestSpinner() - Test spinner manually');
    console.log('window.manualHideQualities() - Force hide 270p/1080p');
    console.log('================================');
})();