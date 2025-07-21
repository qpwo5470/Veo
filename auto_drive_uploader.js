// Automatic Google Drive uploader - uploads videos immediately when downloaded
console.log('Auto Drive uploader starting...');

// Configuration
const DRIVE_FOLDER_ID = '1PlkqWPD7nSxzRLKJpubFP1XiZLMvn35l';
const SERVICE_ACCOUNT_KEY = {
  "type": "service_account",
  "project_id": "wide-factor-466607-i0",
  "private_key_id": "456c6415732fdb8cb7ef927e04167d287cb1aec1",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDOyDgJoyTTxBFY\nVwQAq/1Is2xSY0FGhRiuYA6EtWK2RFnw/Ru9k+jDoAkIoWJDb/KnpkKmrQJNC94N\nWmiJQOsy5CtmwRf1+3adboxLND3lA9U0QYWtfgA5F5F5W4psLg+t9rl4vN/A4wq6\nKU1svFzrjYoPIL6cwGCs/s1xfFoiy7+9HuS84pgBNnM9NmOlblD4gKZxisDAiDMq\n70aeD+hif8WtaUeWGGEq+h++I3fTFSzHlhe08NyUwRpTR5zh9JVzk82OeTNnjbpS\nmBIMsx5ldXRyY9wy+zTCe/aLp0kiGUbEXa9lzelpJsTM5Q7K4kRRjRvV5XRzDUf7\nWWTr4G8xAgMBAAECggEAJorUQxuZGC2yC/TAJr3oCn6DAMJGXvYc+RenbR4ABbgs\nyYnr+0SP/LKeLHEkRyydHpmTT8zsol7FZ1jEJl0m2cgEvPTd2fgijkqWNMhKhx7V\nRRW3bHSRZxLZBzVEUlCtlH/p5zLRQ/stuzBKoatkaHVr19EDJmWHP4eI1I/YnyZk\nNBwAAaTqYgPKuAz4GDjYdK+f+4P392iW4NudmviD3YDYhhettHvPYQOcUv2RsaxA\ntVReQ9T2DxvYzb45AtUmVr1UcStUYI8wRpg9MUQbqjX49proVi8WDhbbrd5wXkyS\ncp7uL9NqKSROOQ/sbxpYynrew53lPufY3nrZcDzepwKBgQDy0tPnB90jZJpFI4KL\nwo9q2nc224CtrgH9gvy/bp5WUylokiFPqK8aVgsH6Z0U2z/8mkTF3LiYvwQ5nyRq\nT0uKirPPuvT/IxUIMgtWuYd/ESbTe6doHDv1Oon2M2LnlFyxd0va70MhRfVXzaW5\nt/pCmuOzgi62ROm63JRyBq5IewKBgQDaALkeF9XJzaf+svJNc2w39CRkvOe0lyOM\ncKRb+w8jmGQ/Q97c68FcnBlNyCRAbQkp+4WzH2qYb9DEi8t0sOXbLrXn9Sg7xbuV\nXkSKFhsexcPui4CB2w1/HF/9ChBMSa4bc//yeoLm+Xfq22MNtvuqpBHMs2O8NDbm\nNkHtbyY1QwKBgQDN6bimJsYBGHO2A5nVmKRz0VTc4SDqpy+q4iQg1dZRj+4CbkDv\nQzVR2Ps7t4BsSkylkdCWFUk4xmr3zhtcR2fg0SQQGRNfNEnGjGGPJn9fYpURK7/X\ninHRz9VkQUky5l4AZBCgVNsRYTjfP1W0+u2vA5fqBpBEIoYt3pXHaCDs9wKBgElH\n4PJatMTHWudlI8ohOIl+ihVK4uBzxcFZxAYfWLFwcpJJsEq2/SKyXlclJfp6LJBu\nOj1CHETtoVHQZC3voPSSuRcl88ZT64CEVanNUISBmiE/x4zfI6RM139puJzMT7hu\nv+S0hfg6d7L82Ekt718nE8ypqKcFLkcoifTUXhWdAoGAN7NSOKJtXUsusOo5oHZg\nCpD1OnSi0Sgi9ZYnFzyE4sn3lmroYiIDYcfL7dNmS1H/DZp14r7kkIDJim/hSK0W\nED5lg3UKwLCd3MwcsH4lqyMTN6lNGnw163XuJIlmo/QgdC3qy07/JS39ImUVfSlu\nvAR8qZXvefDOzVgJ/uS0Imw=\n-----END PRIVATE KEY-----\n",
  "client_email": "video-saver@wide-factor-466607-i0.iam.gserviceaccount.com",
  "client_id": "108491430037887476842",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/video-saver%40wide-factor-466607-i0.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Track download URLs
window._pendingUploads = new Map();

// Function to upload to Google Drive directly from browser
async function uploadToGoogleDrive(blob, filename) {
    console.log(`[DRIVE] Starting upload for ${filename}`);
    
    try {
        // Show uploading status
        showUploadStatus('Uploading to Google Drive...', 'loading');
        
        // Get access token using service account
        const accessToken = await getServiceAccountToken();
        
        // Create metadata
        const metadata = {
            'name': `veo_${Date.now()}_${filename}`,
            'parents': [DRIVE_FOLDER_ID]
        };
        
        // Create form data
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', blob);
        
        // Upload to Google Drive
        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: form
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
        
        const fileData = await uploadResponse.json();
        const fileId = fileData.id;
        
        console.log(`[DRIVE] File uploaded with ID: ${fileId}`);
        
        // Make file public
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'type': 'anyone',
                'role': 'reader'
            })
        });
        
        // Generate download link
        const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
        
        console.log(`[DRIVE] Upload complete: ${downloadLink}`);
        
        // Show success with QR code
        showUploadStatus('Upload complete!', 'success');
        
        // Show QR code if function exists
        if (window.showQROverlay) {
            setTimeout(() => {
                window.showQROverlay(downloadLink);
            }, 1000);
        }
        
        return downloadLink;
        
    } catch (error) {
        console.error('[DRIVE] Upload error:', error);
        showUploadStatus(`Upload failed: ${error.message}`, 'error');
        return null;
    }
}

