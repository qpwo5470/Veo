// Universal home button - shows on all Veo pages
(function() {
    function injectHomeButton() {
        if (document.getElementById('veo-home-button')) return;
        
        const homeButton = document.createElement('button');
        homeButton.id = 'veo-home-button';
        homeButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 50px;
            height: 50px;
            background: #4285F4;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            z-index: 999999;
        `;
        
        // Create SVG using DOM methods
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.style.fill = 'none';
        svg.style.stroke = 'white';
        svg.style.strokeWidth = '2';
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M12 2.1L2 10v11h7v-7h6v7h7V10L12 2.1z');
        
        svg.appendChild(path);
        homeButton.appendChild(svg);
        
        // Add hover effects
        homeButton.onmouseover = () => {
            homeButton.style.background = '#3367D6';
            homeButton.style.transform = 'scale(1.1)';
        };
        
        homeButton.onmouseout = () => {
            homeButton.style.background = '#4285F4';
            homeButton.style.transform = 'scale(1)';
        };
        
        // Add click handler
        homeButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Delete chats if available
            if (window.deleteAllChats) {
                window.deleteAllChats();
            } else {
                // Direct navigation signal
                const signal = document.createElement('div');
                signal.id = 'veo-navigate-to-pg1';
                signal.style.display = 'none';
                document.body.appendChild(signal);
            }
        };
        
        document.body.appendChild(homeButton);
    }
    
    // Check if we're on any Veo-related page
    function isVeoPage() {
        const url = window.location.href;
        return url.includes('labs.google') || 
               url.includes('veo.google') ||
               url.includes('gcdemos') ||
               url.includes('flow') ||
               url.includes('dreamstudio') ||
               // Check for specific Veo identifiers in the page
               document.querySelector('[class*="flow"]') ||
               document.querySelector('[class*="veo"]') ||
               document.querySelector('[id*="veo"]');
    }
    
    // Inject on Veo pages
    if (isVeoPage()) {
        // Initial injection
        injectHomeButton();
        
        // Also inject after a short delay in case page loads dynamically
        setTimeout(injectHomeButton, 1000);
        setTimeout(injectHomeButton, 3000);
    }
    
    // Monitor for navigation to Veo pages
    let lastUrl = window.location.href;
    const checkForUrlChange = () => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            if (isVeoPage()) {
                setTimeout(injectHomeButton, 500);
            }
        }
    };
    
    // Check periodically for URL changes (for SPAs)
    setInterval(checkForUrlChange, 1000);
})();