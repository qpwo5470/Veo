// Framework function caller - waits for framework to load then calls the mode change function
console.log('[FRAMEWORK CALLER] Waiting for framework to load...');

// Check if we're on a Flow project page
if (window.location.href.includes('labs.google/fx/ko/tools/flow/project/')) {
    const requestedMode = sessionStorage.getItem('veo_flow_mode');
    
    if (requestedMode === 'asset') {
        console.log('[FRAMEWORK CALLER] Asset mode requested, waiting for framework...');
        
        // Function to check if framework is loaded and call the function
        const checkAndCallFrameworkFunction = () => {
            try {
                // First check if we're already in asset mode
                const modeButton = document.querySelector('button[role="combobox"]');
                if (modeButton && modeButton.textContent.includes('애셋으로 동영상 만들기')) {
                    console.log('[FRAMEWORK CALLER] Already in asset mode');
                    sessionStorage.removeItem('veo_flow_mode');
                    return true;
                }
                
                // Method 1: Check if _0x3f4f79 exists in global scope
                if (typeof window._0x3f4f79 === 'function') {
                    console.log('[FRAMEWORK CALLER] Found _0x3f4f79 globally, calling it...');
                    window._0x3f4f79();
                    sessionStorage.removeItem('veo_flow_mode');
                    return true;
                }
                
                // Method 2: Search in all scripts for the function
                const scripts = document.querySelectorAll('script[src*="framework"]');
                for (const script of scripts) {
                    if (script.src.includes('framework-3570b9d07cce9e4a.js')) {
                        console.log('[FRAMEWORK CALLER] Found framework script:', script.src);
                        
                        // Try to access it through various methods
                        // Check window object for obfuscated names
                        for (const key in window) {
                            if (key.includes('0x3f4f79') || key === '_0x3f4f79') {
                                console.log(`[FRAMEWORK CALLER] Found function as window.${key}`);
                                if (typeof window[key] === 'function') {
                                    window[key]();
                                    sessionStorage.removeItem('veo_flow_mode');
                                    return true;
                                }
                            }
                        }
                    }
                }
                
                // Method 3: Find the asset option and look for React handlers
                const options = document.querySelectorAll('[role="option"]');
                for (const option of options) {
                    if (option.textContent && option.textContent.includes('애셋으로 동영상 만들기')) {
                        console.log('[FRAMEWORK CALLER] Found asset option, checking React properties...');
                        
                        // Check all properties of the element
                        const props = Object.getOwnPropertyNames(option);
                        for (const prop of props) {
                            if (prop.startsWith('__react')) {
                                const reactData = option[prop];
                                console.log(`[FRAMEWORK CALLER] React property ${prop}:`, reactData);
                                
                                // Look for onClick in various places
                                if (reactData && reactData.memoizedProps && reactData.memoizedProps.onClick) {
                                    console.log('[FRAMEWORK CALLER] Found onClick in memoizedProps');
                                    reactData.memoizedProps.onClick();
                                    sessionStorage.removeItem('veo_flow_mode');
                                    return true;
                                }
                                
                                if (reactData && reactData.return && reactData.return.memoizedProps && reactData.return.memoizedProps.onClick) {
                                    console.log('[FRAMEWORK CALLER] Found onClick in return.memoizedProps');
                                    reactData.return.memoizedProps.onClick();
                                    sessionStorage.removeItem('veo_flow_mode');
                                    return true;
                                }
                            }
                        }
                        
                        // Try to find the handler in the element's event listeners
                        const listeners = getEventListeners ? getEventListeners(option) : null;
                        if (listeners && listeners.click) {
                            console.log('[FRAMEWORK CALLER] Found click listeners:', listeners.click);
                            // Call the first click listener
                            if (listeners.click[0] && listeners.click[0].listener) {
                                listeners.click[0].listener();
                                sessionStorage.removeItem('veo_flow_mode');
                                return true;
                            }
                        }
                    }
                }
                
                // Method 4: Open dropdown and simulate user interaction
                if (modeButton && !document.querySelector('[role="listbox"]')) {
                    console.log('[FRAMEWORK CALLER] Opening dropdown to trigger mode change...');
                    modeButton.click();
                    
                    setTimeout(() => {
                        const assetOption = Array.from(document.querySelectorAll('[role="option"]'))
                            .find(opt => opt.textContent.includes('애셋으로 동영상 만들기'));
                        
                        if (assetOption) {
                            console.log('[FRAMEWORK CALLER] Clicking asset option...');
                            // Try multiple click methods
                            assetOption.click();
                            assetOption.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            assetOption.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
                            assetOption.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
                        }
                    }, 500);
                }
                
                return false;
            } catch (error) {
                console.error('[FRAMEWORK CALLER] Error:', error);
                return false;
            }
        };
        
        // Try multiple times with increasing delays
        const attempts = [
            100,   // 0.1 seconds
            500,   // 0.5 seconds
            1000,  // 1 second
            2000,  // 2 seconds
            3000,  // 3 seconds
            5000,  // 5 seconds
            7000,  // 7 seconds
            10000  // 10 seconds
        ];
        
        let attemptIndex = 0;
        
        const tryCall = () => {
            if (attemptIndex < attempts.length) {
                console.log(`[FRAMEWORK CALLER] Attempt ${attemptIndex + 1}/${attempts.length} after ${attempts[attemptIndex]}ms`);
                
                const success = checkAndCallFrameworkFunction();
                if (!success) {
                    attemptIndex++;
                    if (attemptIndex < attempts.length) {
                        setTimeout(tryCall, attempts[attemptIndex] - (attemptIndex > 0 ? attempts[attemptIndex - 1] : 0));
                    }
                } else {
                    console.log('[FRAMEWORK CALLER] Successfully changed mode!');
                }
            }
        };
        
        // Start trying
        setTimeout(tryCall, attempts[0]);
        
        // Also listen for script loads
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.tagName === 'SCRIPT' && node.src && node.src.includes('framework')) {
                        console.log('[FRAMEWORK CALLER] New framework script loaded:', node.src);
                        // Try again when new scripts are loaded
                        setTimeout(checkAndCallFrameworkFunction, 500);
                    }
                }
            }
        });
        
        observer.observe(document.head, { childList: true });
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Clean up observer after 20 seconds
        setTimeout(() => observer.disconnect(), 20000);
    }
}

// Also expose a manual trigger function
window.manualAssetMode = () => {
    sessionStorage.setItem('veo_flow_mode', 'asset');
    checkAndCallFrameworkFunction();
};