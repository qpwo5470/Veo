// Flow mode selector - automatically selects "애셋으로 동영상 만들기" mode
console.log('Flow mode selector starting...');

// Function to find and click the mode dropdown
function clickModeDropdown() {
    console.log('Looking for mode dropdown...');
    
    // Try multiple selectors
    const selectors = [
        'button[role="combobox"]',
        'button[type="button"][role="combobox"]',
        '.sc-7d2e2cf5-1.hoBDwb',
        'button:has(.material-icons:contains("arrow_drop_down"))',
        'button:has(i.material-icons)'
    ];
    
    for (const selector of selectors) {
        try {
            const buttons = document.querySelectorAll(selector);
            console.log(`Found ${buttons.length} buttons with selector: ${selector}`);
            
            for (const button of buttons) {
                // Check if this is the mode selector
                const buttonText = button.textContent || '';
                console.log(`Checking button: "${buttonText}"`);
                
                if (buttonText.includes('동영상') || 
                    buttonText.includes('텍스트') || 
                    buttonText.includes('프레임') ||
                    buttonText.includes('애셋') ||
                    buttonText.includes('만들기')) {
                    
                    console.log('Found mode dropdown! Text:', buttonText);
                    
                    // Try different click methods
                    try {
                        // Method 1: Direct click
                        button.click();
                    } catch (e) {
                        // Method 2: Dispatch event
                        const event = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        button.dispatchEvent(event);
                    }
                    
                    return true;
                }
            }
        } catch (e) {
            console.log(`Error with selector ${selector}:`, e);
        }
    }
    
    console.log('Mode dropdown not found');
    return false;
}

// Function to select "애셋으로 동영상 만들기" from the dropdown
function selectAssetMode() {
    // Wait a bit for dropdown to appear
    setTimeout(() => {
        // Find all dropdown options
        const options = document.querySelectorAll('[role="option"]');
        
        for (const option of options) {
            // Look for the asset mode option
            if (option.textContent.includes('애셋으로 동영상 만들기')) {
                console.log('Found asset mode option, clicking...');
                option.click();
                return true;
            }
        }
        
        console.log('Asset mode option not found');
        return false;
    }, 500);
}

// Function to select specific mode from dropdown
function selectMode(modeName) {
    setTimeout(() => {
        console.log(`Looking for mode: ${modeName}`);
        
        // Try multiple selectors for dropdown options
        const selectors = [
            '[role="option"]',
            '[role="menuitem"]',
            '.sc-fbed8389-2',
            'div[role="option"]',
            'div[role="listbox"] > div'
        ];
        
        for (const selector of selectors) {
            const options = document.querySelectorAll(selector);
            console.log(`Found ${options.length} options with selector: ${selector}`);
            
            for (const option of options) {
                const optionText = option.textContent || '';
                console.log(`Checking option: "${optionText}"`);
                
                if (optionText.includes(modeName) || 
                    (modeName === '애셋으로 동영상 만들기' && optionText.includes('애셋'))) {
                    console.log(`Found ${modeName} option! Clicking...`);
                    
                    // Try to click
                    try {
                        option.click();
                    } catch (e) {
                        // Dispatch click event
                        const event = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        option.dispatchEvent(event);
                    }
                    
                    return true;
                }
            }
        }
        
        console.log(`${modeName} option not found`);
        return false;
    }, 1000); // Increased delay
}

// Function to change to specific mode
function changeToMode(targetMode) {
    let modeName = '';
    
    switch(targetMode) {
        case 'text':
            modeName = '텍스트 동영상 변환';
            break;
        case 'frame':
            modeName = '프레임 동영상 변환';
            break;
        case 'asset':
        default:
            modeName = '애셋으로 동영상 만들기';
            break;
    }
    
    console.log(`Attempting to change to ${targetMode} mode (${modeName})...`);
    
    // First, check if we need to change mode
    const currentModeButton = document.querySelector('button[role="combobox"]');
    if (currentModeButton && currentModeButton.textContent.includes(modeName)) {
        console.log(`Already in ${targetMode} mode`);
        return;
    }
    
    // Click dropdown
    if (clickModeDropdown()) {
        // Select the mode
        selectMode(modeName);
    } else {
        console.log('Mode dropdown not found, will retry...');
        // Retry after a delay
        setTimeout(() => changeToMode(targetMode), 2000);
    }
}

// Backward compatibility
function changeToAssetMode() {
    changeToMode('asset');
}

// Monitor for page changes to know when to change mode
let lastUrl = window.location.href;
let modeChanged = false;

// Function to wait for dropdown to be available
function waitForDropdownAndChange(mode, retries = 10) {
    if (retries <= 0) {
        console.log('Max retries reached, giving up');
        return;
    }
    
    console.log(`Attempting to change mode (retries left: ${retries})`);
    
    // Look for the dropdown button
    const dropdown = document.querySelector('button[role="combobox"]');
    
    if (dropdown && dropdown.textContent) {
        console.log('Dropdown found, changing mode...');
        changeToMode(mode);
    } else {
        console.log('Dropdown not ready, retrying...');
        setTimeout(() => waitForDropdownAndChange(mode, retries - 1), 2000);
    }
}

// Check URL periodically
setInterval(() => {
    const currentUrl = window.location.href;
    
    // Check if we're on a Flow project page
    if (currentUrl.includes('labs.google/fx/ko/tools/flow/project/') && 
        currentUrl !== lastUrl) {
        console.log('Flow project page detected');
        lastUrl = currentUrl;
        
        // Check sessionStorage for mode preference
        const requestedMode = sessionStorage.getItem('veo_flow_mode');
        
        if (requestedMode) {
            console.log(`Mode requested from pg2: ${requestedMode}`);
            // Clear the flag
            sessionStorage.removeItem('veo_flow_mode');
            
            // Wait for page to load, then try to change mode
            setTimeout(() => {
                waitForDropdownAndChange(requestedMode);
                modeChanged = true;
            }, 2000);
        }
    }
}, 1000);

// Also listen for manual trigger
window.forceAssetMode = function() {
    console.log('Forcing asset mode...');
    waitForDropdownAndChange('asset');
};

// Also provide manual trigger
window.changeToAssetMode = changeToAssetMode;

// Listen for specific triggers
document.addEventListener('flow-mode-change', () => {
    changeToAssetMode();
});

console.log('Flow mode selector ready - will auto-select asset mode');