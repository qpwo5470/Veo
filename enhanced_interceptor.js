// Enhanced download interceptor with aggressive override
console.log('Enhanced interceptor loading...');

// Override window.open to prevent download popups
const originalWindowOpen = window.open;
window.open = function(url, ...args) {
    console.log('window.open intercepted:', url);
    if (url && (url.includes('lh3.googleusercontent.com') || url.includes('=m22-dv') || url.includes('videoplayback'))) {
        console.log('Download popup blocked, showing QR instead');
        if (window.showQROverlay) {
            window.showQROverlay(url);
        }
        return null;
    }
    return originalWindowOpen.apply(this, [url, ...args]);
};

// Override createElement to intercept dynamically created download links
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    if (tagName.toLowerCase() === 'a') {
        // Override click method for anchor elements
        const originalClick = element.click;
        element.click = function() {
            console.log('Anchor click intercepted:', element.href);
            if (element.href && (element.href.includes('lh3.googleusercontent.com') || element.href.includes('=m22-dv'))) {
                console.log('Download link blocked, showing QR instead');
                if (window.showQROverlay) {
                    window.showQROverlay(element.href);
                }
                return;
            }
            return originalClick.call(this);
        };
        
        // Monitor href changes
        let _href = '';
        Object.defineProperty(element, 'href', {
            get() { return _href; },
            set(value) {
                _href = value;
                if (value && (value.includes('lh3.googleusercontent.com') || value.includes('=m22-dv'))) {
                    console.log('Download href detected:', value);
                    // Add click interceptor
                    element.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.showQROverlay) {
                            window.showQROverlay(value);
                        }
                    }, true);
                }
            }
        });
    }
    
    return element;
};

// Override download attribute handling
Object.defineProperty(HTMLAnchorElement.prototype, 'download', {
    set: function(value) {
        console.log('Download attribute set on anchor:', value);
        this._download = value;
        // Add interceptor when download attribute is set
        if (!this._downloadInterceptorAdded) {
            this._downloadInterceptorAdded = true;
            this.addEventListener('click', function(e) {
                console.log('Download anchor clicked:', this.href);
                e.preventDefault();
                e.stopPropagation();
                if (window.showQROverlay && this.href) {
                    window.showQROverlay(this.href);
                }
            }, true);
        }
    },
    get: function() {
        return this._download;
    }
});

// Monitor for programmatic clicks on download buttons
const originalDispatchEvent = EventTarget.prototype.dispatchEvent;
EventTarget.prototype.dispatchEvent = function(event) {
    if (event.type === 'click' && this.tagName) {
        const isDownloadButton = 
            this.getAttribute('aria-label')?.includes('다운로드') ||
            this.getAttribute('aria-label')?.includes('Download') ||
            this.textContent?.toLowerCase().includes('download');
        
        if (isDownloadButton) {
            console.log('Programmatic click on download button intercepted');
            event.preventDefault();
            event.stopPropagation();
            
            // Try to find associated video
            setTimeout(() => {
                const video = document.querySelector('video[src]');
                if (video && video.src && window.showQROverlay) {
                    window.showQROverlay(video.src);
                }
            }, 0);
            
            return false;
        }
    }
    
    return originalDispatchEvent.call(this, event);
};

console.log('Enhanced interceptor ready with all overrides active');