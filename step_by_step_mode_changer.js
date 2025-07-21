// Step by step mode changer - waits for each element before clicking
console.log('[STEP MODE] Starting step-by-step mode changer...');

if (window.location.href.includes('labs.google/fx/ko/tools/flow/project/')) {
    const requestedMode = sessionStorage.getItem('veo_flow_mode');
    
    if (requestedMode === 'asset') {
        console.log('[STEP MODE] Asset mode requested, starting step-by-step process...');
        
        // Step 1: Wait for and click the combobox button
        const waitForCombobox = () => {
            console.log('[STEP MODE] Step 1: Looking for combobox button...');
            
            const interval = setInterval(() => {
                // Look for the combobox button that contains mode text
                const buttons = document.querySelectorAll('button[role="combobox"]');
                let modeButton = null;
                
                for (const button of buttons) {
                    if (button.textContent && (
                        button.textContent.includes('동영상') ||
                        button.textContent.includes('애셋') ||
                        button.textContent.includes('텍스트') ||
                        button.textContent.includes('프레임')
                    )) {
                        modeButton = button;
                        break;
                    }
                }
                
                if (modeButton) {
                    console.log('[STEP MODE] Found combobox button with text:', modeButton.textContent);
                    
                    // Check if already in asset mode
                    if (modeButton.textContent.includes('애셋으로 동영상 만들기')) {
                        console.log('[STEP MODE] Already in asset mode, stopping...');
                        clearInterval(interval);
                        sessionStorage.removeItem('veo_flow_mode');
                        return;
                    }
                    
                    // Check if dropdown is already open
                    const isExpanded = modeButton.getAttribute('aria-expanded') === 'true';
                    if (!isExpanded) {
                        console.log('[STEP MODE] Clicking combobox to open dropdown...');
                        modeButton.click();
                    } else {
                        console.log('[STEP MODE] Dropdown already open, proceeding to step 2...');
                    }
                    
                    clearInterval(interval);
                    // Wait a bit for dropdown to open, then go to step 2
                    setTimeout(waitForOption, 500);
                }
            }, 100);
            
            // Stop trying after 30 seconds
            setTimeout(() => {
                clearInterval(interval);
                console.log('[STEP MODE] Timeout waiting for combobox button');
            }, 30000);
        };
        
        // Step 2: Wait for and click the option
        const waitForOption = () => {
            console.log('[STEP MODE] Step 2: Looking for asset option...');
            
            const interval = setInterval(() => {
                // Look for the specific option with "애셋으로 동영상 만들기"
                const options = document.querySelectorAll('[role="option"]');
                let assetOption = null;
                
                for (const option of options) {
                    // Check both the option text and any span inside it
                    const text = option.textContent || '';
                    const spanText = option.querySelector('span')?.textContent || '';
                    
                    if (text.includes('애셋으로 동영상 만들기') || spanText.includes('애셋으로 동영상 만들기')) {
                        assetOption = option;
                        break;
                    }
                }
                
                if (assetOption) {
                    console.log('[STEP MODE] Found asset option!');
                    console.log('[STEP MODE] Option HTML:', assetOption.outerHTML);
                    console.log('[STEP MODE] Clicking asset option...');
                    
                    // Try multiple click methods
                    assetOption.click();
                    
                    // Also dispatch mouse events
                    const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
                    const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
                    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
                    
                    assetOption.dispatchEvent(mouseDown);
                    assetOption.dispatchEvent(mouseUp);
                    assetOption.dispatchEvent(click);
                    
                    clearInterval(interval);
                    sessionStorage.removeItem('veo_flow_mode');
                    
                    // Verify the change after a short delay
                    setTimeout(() => {
                        const modeButton = document.querySelector('button[role="combobox"]');
                        if (modeButton && modeButton.textContent.includes('애셋으로 동영상 만들기')) {
                            console.log('[STEP MODE] Success! Mode changed to asset mode');
                        } else {
                            console.log('[STEP MODE] Mode change verification failed');
                        }
                    }, 1000);
                }
            }, 100);
            
            // Stop trying after 10 seconds
            setTimeout(() => {
                clearInterval(interval);
                console.log('[STEP MODE] Timeout waiting for asset option');
            }, 10000);
        };
        
        // Start the process
        waitForCombobox();
        
        // Also set up a mutation observer to detect when dropdown opens
        const observer = new MutationObserver((mutations) => {
            // Check if a listbox appeared
            const listbox = document.querySelector('[role="listbox"]');
            if (listbox) {
                console.log('[STEP MODE] Dropdown detected via mutation observer');
                // Give it a moment to fully render
                setTimeout(waitForOption, 200);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Stop observing after 30 seconds
        setTimeout(() => {
            observer.disconnect();
            console.log('[STEP MODE] Stopped mutation observer');
        }, 30000);
    }
}