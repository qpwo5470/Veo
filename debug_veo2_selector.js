// Debug Veo 2 selector - logs each step for troubleshooting
window.debugVeo2Selector = async function() {
    console.log('Starting Veo 2 selection debug...');
    
    // Check mode
    const modeBtn = document.querySelector('button[role="combobox"]');
    console.log('Mode button found:', modeBtn);
    console.log('Mode text:', modeBtn?.textContent);
    
    if (!modeBtn || !modeBtn.textContent.includes('애셋으로 동영상 만들기')) {
        console.log('Not in asset mode, exiting');
        return;
    }
    
    // Find settings button
    const settingsBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.querySelector('i')?.textContent === 'tune'
    );
    console.log('Settings button found:', settingsBtn);
    
    if (!settingsBtn) {
        console.log('No settings button found');
        return;
    }
    
    console.log('Clicking settings button...');
    settingsBtn.click();
    await new Promise(r => setTimeout(r, 500));
    
    // Find all combobox buttons
    const allComboboxes = document.querySelectorAll('button[role="combobox"]');
    console.log('All combobox buttons:', allComboboxes);
    
    allComboboxes.forEach((btn, i) => {
        console.log(`Combobox ${i}:`, btn.textContent);
    });
    
    // Find model button
    const modelButton = Array.from(allComboboxes).find(btn => {
        const text = btn.textContent || '';
        return text.includes('모델');
    });
    
    console.log('Model button found:', modelButton);
    console.log('Model button text:', modelButton?.textContent);
    
    if (!modelButton) return;
    
    console.log('Clicking model button...');
    modelButton.click();
    await new Promise(r => setTimeout(r, 500));
    
    // Find all options
    const allOptions = document.querySelectorAll('[role="option"]');
    console.log('All options found:', allOptions.length);
    
    allOptions.forEach((opt, i) => {
        const span = opt.querySelector('span');
        console.log(`Option ${i}:`, span?.textContent, '- Full HTML:', opt.innerHTML);
    });
    
    // Find Veo 2 - Quality
    const veo2Option = Array.from(allOptions).find(option => {
        const spanText = option.querySelector('span')?.textContent || '';
        return spanText === 'Veo 2 - Quality';
    });
    
    console.log('Veo 2 - Quality option found:', veo2Option);
    
    if (veo2Option) {
        console.log('Clicking Veo 2 - Quality...');
        veo2Option.click();
        console.log('Selection complete!');
    } else {
        console.log('Veo 2 - Quality option not found!');
    }
};