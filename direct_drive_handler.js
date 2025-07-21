// Direct Drive handler - monitors downloads and shows instructions
console.log('Direct Drive handler starting...');

// Track blob URLs to actual download URLs
window._blobToDownloadUrl = new Map();

// Override fetch to capture download URLs
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    
    // Capture drum.usercontent.google.com downloads
    if (url && url.includes('drum.usercontent.google.com/download/')) {
        console.log('[DOWNLOAD] Capturing download URL:', url);
        
        // Return original fetch and track the blob
        return originalFetch.apply(this, args).then(response => {
            response.clone().blob().then(blob => {
                // Create blob URL
                const blobUrl = URL.createObjectURL(blob);
                // Map blob URL to download URL
                window._blobToDownloadUrl.set(blobUrl, url);
                console.log('[DOWNLOAD] Mapped blob URL to download URL');
            });
            return response;
        });
    }
    
    return originalFetch.apply(this, args);
};

// Override createObjectURL to track blobs
const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function(blob) {
    const blobUrl = originalCreateObjectURL(blob);
    console.log('[DOWNLOAD] Blob URL created:', blobUrl);
    
    // Check if we have a download URL for this blob
    setTimeout(() => {
        const downloadUrl = window._blobToDownloadUrl.get(blobUrl);
        if (downloadUrl) {
            console.log('[DOWNLOAD] Found download URL for blob:', downloadUrl);
            showDownloadInfo(downloadUrl);
        }
    }, 100);
    
    return blobUrl;
};

// Function to show download information
function showDownloadInfo(downloadUrl) {
    // Remove existing overlay if any
    const existing = document.getElementById('veo-download-info');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'veo-download-info';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        max-width: 600px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    
    // Title
    const title = document.createElement('h2');
    title.textContent = '동영상 다운로드 완료';
    title.style.cssText = `
        margin: 0 0 20px 0;
        color: #333;
        font-size: 24px;
    `;
    
    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        margin: 20px 0;
        line-height: 1.6;
        color: #555;
    `;
    instructions.innerHTML = `
        <p><strong>다운로드 URL:</strong></p>
        <p style="font-size: 12px; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace;">
            ${downloadUrl}
        </p>
        <p style="margin-top: 20px;"><strong>Google Drive에 업로드하려면:</strong></p>
        <ol style="text-align: left; margin: 10px auto; max-width: 400px;">
            <li>파일이 ~/Downloads 폴더에 저장되었습니다</li>
            <li>터미널에서 실행: <code>python test_download_detection.py</code></li>
            <li>옵션 3을 선택하여 Drive에 업로드</li>
        </ol>
    `;
    
    // Copy URL button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'URL 복사';
    copyBtn.style.cssText = `
        margin: 20px 10px 0;
        padding: 10px 24px;
        background: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
    `;
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(downloadUrl).then(() => {
            copyBtn.textContent = '복사됨!';
            setTimeout(() => {
                copyBtn.textContent = 'URL 복사';
            }, 2000);
        });
    };
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '닫기';
    closeBtn.style.cssText = `
        margin: 20px 10px 0;
        padding: 10px 24px;
        background: #666;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
    `;
    closeBtn.onclick = () => overlay.remove();
    
    // Assemble
    content.appendChild(title);
    content.appendChild(instructions);
    content.appendChild(copyBtn);
    content.appendChild(closeBtn);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    };
}

// Also monitor for download completion
let lastDownloadUrl = null;

// Check for drum.usercontent.google.com requests
const checkInterval = setInterval(() => {
    // Look through recent network logs if available
    if (window._debugNetworkLog) {
        const recentDownload = window._debugNetworkLog
            .filter(log => log.data?.url?.includes('drum.usercontent.google.com/download/'))
            .pop();
            
        if (recentDownload && recentDownload.data.url !== lastDownloadUrl) {
            lastDownloadUrl = recentDownload.data.url;
            console.log('[DOWNLOAD] Found recent download:', lastDownloadUrl);
            
            // Wait a bit for download to complete
            setTimeout(() => {
                showDownloadInfo(lastDownloadUrl);
            }, 2000);
        }
    }
}, 1000);

console.log('Direct Drive handler ready - will show download info when files are downloaded');