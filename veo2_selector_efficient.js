// Efficient Veo 2 selector - runs once and stops
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
        
        // Find and click settings
        const settingsBtn = Array.from(document.querySelectorAll('button')).find(b => 
            b.querySelector('i')?.textContent === 'tune'
        );
        
        if (!settingsBtn) return;
        
        settingsBtn.click();
        await new Promise(r => setTimeout(r, 500));
        
        // Find model control - simple approach
        const modelControl = Array.from(document.querySelectorAll('*')).find(el => {
            const text = el.textContent || '';
            return el.tagName.match(/BUTTON|DIV/) && 
                   text.includes('모델') && 
                   text.includes('Veo') &&
                   text.length < 50;
        });
        
        if (!modelControl || modelControl.textContent.includes('Veo 2')) return;
        
        modelControl.click();
        await new Promise(r => setTimeout(r, 300));
        
        // Click Veo 2 option
        const veo2 = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent.includes('Veo 2') && 
            el.textContent.includes('Quality') &&
            !el.textContent.includes('Veo 3')
        );
        
        if (veo2) veo2.click();
    }
    
    // Run once after page loads
    if (window.location.href.includes('labs.google/fx/ko/tools/flow/project/')) {
        setTimeout(selectVeo2Once, 3000);
    }
})();