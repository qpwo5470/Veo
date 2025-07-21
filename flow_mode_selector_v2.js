// Flow mode selector v2 - more reliable mode switching
// console.log('Flow mode selector v2 starting...');

// Wait for specific element to appear
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Element ${selector} not found after ${timeout}ms`));
            } else {
                setTimeout(checkElement, 100);
            }
        };
        
        checkElement();
    });
}

// Click the mode dropdown button
async function openModeDropdown() {
    try {
        console.log('[MODE SELECTOR] Looking for mode dropdown button...');
        
        // Wait for any combobox button
        const button = await waitForElement('button[role="combobox"]');
        
        // Log what we found
        console.log('[MODE SELECTOR] Found button with text:', button.textContent);
        
        // Verify it's the mode selector by checking content
        if (button.textContent && (
            button.textContent.includes('동영상') ||
            button.textContent.includes('애셋') ||
            button.textContent.includes('텍스트') ||
            button.textContent.includes('프레임')
        )) {
            console.log('[MODE SELECTOR] Clicking mode dropdown...');
            button.click();
            
            // Wait a bit to ensure dropdown opens
            await new Promise(resolve => setTimeout(resolve, 300));
            return true;
        } else {
            console.log('[MODE SELECTOR] Button found but not mode selector');
        }
        
        return false;
    } catch (error) {
        console.error('Error opening dropdown:', error);
        return false;
    }
}

// Select mode from dropdown
async function selectModeOption(modeName) {
    try {
        console.log(`[MODE SELECTOR] Waiting for dropdown to open...`);
        
        // Wait for dropdown container - try multiple selectors
        let listbox = null;
        try {
            listbox = await waitForElement('[role="listbox"]', 2000);
        } catch (e) {
            // Try alternative selector
            listbox = await waitForElement('.sc-fbed8389-1', 2000);
        }
        
        if (!listbox) {
            console.log('[MODE SELECTOR] Dropdown container not found');
            return false;
        }
        
        console.log('[MODE SELECTOR] Dropdown opened, looking for options...');
        
        // Get all options
        const options = document.querySelectorAll('[role="option"]');
        console.log(`[MODE SELECTOR] Found ${options.length} options`);
        
        // Log all options
        options.forEach((option, index) => {
            console.log(`[MODE SELECTOR] Option ${index + 1}: "${option.textContent}"`);
        });
        
        for (const option of options) {
            const text = option.textContent || '';
            
            if (text.includes(modeName)) {
                console.log(`[MODE SELECTOR] Clicking option: ${text}`);
                option.click();
                
                // Wait for mode change
                await new Promise(resolve => setTimeout(resolve, 500));
                return true;
            }
        }
        
        console.log(`[MODE SELECTOR] Mode "${modeName}" not found in dropdown`);
        return false;
    } catch (error) {
        console.error('Error selecting mode:', error);
        return false;
    }
}

// Main function to change mode
async function changeFlowMode(targetMode) {
    const modeMap = {
        'text': '텍스트 동영상 변환',
        'frame': '프레임 동영상 변환',
        'asset': '애셋으로 동영상 만들기'
    };
    
    const modeName = modeMap[targetMode] || targetMode;
    // console.log(`Changing to ${targetMode} mode (${modeName})`);
    
    // Check current mode
    const currentButton = document.querySelector('button[role="combobox"]');
    if (currentButton && currentButton.textContent && currentButton.textContent.includes(modeName)) {
        // console.log('Already in the correct mode');
        return true;
    }
    
    // Open dropdown
    const dropdownOpened = await openModeDropdown();
    if (!dropdownOpened) {
        // console.log('Failed to open dropdown');
        return false;
    }
    
    // Wait a bit for dropdown animation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Select mode
    const modeSelected = await selectModeOption(modeName);
    if (!modeSelected) {
        // console.log('Failed to select mode');
        return false;
    }
    
    // console.log('Mode changed successfully');
    return true;
}

// Monitor for navigation to Flow project
let checkInterval = null;

function startMonitoring() {
    if (checkInterval) return;
    
    checkInterval = setInterval(() => {
        const url = window.location.href;
        
        // Check if we're on a Flow project page
        if (url.includes('labs.google/fx/ko/tools/flow/project/')) {
            // Check for mode request
            const requestedMode = sessionStorage.getItem('veo_flow_mode');
            
            if (requestedMode) {
                // console.log(`Mode change requested: ${requestedMode}`);
                sessionStorage.removeItem('veo_flow_mode');
                
                // Stop monitoring
                clearInterval(checkInterval);
                checkInterval = null;
                
                // Wait for page to stabilize, then change mode
                console.log(`[MODE SELECTOR] Mode change requested: ${requestedMode}`);
                
                // Function to attempt mode change with retries
                let attemptCount = 0;
                const maxAttempts = 10;
                
                const attemptModeChange = async () => {
                    attemptCount++;
                    console.log(`[MODE SELECTOR] Attempt ${attemptCount}/${maxAttempts} for mode: ${requestedMode}`);
                    
                    const success = await changeFlowMode(requestedMode);
                    if (!success && attemptCount < maxAttempts) {
                        // Retry with increasing delay
                        const delay = Math.min(1000 + (attemptCount * 500), 5000);
                        console.log(`[MODE SELECTOR] Retrying in ${delay}ms...`);
                        setTimeout(attemptModeChange, delay);
                    } else if (success) {
                        console.log(`[MODE SELECTOR] Successfully changed to ${requestedMode} mode`);
                    } else {
                        console.log(`[MODE SELECTOR] Failed to change mode after ${maxAttempts} attempts`);
                    }
                };
                
                // Start first attempt after initial delay
                setTimeout(attemptModeChange, 2000);
            }
        }
    }, 500);
}

// Check immediately if mode was requested
const immediateMode = sessionStorage.getItem('veo_flow_mode');
if (immediateMode) {
    console.log(`[MODE SELECTOR] Immediate mode found in sessionStorage: ${immediateMode}`);
}

// Start monitoring
startMonitoring();

// Export functions for manual use
window.changeFlowMode = changeFlowMode;
window.changeToAssetMode = () => changeFlowMode('asset');
window.debugModeSelector = () => {
    console.log('[MODE SELECTOR DEBUG] Current URL:', window.location.href);
    console.log('[MODE SELECTOR DEBUG] SessionStorage veo_flow_mode:', sessionStorage.getItem('veo_flow_mode'));
    console.log('[MODE SELECTOR DEBUG] Current mode button:', document.querySelector('button[role="combobox"]')?.textContent);
    console.log('[MODE SELECTOR DEBUG] Available buttons:', Array.from(document.querySelectorAll('button')).map(b => b.textContent).filter(t => t));
};

// Also check mode periodically in case sessionStorage was set before script loaded
setInterval(() => {
    const mode = sessionStorage.getItem('veo_flow_mode');
    if (mode) {
        console.log(`[MODE SELECTOR] Found pending mode in sessionStorage: ${mode}`);
    }
}, 1000);

console.log('[MODE SELECTOR] Flow mode selector v2 ready');