// Persistent logo hider for Google Flow
// Persistent logo hider for Google Flow

// Function to hide logo and navigation elements
function hideLogoElements() {
    // Hide Google Cloud button
    const googleCloudButton = document.querySelector('.Logo_container__QTJew');
    if (googleCloudButton && googleCloudButton.style.display !== 'none') {
        googleCloudButton.style.display = 'none';
        // Hidden Google Cloud button
    }
    
    // Hide entire navigation container
    const navContainer = document.querySelector('.Navigation_navigation__K3ZWw');
    if (navContainer && navContainer.style.display !== 'none') {
        navContainer.style.display = 'none';
        // Hidden navigation container
    }
    
    // Hide fixed position control container
    const fixedControl = document.querySelector('.FixedPositionControl_topLeft__LnSf_');
    if (fixedControl && fixedControl.style.display !== 'none') {
        fixedControl.style.display = 'none';
        // Hidden fixed position control
    }
    
    // Also hide by more specific selectors if needed
    const fixedContainer = document.querySelector('.FixedPositionControl_container__A3U5P.FixedPositionControl_topLeft__LnSf_');
    if (fixedContainer && fixedContainer.style.display !== 'none') {
        fixedContainer.style.display = 'none';
        // Hidden fixed container
    }
}

// Initial hide
hideLogoElements();

// Set up MutationObserver to catch dynamically added elements
const observer = new MutationObserver((mutations) => {
    // Check if any logo elements were added
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            // Check added nodes
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    // Check if it's a logo element or contains one
                    if (node.classList && (
                        node.classList.contains('Logo_container__QTJew') ||
                        node.classList.contains('Navigation_navigation__K3ZWw') ||
                        node.classList.contains('FixedPositionControl_topLeft__LnSf_')
                    )) {
                        hideLogoElements();
                    } else if (node.querySelector) {
                        // Check if it contains logo elements
                        if (node.querySelector('.Logo_container__QTJew, .Navigation_navigation__K3ZWw, .FixedPositionControl_topLeft__LnSf_')) {
                            hideLogoElements();
                        }
                    }
                }
            });
        }
    }
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Also hide periodically as a fallback
setInterval(hideLogoElements, 1000);

// Persistent logo hider ready