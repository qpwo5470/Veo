// Session storage debugger
console.log('[SESSION DEBUG] Starting session storage debugger...');

// Function to log all session storage
function logSessionStorage() {
    console.log('[SESSION DEBUG] Current sessionStorage contents:');
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        console.log(`  ${key}: '${value}'`);
    }
    if (sessionStorage.length === 0) {
        console.log('  (empty)');
    }
}

// Log initial state
logSessionStorage();

// Monitor session storage changes
let lastState = JSON.stringify(sessionStorage);
setInterval(() => {
    const currentState = JSON.stringify(sessionStorage);
    if (currentState !== lastState) {
        console.log('[SESSION DEBUG] SessionStorage changed!');
        logSessionStorage();
        lastState = currentState;
    }
}, 1000);

// Also log on important events
window.addEventListener('beforeunload', () => {
    console.log('[SESSION DEBUG] Page unloading, final sessionStorage:');
    logSessionStorage();
});

// Log when navigation happens
const originalPushState = history.pushState;
history.pushState = function() {
    console.log('[SESSION DEBUG] pushState called');
    logSessionStorage();
    return originalPushState.apply(history, arguments);
};

const originalReplaceState = history.replaceState;
history.replaceState = function() {
    console.log('[SESSION DEBUG] replaceState called');
    logSessionStorage();
    return originalReplaceState.apply(history, arguments);
};

console.log('[SESSION DEBUG] Debugger ready');