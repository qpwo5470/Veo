// Efficient Flow UI hider - single CSS injection
(function() {
    if (document.getElementById('veo-ui-hider')) return;
    
    const style = document.createElement('style');
    style.id = 'veo-ui-hider';
    style.textContent = `
        /* Hide UI elements */
        .MqrLh:has-text("2025년"), 
        .MqrLh:has-text("월"), 
        .MqrLh:has-text("일"),
        .goSPNE, .gNJurX, 
        a[href*="discord"], a[href*="faq"],
        .Logo_container__QTJew, 
        .Navigation_navigation__K3ZWw,
        .FixedPositionControl_topLeft__LnSf_ {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
    
    // Hide toolbar after 5 seconds
    setTimeout(() => {
        const toolbar = document.querySelector('.gxAzIM');
        if (toolbar) toolbar.style.display = 'none';
    }, 5000);
})();