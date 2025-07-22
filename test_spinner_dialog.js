// Test spinner dialog functionality
window.testSpinner = function() {
    console.log('=== Testing Spinner Dialog ===');
    
    // Check if functions exist
    console.log('showUploadLoadingSpinner:', typeof window.showUploadLoadingSpinner);
    console.log('startUploadMonitoring:', typeof window.startUploadMonitoring);
    console.log('showUploadQRDialog:', typeof window.showUploadQRDialog);
    
    // Find download button
    const downloadButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const icon = btn.querySelector('i, .material-icons, .google-symbols');
        return icon && icon.textContent === 'download';
    });
    
    console.log('Download buttons found:', downloadButtons.length);
    
    if (downloadButtons.length > 0) {
        console.log('Testing with first download button...');
        
        // Test showing spinner
        if (window.showUploadLoadingSpinner) {
            console.log('Showing spinner...');
            window.showUploadLoadingSpinner(downloadButtons[0]);
            
            // Test showing QR after 3 seconds
            setTimeout(() => {
                console.log('Testing QR dialog...');
                if (window.showUploadQRDialog) {
                    window.showUploadQRDialog('https://drive.google.com/test-link');
                }
            }, 3000);
        }
    } else {
        console.log('No download buttons found on page');
    }
    
    console.log('========================');
};

// Manual trigger for 720p
window.trigger720p = function() {
    console.log('Manually triggering 720p download...');
    
    // Find download button
    const downloadBtn = document.querySelector('button i[textContent="download"]')?.parentElement ||
                       Array.from(document.querySelectorAll('button')).find(btn => 
                           btn.querySelector('i')?.textContent === 'download'
                       );
    
    if (downloadBtn && window.showUploadLoadingSpinner) {
        console.log('Showing spinner for manual 720p trigger');
        window.showUploadLoadingSpinner(downloadBtn);
        
        if (window.startUploadMonitoring) {
            window.startUploadMonitoring();
        }
    } else {
        console.error('Download button or spinner function not found');
    }
};

console.log('Spinner test loaded:');
console.log('- window.testSpinner() - Test spinner functionality');
console.log('- window.trigger720p() - Manually trigger 720p download');