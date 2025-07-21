// Button replacer approach - replace download buttons with QR triggers
console.log('Button replacer starting...');

// Function to replace download button functionality
function replaceDownloadButton(button) {
    if (button._qrReplaced) return; // Already processed
    button._qrReplaced = true;
    
    console.log('Replacing download button:', button);
    
    // Clone the button to remove all existing event listeners
    const newButton = button.cloneNode(true);
    newButton._qrReplaced = true;
    
    // Add our own click handler
    newButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        console.log('QR button clicked');
        
        // Find video URL
        let videoUrl = null;
        
        // Method 1: Look for nearby video element
        const container = this.closest('[role="main"]') || this.closest('.flow-content') || document.body;
        const video = container.querySelector('video[src]');
        if (video && video.src) {
            videoUrl = video.src;
        }
        
        // Method 2: Look for video URL in page
        if (!videoUrl) {
            const allVideos = document.querySelectorAll('video[src]');
            if (allVideos.length > 0) {
                videoUrl = allVideos[allVideos.length - 1].src; // Get most recent video
            }
        }
        
        // Method 3: Use test URL if no video found
        if (!videoUrl) {
            console.log('No video found, using test URL');
            videoUrl = 'https://example.com/no-video-found';
        }
        
        console.log('Showing QR for URL:', videoUrl);
        if (window.showQROverlay) {
            window.showQROverlay(videoUrl);
        }
        
        return false;
    }, true);
    
    // Replace the original button
    button.parentNode.replaceChild(newButton, button);
}

// Function to find and replace all download buttons
function replaceAllDownloadButtons() {
    const selectors = [
        '[aria-label*="다운로드"]',
        '[aria-label*="Download"]',
        '[data-tooltip*="Download"]',
        'button[jsname="V67aGc"]',
        'button:has(svg path[d*="M19"])', // Download icon path
        'button:contains("download")'
    ];
    
    const buttons = document.querySelectorAll(selectors.join(', '));
    let count = 0;
    
    buttons.forEach(button => {
        if (!button._qrReplaced) {
            replaceDownloadButton(button);
            count++;
        }
    });
    
    // Also check buttons by text content
    document.querySelectorAll('button').forEach(button => {
        if (button.textContent && button.textContent.toLowerCase().includes('download') && !button._qrReplaced) {
            replaceDownloadButton(button);
            count++;
        }
    });
    
    if (count > 0) {
        console.log(`Replaced ${count} download buttons`);
    }
}

// Run replacement immediately
replaceAllDownloadButtons();

// Monitor for new buttons
const buttonObserver = new MutationObserver(function(mutations) {
    let shouldReplace = false;
    
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
                if (node.tagName === 'BUTTON' || node.querySelector('button')) {
                    shouldReplace = true;
                }
            }
        });
    });
    
    if (shouldReplace) {
        setTimeout(replaceAllDownloadButtons, 100);
    }
});

buttonObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Also run periodically to catch any missed buttons
setInterval(replaceAllDownloadButtons, 2000);

console.log('Button replacer initialized');