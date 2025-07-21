// Remove ALL previous event listeners and interceptors
if (window._downloadInterceptorCleanup) {
    window._downloadInterceptorCleanup();
}

// No longer need to inject QR code library - using API instead

// Function to show QR code overlay
window.showQROverlay = function(url) {
    console.log('showQROverlay called with URL:', url);
    
    // Remove existing overlay if any
    const existingOverlay = document.getElementById('veo-qr-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'veo-qr-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        backdrop-filter: blur(5px);
    `;
    
    // Create popup container
    const popup = document.createElement('div');
    popup.style.cssText = `
        background-color: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        position: relative;
    `;
    
    // Add close button
    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 30px;
        line-height: 30px;
        color: #666;
        transition: all 0.2s;
        font-weight: 300;
    `;
    closeBtn.onmouseover = () => {
        closeBtn.style.transform = 'scale(1.2)';
        closeBtn.style.color = '#000';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.transform = 'scale(1)';
        closeBtn.style.color = '#666';
    };
    closeBtn.onclick = () => overlay.remove();
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = '다운로드 QR 코드';
    title.style.cssText = `
        margin: 0 0 20px 0;
        color: #333;
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 24px;
    `;
    
    // Add QR code container
    const qrContainer = document.createElement('div');
    qrContainer.id = 'veo-qr-code';
    qrContainer.style.cssText = `
        margin: 20px auto;
        display: inline-block;
        padding: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 10px;
    `;
    
    // Generate QR code using QR Server API
    const qrImg = document.createElement('img');
    qrImg.style.cssText = `
        display: block;
        width: 256px;
        height: 256px;
    `;
    
    // Encode the URL for use in API
    const encodedData = encodeURIComponent(url);
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedData}`;
    
    qrImg.onerror = function() {
        // Fallback if API fails
        this.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.style.cssText = 'width:256px;height:256px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#666;border-radius:8px;';
        fallback.textContent = 'QR Code Error';
        qrContainer.appendChild(fallback);
    };
    
    qrContainer.appendChild(qrImg);
    
    // Add URL text
    const urlText = document.createElement('p');
    urlText.textContent = url;
    urlText.style.cssText = `
        margin: 20px 0 0 0;
        font-size: 12px;
        color: #666;
        word-break: break-all;
        max-width: 300px;
        font-family: monospace;
    `;
    
    // Add instruction text
    const instruction = document.createElement('p');
    instruction.textContent = '모바일로 QR 코드를 스캔하여 다운로드하세요';
    instruction.style.cssText = `
        margin: 15px 0 0 0;
        font-size: 14px;
        color: #888;
        font-family: 'Noto Sans KR', sans-serif;
    `;
    
    // Assemble popup
    popup.appendChild(closeBtn);
    popup.appendChild(title);
    popup.appendChild(qrContainer);
    popup.appendChild(urlText);
    popup.appendChild(instruction);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Close on overlay click (not popup)
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    };
    
    // Close on Escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
};

// Store cleanup function
window._downloadInterceptorCleanup = function() {
    // Remove all event listeners
    if (window._abortController) {
        window._abortController.abort();
    }
    // Clear mutation observer
    if (window._downloadObserver) {
        window._downloadObserver.disconnect();
    }
};

// Create abort controller for event listeners
window._abortController = new AbortController();

// Function to intercept download button clicks
function interceptDownloadButton(e) {
    const target = e.target;
    
    // Check if this is a download button using various selectors
    const isDownloadButton = 
        target.closest('[aria-label*="다운로드"]') || 
        target.closest('[aria-label*="Download"]') ||
        target.closest('[data-tooltip*="Download"]') ||
        target.closest('button[jsname="V67aGc"]') || // Google's download button
        (target.closest('button') && target.closest('button').textContent.toLowerCase().includes('download'));
    
    if (isDownloadButton) {
        console.log(`Download button ${e.type} intercepted at ${new Date().toISOString()}`);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Only process on actual click events
        if (e.type === 'click') {
            // Disable the button temporarily to prevent double clicks
            const button = target.closest('button');
            if (button) {
                button.style.pointerEvents = 'none';
                setTimeout(() => {
                    button.style.pointerEvents = '';
                }, 1000);
            }
            
            // Try multiple methods to find the video URL
            let videoUrl = null;
            
            // Method 1: Look for video element
            const videoElement = document.querySelector('video[src]');
            if (videoElement && videoElement.src) {
                videoUrl = videoElement.src;
                console.log('Found video URL from element:', videoUrl);
            }
            
            // Method 2: Look for video in parent container
            if (!videoUrl) {
                const container = target.closest('[role="main"]') || target.closest('[data-video-url]');
                if (container) {
                    const video = container.querySelector('video[src]');
                    if (video && video.src) {
                        videoUrl = video.src;
                        console.log('Found video URL from container:', videoUrl);
                    }
                }
            }
            
            // Method 3: Extract from data attributes or nearby elements
            if (!videoUrl) {
                // Look for any element with a Google video URL
                const allElements = document.querySelectorAll('*');
                for (let elem of allElements) {
                    const text = elem.textContent || '';
                    if (text.includes('lh3.googleusercontent.com') && text.includes('=m22-dv')) {
                        videoUrl = text.match(/https?:\/\/[^\s]+/)?.[0];
                        if (videoUrl) {
                            console.log('Found video URL from text:', videoUrl);
                            break;
                        }
                    }
                }
            }
            
            if (videoUrl) {
                window.showQROverlay(videoUrl);
            } else {
                console.log('No video URL found, intercepting next network request...');
                // Set flag to intercept next video request
                window._interceptNextVideo = true;
            }
        }
        
        return false;
    }
}

// Add event listeners with abort signal
['click', 'pointerdown', 'mousedown'].forEach(eventType => {
    document.addEventListener(eventType, interceptDownloadButton, {
        capture: true,
        signal: window._abortController.signal
    });
});

// Intercept fetch requests for video downloads
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    
    if (url) {
        // Check if this is a video download URL
        const isVideoUrl = 
            (url.includes('lh3.googleusercontent.com') && url.includes('=m22-dv')) ||
            (url.includes('lh3.google.com/fife/') && url.includes('=s0-I-m22-dv')) ||
            url.includes('drum.usercontent.google.com/download/') ||
            url.includes('videoplayback') ||
            url.includes('itag=') ||
            url.includes('mime=video');
        
        if (isVideoUrl || window._interceptNextVideo) {
            console.log('Video fetch intercepted:', url);
            window._interceptNextVideo = false;
            
            // Show QR code
            setTimeout(() => {
                window.showQROverlay(url);
            }, 0);
            
            // Return empty response
            return Promise.resolve(new Response('', {status: 200}));
        }
    }
    
    return originalFetch.apply(this, args);
};

// Monitor DOM for download buttons
window._downloadObserver = new MutationObserver(function(mutations) {
    // Re-check for download buttons periodically
    const downloadButtons = document.querySelectorAll('[aria-label*="다운로드"], [aria-label*="Download"], button[jsname="V67aGc"]');
    if (downloadButtons.length > 0) {
        console.log(`Found ${downloadButtons.length} download buttons in DOM`);
    }
});

window._downloadObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label', 'data-tooltip']
});

console.log('Download interceptor fully initialized with persistent handling');