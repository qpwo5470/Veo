// Efficient quality filter using event delegation
(function() {
    let filterApplied = false;
    
    function hideQualityOptions() {
        if (filterApplied) return;
        
        const options = document.querySelectorAll('[role="menuitem"], [role="option"]');
        let hidden = 0;
        
        options.forEach(item => {
            const text = item.textContent || '';
            if (text.match(/270p|1080p/i)) {
                item.style.display = 'none';
                hidden++;
            }
        });
        
        if (hidden > 0) filterApplied = true;
    }
    
    // Use passive event listener for efficiency
    document.addEventListener('click', function(e) {
        // Only check if clicking download-related elements
        const target = e.target;
        if (target.closest('button') && 
            (target.textContent.includes('download') || 
             target.closest('[role="menu"]'))) {
            
            // Reset filter flag when menu might open
            filterApplied = false;
            
            // Apply filter after menu renders
            setTimeout(hideQualityOptions, 100);
            setTimeout(hideQualityOptions, 300);
        }
    }, { passive: true, capture: true });
})();