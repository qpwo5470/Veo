// Refresh blocker - prevents page refresh
// Block F5, Ctrl+R, Cmd+R refresh attempts

(function() {
    // Prevent F5, Ctrl+R, Cmd+R
    document.addEventListener('keydown', function(e) {
        // F5
        if (e.key === 'F5') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Ctrl+R or Cmd+R
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Ctrl+Shift+R or Cmd+Shift+R (hard refresh)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Ctrl+F5 (hard refresh)
        if (e.ctrlKey && e.key === 'F5') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    
    // Also block on window level
    window.addEventListener('keydown', function(e) {
        if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    
    // Override location.reload
    const originalReload = location.reload;
    location.reload = function() {
        // Silently ignore reload attempts
        console.warn('Page refresh blocked');
        return false;
    };
    
    // Override history.go(0)
    const originalGo = history.go;
    history.go = function(delta) {
        if (delta === 0) {
            console.warn('Page refresh via history.go(0) blocked');
            return false;
        }
        return originalGo.call(this, delta);
    };
    
    // Block beforeunload for refresh (but not for navigation)
    let isNavigating = false;
    
    // Track clicks on links and buttons
    document.addEventListener('click', function(e) {
        const target = e.target;
        if (target.tagName === 'A' || target.tagName === 'BUTTON' || 
            target.closest('a') || target.closest('button')) {
            isNavigating = true;
            setTimeout(() => { isNavigating = false; }, 100);
        }
    }, true);
    
    // Track location changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
        isNavigating = true;
        const result = originalPushState.apply(this, arguments);
        setTimeout(() => { isNavigating = false; }, 100);
        return result;
    };
    
    history.replaceState = function() {
        isNavigating = true;
        const result = originalReplaceState.apply(this, arguments);
        setTimeout(() => { isNavigating = false; }, 100);
        return result;
    };
    
    // Note: We don't block beforeunload entirely as it would interfere with navigation
    // The keyboard shortcuts and reload() blocking should be sufficient
    
})();

// Refresh blocker active