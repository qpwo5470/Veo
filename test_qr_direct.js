// Direct QR test - bypasses upload monitoring
window.testQRDirect = function() {
    console.log('Testing QR dialog directly...');
    
    // Test with a dummy Google Drive link
    const testLink = 'https://drive.google.com/file/d/1ABC123/view?usp=drive_link';
    
    if (window.showUploadQRDialog) {
        console.log('Calling showUploadQRDialog with test link...');
        window.showUploadQRDialog(testLink);
        console.log('QR dialog should be visible now');
    } else {
        console.error('showUploadQRDialog function not found!');
        
        // Check if upload_qr_dialog.js was loaded
        console.log('uploadQRDialogInitialized:', window.uploadQRDialogInitialized);
    }
};

// Also test the spinner
window.testSpinnerDirect = function() {
    console.log('Testing loading spinner directly...');
    
    if (window.showUploadLoadingSpinner) {
        console.log('Calling showUploadLoadingSpinner...');
        window.showUploadLoadingSpinner();
        console.log('Spinner should be visible now');
    } else {
        console.error('showUploadLoadingSpinner function not found!');
    }
};

console.log('Direct QR tests loaded:');
console.log('- window.testQRDirect() - Test QR dialog');
console.log('- window.testSpinnerDirect() - Test loading spinner');