// Get service account access token
async function getServiceAccountToken() {
    // In a real implementation, this would need a server endpoint
    // For now, we'll use a placeholder
    // The service account authentication requires server-side code
    console.warn('[DRIVE] Service account auth requires server-side implementation');
    throw new Error('Server-side authentication required');
}

// Show upload status
function showUploadStatus(message, status) {
    // Remove existing status
    const existing = document.getElementById('veo-upload-status');
    if (existing) existing.remove();
    
    const statusDiv = document.createElement('div');
    statusDiv.id = 'veo-upload-status';
    statusDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${status === 'error' ? '#f44336' : status === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        border-radius: 5px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        z-index: 999999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);
    
    // Auto remove after 5 seconds
    if (status !== 'loading') {
        setTimeout(() => {
            statusDiv.remove();
        }, 5000);
    }
}

// Monitor fetch for downloads
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    
    // Check if this is a video download
    if (url && url.includes('drum.usercontent.google.com/download/')) {
        console.log('[DOWNLOAD] Intercepting download:', url);
        
        return originalFetch.apply(this, args).then(async response => {
            try {
                // Clone response to get blob
                const blob = await response.clone().blob();
                
                // Extract filename from URL or use default
                const urlParts = url.split('/');
                const filename = urlParts[urlParts.length - 1] || `video_${Date.now()}.mp4`;
                
                console.log(`[DOWNLOAD] Got video blob: ${blob.size} bytes`);
                
                // Automatically upload to Drive
                uploadToGoogleDrive(blob, filename);
                
            } catch (error) {
                console.error('[DOWNLOAD] Error processing download:', error);
            }
            
            return response;
        });
    }
    
    return originalFetch.apply(this, args);
};

// Alternative: Monitor blob creation
const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function(blob) {
    const blobUrl = originalCreateObjectURL(blob);
    
    // Check if this is a video blob
    if (blob.type && blob.type.startsWith('video/')) {
        console.log('[DOWNLOAD] Video blob created:', blob.size, 'bytes');
        
        // Check if we have a pending upload for this size
        const pendingUrl = findPendingUploadBySize(blob.size);
        if (pendingUrl) {
            console.log('[DOWNLOAD] Matching download found, uploading...');
            uploadToGoogleDrive(blob, `video_${Date.now()}.mp4`);
        }
    }
    
    return blobUrl;
};

// Helper to find pending upload by blob size
function findPendingUploadBySize(size) {
    for (const [url, info] of window._pendingUploads) {
        if (Math.abs(info.size - size) < 1000) { // Within 1KB
            return url;
        }
    }
    return null;
}

// Since service account auth requires server, let's show manual upload instructions
function showManualUploadInstructions(blob, filename) {
    // Create a download link for the blob
    const blobUrl = URL.createObjectURL(blob);
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 10px;
        text-align: center;
        max-width: 500px;
    `;
    
    content.innerHTML = `
        <h2>Video Downloaded</h2>
        <p>File saved to ~/Downloads</p>
        <p style="margin: 20px 0;">
            <a href="${blobUrl}" download="${filename}" 
               style="background: #4285f4; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Download Again
            </a>
        </p>
        <p style="color: #666; font-size: 14px;">
            To upload to Google Drive automatically,<br>
            run in terminal: <code>python auto_upload_monitor.py</code>
        </p>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="margin-top: 20px; padding: 10px 20px; background: #666; 
                       color: white; border: none; border-radius: 5px; cursor: pointer;">
            Close
        </button>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
}

// Override fetch to handle downloads
const originalFetch2 = window.fetch;
window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    
    if (url && url.includes('drum.usercontent.google.com/download/')) {
        console.log('[AUTO UPLOAD] Detecting download:', url);
        
        return originalFetch2.apply(this, args).then(async response => {
            try {
                const blob = await response.clone().blob();
                const filename = `video_${Date.now()}.mp4`;
                
                console.log('[AUTO UPLOAD] Video downloaded:', blob.size, 'bytes');
                
                // Show manual instructions since we can't do service account auth from browser
                showManualUploadInstructions(blob, filename);
                
            } catch (error) {
                console.error('[AUTO UPLOAD] Error:', error);
            }
            
            return response;
        });
    }
    
    return originalFetch2.apply(this, args);
};

console.log('Auto Drive uploader ready - will detect downloads automatically');