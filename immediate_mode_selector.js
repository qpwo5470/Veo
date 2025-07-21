// Immediate mode selector - runs as soon as possible on page load
console.log('[IMMEDIATE MODE] Checking for mode change request...');

// Check if we're on a Flow project page
if (window.location.href.includes('labs.google/fx/ko/tools/flow/project/')) {
    const requestedMode = sessionStorage.getItem('veo_flow_mode');
    
    if (requestedMode) {
        console.log(`[IMMEDIATE MODE] Found mode request: ${requestedMode}`);
        
        // Map mode to Korean text
        const modeMap = {
            'text': '텍스트 동영상 변환',
            'frame': '프레임 동영상 변환',
            'asset': '애셋으로 동영상 만들기'
        };
        
        const targetModeName = modeMap[requestedMode] || requestedMode;
        
        // Function to attempt mode change
        const attemptModeChange = async () => {
            console.log('[IMMEDIATE MODE] Looking for mode dropdown...');
            
            // Find the dropdown button
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
            
            if (!modeButton) {
                console.log('[IMMEDIATE MODE] Mode button not found yet');
                return false;
            }
            
            console.log('[IMMEDIATE MODE] Current mode:', modeButton.textContent);
            
            // Check if already in correct mode
            if (modeButton.textContent.includes(targetModeName)) {
                console.log('[IMMEDIATE MODE] Already in correct mode');
                sessionStorage.removeItem('veo_flow_mode');
                return true;
            }
            
            // Click to open dropdown
            console.log('[IMMEDIATE MODE] Opening dropdown...');
            modeButton.click();
            
            // Wait for dropdown
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Find and click the target option
            const options = document.querySelectorAll('[role="option"]');
            console.log(`[IMMEDIATE MODE] Found ${options.length} options`);
            
            for (const option of options) {
                if (option.textContent && option.textContent.includes(targetModeName)) {
                    console.log('[IMMEDIATE MODE] Clicking option:', option.textContent);
                    option.click();
                    
                    // Wait a bit then check if we need to close dropdown
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Try to close dropdown by clicking outside or pressing Escape
                    document.body.click();
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                    
                    sessionStorage.removeItem('veo_flow_mode');
                    return true;
                }
            }
            
            console.log('[IMMEDIATE MODE] Target option not found');
            return false;
        };
        
        // Try immediately and with delays
        let attempts = 0;
        const maxAttempts = 20;
        
        const tryChange = async () => {
            attempts++;
            console.log(`[IMMEDIATE MODE] Attempt ${attempts}/${maxAttempts}`);
            
            const success = await attemptModeChange();
            if (!success && attempts < maxAttempts) {
                setTimeout(tryChange, 500 + (attempts * 200));
            } else if (success) {
                console.log('[IMMEDIATE MODE] Mode change successful');
            } else {
                console.log('[IMMEDIATE MODE] Mode change failed after all attempts');
                // Keep the mode in storage for the regular selector to try
            }
        };
        
        // Start trying after a short delay
        setTimeout(tryChange, 500);
    } else {
        console.log('[IMMEDIATE MODE] No mode change requested');
    }
} else {
    console.log('[IMMEDIATE MODE] Not on Flow project page');
}