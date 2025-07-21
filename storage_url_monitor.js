// Google Cloud Storage URL monitor - captures actual shareable download URLs
console.log('Storage URL monitor starting...');

// Pattern for Google Cloud Storage URLs
const STORAGE_URL_PATTERNS = [
    /storage\.googleapis\.com/,
    /storage\.cloud\.google\.com/,
    /\?GoogleAccessId=/,
    /\?X-Goog-Signature=/,
    /firebasestorage\.googleapis\.com/
];

// Pattern for CDN/streaming URLs to ignore
const IGNORE_URL_PATTERNS = [
    /lh3\.google/,
    /googleusercontent\.com\/fife/,
    /\.googlevideo\.com/,
    /youtube\.com/,
    /ytimg\.com/
];

// Check if URL is a storage URL
function isStorageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Check if it's an ignored URL
    for (const pattern of IGNORE_URL_PATTERNS) {
        if (pattern.test(url)) return false;
    }
    
    // Check if it's a storage URL
    for (const pattern of STORAGE_URL_PATTERNS) {
        if (pattern.test(url)) return true;
    }
    
    // Also check for signed URLs with expiry
    if (url.includes('Expires=') && url.includes('Signature=')) return true;
    
    return false;
}

// Monitor all network responses
const originalFetch = window.fetch;
window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(async response => {
        try {
            const cloned = response.clone();
            const text = await cloned.text();
            
            // Look for storage URLs in response
            const urlMatches = text.match(/https?:\/\/[^\s"'<>]+/g);
            if (urlMatches) {
                for (const url of urlMatches) {
                    if (isStorageUrl(url)) {
                        console.log('[STORAGE URL FOUND]', url);
                        if (window.showQROverlay) {
                            window.showQROverlay(url);
                        }
                        break; // Show only the first valid storage URL
                    }
                }
            }
        } catch (e) {
            // Ignore errors - response might not be text
        }
        
        return response;
    });
};

// Monitor XHR responses too
const originalXHRSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(body) {
    const xhr = this;
    const originalOnLoad = xhr.onload;
    
    xhr.onload = function() {
        try {
            // Check response for storage URLs
            const urlMatches = xhr.responseText.match(/https?:\/\/[^\s"'<>]+/g);
            if (urlMatches) {
                for (const url of urlMatches) {
                    if (isStorageUrl(url)) {
                        console.log('[STORAGE URL FOUND IN XHR]', url);
                        if (window.showQROverlay) {
                            window.showQROverlay(url);
                        }
                        break;
                    }
                }
            }
        } catch (e) {}
        
        if (originalOnLoad) originalOnLoad.apply(this, arguments);
    };
    
    return originalXHRSend.apply(this, [body]);
};

// Monitor dynamically created links
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
                // Check for links
                const links = node.tagName === 'A' ? [node] : node.querySelectorAll('a');
                links.forEach(link => {
                    if (link.href && isStorageUrl(link.href)) {
                        console.log('[STORAGE URL IN NEW LINK]', link.href);
                        
                        // Override click to show QR instead
                        link.addEventListener('click', function(e) {
                            e.preventDefault();
                            if (window.showQROverlay) {
                                window.showQROverlay(link.href);
                            }
                        }, true);
                    }
                });
            }
        });
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('Storage URL monitor ready - looking for shareable Google Cloud Storage URLs');