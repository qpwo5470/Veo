// Mode diagnostic script
console.log('[MODE DIAGNOSTIC] Running diagnostic...');

// Function to check current mode
function checkCurrentMode() {
    // Check the combobox button
    const modeButton = document.querySelector('button[role="combobox"]');
    if (modeButton) {
        console.log('[MODE DIAGNOSTIC] Current mode button text:', modeButton.textContent);
    } else {
        console.log('[MODE DIAGNOSTIC] Mode button not found');
    }
    
    // Check if dropdown is open
    const dropdown = document.querySelector('[role="listbox"]');
    if (dropdown) {
        console.log('[MODE DIAGNOSTIC] Dropdown is OPEN');
        
        // Check all options
        const options = document.querySelectorAll('[role="option"]');
        console.log('[MODE DIAGNOSTIC] Available options:');
        options.forEach((option, index) => {
            const text = option.textContent;
            const isSelected = option.getAttribute('aria-selected') === 'true';
            const state = option.getAttribute('data-state');
            console.log(`  ${index + 1}. ${text} - Selected: ${isSelected}, State: ${state}`);
        });
    } else {
        console.log('[MODE DIAGNOSTIC] Dropdown is CLOSED');
    }
    
    // Check sessionStorage
    console.log('[MODE DIAGNOSTIC] SessionStorage veo_flow_mode:', sessionStorage.getItem('veo_flow_mode'));
    
    // Check if we're on a project page
    console.log('[MODE DIAGNOSTIC] Current URL:', window.location.href);
    console.log('[MODE DIAGNOSTIC] Is Flow project page:', window.location.href.includes('labs.google/fx/ko/tools/flow/project/'));
}

// Run diagnostic immediately
checkCurrentMode();

// Also check after a delay
setTimeout(() => {
    console.log('\n[MODE DIAGNOSTIC] Checking again after 2 seconds...');
    checkCurrentMode();
}, 2000);

// Export for manual use
window.modeCheck = checkCurrentMode;