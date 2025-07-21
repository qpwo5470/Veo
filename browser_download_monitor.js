// Browser download monitor - monitors actual browser download attempts
console.log('Browser download monitor starting...');

// Override anchor click behavior for download links
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.download !== undefined && link.download !== '') {
        // This is a download link
        e.preventDefault();
        e.stopPropagation();
        console.log('Download link intercepted:', link.href);
        if (window.showQROverlay) {
            window.showQROverlay(link.href);
        }
    }
}, true);

// Monitor dynamically created download links
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    if (tagName.toLowerCase() === 'a') {
        // Override click method for anchors
        const originalClick = element.click;
        element.click = function() {
            if (this.download !== undefined && this.download !== '') {
                console.log('Programmatic download intercepted:', this.href);
                if (window.showQROverlay) {
                    window.showQROverlay(this.href);
                }
                return;
            }
            return originalClick.call(this);
        };
    }
    
    return element;
};

// Monitor blob URLs
const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function(blob) {
    const url = originalCreateObjectURL(blob);
    console.log('Blob URL created:', url);
    
    // Set a flag that this might be a download
    window._lastBlobUrl = url;
    window._blobTimestamp = Date.now();
    
    return url;
};

// Skip blob URLs - they're not actual download URLs
// Only monitor real download URLs from API responses

console.log('Browser download monitor ready');