// Minimal Flow UI hider - one-time CSS injection only
(function() {
    if (document.getElementById('veo-ui-hider-min')) return;
    
    const style = document.createElement('style');
    style.id = 'veo-ui-hider-min';
    style.textContent = `
        /* Hide all navigation and UI elements at once */
        [class*="Navigation"], 
        [class*="navigation"],
        [class*="Header"],
        [class*="header"],
        [class*="Logo"],
        [class*="logo"],
        .goSPNE, .gNJurX, 
        .gxAzIM,
        .MqrLh,
        nav, header,
        a[href*="discord"], 
        a[href*="faq"] {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
})();