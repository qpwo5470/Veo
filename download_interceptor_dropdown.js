// Remove ALL previous event listeners and interceptors
if (window._downloadInterceptorCleanup) {
    window._downloadInterceptorCleanup();
}

// Simple QR Code implementation using Canvas (no innerHTML)
(function() {
    // QR Code generation using Canvas only
    window.generateQRCode = function(text, size) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Simple QR code placeholder - in production, use a proper QR library
        canvas.width = size || 256;
        canvas.height = size || 256;
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Create a simple pattern for demo (replace with actual QR generation)
        ctx.fillStyle = '#000000';
        const moduleSize = 8;
        const modules = Math.floor(canvas.width / moduleSize);
        
        // Draw a border
        ctx.fillRect(0, 0, canvas.width, moduleSize);
        ctx.fillRect(0, canvas.height - moduleSize, canvas.width, moduleSize);
        ctx.fillRect(0, 0, moduleSize, canvas.height);
        ctx.fillRect(canvas.width - moduleSize, 0, moduleSize, canvas.height);
        
        // Draw center text
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', canvas.width/2, canvas.height/2 - 20);
        ctx.font = '10px Arial';
        ctx.fillText('(Scan for URL)', canvas.width/2, canvas.height/2 + 20);
        
        return canvas;
    };
})();

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
    closeBtn.textContent = '×';
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
    
    // Generate and add QR code canvas
    const qrCanvas = window.generateQRCode(url, 256);
    qrContainer.appendChild(qrCanvas);
    
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
    
    // Add alternative: clickable link
    const linkText = document.createElement('p');
    linkText.style.cssText = `
        margin: 10px 0 0 0;
        font-size: 12px;
        color: #666;
    `;
    linkText.textContent = '또는 ';
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.textContent = '여기를 클릭하여 다운로드';
    downloadLink.style.cssText = `
        color: #4285f4;
        text-decoration: underline;
        cursor: pointer;
    `;
    downloadLink.target = '_blank';
    linkText.appendChild(downloadLink);
    
    // Assemble popup
    popup.appendChild(closeBtn);
    popup.appendChild(title);
    popup.appendChild(qrContainer);
    popup.appendChild(urlText);
    popup.appendChild(instruction);
    popup.appendChild(linkText);
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
    if (window._dropdownObserver) {
        window._dropdownObserver.disconnect();
    }
};

// Monitor for dropdown menu items instead of the main download button
window._dropdownObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
                // Look for dropdown menu items
                const menuItems = node.querySelectorAll('[role="menuitem"], [role="option"]');
                menuItems.forEach(item => {
                    // Check if this is a download option in the dropdown
                    const text = item.textContent.toLowerCase();
                    if (text.includes('mp4') || text.includes('mov') || text.includes('gif') || 
                        text.includes('다운로드') || text.includes('download')) {
                        console.log('Found download menu item:', text);
                        
                        // Replace the click handler
                        const newItem = item.cloneNode(true);
                        newItem.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Download menu item clicked:', text);
                            
                            // Set flag to intercept the next download
                            window._interceptNextDownload = true;
                            window._downloadFormat = text;
                            
                            // Close the dropdown
                            const dropdown = item.closest('[role="menu"], [role="listbox"]');
                            if (dropdown) {
                                dropdown.style.display = 'none';
                            }
                            
                            // Wait a bit for the download URL
                            setTimeout(() => {
                                // If no download was intercepted, show a placeholder
                                if (window._interceptNextDownload) {
                                    window._interceptNextDownload = false;
                                    window.showQROverlay(`https://example.com/download?format=${text}`);
                                }
                            }, 2000);
                        }, true);
                        
                        item.parentNode.replaceChild(newItem, item);
                    }
                });
                
                // Also check the node itself
                if (node.getAttribute && node.getAttribute('role') === 'menuitem') {
                    const text = node.textContent.toLowerCase();
                    if (text.includes('mp4') || text.includes('mov') || text.includes('gif')) {
                        console.log('Found download menu item (node):', text);
                    }
                }
            }
        });
    });
});

// Start observing the document for dropdown menus
window._dropdownObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Intercept fetch requests for download URLs
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const options = args[1] || {};
    
    console.log('Fetch:', url);
    
    // Check if this is a download/export request
    if (window._interceptNextDownload || (url && (
        url.includes('/export') ||
        url.includes('/download') ||
        url.includes('download=true') ||
        url.includes('export_format=') ||
        url.includes('output_format=') ||
        url.includes('render') ||
        url.includes('transcode')
    ))) {
        console.log('Download URL intercepted:', url);
        window._interceptNextDownload = false;
        
        // Show QR code
        setTimeout(() => {
            window.showQROverlay(url);
        }, 0);
        
        // Return empty response to prevent download
        return Promise.resolve(new Response('', {status: 200}));
    }
    
    return originalFetch.apply(this, args);
};

// Intercept XHR requests too
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    this._method = method;
    
    console.log('XHR:', method, url);
    
    return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(body) {
    if (window._interceptNextDownload || (this._url && (
        this._url.includes('/export') ||
        this._url.includes('/download') ||
        this._url.includes('render') ||
        this._url.includes('transcode')
    ))) {
        console.log('Download XHR intercepted:', this._url);
        window._interceptNextDownload = false;
        
        // Show QR code
        setTimeout(() => {
            window.showQROverlay(this._url);
        }, 0);
        
        // Fake the response
        this.readyState = 4;
        this.status = 200;
        this.responseText = '';
        if (this.onreadystatechange) this.onreadystatechange();
        if (this.onload) this.onload();
        
        return;
    }
    
    return originalXHRSend.apply(this, [body]);
};

// Also monitor for direct download links
document.addEventListener('click', function(e) {
    const target = e.target;
    const link = target.closest('a');
    
    if (link && link.href) {
        const href = link.href;
        if (href.includes('.mp4') || href.includes('.mov') || href.includes('.gif') ||
            href.includes('download') || href.includes('export')) {
            console.log('Download link clicked:', href);
            e.preventDefault();
            window.showQROverlay(href);
        }
    }
}, true);

console.log('Download interceptor ready - monitoring dropdown menus');