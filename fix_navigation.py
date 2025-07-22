#!/usr/bin/env python3
"""Fix navigation monitoring in main.py"""

import re

# Read the file
with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the navigation monitoring section
# This will fix the indentation issues and prevent repeated triggering

old_pattern = r'(\s+# Check if URL changed.*?)(flow_clicked = True\s+interceptor_refresh_count = 0)'
new_code = '''            # Check if URL changed (ignore minor hash changes)
            if new_url != current_url:
                # Extract base URL without hash for comparison
                current_base = current_url.split('#')[0]
                new_base = new_url.split('#')[0]
                
                # Only process if base URL changed
                if new_base != current_base:
                    # Check if navigating to Google Flow project page directly
                    if "labs.google/fx/ko/tools/flow" in new_url and not flow_clicked:
                        print("\\n" + "#" * 60)
                        print("[NAVIGATION] Navigated to Google Flow project")
                        print(f"[NAVIGATION] URL: {new_url}")
                        print("#" * 60)
                        
                        # Check URL hash for mode
                        requested_mode = None
                        if '#veo_mode=' in new_url:
                            try:
                                hash_part = new_url.split('#veo_mode=')[1]
                                requested_mode = hash_part.split('&')[0]  # In case there are other params
                                print(f"[NAVIGATION] Mode from URL hash: '{requested_mode}'")
                            except:
                                print("[NAVIGATION] Error parsing URL hash")
                        
                        # Also check session storage as fallback
                        if not requested_mode:
                            requested_mode = driver.execute_script("return sessionStorage.getItem('veo_flow_mode');")
                            print(f"[NAVIGATION] Mode from session storage: '{requested_mode}'")
                        
                        if requested_mode == 'asset':
                            print("[NAVIGATION] \\u2192 Asset mode requested, initiating mode change...")
                            # Use Python Selenium to change mode
                            if wait_and_change_mode(driver):
                                print("[NAVIGATION] \\u2713 Mode changed successfully")
                                # Clear the hash from URL
                                driver.execute_script("history.replaceState(null, '', window.location.pathname + window.location.search);")
                            else:
                                print("[NAVIGATION] \\u2717 Failed to change mode")
                        elif requested_mode == 'text':
                            print("[NAVIGATION] Text mode requested (default mode, no change needed)")
                        else:
                            print(f"[NAVIGATION] No mode change needed (requested: '{requested_mode}')")
                        
                        # Setup download QR interceptor
                        print("[NAVIGATION] Setting up download QR interceptor...")
                        setup_download_qr_interceptor(driver)
                        
                        # Hide UI elements
                        print("[NAVIGATION] Hiding UI elements...")
                        hide_flow_ui_elements(driver)
                        
                        # Add home button auto-hider
                        home_hider_path = os.path.join(current_dir, 'home_button_auto_hider.js')
                        if os.path.exists(home_hider_path):
                            with open(home_hider_path, 'r', encoding='utf-8') as f:
                                hider_script = f.read()
                            driver.execute_script(hider_script)
                            print("[NAVIGATION] Home button auto-hider loaded - will hide during processing")
                        
                        print("#" * 60 + "\\n")
                        flow_clicked = True
                        interceptor_refresh_count = 0'''

# Find the section to replace
match = re.search(old_pattern, content, re.DOTALL)
if match:
    # Get the proper indentation from the first line
    first_line = match.group(1).split('\n')[0]
    indent = len(first_line) - len(first_line.lstrip())
    
    # Apply proper indentation to new code
    indented_new_code = '\n'.join(' ' * indent + line if line.strip() else line 
                                   for line in new_code.split('\n'))
    
    # Replace the section
    start = content.find('# Check if URL changed')
    end = content.find('flow_clicked = True\n                    interceptor_refresh_count = 0') + len('flow_clicked = True\n                    interceptor_refresh_count = 0')
    
    if start != -1 and end != -1:
        content = content[:start] + indented_new_code + content[end:]
        
        # Write back
        with open('main.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed navigation monitoring")
    else:
        print("Could not find the section to replace")
else:
    print("Pattern not found")