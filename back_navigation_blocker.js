// Block back navigation to prevent returning to Flow pages
console.log('[BACK BLOCKER] Initializing back navigation blocker...');

// Method 1: Replace current history entry
history.pushState(null, '', location.href);
history.pushState(null, '', location.href);

// Method 2: Intercept popstate events (back button)
window.addEventListener('popstate', function(event) {
    console.log('[BACK BLOCKER] Back navigation attempted - blocking...');
    history.pushState(null, '', location.href);
});

// Method 3: Warn before unload (optional - can be annoying)
// window.addEventListener('beforeunload', function(e) {
//     e.preventDefault();
//     e.returnValue = '';
// });

// Method 4: Override history.back()
const originalBack = history.back;
history.back = function() {
    console.log('[BACK BLOCKER] history.back() blocked');
    // Do nothing - block the back navigation
};

// Method 5: Override history.go() for negative values
const originalGo = history.go;
history.go = function(n) {
    if (n < 0) {
        console.log('[BACK BLOCKER] history.go(' + n + ') blocked');
        // Do nothing - block the back navigation
    } else {
        originalGo.call(this, n);
    }
};

console.log('[BACK BLOCKER] Back navigation blocking active');