// Veo 2 Quality Auto-Switcher
// Monitors for "Switch to Veo 2 - Quality" button and clicks it automatically

(function() {
    console.log('🎬 Veo 2 Auto-Switcher starting...');
    
    let isMonitoring = true;
    let clickCount = 0;
    let lastClickTime = 0;
    
    // Function to find and click the switch button
    function findAndClickSwitchButton() {
        // Multiple methods to find the button
        
        // Method 1: By exact button text
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            if (button.textContent?.includes('Switch to Veo 2') && 
                button.textContent?.includes('Quality')) {
                
                // Avoid clicking the same button multiple times in quick succession
                const now = Date.now();
                if (now - lastClickTime < 1000) {
                    return false;
                }
                
                console.log('🎯 Found Veo 2 switch button - clicking it!');
                button.click();
                clickCount++;
                lastClickTime = now;
                
                // Visual feedback
                button.style.border = '3px solid #00ff00';
                setTimeout(() => {
                    if (button) button.style.border = '';
                }, 500);
                
                console.log(`✅ Clicked Veo 2 switch button (click #${clickCount})`);
                return true;
            }
        }
        
        // Method 2: By class name pattern
        const classButtons = document.querySelectorAll('button.hLwJov, button[class*="hLwJov"]');
        for (const button of classButtons) {
            if (button.textContent?.includes('Switch to Veo 2')) {
                const now = Date.now();
                if (now - lastClickTime < 1000) {
                    return false;
                }
                
                console.log('🎯 Found Veo 2 switch button by class - clicking it!');
                button.click();
                clickCount++;
                lastClickTime = now;
                
                console.log(`✅ Clicked Veo 2 switch button (click #${clickCount})`);
                return true;
            }
        }
        
        // Method 3: By toast attributes
        const toastButtons = document.querySelectorAll('button[data-radix-toast-announce-exclude]');
        for (const button of toastButtons) {
            if (button.textContent?.includes('Switch to Veo 2')) {
                const now = Date.now();
                if (now - lastClickTime < 1000) {
                    return false;
                }
                
                console.log('🎯 Found Veo 2 switch button by toast attribute - clicking it!');
                button.click();
                clickCount++;
                lastClickTime = now;
                
                console.log(`✅ Clicked Veo 2 switch button (click #${clickCount})`);
                return true;
            }
        }
        
        return false;
    }
    
    // Function to check if we're on a video generation page
    function isOnVideoPage() {
        const url = window.location.href;
        return url.includes('labs.google') && url.includes('/flow');
    }
    
    // Main monitoring function
    function monitorForButton() {
        if (!isMonitoring) return;
        
        // Only monitor on relevant pages
        if (!isOnVideoPage()) {
            return;
        }
        
        // Try to find and click the button
        const found = findAndClickSwitchButton();
        
        if (found) {
            console.log('🎉 Successfully switched to Veo 2 Quality mode!');
            
            // Continue monitoring in case the button appears again
            // (e.g., when creating a new video)
        }
    }
    
    // Start monitoring with interval
    const checkInterval = setInterval(monitorForButton, 500); // Check every 500ms
    
    // Also use MutationObserver for immediate detection
    const observer = new MutationObserver((mutations) => {
        // Quick check if any mutation might have added the button
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        // Check if it's a button or contains buttons
                        if (node.tagName === 'BUTTON' || 
                            (node.querySelector && node.querySelector('button'))) {
                            monitorForButton();
                            break;
                        }
                    }
                }
            }
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Add keyboard shortcut to toggle monitoring (Ctrl+Shift+V)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            isMonitoring = !isMonitoring;
            console.log(`🎬 Veo 2 Auto-Switcher: ${isMonitoring ? 'ENABLED' : 'DISABLED'}`);
        }
    });
    
    // Status display removed - no visual indicator needed
    
    // Cleanup function
    window.veo2AutoSwitcherCleanup = function() {
        isMonitoring = false;
        clearInterval(checkInterval);
        observer.disconnect();
        console.log('🛑 Veo 2 Auto-Switcher stopped');
    };
    
    // Debug functions
    window.veo2Switcher = {
        status: () => {
            console.log('Monitoring:', isMonitoring);
            console.log('Click count:', clickCount);
            console.log('On video page:', isOnVideoPage());
            findAndClickSwitchButton(); // Try to click now
        },
        toggle: () => {
            isMonitoring = !isMonitoring;
            console.log(`Monitoring: ${isMonitoring ? 'ON' : 'OFF'}`);
        },
        findButton: () => {
            const buttons = document.querySelectorAll('button');
            let found = false;
            buttons.forEach(btn => {
                if (btn.textContent?.includes('Veo 2')) {
                    console.log('Found button:', btn);
                    console.log('Text:', btn.textContent);
                    console.log('Classes:', btn.className);
                    found = true;
                }
            });
            if (!found) {
                console.log('No Veo 2 buttons found');
            }
        }
    };
    
    console.log('✅ Veo 2 Auto-Switcher ready');
    console.log('Press Ctrl+Shift+V to toggle monitoring');
    console.log('Commands: veo2Switcher.status(), .toggle(), .findButton()');
})();