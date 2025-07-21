// Home button injector for external pages
// Home button injector starting

// Function to inject home button
function injectHomeButton() {
    // Check if home button already exists
    if (document.getElementById('veo-home-button')) {
        return;
    }
    
    // Create home button
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
    
    // Add SVG icon that looks like home (white color to match the image)
    homeButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="fill: none; stroke: white; stroke-width: 2;">
            <path d="M12 2.1L2 10v11h7v-7h6v7h7V10L12 2.1z"/>
        </svg>
    `;
    
    // Add hover effect
    homeButton.onmouseover = () => {
        homeButton.style.background = '#3367D6';
        homeButton.style.transform = 'scale(1.1)';
        homeButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    };
    
    homeButton.onmouseout = () => {
        homeButton.style.background = '#4285F4';
        homeButton.style.transform = 'scale(1)';
        homeButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    };
    
    // Add click handler to navigate to pg1
    homeButton.onclick = () => {
        // Send message to Python to navigate home
        // Home button clicked - will delete chats then navigate to home
        
        // Check if this is a Flow page (text/image to video)
        const isFlowPage = window.location.href.includes('labs.google/fx/ko/tools/flow');
        
        if (isFlowPage && typeof window.deleteAllChatsAndGoHome === 'function') {
            // Delete all chats first, then go home
            // On Flow page - deleting chats first
            window.deleteAllChatsAndGoHome();
        } else {
            // Not on Flow page or function not available, go home directly
            // Not on Flow page or chat deleter not available - going home directly
            const navSignal = document.createElement('div');
            navSignal.id = 'veo-navigate-to-pg1';
            navSignal.style.display = 'none';
            navSignal.setAttribute('data-timestamp', Date.now());
            document.body.appendChild(navSignal);
        }
    };
    
    // Add tooltip
    homeButton.title = 'Go to Home';
    
    // Append to body
    document.body.appendChild(homeButton);
    
    // Home button injected successfully
}

// Inject immediately
injectHomeButton();

// Also inject after DOM content loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHomeButton);
}

// Monitor for page changes (for SPAs)
const observer = new MutationObserver(() => {
    injectHomeButton();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Home button injector ready