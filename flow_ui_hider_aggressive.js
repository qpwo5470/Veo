// Aggressive Flow UI hider - hides all unnecessary UI elements
(function() {
    if (document.getElementById('veo-ui-hider-aggressive')) return;
    
    // Inject aggressive CSS
    const style = document.createElement('style');
    style.id = 'veo-ui-hider-aggressive';
    style.textContent = `
        /* Hide navigation and header elements */
        [class*="Navigation"], 
        [class*="navigation"],
        [class*="Header"],
        [class*="header"],
        nav, header,
        /* Hide specific classes */
        .goSPNE, .gNJurX, 
        .sc-b2e18568-0,
        .sc-b2e18568-1,
        .sc-b2e18568-2,
        /* Hide links */
        a[href*="discord"], 
        a[href*="faq"],
        /* Hide logo containers */
        [class*="Logo"],
        [class*="logo"],
        /* Hide position controls */
        .FixedPositionControl_topLeft__LnSf_,
        /* Hide date elements */
        .MqrLh,
        /* Hide toolbar after delay */
        .gxAzIM {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
        }
        
        /* Ensure main content takes full space */
        main, [role="main"] {
            margin-top: 0 !important;
            padding-top: 0 !important;
        }
    `;
    document.head.appendChild(style);
    
    // Additional JavaScript-based hiding
    function aggressiveHide() {
        // Hide any element that looks like a header/nav
        const selectors = [
            '[class*="Navigation"]',
            '[class*="navigation"]', 
            '[class*="Header"]',
            '[class*="header"]',
            'nav',
            'header',
            '.goSPNE',
            '.gNJurX',
            '.gxAzIM',
            '[class*="Logo"]',
            '[class*="logo"]'
        ];
        
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
                el.style.height = '0';
                el.style.overflow = 'hidden';
            });
        });
        
        // Hide date elements with specific text
        document.querySelectorAll('.MqrLh, [class*="date"], [class*="Date"]').forEach(el => {
            const text = el.textContent || '';
            if (text.includes('2025년') || text.includes('2024년') || 
                text.includes('월') || text.includes('일') || 
                text.includes('년')) {
                el.style.display = 'none';
            }
        });
    }
    
    // Run multiple times to catch dynamic content
    aggressiveHide();
    setTimeout(aggressiveHide, 1000);
    setTimeout(aggressiveHide, 2000);
    setTimeout(aggressiveHide, 3000);
    setTimeout(aggressiveHide, 5000);
    
    // Monitor for new elements
    const observer = new MutationObserver(() => {
        aggressiveHide();
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
    
    // Stop observer after 10 seconds to save resources
    setTimeout(() => observer.disconnect(), 10000);
})();