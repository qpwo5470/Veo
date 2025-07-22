// Fixed Veo 2 selector - properly finds and clicks the option
(function() {
    let attempted = false;
    
    async function selectVeo2Once() {
        if (attempted) return;
        attempted = true;
        
        // Check if in asset mode
        const modeBtn = document.querySelector('button[role="combobox"]');
        if (!modeBtn || !modeBtn.textContent.includes('애셋으로 동영상 만들기')) return;
        
        // Wait for UI to stabilize
        await new Promise(r => setTimeout(r, 2000));
        
        // Find and click settings button
        const settingsBtn = Array.from(document.querySelectorAll('button')).find(b => 
            b.querySelector('i')?.textContent === 'tune'
        );
        
        if (!settingsBtn) return;
        
        settingsBtn.click();
        await new Promise(r => setTimeout(r, 500));
        
        // Find model dropdown button - look for button with "모델" text and current model name
        const modelButton = Array.from(document.querySelectorAll('button[role="combobox"]')).find(btn => {
            const text = btn.textContent || '';
            return text.includes('모델') && (text.includes('Veo') || text.includes('모델'));
        });
        
        if (!modelButton) return;
        
        // Check if already Veo 2 - Quality
        if (modelButton.textContent.includes('Veo 2 - Quality')) return;
        
        // Click to open dropdown
        modelButton.click();
        await new Promise(r => setTimeout(r, 300));
        
        // Find Veo 2 - Quality option by looking for the specific text in role="option" elements
        const veo2Option = Array.from(document.querySelectorAll('[role="option"]')).find(option => {
            const spanText = option.querySelector('span')?.textContent || '';
            return spanText === 'Veo 2 - Quality';
        });
        
        if (veo2Option) {
            veo2Option.click();
            console.log('Selected Veo 2 - Quality model');
        }
    }
    
    // Run once after page loads
    if (window.location.href.includes('labs.google/fx/ko/tools/flow/project/')) {
        setTimeout(selectVeo2Once, 3000);
    }
})();