// Google Drive download handler v2 - Complete flow with loading dialog
console.log('Drive download handler v2 starting...');

// Create loading dialog
function showLoadingDialog(message = '다운로드 중...') {
    // Remove existing dialog if any
    const existing = document.getElementById('veo-loading-dialog');
    if (existing) existing.remove();
    
    const dialog = document.createElement('div');
    dialog.id = 'veo-loading-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        min-width: 300px;
    `;
    
    // Spinner
    const spinner = document.createElement('div');
    spinner.style.cssText = `
        width: 50px;
        height: 50px;
        margin: 0 auto 20px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #4285f4;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    `;
    
    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Message
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        margin: 0;
        font-size: 18px;
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    
    content.appendChild(spinner);
    content.appendChild(messageEl);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    
    return {
        updateMessage: (newMessage) => {
            messageEl.textContent = newMessage;
        },
        close: () => {
            dialog.remove();
        }
    };
}

// Start upload monitoring
async function startUploadMonitoring() {
    try {
        const response = await fetch('http://localhost:5000/start-upload-monitor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (result.success) {
            return result.upload_id;
        }
    } catch (error) {
        console.error('Error starting upload monitor:', error);
    }
    return null;
}

// Check upload status
async function checkUploadStatus(uploadId) {
    try {
        const response = await fetch(`http://localhost:5000/check-upload-status/${uploadId}`);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error checking upload status:', error);
        return null;
    }
}

// Monitor upload progress
async function monitorUploadProgress(uploadId, loadingDialog) {
    const checkInterval = 2000; // Check every 2 seconds
    const maxWaitTime = 90000; // 90 seconds max
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        const status = await checkUploadStatus(uploadId);
        
        if (!status) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            continue;
        }
        
        if (status.status === 'monitoring') {
            loadingDialog.updateMessage('동영상 다운로드 대기 중...');
        } else if (status.success) {
            loadingDialog.updateMessage('Google Drive에 업로드 완료!');
            return status;
        } else if (status.error) {
            console.error('Upload error:', status.error);
            return status;
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    return { success: false, error: 'Timeout waiting for upload' };
}

// Handle download click
async function handleDownloadClick(format) {
    console.log(`Download initiated for format: ${format}`);
    
    // Show loading dialog
    const loadingDialog = showLoadingDialog('다운로드 준비 중...');
    
    try {
        // Start monitoring for the download
        const uploadId = await startUploadMonitoring();
        
        if (!uploadId) {
            throw new Error('Failed to start upload monitoring');
        }
        
        // Update message
        loadingDialog.updateMessage('동영상 다운로드 중...');
        
        // Wait a bit for download to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Monitor the upload progress
        loadingDialog.updateMessage('Google Drive에 업로드 중...');
        const result = await monitorUploadProgress(uploadId, loadingDialog);
        
        // Close loading dialog
        loadingDialog.close();
        
        if (result.success && result.download_link) {
            console.log('Upload successful:', result);
            
            // Show QR code with the Drive link
            if (window.showQROverlay) {
                window.showQROverlay(result.download_link);
            }
        } else {
            console.error('Upload failed:', result);
            alert('업로드 실패: ' + (result.error || 'Unknown error'));
        }
        
    } catch (error) {
        console.error('Error in download handler:', error);
        loadingDialog.close();
        alert('오류 발생: ' + error.message);
    }
}

// Monitor for download menu clicks
document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Check for download menu items
    const menuItem = target.closest('[role="menuitem"], [role="option"]');
    if (menuItem) {
        const text = menuItem.textContent.toLowerCase();
        if (text.includes('mp4') || text.includes('mov') || text.includes('gif') || 
            text.includes('다운로드') || text.includes('download')) {
            
            console.log('Download menu item clicked:', text);
            
            // Don't prevent default - let the download happen
            // Start monitoring after a delay
            setTimeout(() => {
                handleDownloadClick(text);
            }, 100);
        }
    }
}, true);

// Check server health on load
fetch('http://localhost:5000/health')
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            console.log('Drive upload server is running');
        } else {
            console.error('Drive upload server health check failed:', data);
        }
    })
    .catch(error => {
        console.error('Drive upload server not accessible:', error);
        console.error('Make sure to run: python drive_upload_server_v2.py');
    });

console.log('Drive download handler v2 ready - will show loading dialog during upload');