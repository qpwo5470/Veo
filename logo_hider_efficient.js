// Efficient logo hider - CSS only, no continuous monitoring
(function() {
    if (document.getElementById('logo-hider-css')) return;
    
    const style = document.createElement('style');
    style.id = 'logo-hider-css';
    style.textContent = `
        .Logo_container__QTJew,
        .Navigation_navigation__K3ZWw,
        .FixedPositionControl_topLeft__LnSf_,
        .FixedPositionControl_container__A3U5P {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
})();