// Debug version of chat deleter with console logs
console.log('[CHAT DELETER DEBUG] Loading debug chat deleter...');

async function debugDeleteAllChats() {
    return new Promise(async (resolve) => {
        let deletionCount = 0;
        let attempts = 0;
        const maxAttempts = 50;
        
        console.log('[DEBUG] Starting chat deletion...');
        
        async function deleteNextChat() {
            attempts++;
            if (attempts > maxAttempts) {
                console.log('[DEBUG] Max attempts reached, stopping');
                resolve(deletionCount);
                return;
            }
            
            // Debug: List all buttons with aria-haspopup
            const menuButtons = document.querySelectorAll('button[aria-haspopup="menu"]');
            console.log(`[DEBUG] Found ${menuButtons.length} menu buttons`);
            
            // Find the more_vert button (menu button)
            const actualMenuButton = Array.from(document.querySelectorAll('button[aria-haspopup="menu"]')).find(btn => {
                const icon = btn.querySelector('i.material-icons');
                const hasMoreVert = icon && icon.textContent.trim() === 'more_vert';
                if (hasMoreVert) {
                    console.log('[DEBUG] Found more_vert button:', btn);
                }
                return hasMoreVert;
            });
            
            if (!actualMenuButton) {
                console.log('[DEBUG] No menu button found - listing all buttons with icons:');
                document.querySelectorAll('button').forEach(btn => {
                    const icon = btn.querySelector('i.material-icons');
                    if (icon) {
                        console.log(`[DEBUG] Button with icon: ${icon.textContent.trim()}`);
                    }
                });
                resolve(deletionCount);
                return;
            }
            
            console.log('[DEBUG] Clicking menu button...');
            actualMenuButton.click();
            
            // Wait for menu to appear
            await new Promise(r => setTimeout(r, 500));
            
            // Debug: List all menu items
            const menuItems = document.querySelectorAll('[role="menuitem"]');
            console.log(`[DEBUG] Found ${menuItems.length} menu items`);
            menuItems.forEach(item => {
                console.log(`[DEBUG] Menu item: ${item.textContent.trim()}`);
            });
            
            // Find delete button in the menu
            const deleteButton = Array.from(menuItems).find(item => {
                const icon = item.querySelector('i.material-icons-outlined');
                const text = item.textContent;
                const hasDelete = (icon && icon.textContent === 'delete') || 
                                 text.includes('삭제') || 
                                 text.includes('Delete') ||
                                 text.includes('Remove');
                if (hasDelete) {
                    console.log('[DEBUG] Found delete option:', text);
                }
                return hasDelete;
            });
            
            if (deleteButton) {
                console.log('[DEBUG] Clicking delete button...');
                deleteButton.click();
                deletionCount++;
                
                // Wait for possible confirmation dialog
                await new Promise(r => setTimeout(r, 700));
                
                // Look for confirmation dialog
                const allButtons = document.querySelectorAll('button');
                console.log(`[DEBUG] Looking for confirmation among ${allButtons.length} buttons`);
                
                const confirmButton = Array.from(allButtons).find(btn => {
                    const text = btn.textContent.trim();
                    const isConfirm = text === '삭제' || text === 'Delete' || 
                                     text === '확인' || text === 'Confirm' ||
                                     text === 'OK' || text === '예' || text === 'Yes';
                    if (isConfirm) {
                        console.log('[DEBUG] Found confirmation button:', text);
                    }
                    return isConfirm;
                });
                
                if (confirmButton && confirmButton !== deleteButton) {
                    console.log('[DEBUG] Clicking confirmation button...');
                    confirmButton.click();
                    await new Promise(r => setTimeout(r, 500));
                }
                
                // Continue deleting
                deleteNextChat();
            } else {
                console.log('[DEBUG] Delete button not found in menu');
                // Try to close menu by clicking elsewhere
                document.body.click();
                await new Promise(r => setTimeout(r, 300));
                
                // Maybe try again with different selectors
                resolve(deletionCount);
            }
        }
        
        // Start deletion process
        deleteNextChat();
    });
}

// Debug function to test
window.debugDeleteChats = async function() {
    console.log('[DEBUG] Starting debug chat deletion...');
    const count = await debugDeleteAllChats();
    console.log(`[DEBUG] Deleted ${count} chats`);
    return count;
};

// Also add a function to analyze the page structure
window.analyzeFlowPage = function() {
    console.log('[DEBUG] Analyzing Flow page structure...');
    
    // Look for chat containers
    const possibleChatContainers = [
        '.chat-container', '.conversation', '.message', '.chat-item',
        '[role="article"]', '[role="listitem"]', '.thread', '.chat'
    ];
    
    possibleChatContainers.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`[DEBUG] Found ${elements.length} elements with selector: ${selector}`);
        }
    });
    
    // Look for any more_vert icons
    const moreIcons = Array.from(document.querySelectorAll('i.material-icons')).filter(i => 
        i.textContent.includes('more') || i.textContent.includes('vert')
    );
    console.log(`[DEBUG] Found ${moreIcons.length} more/vert icons:`, moreIcons.map(i => i.textContent));
    
    // Look for delete-related text
    const deleteTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent.trim();
        return (text === '삭제' || text === 'Delete' || text === 'Remove') && 
               el.children.length === 0; // Only leaf nodes
    });
    console.log(`[DEBUG] Found ${deleteTexts.length} delete-related texts`);
};

console.log('[CHAT DELETER DEBUG] Debug functions ready - use window.debugDeleteChats() or window.analyzeFlowPage()');