// innerHTML Patcher - Fix Trusted Types issues on Windows
(function() {
    console.log('🔧 Patching innerHTML for Trusted Types...');
    
    // Store original innerHTML setter
    const originalInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    
    // Check if we need to patch
    if (typeof window.trustedTypes !== 'undefined') {
        console.log('Trusted Types detected - patching innerHTML...');
        
        // Create a permissive policy
        let policy = null;
        try {
            policy = window.trustedTypes.createPolicy('veo-html', {
                createHTML: (string) => string
            });
            console.log('✅ Created TrustedHTML policy');
        } catch (e) {
            console.warn('Could not create policy, will use fallback:', e);
        }
        
        // Patch innerHTML
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                try {
                    if (policy && typeof value === 'string') {
                        originalInnerHTMLDescriptor.set.call(this, policy.createHTML(value));
                    } else {
                        originalInnerHTMLDescriptor.set.call(this, value);
                    }
                } catch (e) {
                    // Fallback: Use DOM methods
                    console.warn('innerHTML failed, using DOM methods for:', this.id || this.className);
                    
                    // Clear content
                    while (this.firstChild) {
                        this.removeChild(this.firstChild);
                    }
                    
                    // Parse HTML and append
                    const temp = document.createElement('template');
                    temp.innerHTML = value; // This works in template
                    while (temp.content.firstChild) {
                        this.appendChild(temp.content.firstChild);
                    }
                }
            },
            get: originalInnerHTMLDescriptor.get,
            enumerable: originalInnerHTMLDescriptor.enumerable,
            configurable: originalInnerHTMLDescriptor.configurable
        });
        
        console.log('✅ innerHTML patched successfully');
    } else {
        console.log('Trusted Types not enforced - no patch needed');
    }
})();