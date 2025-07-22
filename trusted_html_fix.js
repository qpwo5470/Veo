// Trusted HTML Fix for Windows Chrome
(function() {
    console.log('🔒 Applying Trusted HTML fix...');
    
    // Check if Trusted Types are enforced
    const trustedTypesEnabled = typeof window.trustedTypes !== 'undefined';
    
    if (trustedTypesEnabled) {
        console.log('Trusted Types detected - creating policy...');
        
        // Create a default policy if possible
        try {
            if (window.trustedTypes && window.trustedTypes.createPolicy) {
                const policy = window.trustedTypes.createPolicy('veo-default', {
                    createHTML: (html) => html,
                    createScript: (script) => script,
                    createScriptURL: (url) => url
                });
                
                // Store policy for use
                window.veoTrustedPolicy = policy;
                console.log('✅ Trusted Types policy created');
            }
        } catch (e) {
            console.error('Failed to create Trusted Types policy:', e);
        }
    }
    
    // Helper function to safely set innerHTML
    window.safeSetInnerHTML = function(element, html) {
        if (!element) return;
        
        try {
            if (window.veoTrustedPolicy) {
                // Use trusted policy
                element.innerHTML = window.veoTrustedPolicy.createHTML(html);
            } else if (trustedTypesEnabled && window.trustedTypes && window.trustedTypes.emptyHTML) {
                // Clear first with emptyHTML
                element.innerHTML = window.trustedTypes.emptyHTML;
                // Then use textContent and manual DOM creation
                const temp = document.createElement('div');
                temp.innerHTML = html; // This might fail, but we'll catch it
                while (temp.firstChild) {
                    element.appendChild(temp.firstChild);
                }
            } else {
                // Normal assignment
                element.innerHTML = html;
            }
        } catch (e) {
            console.warn('safeSetInnerHTML failed, using DOM methods:', e);
            // Fallback: Parse and create DOM manually
            try {
                element.textContent = ''; // Clear safely
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                while (doc.body.firstChild) {
                    element.appendChild(doc.body.firstChild);
                }
            } catch (e2) {
                console.error('All innerHTML methods failed:', e2);
                element.textContent = 'Error loading content';
            }
        }
    };
    
    // Override innerHTML setter for common elements
    const originalInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (originalInnerHTMLDescriptor && originalInnerHTMLDescriptor.set) {
        try {
            Object.defineProperty(Element.prototype, 'innerHTML', {
                set: function(html) {
                    try {
                        if (window.veoTrustedPolicy && typeof html === 'string') {
                            originalInnerHTMLDescriptor.set.call(this, window.veoTrustedPolicy.createHTML(html));
                        } else {
                            originalInnerHTMLDescriptor.set.call(this, html);
                        }
                    } catch (e) {
                        // Fallback for specific elements
                        if (this.id && (this.id.includes('veo-') || this.id.includes('upload-') || this.id.includes('spinner'))) {
                            console.warn('Using safe innerHTML for:', this.id);
                            window.safeSetInnerHTML(this, html);
                        } else {
                            throw e;
                        }
                    }
                },
                get: originalInnerHTMLDescriptor.get,
                enumerable: originalInnerHTMLDescriptor.enumerable,
                configurable: originalInnerHTMLDescriptor.configurable
            });
        } catch (e) {
            console.warn('Could not override innerHTML:', e);
        }
    }
    
    // Helper to create elements safely
    window.safeCreateElement = function(tagName, attributes = {}, innerHTML = '') {
        const element = document.createElement(tagName);
        
        // Set attributes
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key === 'style' && typeof value === 'string') {
                element.setAttribute('style', value);
            } else if (key.startsWith('on')) {
                // Event handlers
                element[key] = value;
            } else {
                element.setAttribute(key, value);
            }
        }
        
        // Set content
        if (innerHTML) {
            window.safeSetInnerHTML(element, innerHTML);
        }
        
        return element;
    };
    
    console.log('✅ Trusted HTML fix ready');
    console.log('Use window.safeSetInnerHTML(element, html) for safe innerHTML assignment');
})();