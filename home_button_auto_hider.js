// Home Button Auto-Hider - Hide home button when percentage is showing
(function() {
    console.log('🏠 Home Button Auto-Hider starting...');
    
    let homeButton = null;
    let isHidden = false;
    let lastPercentageTime = 0;
    
    // Function to find home button
    function findHomeButton() {
        // Look for the home button by various methods
        homeButton = document.querySelector('#veo-home-button') || 
                    document.querySelector('.veo-home-button') ||
                    document.querySelector('button[title="Go to Home"]') ||
                    document.querySelector('button[onclick*="goToHome"]') ||
                    document.querySelector('button:has(svg path[d*="M12 2.1L2 10v11h7v-7h6v7h7V10L12 2.1z"])');
        
        return homeButton;
    }
    
    // Function to check for percentage on screen
    function hasPercentageOnScreen() {
        // Method 1: Look for any element containing percentage
        const allElements = document.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
            const element = allElements[i];
            
            // Skip script and style tags
            if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') continue;
            
            // Get direct text content (not from children)
            let text = '';
            for (let j = 0; j < element.childNodes.length; j++) {
                const node = element.childNodes[j];
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
            }
            
            text = text.trim();
            
            // Check if it contains percentage
            if (text && /\d+%/.test(text)) {
                // Make sure element is visible
                const style = window.getComputedStyle(element);
                if (style.display !== 'none' && 
                    style.visibility !== 'hidden' && 
                    style.opacity !== '0') {
                    
                    const rect = element.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        console.log('🎯 Found percentage:', text, 'in', element.className || element.tagName);
                        return true;
                    }
                }
            }
        }
        
        // Method 2: Check specific selectors for Google's UI
        const percentageSelectors = [
            // Styled components patterns
            'div[class*="sc-"]',
            'span[class*="sc-"]',
            // Common progress/loading patterns
            '[class*="progress"]',
            '[class*="percent"]',
            '[class*="loading"]',
            '[class*="status"]',
            // Specific classes from example
            '.krAKfQ',
            // Any div that might contain percentage
            'div:not(:empty)',
            'span:not(:empty)'
        ];
        
        for (const selector of percentageSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    const text = el.textContent?.trim() || '';
                    // More flexible percentage matching
                    if (/\d{1,3}\s*%/.test(text) || /^\d{1,3}%$/.test(text)) {
                        // Double check visibility
                        const rect = el.getBoundingClientRect();
                        if (rect.top >= 0 && rect.left >= 0 && 
                            rect.bottom <= window.innerHeight && 
                            rect.right <= window.innerWidth &&
                            rect.width > 0 && rect.height > 0) {
                            console.log('🎯 Found percentage via selector:', selector, text);
                            return true;
                        }
                    }
                }
            } catch (e) {
                // Ignore selector errors
            }
        }
        
        // Method 3: Check for percentage in page text
        const bodyText = document.body.innerText || document.body.textContent || '';
        const percentageMatch = bodyText.match(/\b\d{1,3}%/);
        if (percentageMatch) {
            console.log('🎯 Found percentage in page text:', percentageMatch[0]);
            return true;
        }
        
        return false;
    }
    
    // Function to hide/show home button
    function updateHomeButtonVisibility() {
        if (!homeButton) {
            homeButton = findHomeButton();
            if (!homeButton) return;
        }
        
        const hasPercentage = hasPercentageOnScreen();
        
        if (hasPercentage && !isHidden) {
            // Hide the button
            homeButton.style.transition = 'opacity 0.3s ease-out';
            homeButton.style.opacity = '0';
            setTimeout(() => {
                if (homeButton) {
                    homeButton.style.display = 'none';
                }
            }, 300);
            isHidden = true;
            lastPercentageTime = Date.now();
            console.log('🏠 Home button hidden - percentage detected');
        } else if (!hasPercentage && isHidden) {
            // Only show if percentage has been gone for at least 1 second
            if (Date.now() - lastPercentageTime > 1000) {
                // Show the button
                homeButton.style.display = '';
                setTimeout(() => {
                    if (homeButton) {
                        homeButton.style.opacity = '1';
                    }
                }, 10);
                isHidden = false;
                console.log('🏠 Home button shown - no percentage detected');
            }
        }
    }
    
    // Monitor for changes
    function startMonitoring() {
        // Initial check
        updateHomeButtonVisibility();
        
        // Check more frequently during active periods
        let checkInterval = 250; // Check every 250ms
        setInterval(updateHomeButtonVisibility, checkInterval);
        
        // Also add debug logging
        setInterval(() => {
            const hasPercent = hasPercentageOnScreen();
            if (hasPercent) {
                console.log('🔍 Percentage detection active - home button should be hidden');
            }
        }, 2000);
        
        // Also monitor DOM changes
        const observer = new MutationObserver((mutations) => {
            // Check if any mutation might have added/removed percentage
            let shouldCheck = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // Check added nodes
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 && node.textContent?.includes('%')) {
                            shouldCheck = true;
                            break;
                        }
                    }
                    // Check removed nodes
                    for (const node of mutation.removedNodes) {
                        if (node.nodeType === 1 && node.textContent?.includes('%')) {
                            shouldCheck = true;
                            break;
                        }
                    }
                } else if (mutation.type === 'characterData') {
                    // Text content changed
                    if (mutation.target.textContent?.includes('%')) {
                        shouldCheck = true;
                    }
                }
            }
            
            if (shouldCheck) {
                updateHomeButtonVisibility();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
    // Start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMonitoring);
    } else {
        startMonitoring();
    }
    
    // Also start monitoring when navigating to Flow pages
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        setTimeout(() => {
            homeButton = null; // Reset to find new button
            updateHomeButtonVisibility();
        }, 100);
    };
    
    history.replaceState = function() {
        originalReplaceState.apply(history, arguments);
        setTimeout(() => {
            homeButton = null; // Reset to find new button
            updateHomeButtonVisibility();
        }, 100);
    };
    
    // Manual controls for debugging
    window.homeButtonHider = {
        checkPercentage: hasPercentageOnScreen,
        findButton: findHomeButton,
        hide: () => {
            if (homeButton) {
                homeButton.style.display = 'none';
                isHidden = true;
            }
        },
        show: () => {
            if (homeButton) {
                homeButton.style.display = '';
                homeButton.style.opacity = '1';
                isHidden = false;
            }
        },
        status: () => {
            console.log('Home button:', homeButton);
            console.log('Is hidden:', isHidden);
            console.log('Has percentage:', hasPercentageOnScreen());
        }
    };
    
    console.log('✅ Home Button Auto-Hider ready');
    console.log('Commands: homeButtonHider.status(), .checkPercentage(), .hide(), .show()');
})();