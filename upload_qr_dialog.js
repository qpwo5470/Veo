// QR Code dialog for uploaded videos
if (window.uploadQRDialogInitialized) {
    return;
}
window.uploadQRDialogInitialized = true;

// Store dialog reference globally
let currentDialog = null;

// Track shown uploads to avoid duplicates
let shownUploads = new Set();
let lastShownUploadKey = null;
let dismissedUploads = new Set(); // Track uploads that user has closed

// Function to show loading spinner with video preview
window.showUploadLoadingSpinner = function(downloadButton) {
    // If spinner already showing, don't create another
    if (currentDialog && currentDialog.querySelector('.veo-spinner')) {
        // Spinner already showing, skipping duplicate
        return;
    }
    
    // Remove any existing dialog
    if (currentDialog) currentDialog.remove();
    
    // Find the video associated with the download button
    let videoElement = null;
    
    if (downloadButton) {
        // Strategy 1: Look for video in the same card/container structure
        // Go up until we find a container that has both video and download button
        let parent = downloadButton;
        let maxLevels = 15;
        
        while (parent && maxLevels > 0) {
            // Check if this container has exactly one video
            const videos = parent.querySelectorAll('video');
            if (videos.length === 1) {
                // Verify this video is visible
                const rect = videos[0].getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    videoElement = videos[0];
                    break;
                }
            } else if (videos.length > 1) {
                // Multiple videos in container, need to find the closest one
                // Check which video is in the same sub-container as our button
                const buttonRect = downloadButton.getBoundingClientRect();
                let closestVideo = null;
                let closestDistance = Infinity;
                
                videos.forEach(video => {
                    const videoRect = video.getBoundingClientRect();
                    // Calculate distance between button and video centers
                    const distance = Math.sqrt(
                        Math.pow(buttonRect.left + buttonRect.width/2 - videoRect.left - videoRect.width/2, 2) +
                        Math.pow(buttonRect.top + buttonRect.height/2 - videoRect.top - videoRect.height/2, 2)
                    );
                    
                    if (distance < closestDistance && videoRect.width > 0 && videoRect.height > 0) {
                        closestDistance = distance;
                        closestVideo = video;
                    }
                });
                
                if (closestVideo) {
                    videoElement = closestVideo;
                    break;
                }
            }
            
            parent = parent.parentElement;
            maxLevels--;
        }
    }
    
    // Fallback: if no video found from button, look for visible videos
    if (!videoElement) {
        const videos = document.querySelectorAll('video');
        for (const video of videos) {
            const rect = video.getBoundingClientRect();
            if (rect.width > 100 && rect.height > 100 && 
                rect.top >= 0 && rect.left >= 0 &&
                rect.bottom <= window.innerHeight && rect.right <= window.innerWidth) {
                videoElement = video;
                break;
            }
        }
    }
    
    // Create main container
    const dialog = document.createElement('div');
    dialog.id = 'veo-upload-qr-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        animation: fadeIn 0.3s ease-out;
    `;
    
    // Create content container
    const content = document.createElement('div');
    content.style.cssText = `
        position: relative;
        background: white;
        border-radius: 24px;
        padding: 24px;
        min-width: 400px;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: slideUp 0.4s ease-out;
    `;
    
    // Add title
    const title = document.createElement('h3');
    title.style.cssText = `
        margin: 0;
        font-family: 'Noto Sans KR', 'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 20px;
        color: #202124;
    `;
    title.textContent = '준비 중...';
    content.appendChild(title);
    
    // If we found a video, add video preview
    if (videoElement) {
        const videoContainer = document.createElement('div');
        videoContainer.style.cssText = `
            width: 100%;
            max-width: 500px;
            border-radius: 12px;
            overflow: hidden;
            background: #000;
        `;
        
        // Clone the video element
        const videoPreview = document.createElement('video');
        videoPreview.style.cssText = `
            width: 100%;
            height: auto;
            display: block;
        `;
        videoPreview.autoplay = true;
        videoPreview.loop = true;
        videoPreview.muted = true;
        videoPreview.playsInline = true;
        
        // Copy video source
        if (videoElement.src) {
            videoPreview.src = videoElement.src;
        } else {
            // Copy source elements
            const sources = videoElement.querySelectorAll('source');
            sources.forEach(source => {
                const newSource = source.cloneNode(true);
                videoPreview.appendChild(newSource);
            });
        }
        
        // Set current time to match
        videoPreview.currentTime = videoElement.currentTime;
        
        videoContainer.appendChild(videoPreview);
        content.appendChild(videoContainer);
        
        // Play the preview
        videoPreview.play().catch(() => {});
    }
    
    // Create spinner container
    const spinnerContainer = document.createElement('div');
    spinnerContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 15px;
    `;
    
    // Create spinner
    const spinner = document.createElement('div');
    spinner.className = 'veo-spinner';
    spinner.style.cssText = `
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #1a73e8;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    `;
    
    // Add loading text
    const loadingText = document.createElement('p');
    loadingText.style.cssText = `
        margin: 0;
        font-family: 'Noto Sans KR', 'Roboto', sans-serif;
        font-size: 14px;
        color: #5f6368;
    `;
    loadingText.textContent = '링크를 생성하고 있습니다...';
    
    spinnerContainer.appendChild(spinner);
    spinnerContainer.appendChild(loadingText);
    content.appendChild(spinnerContainer);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 15px;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: #5f6368;
        font-size: 20px;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    `;
    closeBtn.innerHTML = '✕';
    closeBtn.onmouseover = () => {
        closeBtn.style.background = 'rgba(0, 0, 0, 0.08)';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.background = 'transparent';
    };
    closeBtn.onclick = () => {
        dialog.remove();
        currentDialog = null;
    };
    
    content.appendChild(closeBtn);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    
    currentDialog = dialog;
    
    // Close on background click
    dialog.onclick = (e) => {
        if (e.target === dialog) {
            dialog.remove();
            currentDialog = null;
        }
    };
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            dialog.remove();
            currentDialog = null;
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    if (!document.querySelector('#veo-upload-styles')) {
        style.id = 'veo-upload-styles';
        document.head.appendChild(style);
    }
};

// Function to show QR dialog with download link
window.showUploadQRDialog = function(downloadLink) {
    // Remove any existing dialog (including spinner)
    if (currentDialog) {
        currentDialog.remove();
        currentDialog = null;
    }
    
    // Also remove by ID just in case
    const existingDialog = document.getElementById('veo-upload-qr-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    // Create new dialog
    const dialog = document.createElement('div');
    dialog.id = 'veo-upload-qr-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(dialog);
    currentDialog = dialog;
    
    // Create content container
    const content = document.createElement('div');
    content.style.cssText = `
        position: relative;
        background: white;
        border-radius: 24px;
        padding: 48px;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: contentFadeIn 0.4s ease-out;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
    `;
    
    // Title
    const title = document.createElement('h1');
    title.style.cssText = `
        font-size: 32px;
        line-height: 1.3;
        font-weight: 500;
        margin: 0;
        font-family: 'Noto Sans KR', 'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #202124;
        text-align: center;
        letter-spacing: -0.5px;
    `;
    title.innerHTML = '비디오를 세상과<br>공유해 보세요';
    
    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.style.cssText = `
        font-size: 16px;
        line-height: 1.5;
        color: #5f6368;
        margin: 0;
        font-family: 'Noto Sans KR', 'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        text-align: center;
    `;
    subtitle.innerHTML = '<strong>Gemini</strong>, <strong>Imagen</strong>, <strong>Veo</strong> 에이전트와<br>함께 만들어 주셔서 감사합니다.';
    
    // QR Code container with white background and shadow
    const qrWrapper = document.createElement('div');
    qrWrapper.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        margin: 16px 0;
    `;
    
    // QR container
    const qrContainer = document.createElement('div');
    qrContainer.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    // Generate QR code using QR Server API
    const qrImg = document.createElement('img');
    qrImg.style.cssText = `
        display: block;
        width: 260px;
        height: 260px;
    `;
    
    // Encode the download link for use in URL
    const encodedData = encodeURIComponent(downloadLink);
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodedData}`;
    
    qrImg.onerror = function() {
        // Fallback if API fails
        this.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.style.cssText = 'width:260px;height:260px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#666;border-radius:8px;';
        fallback.textContent = 'QR Code';
        qrContainer.appendChild(fallback);
    };
    
    qrContainer.appendChild(qrImg);
    qrWrapper.appendChild(qrContainer);
    
    // Privacy disclaimer with gray background
    const disclaimerWrapper = document.createElement('div');
    disclaimerWrapper.style.cssText = `
        background: #f8f9fa;
        border-radius: 12px;
        padding: 16px 24px;
        margin-top: 8px;
        max-width: 520px;
    `;
    
    const disclaimer = document.createElement('p');
    disclaimer.style.cssText = `
        font-size: 12px;
        line-height: 1.6;
        color: #5f6368;
        text-align: center;
        font-family: 'Noto Sans KR', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
        margin: 0;
    `;
    disclaimer.textContent = 'Google은 이 데모에서 생성된 결과물을 표시하거나 공개할 수 있습니다. 결과와 사용자를 연결하는 정보는 수집되지 않습니다.';
    
    disclaimerWrapper.appendChild(disclaimer);
    
    // Close button styled to match the original image
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        width: 97px;
        height: 32px;
        border: none;
        background: #4285f4;
        color: white;
        font-family: 'Product Sans', 'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 15px;
        font-weight: 400;
        border-radius: 4px;
        cursor: pointer;
        padding: 0;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeBtn.innerHTML = '<span style="margin-right: 6px;">✕</span>Close';
    
    closeBtn.onmouseover = () => {
        closeBtn.style.background = '#3367d6';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.background = '#4285f4';
    };
    closeBtn.onclick = () => {
        dialog.remove();
        currentDialog = null;
        // Mark this upload as dismissed
        if (lastShownUploadKey) {
            dismissedUploads.add(lastShownUploadKey);
        }
        lastShownUploadKey = null;
    };
    
    // Assemble elements
    content.appendChild(closeBtn);
    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(qrWrapper);
    content.appendChild(disclaimerWrapper);
    
    dialog.appendChild(content);
    
    // Add animations and font
    if (!document.querySelector('#veo-upload-styles')) {
        const style = document.createElement('style');
        style.id = 'veo-upload-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes contentFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            #veo-upload-qr-dialog * {
                box-sizing: border-box;
            }
            
            #veo-upload-qr-dialog strong {
                font-weight: 700;
                color: #202124;
            }
            
            /* Hide scrollbar but keep functionality */
            #veo-upload-qr-dialog > div > div {
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            #veo-upload-qr-dialog > div > div::-webkit-scrollbar {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Close on background click
    dialog.onclick = (e) => {
        if (e.target === dialog) {
            dialog.remove();
            currentDialog = null;
            // Mark this upload as dismissed
            if (lastShownUploadKey) {
                dismissedUploads.add(lastShownUploadKey);
            }
            lastShownUploadKey = null;
        }
    };
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            dialog.remove();
            currentDialog = null;
            // Mark this upload as dismissed
            if (lastShownUploadKey) {
                dismissedUploads.add(lastShownUploadKey);
            }
            lastShownUploadKey = null;
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
};

// Listen for upload complete messages
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'veo-upload-complete') {
        // Received upload complete
        window.showUploadQRDialog(event.data.link);
    } else if (event.data && event.data.type === 'veo-upload-loading') {
        // Showing loading spinner
        window.showUploadLoadingSpinner();
    }
});

// Also check for upload data periodically
async function checkForUploadComplete() {
    // Use only port 8888
    const port = 8888;
    
    try {
        const response = await fetch(`http://localhost:${port}/latest_upload.json?` + Date.now());
        if (response.ok) {
                const data = await response.json();
                // Fetched upload data
                if (data.timestamp) {
                    // Create unique key for this upload
                    const uploadKey = `${data.timestamp}_${data.link || 'loading'}`;
                    
                    // Check if user has dismissed this upload
                    if (dismissedUploads.has(uploadKey)) {
                        // User dismissed this upload
                        return;
                    }
                    
                    // Check if we've already shown this upload
                    if (!shownUploads.has(uploadKey)) {
                        // Check if this is a recent event (within last 30 seconds)
                        const uploadTime = new Date(data.timestamp);
                        const now = new Date();
                        const timeDiff = (now - uploadTime) / 1000; // seconds
                        // Time diff check
                        
                        if (timeDiff < 30) {  // Show uploads from last 30 seconds
                            shownUploads.add(uploadKey);
                            lastShownUploadKey = uploadKey;
                            
                            if (data.loading) {
                                // New upload starting - showing spinner
                                window.showUploadLoadingSpinner();
                            } else if (data.link) {
                                // New upload detected
                                window.showUploadQRDialog(data.link);
                            }
                        } else {
                            // Upload too old
                        }
                    } else {
                        // Already shown this upload
                    }
                }
            }
        } catch (error) {
            // Server not responding on port 8888
        }
    }

