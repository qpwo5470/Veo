// Debug script for Windows QR dialog issues
window.debugQRWindows = function() {
    console.log('=== QR Dialog Debug Info ===');
    
    // Check if functions exist
    console.log('showUploadQRDialog exists:', typeof window.showUploadQRDialog);
    console.log('showUploadLoadingSpinner exists:', typeof window.showUploadLoadingSpinner);
    console.log('startUploadMonitoring exists:', typeof window.startUploadMonitoring);
    
    // Check server connectivity
    console.log('\nChecking server ports...');
    const ports = [8889, 8890, 8891, 8892];
    
    ports.forEach(port => {
        fetch(`http://localhost:${port}/latest_upload.json?t=${Date.now()}`)
            .then(response => {
                console.log(`Port ${port}: SUCCESS (status ${response.status})`);
                return response.json();
            })
            .then(data => {
                console.log(`Port ${port} data:`, data);
            })
            .catch(error => {
                console.log(`Port ${port}: FAILED -`, error.message);
            });
    });
    
    // Test showing QR dialog directly
    console.log('\nTesting QR dialog display...');
    setTimeout(() => {
        console.log('Attempting to show test QR dialog...');
        if (window.showUploadQRDialog) {
            window.showUploadQRDialog('https://drive.google.com/test-link');
        } else {
            console.error('showUploadQRDialog function not found!');
        }
    }, 2000);
    
    // Check for existing dialogs
    const existingDialog = document.getElementById('veo-upload-qr-dialog');
    console.log('Existing dialog found:', existingDialog ? 'YES' : 'NO');
    
    // Monitor download button clicks
    document.addEventListener('click', function(e) {
        const target = e.target;
        const button = target.closest('button');
        
        if (button && button.querySelector('i')?.textContent === 'download') {
            console.log('Download button clicked!');
            console.log('Button element:', button);
            console.log('startUploadMonitoring called:', typeof window.startUploadMonitoring === 'function');
        }
    }, true);
};

// Add manual test trigger
document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 'q') {
        console.log('Alt+Q pressed - running QR debug');
        window.debugQRWindows();
    }
});

console.log('Windows QR debug loaded - Press Alt+Q to run debug or call window.debugQRWindows()');