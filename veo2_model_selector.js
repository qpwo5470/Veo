// Automatically select Veo 2 - Quality model for image to video mode
console.log('[VEO2 SELECTOR] Initializing Veo 2 model selector...');

async function selectVeo2Quality() {
    try {
        console.log('[VEO2 SELECTOR] Looking for settings button...');
        
        // Step 1: Find and click the settings button (tune icon)
        const settingsButton = Array.from(document.querySelectorAll('button')).find(btn => {
            const icon = btn.querySelector('i.material-icons-outlined');
            return icon && icon.textContent === 'tune';
        });
        
        if (!settingsButton) {
            console.log('[VEO2 SELECTOR] Settings button not found');
            return false;
        }
        
        console.log('[VEO2 SELECTOR] Clicking settings button...');
        settingsButton.click();
        
        // Wait for settings panel to open
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 2: Find and click the model dropdown
        // Debug: log all combobox buttons
        const allComboboxes = document.querySelectorAll('button[role="combobox"]');
        console.log(`[VEO2 SELECTOR] Found ${allComboboxes.length} combobox buttons:`);
        allComboboxes.forEach((btn, i) => {
            console.log(`[VEO2 SELECTOR]   ${i}: "${btn.textContent.trim()}"`);
        });
        
        // Look for button with '모델' text or containing Veo
        let modelDropdown = Array.from(allComboboxes).find(btn => {
            const btnText = btn.textContent || '';
            return btnText.includes('모델') || btnText.includes('Veo');
        });
        
        if (!modelDropdown) {
            console.log('[VEO2 SELECTOR] Model dropdown not found');
            return false;
        }
        
        // Check if already Veo 2
        if (modelDropdown.textContent.includes('Veo 2')) {
            console.log('[VEO2 SELECTOR] Already using Veo 2 - Quality');
            return true;
        }
        
        console.log(`[VEO2 SELECTOR] Clicking model dropdown: "${modelDropdown.textContent.trim()}"`);
        modelDropdown.click();
        
        // Wait for dropdown to open
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 3: Find and click Veo 2 - Quality option
        const allOptions = document.querySelectorAll('[role="option"]');
        console.log(`[VEO2 SELECTOR] Found ${allOptions.length} options:`);
        allOptions.forEach((opt, i) => {
            console.log(`[VEO2 SELECTOR]   ${i}: "${opt.textContent.trim()}"`);
        });
        
        const veo2Option = Array.from(allOptions).find(option => {
            const optionText = option.textContent || '';
            // Look for Veo 2 with Quality or No Audio indication
            return optionText.includes('Veo 2') && 
                   (optionText.includes('Quality') || optionText.includes('No Audio'));
        });
        
        if (!veo2Option) {
            console.log('[VEO2 SELECTOR] Veo 2 - Quality option not found');
            // Try just Veo 2
            const anyVeo2 = Array.from(allOptions).find(option => {
                return option.textContent.includes('Veo 2');
            });
            if (anyVeo2) {
                console.log('[VEO2 SELECTOR] Found Veo 2 option, clicking...');
                anyVeo2.click();
                return true;
            }
            return false;
        }
        
        console.log(`[VEO2 SELECTOR] Clicking Veo 2 option: "${veo2Option.textContent.trim()}"`);
        veo2Option.click();
        
        // Wait for selection to apply
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('[VEO2 SELECTOR] Successfully selected Veo 2 - Quality');
        return true;
        
    } catch (error) {
        console.error('[VEO2 SELECTOR] Error:', error);
        return false;
    }
}

// Function to check if we're in asset/image mode
function isInAssetMode() {
    const modeButton = document.querySelector('button[role="combobox"]');
    if (modeButton) {
        const modeText = modeButton.textContent;
        return modeText && modeText.includes('애셋으로 동영상 만들기');
    }
    return false;
}

// Try to select Veo 2 when page loads
async function trySelectVeo2() {
    // Only proceed if in asset mode
    if (!isInAssetMode()) {
        console.log('[VEO2 SELECTOR] Not in asset mode, skipping');
        return;
    }
    
    console.log('[VEO2 SELECTOR] In asset mode, attempting to select Veo 2...');
    
    // Try multiple times with delays
    const attempts = [1000, 2000, 3000, 5000];
    
    for (let i = 0; i < attempts.length; i++) {
        await new Promise(resolve => setTimeout(resolve, i === 0 ? attempts[i] : attempts[i] - attempts[i-1]));
        
        console.log(`[VEO2 SELECTOR] Attempt ${i + 1}/${attempts.length}`);
        const success = await selectVeo2Quality();
        
        if (success) {
            break;
        }
    }
}

// Start the process
if (window.location.href.includes('labs.google/fx/ko/tools/flow/project/')) {
    trySelectVeo2();
}

// Also provide manual trigger
window.selectVeo2Model = selectVeo2Quality;

console.log('[VEO2 SELECTOR] Veo 2 model selector ready');