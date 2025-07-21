// Network monitor to log all requests and help identify download patterns
console.log('Network monitor starting...');

// Create a debug panel
const debugPanel = document.createElement('div');
debugPanel.id = 'network-debug-panel';
debugPanel.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    width: 400px;
    height: 200px;
    background: rgba(0, 0, 0, 0.9);
    color: #0f0;
    font-family: monospace;
    font-size: 10px;
    padding: 10px;
    overflow-y: auto;
    z-index: 99999;
    border: 1px solid #0f0;
    display: none;
`;
document.body.appendChild(debugPanel);

// Toggle with Ctrl+D
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    }
});

const logs = [];
function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    logs.push(logEntry);
    if (logs.length > 50) logs.shift();
    debugPanel.innerHTML = logs.join('<br>');
    debugPanel.scrollTop = debugPanel.scrollHeight;
    console.log(logEntry);
}

// Monitor all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const method = args[1]?.method || 'GET';
    
    addLog(`FETCH ${method}: ${url?.substring(0, 100)}`);
    
    // Log POST body if present
    if (method === 'POST' && args[1]?.body) {
        try {
            const body = JSON.parse(args[1].body);
            addLog(`BODY: ${JSON.stringify(body).substring(0, 100)}`);
        } catch (e) {
            // Not JSON
        }
    }
    
    return originalFetch.apply(this, args).then(response => {
        addLog(`RESPONSE ${response.status}: ${url?.substring(0, 60)}`);
        
        // Clone response to read it
        const cloned = response.clone();
        cloned.text().then(text => {
            if (text.includes('download') || text.includes('export')) {
                addLog(`DOWNLOAD RESPONSE: ${text.substring(0, 100)}`);
            }
        }).catch(() => {});
        
        return response;
    });
};

// Monitor XHR
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._debugMethod = method;
    this._debugUrl = url;
    addLog(`XHR ${method}: ${url?.substring(0, 100)}`);
    return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(body) {
    if (body) {
        try {
            const parsed = JSON.parse(body);
            addLog(`XHR BODY: ${JSON.stringify(parsed).substring(0, 100)}`);
        } catch (e) {
            addLog(`XHR BODY: ${body?.toString().substring(0, 100)}`);
        }
    }
    
    const originalOnLoad = this.onload;
    this.onload = function() {
        addLog(`XHR DONE: ${this._debugUrl?.substring(0, 60)}`);
        if (originalOnLoad) originalOnLoad.apply(this);
    };
    
    return originalXHRSend.apply(this, [body]);
};

// Monitor link clicks
document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.tagName === 'A' || target.closest('a')) {
        const link = target.closest('a');
        addLog(`LINK CLICK: ${link?.href?.substring(0, 100)}`);
    }
    
    // Check for download buttons
    if (target.closest('[aria-label*="다운로드"]') || 
        target.closest('[aria-label*="Download"]')) {
        addLog('!!! DOWNLOAD BUTTON CLICKED !!!');
    }
}, true);

// Monitor dynamic link creation
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    if (tagName.toLowerCase() === 'a') {
        // Monitor when href is set
        let _href = '';
        Object.defineProperty(element, 'href', {
            get() { return _href; },
            set(value) {
                _href = value;
                if (value && !value.startsWith('javascript:')) {
                    addLog(`DYNAMIC LINK: ${value.substring(0, 100)}`);
                }
            }
        });
        
        // Monitor clicks
        const originalClick = element.click;
        element.click = function() {
            addLog(`PROGRAMMATIC CLICK: ${this.href?.substring(0, 100)}`);
            return originalClick.call(this);
        };
    }
    
    return element;
};

addLog('Network monitor ready. Press Ctrl+D to toggle panel.');
addLog('Click download button to see what happens...');