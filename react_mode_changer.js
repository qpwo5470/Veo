// React mode changer - uses React's event system to change mode
console.log('[REACT MODE] Checking for mode change request...');

if (window.location.href.includes('labs.google/fx/ko/tools/flow/project/')) {
    const requestedMode = sessionStorage.getItem('veo_flow_mode');
    
    if (requestedMode === 'asset') {
        console.log('[REACT MODE] Asset mode requested');
        
        // Function to trigger React click event
        const triggerReactClick = (element) => {
            const props = Object.keys(element).find(key => key.startsWith('__reactProps'));
            if (props && element[props].onClick) {
                console.log('[REACT MODE] Found React onClick handler');
                element[props].onClick();
                return true;
            }
            
            // Alternative: look for __reactEventHandlers
            const handlers = Object.keys(element).find(key => key.startsWith('__reactEventHandlers'));
            if (handlers && element[handlers].onClick) {
                console.log('[REACT MODE] Found React event handlers');
                element[handlers].onClick();
                return true;
            }
            
            // Try React 17+ format
            const fiber = Object.keys(element).find(key => key.startsWith('__reactFiber'));
            if (fiber && element[fiber]) {
                const fiberNode = element[fiber];
                if (fiberNode.memoizedProps && fiberNode.memoizedProps.onClick) {
                    console.log('[REACT MODE] Found onClick in fiber node');
                    fiberNode.memoizedProps.onClick();
                    return true;
                }
            }
            
            return false;
        };
        
        // Function to change mode
        const changeToAssetMode = () => {
            try {
                // Check if already in asset mode
                const modeButton = document.querySelector('button[role="combobox"]');
                if (modeButton && modeButton.textContent.includes('애셋으로 동영상 만들기')) {
                    console.log('[REACT MODE] Already in asset mode');
                    sessionStorage.removeItem('veo_flow_mode');
                    return true;
                }
                
                // First, ensure dropdown is open
                if (modeButton && !document.querySelector('[role="listbox"]')) {
                    console.log('[REACT MODE] Opening dropdown...');
                    modeButton.click();
                    
                    // Wait for dropdown to open then find option
                    setTimeout(() => {
                        const options = document.querySelectorAll('[role="option"]');
                        for (const option of options) {
                            if (option.textContent && option.textContent.includes('애셋으로 동영상 만들기')) {
                                console.log('[REACT MODE] Found asset option, triggering React click...');
                                
                                // Try React click first
                                if (triggerReactClick(option)) {
                                    sessionStorage.removeItem('veo_flow_mode');
                                    return;
                                }
                                
                                // Fallback to regular click
                                console.log('[REACT MODE] Falling back to regular click');
                                option.click();
                                sessionStorage.removeItem('veo_flow_mode');
                                return;
                            }
                        }
                    }, 300);
                } else if (document.querySelector('[role="listbox"]')) {
                    // Dropdown already open
                    const options = document.querySelectorAll('[role="option"]');
                    for (const option of options) {
                        if (option.textContent && option.textContent.includes('애셋으로 동영상 만들기')) {
                            console.log('[REACT MODE] Found asset option (dropdown open)');
                            
                            if (triggerReactClick(option)) {
                                sessionStorage.removeItem('veo_flow_mode');
                                return true;
                            }
                            
                            option.click();
                            sessionStorage.removeItem('veo_flow_mode');
                            return true;
                        }
                    }
                }
                
                return false;
            } catch (error) {
                console.error('[REACT MODE] Error:', error);
                return false;
            }
        };
        
        // Try multiple times
        const delays = [500, 1000, 2000, 3000, 5000];
        
        delays.forEach((delay, index) => {
            setTimeout(() => {
                console.log(`[REACT MODE] Attempt ${index + 1}/${delays.length}`);
                changeToAssetMode();
            }, delay);
        });
        
        // Also monitor for dropdown appearance
        const observer = new MutationObserver((mutations) => {
            const listbox = document.querySelector('[role="listbox"]');
            if (listbox) {
                console.log('[REACT MODE] Dropdown appeared, checking for asset option...');
                setTimeout(changeToAssetMode, 100);
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Stop observing after 10 seconds
        setTimeout(() => observer.disconnect(), 10000);
    }
}