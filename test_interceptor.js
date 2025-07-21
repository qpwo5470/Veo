// Add test button to verify interceptor is working
const testBtn = document.createElement('button');
testBtn.textContent = 'Test QR';
testBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 20px;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 9999;
    font-size: 14px;
`;
testBtn.onclick = () => {
    const testUrl = 'https://example.com/test-video.mp4';
    console.log('Testing QR overlay with URL:', testUrl);
    if (window.showQROverlay) {
        window.showQROverlay(testUrl);
    } else {
        alert('QR overlay function not found!');
    }
};
document.body.appendChild(testBtn);