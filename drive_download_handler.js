// Google Drive download handler - allows downloads then uploads to Drive
console.log('Drive download handler starting...');

// Configuration
const DRIVE_FOLDER_ID = '1PlkqWPD7nSxzRLKJpubFP1XiZLMvn35l';
const CHECK_INTERVAL = 3000; // Check every 3 seconds
const MAX_WAIT_TIME = 60000; // Wait max 60 seconds

// Track download requests
window._activeDownloads = new Map();

// Function to check for new downloads and upload to Drive
async function checkAndUploadToDrive() {
    try {
        const response = await fetch('http://localhost:5000/check-and-upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                folder_id: DRIVE_FOLDER_ID
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.download_link) {
            console.log('Video uploaded to Drive!', result);
            
            // Show QR code with Drive download link
            if (window.showQROverlay) {
                window.showQROverlay(result.download_link);
            }
            
            return true;
        }
    } catch (error) {
        console.error('Error checking/uploading to Drive:', error);
    }
    
    return false;
}

// Monitor for download completion
async function monitorDownload(downloadId) {
    console.log(`Monitoring download: ${downloadId}`);
    const startTime = Date.now();
    
    while (Date.now() - startTime < MAX_WAIT_TIME) {
        // Wait a bit for download to complete
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
        
        // Check if file was downloaded and upload to Drive
        const uploaded = await checkAndUploadToDrive();
        if (uploaded) {
            window._activeDownloads.delete(downloadId);
            return;
        }
    }
    
    console.log(`Download monitoring timeout for: ${downloadId}`);
    window._activeDownloads.delete(downloadId);
}

// Override download behavior - let it download, then upload to Drive
document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Check for download menu items
    const menuItem = target.closest('[role="menuitem"], [role="option"]');
    if (menuItem) {
        const text = menuItem.textContent.toLowerCase();
        if (text.includes('mp4') || text.includes('mov') || text.includes('gif') || 
            text.includes('다운로드') || text.includes('download')) {
            
            console.log('Download menu item clicked, will monitor for file:', text);
            
            // Generate download ID
            const downloadId = Date.now().toString();
            window._activeDownloads.set(downloadId, {
                format: text,
                startTime: Date.now()
            });
            
            // Start monitoring for the download
            monitorDownload(downloadId);
        }
    }
    
    // Check for download button
    const button = target.closest('button');
    if (button) {
        const ariaLabel = button.getAttribute('aria-label') || '';
        if (ariaLabel.includes('다운로드') || ariaLabel.includes('Download')) {
            console.log('Download button clicked, preparing to monitor downloads');
        }
    }
}, true);

// Alternative: Monitor for direct download links
const originalWindowOpen = window.open;
window.open = function(url, ...args) {
    if (url && (url.includes('download') || url.includes('export'))) {
        console.log('Download window.open detected:', url);
        
        // Allow the download to proceed
        const result = originalWindowOpen.apply(this, [url, ...args]);
        
        // Start monitoring for the downloaded file
        const downloadId = Date.now().toString();
        window._activeDownloads.set(downloadId, {
            url: url,
            startTime: Date.now()
        });
        monitorDownload(downloadId);
        
        return result;
    }
    
    return originalWindowOpen.apply(this, [url, ...args]);
};

console.log('Drive download handler ready - downloads will be uploaded to Google Drive');