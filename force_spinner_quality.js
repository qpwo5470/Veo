// Force solution for spinner and quality filter
(function() {
    console.log('Force spinner/quality solution activated');
    
    // 1. AGGRESSIVE QUALITY FILTER
    // Override the dropdown rendering
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    // Check the node and all its children
                    const checkAndHide = (element) => {
                        // Direct text check
                        if (element.textContent === '270p' || element.textContent === '1080p') {
                            element.remove();
                            console.log('Removed quality option:', element.textContent);
                            return;
                        }
                        
                        // Check all children
                        const walker = document.createTreeWalker(
                            element,
                            NodeFilter.SHOW_ELEMENT,
                            {
                                acceptNode: function(node) {
                                    const text = node.textContent?.trim();
                                    if (text === '270p' || text === '1080p' ||
                                        (text && (text.includes('270p') || text.includes('1080p')))) {
                                        return NodeFilter.FILTER_ACCEPT;
                                    }
                                    return NodeFilter.FILTER_SKIP;
                                }
                            }
                        );
                        
                        let nodeToRemove;
                        while (nodeToRemove = walker.nextNode()) {
                            // Find the menu item parent
                            let parent = nodeToRemove;
                            while (parent && !parent.matches('[role="menuitem"], [role="option"], li')) {
                                parent = parent.parentElement;
                            }
                            if (parent) {
                                parent.remove();
                                console.log('Removed quality parent:', parent.textContent);
                            } else {
                                nodeToRemove.remove();
                            }
                        }
                    };
                    
                    checkAndHide(node);
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // 2. FORCE SPINNER ON ANY QUALITY CLICK
    let lastDownloadButton = null;
    
    // Track download button clicks
    document.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            // Check for download icon in multiple ways
            const hasDownload = 
                button.innerHTML.includes('download') ||
                button.textContent.includes('download') ||
                Array.from(button.querySelectorAll('*')).some(el => 
                    el.textContent.trim() === 'download' ||
                    el.className.includes('download')
                );
            
            if (hasDownload) {
                lastDownloadButton = button;
                console.log('Download button tracked:', button);
                
                // Set up interceptor for next clicks
                const interceptor = (evt) => {
                    const target = evt.target;
                    const text = target.textContent?.trim() || '';
                    
                    // Check if it's a quality selection
                    if (text.match(/\d+p/) || text.includes('mp4') || text.includes('mov')) {
                        console.log('Quality clicked:', text);
                        
                        // Force show spinner
                        if (window.showUploadLoadingSpinner) {
                            console.log('Forcing spinner display...');
                            window.showUploadLoadingSpinner(lastDownloadButton);
                        } else {
                            // Create spinner manually if function doesn't exist
                            console.log('Creating spinner manually...');
                            const spinner = document.createElement('div');
                            spinner.id = 'force-spinner';
                            spinner.style.cssText = `
                                position: fixed;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                width: 100px;
                                height: 100px;
                                background: rgba(0,0,0,0.8);
                                border-radius: 10px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                z-index: 999999;
                            `;
                            spinner.innerHTML = `
                                <div style="
                                    width: 50px;
                                    height: 50px;
                                    border: 3px solid #fff;
                                    border-top-color: transparent;
                                    border-radius: 50%;
                                    animation: spin 1s linear infinite;
                                "></div>
                            `;
                            
                            const style = document.createElement('style');
                            style.textContent = `
                                @keyframes spin {
                                    to { transform: rotate(360deg); }
                                }
                            `;
                            document.head.appendChild(style);
                            document.body.appendChild(spinner);
                        }
                        
                        // Start monitoring
                        if (window.startUploadMonitoring) {
                            window.startUploadMonitoring();
                        }
                        
                        // Remove interceptor
                        document.removeEventListener('click', interceptor, true);
                    }
                };
                
                // Add interceptor for next click
                document.addEventListener('click', interceptor, true);
                
                // Remove after 5 seconds if not used
                setTimeout(() => {
                    document.removeEventListener('click', interceptor, true);
                }, 5000);
            }
        }
    }, true);
    
    // 3. NUCLEAR OPTION FOR QUALITY FILTER
    setInterval(() => {
        document.querySelectorAll('*').forEach(el => {
            const text = el.textContent?.trim();
            if (text === '270p' || text === '1080p') {
                if (el.offsetParent !== null) { // Is visible
                    el.remove();
                    console.log('Nuclear removal:', text);
                }
            }
        });
    }, 500);
    
    console.log('Force solution ready - Quality filter and spinner should work now');
})();