// Fixed Flow UI hider - proper CSS and element hiding
(function() {
    if (document.getElementById('veo-ui-hider')) return;
    
    // Inject CSS for class-based hiding
    const style = document.createElement('style');
    style.id = 'veo-ui-hider';
    style.textContent = `
        /* Hide UI elements by class */
        .goSPNE, .gNJurX, 
        a[href*="discord"], a[href*="faq"],
        .Logo_container__QTJew, 
        .Navigation_navigation__K3ZWw,
        .FixedPositionControl_topLeft__LnSf_,
        /* Hide the top navigation bar */
        .sc-b2e18568-0,
        /* Hide date elements */
        .MqrLh {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
    
    // Hide specific text elements using JavaScript
    function hideTextElements() {
        // Find and hide date-related elements
        document.querySelectorAll('.MqrLh').forEach(el => {
            const text = el.textContent || '';
            if (text.includes('2025년') || text.includes('월') || text.includes('일')) {
                el.style.display = 'none';
            }
        });
        
        // Hide toolbar after delay
        const toolbar = document.querySelector('.gxAzIM');
        if (toolbar) {
            toolbar.style.display = 'none';
        }
    }
    
    // Initial hide
    hideTextElements();
    
    // Hide again after 2 seconds (for dynamic content)
    setTimeout(hideTextElements, 2000);
    
    // Hide toolbar after 5 seconds
    setTimeout(() => {
        const toolbar = document.querySelector('.gxAzIM');
        if (toolbar) toolbar.style.display = 'none';
    }, 5000);
})();