// Direct mode changer using the framework's function
console.log('[DIRECT MODE] Attempting to change mode using framework function...');

// Check if we're on a Flow project page
if (window.location.href.includes('labs.google/fx/ko/tools/flow/project/')) {
    const requestedMode = sessionStorage.getItem('veo_flow_mode');
    
    if (requestedMode === 'asset') {
        console.log('[DIRECT MODE] Asset mode requested');
        
        // Function to find and trigger the asset mode option
        const triggerAssetMode = async () => {
            try {
                // First, check if we're already in asset mode
                const modeButton = document.querySelector('button[role="combobox"]');
                if (modeButton && modeButton.textContent.includes('애셋으로 동영상 만들기')) {
                    console.log('[DIRECT MODE] Already in asset mode');
                    sessionStorage.removeItem('veo_flow_mode');
                    return true;
                }
                
                // Find the option element for asset mode
                const options = document.querySelectorAll('[role="option"]');
                let assetOption = null;
                
                for (const option of options) {
                    if (option.textContent && option.textContent.includes('애셋으로 동영상 만들기')) {
                        assetOption = option;
                        break;
                    }
                }
                
                if (assetOption) {
                    console.log('[DIRECT MODE] Found asset option, looking for click handler...');
                    
                    // Method 1: Try to find and call the obfuscated function directly
                    if (typeof _0x3f4f79 === 'function') {
                        console.log('[DIRECT MODE] Calling _0x3f4f79() directly');
                        _0x3f4f79();
                        sessionStorage.removeItem('veo_flow_mode');
                        return true;
                    }
                    
                    // Method 2: Get the React props/event handlers
                    const reactKey = Object.keys(assetOption).find(key => key.startsWith('__react'));
                    if (reactKey) {
                        const reactProps = assetOption[reactKey];
                        console.log('[DIRECT MODE] Found React props:', reactProps);
                        
                        // Try to find onClick handler
                        if (reactProps.onClick) {
                            console.log('[DIRECT MODE] Calling React onClick handler');
                            reactProps.onClick();
                            sessionStorage.removeItem('veo_flow_mode');
                            return true;
                        }
                    }
                    
                    // Method 3: Trigger synthetic click event
                    console.log('[DIRECT MODE] Triggering synthetic click event');
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    assetOption.dispatchEvent(clickEvent);
                    
                    // Also try pointerdown/up which React might use
                    const pointerDown = new PointerEvent('pointerdown', { bubbles: true });
                    const pointerUp = new PointerEvent('pointerup', { bubbles: true });
                    assetOption.dispatchEvent(pointerDown);
                    assetOption.dispatchEvent(pointerUp);
                    
                    sessionStorage.removeItem('veo_flow_mode');
                    return true;
                } else {
                    // If dropdown not open, open it first
                    if (modeButton) {
                        console.log('[DIRECT MODE] Opening dropdown first...');
                        modeButton.click();
                        
                        // Wait and retry
                        setTimeout(triggerAssetMode, 500);
                        return false;
                    }
                }
                
            } catch (error) {
                console.error('[DIRECT MODE] Error:', error);
                return false;
            }
        };
        
        // Try multiple times with delays
        const attempts = [100, 500, 1000, 2000, 3000, 5000];
        
        attempts.forEach((delay, index) => {
            setTimeout(async () => {
                console.log(`[DIRECT MODE] Attempt ${index + 1} after ${delay}ms`);
                const success = await triggerAssetMode();
                if (success) {
                    console.log('[DIRECT MODE] Mode change successful');
                }
            }, delay);
        });
    }
}

// Also expose for manual testing
window.triggerAssetMode = () => {
    sessionStorage.setItem('veo_flow_mode', 'asset');
    location.reload();
};