// Clear any existing interval before creating new one
if (window.uploadCheckInterval) {
    clearInterval(window.uploadCheckInterval);
}

// First check if server is available
let serverAvailable = false;
fetch('http://localhost:8888/latest_upload.json')
    .then(response => {
        if (response.ok) {
            serverAvailable = true;
            console.log('Upload server detected on port 8888');
            // Check every 1 second for faster response
            window.uploadCheckInterval = setInterval(checkForUploadComplete, 1000);
        }
    })
    .catch(() => {
        console.log('Upload server not running on port 8888 - monitoring disabled');
        // Don't set up interval if server is not available
    });

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.uploadCheckInterval) {
        clearInterval(window.uploadCheckInterval);
    }
});

// Dialog handler ready - will show spinner and QR dialog when videos are uploaded

// Test functions
window.testUploadQR = function() {
    // Showing test QR dialog
    window.showUploadQRDialog('https://drive.google.com/uc?export=download&id=test123');
};

window.testUploadSpinner = function() {
    // Showing test spinner
    // Try to find a download button for testing
    const downloadIcons = document.querySelectorAll('i.google-symbols');
    let downloadButton = null;
    for (const icon of downloadIcons) {
        if (icon.textContent === 'download') {
            downloadButton = icon.closest('button');
            break;
        }
    }
    window.showUploadLoadingSpinner(downloadButton);
};

// Manual trigger for debugging
window.checkUploadNow = function() {
    // Manually checking for uploads
    checkForUploadComplete();
};