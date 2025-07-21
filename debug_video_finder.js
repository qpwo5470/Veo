// Debug script to find the correct video structure
window.debugVideoFinder = function() {
    // Find all download buttons
    const downloadButtons = [];
    const icons = document.querySelectorAll('i.google-symbols');
    
    icons.forEach(icon => {
        if (icon.textContent === 'download') {
            const button = icon.closest('button');
            if (button) {
                downloadButtons.push(button);
            }
        }
    });
    
    console.log(`Found ${downloadButtons.length} download buttons`);
    
    downloadButtons.forEach((button, index) => {
        console.log(`\n=== Download Button ${index + 1} ===`);
        
        // Find the video for this button
        let parent = button;
        let level = 0;
        let foundVideo = null;
        
        while (parent && level < 10) {
            console.log(`Level ${level}: ${parent.tagName}.${parent.className}`);
            
            // Look for video in this container
            const videos = parent.querySelectorAll('video');
            if (videos.length > 0) {
                console.log(`  Found ${videos.length} video(s) at level ${level}`);
                videos.forEach((video, vIndex) => {
                    const rect = video.getBoundingClientRect();
                    console.log(`    Video ${vIndex + 1}: ${rect.width}x${rect.height}, src: ${video.src?.substring(0, 50)}...`);
                    if (!foundVideo && rect.width > 0 && rect.height > 0) {
                        foundVideo = video;
                    }
                });
            }
            
            parent = parent.parentElement;
            level++;
        }
        
        if (foundVideo) {
            console.log(`✓ Found video for button ${index + 1}`);
        } else {
            console.log(`✗ No video found for button ${index + 1}`);
        }
    });
    
    // Also check the structure from video perspective
    console.log('\n=== Video to Download Button Mapping ===');
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video, index) => {
        const rect = video.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            console.log(`\nVideo ${index + 1} (${rect.width}x${rect.height}):`);
            
            // Find download button for this video
            let parent = video;
            let level = 0;
            let foundButton = false;
            
            while (parent && level < 10 && !foundButton) {
                const buttons = parent.querySelectorAll('button');
                buttons.forEach(button => {
                    const icon = button.querySelector('i.google-symbols');
                    if (icon && icon.textContent === 'download') {
                        console.log(`  Found download button at level ${level}`);
                        foundButton = true;
                    }
                });
                parent = parent.parentElement;
                level++;
            }
        }
    });
};

console.log('Debug video finder loaded. Run window.debugVideoFinder() to analyze structure.');