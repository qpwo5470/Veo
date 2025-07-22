// Automatically select Veo 2 - Quality model for image to video mode - Version 2
console.log('[VEO2 SELECTOR V2] Initializing Veo 2 model selector v2...');

async function selectVeo2Quality() {
    try {
        console.log('[VEO2 SELECTOR V2] Looking for settings button...');
        
        // Step 1: Find and click the settings button (tune icon)
        const settingsButton = Array.from(document.querySelectorAll('button')).find(btn => {
            const icon = btn.querySelector('i.material-icons-outlined, i.material-icons');
            return icon && icon.textContent === 'tune';
        });
        
        if (!settingsButton) {
            console.log('[VEO2 SELECTOR V2] Settings button not found');
            return false;
        }
        
        // Check if settings panel is already open
        const isSettingsOpen = settingsButton.getAttribute('aria-expanded') === 'true';
        
        if (!isSettingsOpen) {
            console.log('[VEO2 SELECTOR V2] Opening settings panel...');
            settingsButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            console.log('[VEO2 SELECTOR V2] Settings panel already open');
        }
        
        // Step 2: Look for model section in settings panel
        // Try multiple selectors
        console.log('[VEO2 SELECTOR V2] Looking for model controls...');
        
        // Debug: Find all elements with '모델' text
        const allElements = document.querySelectorAll('*');
        const modelElements = Array.from(allElements).filter(el => {
            const text = el.textContent || '';
            const hasModelText = text.includes('모델') && text.length < 100; // Avoid large containers
            const hasVeoText = text.includes('Veo');
            return hasModelText || hasVeoText;
        });
        
        console.log(`[VEO2 SELECTOR V2] Found ${modelElements.length} elements with '모델' or 'Veo':`);
        modelElements.forEach((el, i) => {
            if (i < 10) { // Limit output
                console.log(`[VEO2 SELECTOR V2]   ${i}: ${el.tagName} - "${el.textContent.substring(0, 50)}..."`);
            }
        });
        
        // Look for clickable model dropdown - might be a div or button
        let modelControl = null;
        
        // Strategy 1: Find element with both '모델' and 'Veo' text
        modelControl = modelElements.find(el => {
            const text = el.textContent || '';
            const hasModel = text.includes('모델');
            const hasVeo = text.includes('Veo');
            const isClickable = el.tagName === 'BUTTON' || el.tagName === 'DIV' || el.role === 'button' || el.role === 'combobox';
            return hasModel && hasVeo && isClickable;
        });
        
        // Strategy 2: Find parent of '모델' label that contains 'Veo'
        if (!modelControl) {
            const modelLabel = Array.from(document.querySelectorAll('span, div')).find(el => 
                el.textContent === '모델' || el.textContent.trim() === '모델'
            );
            
            if (modelLabel) {
                console.log('[VEO2 SELECTOR V2] Found 모델 label, looking for nearby Veo control...');
                let parent = modelLabel.parentElement;
                while (parent && parent !== document.body) {
                    if (parent.textContent.includes('Veo')) {
                        // Find clickable child
                        const clickable = parent.querySelector('button, [role="button"], [role="combobox"]');
                        if (clickable) {
                            modelControl = clickable;
                            break;
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        
        if (!modelControl) {
            console.log('[VEO2 SELECTOR V2] Model control not found');
            return false;
        }
        
        console.log(`[VEO2 SELECTOR V2] Found model control: ${modelControl.tagName} - "${modelControl.textContent.trim()}"`);
        
        // Check if already Veo 2
        if (modelControl.textContent.includes('Veo 2')) {
            console.log('[VEO2 SELECTOR V2] Already using Veo 2');
            return true;
        }
        
        // Click the model control
        console.log('[VEO2 SELECTOR V2] Clicking model control...');
        modelControl.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 3: Find and click Veo 2 option
        const options = document.querySelectorAll('[role="option"], [role="menuitem"], .menu-item, .option-item');
        console.log(`[VEO2 SELECTOR V2] Found ${options.length} option elements`);
        
        const veo2Option = Array.from(options).find(option => {
            const text = option.textContent || '';
            return text.includes('Veo 2');
        });
        
        if (!veo2Option) {
            console.log('[VEO2 SELECTOR V2] Veo 2 option not found, looking for any clickable with Veo 2...');
            
            // Try broader search
            const allClickables = document.querySelectorAll('div, button, li');
            const veo2Clickable = Array.from(allClickables).find(el => {
                const text = el.textContent || '';
                const rect = el.getBoundingClientRect();
                return text.includes('Veo 2') && 
                       text.includes('Quality') && 
                       rect.width > 0 && 
                       rect.height > 0;
            });
            
            if (veo2Clickable) {
                console.log(`[VEO2 SELECTOR V2] Found Veo 2 element: "${veo2Clickable.textContent.trim()}"`);
                veo2Clickable.click();
                return true;
            }
            
            return false;
        }
        
        console.log(`[VEO2 SELECTOR V2] Clicking Veo 2 option: "${veo2Option.textContent.trim()}"`);
        veo2Option.click();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[VEO2 SELECTOR V2] Successfully selected Veo 2');
        return true;
        
    } catch (error) {
        console.error('[VEO2 SELECTOR V2] Error:', error);
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
        console.log('[VEO2 SELECTOR V2] Not in asset mode, skipping');
        return;
    }
    
    console.log('[VEO2 SELECTOR V2] In asset mode, attempting to select Veo 2...');
    
    // Wait for UI to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try once
    const success = await selectVeo2Quality();
    
    if (!success) {
        console.log('[VEO2 SELECTOR V2] First attempt failed, retrying in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await selectVeo2Quality();
    }
}

// Start the process
if (window.location.href.includes('labs.google/fx/ko/tools/flow/project/')) {
    trySelectVeo2();
}

// Also provide manual trigger
window.selectVeo2Model = selectVeo2Quality;

console.log('[VEO2 SELECTOR V2] Ready');