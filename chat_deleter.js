// Chat deletion script for Google Flow with dark overlay

// Create dark overlay
function createDarkOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'veo-deletion-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999998;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        pointer-events: none;
    `;
    
    document.body.appendChild(overlay);
    
    // Fade in
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
    
    return overlay;
}

// Remove dark overlay
function removeDarkOverlay() {
    const overlay = document.getElementById('veo-deletion-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 500);
    }
}


async function deleteAllChats() {
    return new Promise(async (resolve) => {
        let deletionCount = 0;
        let attempts = 0;
        const maxAttempts = 50; // Prevent infinite loops
        
        // Create dark overlay when starting deletion
        createDarkOverlay();
        
        async function deleteNextChat() {
            attempts++;
            if (attempts > maxAttempts) {
                // Max attempts reached, stopping
                resolve(deletionCount);
                return;
            }
            
            // Find the more_vert button (menu button)
            const actualMenuButton = Array.from(document.querySelectorAll('button[aria-haspopup="menu"]')).find(btn => {
                const icon = btn.querySelector('i.material-icons');
                return icon && icon.textContent.trim() === 'more_vert';
            }) || Array.from(document.querySelectorAll('button')).find(btn => {
                const icon = btn.querySelector('i.material-icons');
                return icon && icon.textContent.trim() === 'more_vert';
            });
            
            if (!actualMenuButton) {
                // No more chat items found
                resolve(deletionCount);
                return;
            }
            
            // Found menu button, clicking
            actualMenuButton.click();
            
            // Wait for menu to appear
            await new Promise(r => setTimeout(r, 300));
            
            // Find delete button in the menu
            const deleteButton = Array.from(document.querySelectorAll('[role="menuitem"]')).find(item => {
                const icon = item.querySelector('i.material-icons-outlined');
                const text = item.textContent;
                return (icon && icon.textContent === 'delete') || text.includes('삭제') || text.includes('Delete');
            });
            
            if (deleteButton) {
                // Found delete button, clicking
                deleteButton.click();
                deletionCount++;
                
                // Wait for deletion animation
                await new Promise(r => setTimeout(r, 500));
                
                // Look for confirmation dialog and click it if exists
                const confirmButton = Array.from(document.querySelectorAll('button')).find(btn => {
                    const text = btn.textContent.trim();
                    return text === '삭제' || text === 'Delete' || text === '확인' || text === 'Confirm';
                });
                
                if (confirmButton && confirmButton !== deleteButton) {
                    // Found confirmation button, clicking
                    confirmButton.click();
                    await new Promise(r => setTimeout(r, 500));
                }
                
                // Continue deleting
                deleteNextChat();
            } else {
                // Delete button not found in menu
                // Try to close menu by clicking elsewhere
                document.body.click();
                await new Promise(r => setTimeout(r, 300));
                deleteNextChat();
            }
        }
        
        // Start deletion process
        deleteNextChat();
    });
}

// Function to be called when home button is clicked
window.deleteAllChatsAndGoHome = async function() {
    // Starting chat deletion before going home
    
    try {
        const deletedCount = await deleteAllChats();
        // Chat deletion completed
        
        // Remove overlay after a short delay
        setTimeout(() => {
            removeDarkOverlay();
        }, 500);
        
        // Signal to Python that deletion is complete and ready to go home
        setTimeout(() => {
            const navSignal = document.createElement('div');
            navSignal.id = 'veo-chats-deleted-go-home';
            navSignal.style.display = 'none';
            navSignal.setAttribute('data-timestamp', Date.now());
            document.body.appendChild(navSignal);
        }, 1000);
        
    } catch (error) {
        // Error during deletion
        removeDarkOverlay();
        
        // Go home anyway
        const navSignal = document.createElement('div');
        navSignal.id = 'veo-chats-deleted-go-home';
        navSignal.style.display = 'none';
        document.body.appendChild(navSignal);
    }
};

// Chat deletion functions ready with dark overlay