from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import json
import time
import os
import platform
import sys
import subprocess
import threading
import atexit
from flow_mode_changer import wait_and_change_mode

# Suppress WebDriver logging on Windows
os.environ['WDM_LOG_LEVEL'] = '0'
os.environ['WDM_PRINT_FIRST_LINE'] = 'False'

# Suppress Selenium logging
import logging
logging.getLogger('selenium').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)

# Global variables
drive_server_process = None
oauth_service = None

def load_credentials(filepath='credentials.json'):
    with open(filepath, 'r') as file:
        return json.load(file)

def start_drive_upload_server():
    """Start the Drive upload server in background"""
    global drive_server_process
    
    # Check if service account key exists
    service_account_path = os.path.join(os.path.dirname(__file__), 'res', 'drive_api_key.json')
    if not os.path.exists(service_account_path):
        print(f"WARNING: Google Drive service account key not found at {service_account_path}")
        print("Drive upload functionality will not work!")
        return False
    
    try:
        # Check if required packages are installed
        try:
            import google.auth
            from flask import Flask
            from flask_cors import CORS
            import requests
        except ImportError as e:
            print(f"WARNING: Missing required packages: {e}")
            print("Please run: pip install -r requirements_drive.txt")
            return False
        
        # Try integrated server first (runs in thread)
        try:
            from integrated_drive_server import start_integrated_drive_server
            print("Starting integrated Google Drive upload server...")
            if start_integrated_drive_server():
                return True
        except Exception as e:
            print(f"Integrated server failed: {e}")
        
        # Fallback to subprocess method
        print("Trying subprocess method...")
        
        server_script = os.path.join(os.path.dirname(__file__), 'drive_upload_server_v2.py')
        if not os.path.exists(server_script):
            print(f"ERROR: Server script not found: {server_script}")
            return False
            
        drive_server_process = subprocess.Popen(
            [sys.executable, server_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Check if server started successfully
        time.sleep(0.5)
        if drive_server_process.poll() is not None:
            print("ERROR: Server process died immediately")
            # Read any error output
            output, _ = drive_server_process.communicate()
            print(f"Server output: {output}")
            return False
        
        # Monitor server output in a thread
        def monitor_server():
            try:
                while drive_server_process and drive_server_process.poll() is None:
                    output = drive_server_process.stdout.readline()
                    if output:
                        print(f"[Drive Server] {output.strip()}")
            except Exception as e:
                print(f"Error monitoring server: {e}")
        
        server_thread = threading.Thread(target=monitor_server, daemon=True)
        server_thread.start()
        
        # Wait for server to start
        time.sleep(3)
        
        # Check if server is running
        try:
            response = requests.get('http://localhost:5000/health')
            if response.status_code == 200:
                print("✓ Drive upload server is running (subprocess)")
                return True
        except Exception as e:
            print(f"Server health check failed: {e}")
        
        print("✗ Drive upload server failed to start")
        return False
        
    except Exception as e:
        print(f"Error starting Drive server: {e}")
        return False

def stop_drive_upload_server():
    """Stop the Drive upload server"""
    global drive_server_process
    if drive_server_process:
        print("Stopping Drive upload server...")
        try:
            drive_server_process.terminate()
            drive_server_process.wait(timeout=5)
        except:
            drive_server_process.kill()
        drive_server_process = None

def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Disable download bubble
    chrome_options.add_argument('--disable-features=DownloadBubble,DownloadBubbleV2')
    
    # Reduce console logging
    chrome_options.add_argument('--log-level=3')  # Only show fatal errors
    chrome_options.add_argument('--silent')
    chrome_options.add_argument('--disable-logging')
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
    
    if platform.system() == 'Windows':
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-software-rasterizer')
    
    # Use kiosk mode for all platforms to hide UI elements
    if '--kiosk' in sys.argv:
        chrome_options.add_argument('--kiosk')
        print("Kiosk mode enabled")
    else:
        chrome_options.add_argument('--start-fullscreen')  # Use fullscreen instead of kiosk
    
    # Additional arguments to ensure full kiosk mode
    chrome_options.add_argument('--disable-infobars')
    chrome_options.add_argument('--disable-session-crashed-bubble')
    chrome_options.add_argument('--disable-restore-session-state')
    chrome_options.add_argument('--no-first-run')
    chrome_options.add_argument('--disable-features=TranslateUI')
    
    # Enable developer tools only if requested via command line
    if '--devtools' in sys.argv:
        chrome_options.add_argument('--auto-open-devtools-for-tabs')
        print("Developer tools enabled")
    
    # Enable downloads to default directory
    home_dir = os.path.expanduser("~")
    download_dir = os.path.join(home_dir, "Downloads")
    
    prefs = {
        "download.prompt_for_download": False,
        "download.default_directory": download_dir,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
        "profile.default_content_settings.popups": 0,
        "download.bubble.enabled": False,  # Disable download bubble in prefs
        "download_bubble.partial_view.enabled": False,
        "download.ui.enabled": False
    }
    chrome_options.add_experimental_option("prefs", prefs)
    
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    user_data_dir = os.path.join(current_dir, 'chrome_user_data')
    
    if not os.path.exists(user_data_dir):
        os.makedirs(user_data_dir)
        print(f"Created Chrome user data directory: {user_data_dir}")
    else:
        print(f"Using existing Chrome user data directory: {user_data_dir}")
    
    chrome_options.add_argument(f'--user-data-dir={user_data_dir}')
    
    # Always use webdriver_manager to ensure correct version
    print("Setting up ChromeDriver...")
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        driver_path = ChromeDriverManager().install()
        print(f"ChromeDriver path: {driver_path}")
        
        if driver_path.endswith('THIRD_PARTY_NOTICES.chromedriver'):
            driver_path = driver_path.replace('THIRD_PARTY_NOTICES.chromedriver', 'chromedriver')
        
        if platform.system() == 'Windows':
            if not driver_path.endswith('.exe'):
                exe_path = driver_path + '.exe'
                if os.path.exists(exe_path):
                    driver_path = exe_path
                else:
                    driver_dir = os.path.dirname(driver_path)
                    exe_in_dir = os.path.join(driver_dir, 'chromedriver.exe')
                    if os.path.exists(exe_in_dir):
                        driver_path = exe_in_dir
        
        print(f"Using ChromeDriver: {driver_path}")
        
        if platform.system() != 'Windows':
            import subprocess
            try:
                subprocess.run(['chmod', '+x', driver_path], check=True)
            except Exception as e:
                print(f"Warning: Could not set execute permissions: {e}")
        
        service = Service(driver_path)
        driver = webdriver.Chrome(service=service, options=chrome_options)
        print("Successfully connected to Chrome!")
        return driver
        
    except Exception as e:
        print(f"Error setting up ChromeDriver: {e}")
        raise Exception("Could not setup ChromeDriver. Please run 'python install_chromedriver.py' first.")

def login_to_google(driver, email, password):
    try:
        print("Navigating to Google login...")
        driver.get("https://accounts.google.com")
        
        # Check if window is still open
        try:
            current_url = driver.current_url
        except:
            print("Chrome window was closed")
            return False
        
        wait = WebDriverWait(driver, 30)
        
        try:
            # Check if already logged in
            if "myaccount.google.com" in driver.current_url:
                print("Already logged in!")
                return True
                
            email_input = wait.until(EC.presence_of_element_located((By.ID, "identifierId")))
            email_input.clear()
            email_input.send_keys(email)
            email_input.send_keys(Keys.RETURN)
            print("Email entered, proceeding to password...")
            
            time.sleep(2)
            
            password_input = wait.until(EC.presence_of_element_located((By.NAME, "Passwd")))
            password_input.clear()
            password_input.send_keys(password)
            password_input.send_keys(Keys.RETURN)
            print("Password entered, logging in...")
            
            time.sleep(5)
            
            if "myaccount.google.com" in driver.current_url or "google.com" in driver.current_url:
                print("Login successful!")
                return True
            else:
                print("Login verification needed. Current URL:", driver.current_url)
                return True
                
        except TimeoutException:
            print("Already logged in or different login flow")
            return True
            
    except Exception as e:
        print(f"Error during login: {e}")
        # Check if it's a window closed error
        if "no such window" in str(e) or "target window already closed" in str(e):
            print("Chrome window was closed. Please don't close the browser window.")
        return False

def show_pg1(driver):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    pg1_path = os.path.join(current_dir, 'pg1.html')
    driver.get(f"file:///{pg1_path}")
    # Re-inject console filter on navigation
    inject_console_filters(driver)

def show_pg2(driver):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Read the template and inject the project URL
    template_path = os.path.join(current_dir, 'pg2_template.html')
    if os.path.exists(template_path):
        # Load credentials to get project URL
        credentials = load_credentials()
        flow_project_url = credentials.get('flow_project_url', '')
        
        # Read template and replace placeholder
        with open(template_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Replace the placeholder with actual URL
        html_content = html_content.replace('{{FLOW_PROJECT_URL}}', flow_project_url)
        
        # Write to temporary pg2.html
        pg2_path = os.path.join(current_dir, 'pg2.html')
        with open(pg2_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"[PG2] Generated pg2.html with project URL: {flow_project_url[:50]}...")
    else:
        # Fallback to existing pg2.html if template not found
        pg2_path = os.path.join(current_dir, 'pg2.html')
        print("[PG2] Using existing pg2.html (template not found)")
    
    driver.get(f"file:///{pg2_path}")
    # Re-inject console filter on navigation
    inject_console_filters(driver)

def inject_console_filters(driver):
    """Inject console filters to suppress network logs"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        early_filter_path = os.path.join(current_dir, 'early_console_filter.js')
        if os.path.exists(early_filter_path):
            with open(early_filter_path, 'r', encoding='utf-8') as f:
                driver.execute_script(f.read())
    except:
        pass


def setup_download_qr_interceptor(driver):
    """Setup download interceptor to show QR code instead of downloading"""
    try:
        # Skip Chrome DevTools Protocol command - it requires downloadPath
        # Just use JavaScript monitoring instead
        print("Setting up download monitor...")
        
        # Get current directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Add Windows-specific fixes
        if platform.system() == 'Windows':
            # innerHTML patcher for Trusted Types
            patcher_path = os.path.join(current_dir, 'innerHTML_patcher.js')
            if os.path.exists(patcher_path):
                with open(patcher_path, 'r', encoding='utf-8') as f:
                    patcher_script = f.read()
                driver.execute_script(patcher_script)
                print("innerHTML patcher applied for Windows Trusted Types")
            
            # Suppress network errors for localhost:8888
            suppress_errors_path = os.path.join(current_dir, 'suppress_network_errors.js')
            if os.path.exists(suppress_errors_path):
                with open(suppress_errors_path, 'r', encoding='utf-8') as f:
                    suppress_script = f.read()
                driver.execute_script(suppress_script)
                print("Network error suppression active - localhost:8888 errors hidden")
        
        # Add EARLY console filter first to suppress ALL network logs
        early_filter_path = os.path.join(current_dir, 'early_console_filter.js')
        if os.path.exists(early_filter_path):
            with open(early_filter_path, 'r', encoding='utf-8') as f:
                early_filter_script = f.read()
            driver.execute_script(early_filter_script)
            print("Early console filter configured - aggressive network log suppression")
        
        # Then add regular console filter as backup
        console_filter_path = os.path.join(current_dir, 'console_filter.js')
        if os.path.exists(console_filter_path):
            with open(console_filter_path, 'r', encoding='utf-8') as f:
                console_filter_script = f.read()
            driver.execute_script(console_filter_script)
            print("Console filter configured - fetch logs suppressed")
        
        # Add debug monitor if requested
        if '--debug-downloads' in sys.argv:
            debug_monitor_path = os.path.join(current_dir, 'debug_download_monitor.js')
            if os.path.exists(debug_monitor_path):
                with open(debug_monitor_path, 'r', encoding='utf-8') as f:
                    debug_script = f.read()
                driver.execute_script(debug_script)
                print("Debug download monitor loaded - Press Ctrl+D for debug panel")
        
        # Download handlers disabled to prevent popups
        
        # Mode changing is now handled in Python when navigating to Flow page
        # No need for JavaScript mode changers here
        
        # Add Flow mode selector v2
        mode_selector_path = os.path.join(current_dir, 'flow_mode_selector_v2.js')
        if os.path.exists(mode_selector_path):
            with open(mode_selector_path, 'r', encoding='utf-8') as f:
                mode_selector_script = f.read()
            driver.execute_script(mode_selector_script)
            print("Flow mode selector v2 configured - will auto-select requested mode")
        
        
        # Add upload QR dialog handler FIRST (before simple_download_monitor)
        upload_qr_path = os.path.join(current_dir, 'upload_qr_dialog.js')
        if os.path.exists(upload_qr_path):
            # Check if oauth service is running
            if not oauth_service:
                # Disable upload monitoring if service is not available
                driver.execute_script("window.disableUploadMonitoring = true;")
            with open(upload_qr_path, 'r', encoding='utf-8') as f:
                upload_qr_script = f.read()
            driver.execute_script(upload_qr_script)
            if oauth_service:
                print("Upload QR dialog configured - will show QR code after Google Drive uploads")
            else:
                print("Upload QR dialog configured - monitoring disabled (no upload service)")
        
        # NOW load the full simple download monitor (which uses showUploadLoadingSpinner)
        simple_monitor_path = os.path.join(current_dir, 'simple_download_monitor.js')
        if os.path.exists(simple_monitor_path):
            with open(simple_monitor_path, 'r', encoding='utf-8') as f:
                simple_monitor_script = f.read()
            driver.execute_script(simple_monitor_script)
            print("Simple download monitor loaded - will show spinner on download button click")
        
        # Add persistent logo hider
        logo_hider_path = os.path.join(current_dir, 'persistent_logo_hider.js')
        if os.path.exists(logo_hider_path):
            with open(logo_hider_path, 'r', encoding='utf-8') as f:
                logo_hider_script = f.read()
            driver.execute_script(logo_hider_script)
            print("Persistent logo hider configured - will continuously hide Google Cloud logo")
        
        # Add quality filter to hide 270p and 1080p options
        quality_filter_path = os.path.join(current_dir, 'quality_filter.js')
        if os.path.exists(quality_filter_path):
            with open(quality_filter_path, 'r', encoding='utf-8') as f:
                quality_filter_script = f.read()
            driver.execute_script(quality_filter_script)
            print("Quality filter configured - 270p and 1080p options will be hidden")
        
        # Add chat deleter script
        chat_deleter_path = os.path.join(current_dir, 'chat_deleter.js')
        if os.path.exists(chat_deleter_path):
            with open(chat_deleter_path, 'r', encoding='utf-8') as f:
                chat_deleter_script = f.read()
            driver.execute_script(chat_deleter_script)
            print("Chat deleter configured - will delete chats before going home")
        
        # Add debug chat deleter if requested
        if '--debug-chat' in sys.argv:
            debug_chat_path = os.path.join(current_dir, 'debug_chat_deleter.js')
            if os.path.exists(debug_chat_path):
                with open(debug_chat_path, 'r', encoding='utf-8') as f:
                    debug_chat_script = f.read()
                driver.execute_script(debug_chat_script)
                print("Debug chat deleter loaded - use window.debugDeleteChats() in console")
        
        # Add debug video finder if requested
        if '--debug-video' in sys.argv:
            debug_video_path = os.path.join(current_dir, 'debug_video_finder.js')
            if os.path.exists(debug_video_path):
                with open(debug_video_path, 'r', encoding='utf-8') as f:
                    debug_video_script = f.read()
                driver.execute_script(debug_video_script)
                print("Debug video finder loaded - use window.debugVideoFinder() in console")
        
        # Add refresh blocker
        refresh_blocker_path = os.path.join(current_dir, 'refresh_blocker.js')
        if os.path.exists(refresh_blocker_path):
            with open(refresh_blocker_path, 'r', encoding='utf-8') as f:
                refresh_blocker_script = f.read()
            driver.execute_script(refresh_blocker_script)
            print("Refresh blocker configured - F5 and Ctrl/Cmd+R disabled")
        
        # Add home button injector with base path
        home_button_path = os.path.join(current_dir, 'home_button_injector.js')
        if os.path.exists(home_button_path):
            # Set the base path first
            driver.execute_script(f"window.veoBasePath = '{current_dir}';")
            with open(home_button_path, 'r', encoding='utf-8') as f:
                home_button_script = f.read()
            driver.execute_script(home_button_script)
            print("Home button injector configured - will add home button to external pages")
        
        # Framework function blocker disabled
        # if platform.system() == 'Windows':
        #     aggressive_blocker_path = os.path.join(current_dir, 'aggressive_framework_blocker.js')
        #     if os.path.exists(aggressive_blocker_path):
        #         with open(aggressive_blocker_path, 'r', encoding='utf-8') as f:
        #             blocker_script = f.read()
        #         driver.execute_script(blocker_script)
        #         print("Aggressive framework blocker loaded - targeting _0x4fef57 and similar functions")
        
        print("Press Alt+D to test QR overlay")
        print("Developer tools: Run with --devtools flag to enable")
        print("Debug downloads: Run with --debug-downloads flag")
        print("Debug chat deletion: Run with --debug-chat flag")
        print("Debug video finder: Run with --debug-video flag")
        print("Kiosk mode: Run with --kiosk flag to test full kiosk mode")
        
    except Exception as e:
        print(f"Error setting up download monitor: {e}")

def hide_flow_ui_elements(driver):
    """Hide UI elements in Google Flow interface"""
    try:
        hide_script = """
        // Remove any existing hiding styles first
        const existingStyle = document.getElementById('veo-hiding-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Hide elements immediately with a minimal delay
        setTimeout(() => {
            // Hide specific elements by searching for them
            // Hide date dividers
            const dateElements = document.querySelectorAll('.MqrLh');
            dateElements.forEach(el => {
                if (el.textContent.includes('2025년') || el.textContent.includes('월') || el.textContent.includes('일')) {
                    const container = el.closest('[data-known-size]') || el.parentElement.parentElement;
                    if (container) container.style.display = 'none';
                }
            });
            
            // Hide breadcrumb
            const breadcrumb = document.querySelector('.goSPNE');
            if (breadcrumb) breadcrumb.style.display = 'none';
            
            // Hide top toolbar - but delay to allow mode change
            setTimeout(() => {
                const toolbar = document.querySelector('.gxAzIM');
                if (toolbar) toolbar.style.display = 'none';
            }, 5000); // Wait 5 seconds before hiding toolbar
            
            // Hide profile and buttons
            const profile = document.querySelector('.gNJurX');
            if (profile) profile.style.display = 'none';
            
            const discord = document.querySelector('a[href*="discord"]');
            if (discord) discord.style.display = 'none';
            
            const help = document.querySelector('a[href*="faq"]');
            if (help) help.style.display = 'none';
            
            // Hide Google Cloud button on top left
            const googleCloudButton = document.querySelector('.Logo_container__QTJew');
            if (googleCloudButton) googleCloudButton.style.display = 'none';
            
            // Also hide the entire navigation container if it only contains the logo
            const navContainer = document.querySelector('.Navigation_navigation__K3ZWw');
            if (navContainer) navContainer.style.display = 'none';
            
            // Hide the fixed position control that contains the logo
            const fixedControl = document.querySelector('.FixedPositionControl_topLeft__LnSf_');
            if (fixedControl) fixedControl.style.display = 'none';
            
            console.log('UI elements hidden selectively');
        }, 50);
        """
        
        driver.execute_script(hide_script)
        print("UI elements hidden")
        
    except Exception as e:
        print(f"Error hiding UI elements: {e}")


def monitor_navigation(driver, credentials):
    current_url = driver.current_url
    flow_clicked = False
    sketch_clicked = False
    project_url = credentials.get('flow_project_url', '')
    interceptor_refresh_count = 0
    
    print("Navigation monitoring active")
    
    while True:
        try:
            time.sleep(0.1)
            new_url = driver.current_url
            
            # Check if URL changed
            if new_url != current_url:
                # Check if navigating to Google Flow project page directly
                if "labs.google/fx/ko/tools/flow" in new_url and not flow_clicked:
                    print("\n" + "#" * 60)
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
                        print("[NAVIGATION] \u2192 Asset mode requested, initiating mode change...")
                        # Use Python Selenium to change mode
                        if wait_and_change_mode(driver):
                            print("[NAVIGATION] \u2713 Mode changed successfully")
                            # Clear the hash from URL
                            driver.execute_script("history.replaceState(null, '', window.location.pathname + window.location.search);")
                        else:
                            print("[NAVIGATION] \u2717 Failed to change mode")
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
                    
                    print("#" * 60 + "\n")
                    flow_clicked = True
                    interceptor_refresh_count = 0
                    
                # Check if navigating to sketch page
                elif "gcdemos-25-int-dreamstudio" in new_url and not sketch_clicked:
                    print("Navigated to Sketch to Video page...")
                    time.sleep(2)
                    
                    # Inject persistent logo hider for sketch page
                    current_dir = os.path.dirname(os.path.abspath(__file__))
                    logo_hider_path = os.path.join(current_dir, 'persistent_logo_hider.js')
                    if os.path.exists(logo_hider_path):
                        with open(logo_hider_path, 'r', encoding='utf-8') as f:
                            logo_hider_script = f.read()
                        driver.execute_script(logo_hider_script)
                        print("Injected logo hider for sketch page")
                    
                    # Inject home button for sketch page
                    home_button_path = os.path.join(current_dir, 'home_button_injector.js')
                    if os.path.exists(home_button_path):
                        driver.execute_script(f"window.veoBasePath = '{current_dir}';")
                        with open(home_button_path, 'r', encoding='utf-8') as f:
                            home_button_script = f.read()
                        driver.execute_script(home_button_script)
                        print("Injected home button for sketch page")
                    
                    sketch_clicked = True
                    
                elif "labs.google/fx/ko/tools/flow" not in new_url:
                    flow_clicked = False  # Reset when navigating away
                    
                elif "gcdemos-25-int-dreamstudio" not in new_url:
                    sketch_clicked = False  # Reset when navigating away
                
                current_url = new_url
            
            # Check if home button was clicked by checking for navigation signals
            try:
                # Check for navigation signals
                nav_signal = driver.execute_script("""
                    // Check for direct navigation signal
                    const directNav = document.getElementById('veo-navigate-to-pg1');
                    if (directNav) {
                        directNav.remove();
                        return 'direct';
                    }
                    
                    // Check for chats deleted signal
                    const chatsDeleted = document.getElementById('veo-chats-deleted-go-home');
                    if (chatsDeleted) {
                        chatsDeleted.remove();
                        return 'chats-deleted';
                    }
                    
                    return null;
                """)
                
                if nav_signal:
                    if nav_signal == 'chats-deleted':
                        print("Chats deleted - navigating to pg1...")
                    else:
                        print("Home button clicked - navigating to pg1...")
                    
                    # Clean up downloaded files
                    try:
                        from download_cleanup import cleanup_recent_downloads
                        cleanup_recent_downloads()
                    except Exception as e:
                        print(f"Error cleaning up downloads: {e}")
                    
                    show_pg1(driver)
                    current_url = "pg1"
                    flow_clicked = False
                    sketch_clicked = False
            except:
                pass
            
            
        except Exception as e:
            if "no such window" in str(e).lower():
                print("Browser was closed.")
                break
            else:
                time.sleep(0.5)

def main():
    driver = None
    try:
        # Try to start integrated Drive service
        print("=" * 60)
        print("Starting Veo Application with Automatic Upload")
        print("=" * 60)
        
        # First install dependencies if needed
        try:
            import google.auth
            from googleapiclient.discovery import build
        except ImportError:
            print("Installing required dependencies...")
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", 
                                 "google-auth", "google-api-python-client", 
                                 "google-auth-oauthlib", "google-auth-httplib2"])
            print("Dependencies installed!")
        
        # Start OAuth Drive service (optional)
        global oauth_service
        try:
            from oauth_drive_service import start_oauth_drive_service, stop_oauth_drive_service
            oauth_service = start_oauth_drive_service()
            if oauth_service:
                print("✅ Automatic upload service started")
                print("Downloads will be automatically uploaded to Google Drive")
                atexit.register(stop_oauth_drive_service)
            else:
                print("⚠️  Automatic upload service failed to start")
                print("Downloads will be saved to ~/Downloads")
                print("💡 Tip: Add your email as test user in Google Cloud Console")
                print("   Or run: python manual_upload_helper.py")
        except Exception as e:
            print(f"⚠️  Could not start automatic upload: {e}")
            print("Downloads will be saved to ~/Downloads")
            print("💡 Run in another terminal: python manual_upload_helper.py")
        
        print("=" * 60)
        
        # Load credentials from file
        credentials = load_credentials()
        
        driver = setup_driver()
        
        email = credentials['google']['email']
        password = credentials['google']['password']
        
        if login_to_google(driver, email, password):
            print("Starting application flow...")
            
            # Inject early fixes IMMEDIATELY
            current_dir = os.path.dirname(os.path.abspath(__file__))
            
            # Fix innerHTML for Windows Trusted Types first
            if platform.system() == 'Windows':
                patcher_path = os.path.join(current_dir, 'innerHTML_patcher.js')
                if os.path.exists(patcher_path):
                    with open(patcher_path, 'r', encoding='utf-8') as f:
                        patcher_script = f.read()
                    driver.execute_script(patcher_script)
                    print("innerHTML patcher injected early for Windows")
            
            # Then inject console filter
            early_filter_path = os.path.join(current_dir, 'early_console_filter.js')
            if os.path.exists(early_filter_path):
                with open(early_filter_path, 'r', encoding='utf-8') as f:
                    early_filter_script = f.read()
                driver.execute_script(early_filter_script)
                print("Early console filter injected globally")
            
            # Framework blocker disabled
            # if platform.system() == 'Windows':
            #     aggressive_blocker_path = os.path.join(current_dir, 'aggressive_framework_blocker.js')
            #     if os.path.exists(aggressive_blocker_path):
            #         with open(aggressive_blocker_path, 'r', encoding='utf-8') as f:
            #             blocker_script = f.read()
            #         driver.execute_script(blocker_script)
            #         print("Aggressive framework blocker injected early - will catch _0x4fef57")
            
            # Setup download QR interceptor globally
            setup_download_qr_interceptor(driver)
            
            show_pg1(driver)
            
            print("Application is running. Press Ctrl+C to stop.")
            monitor_navigation(driver, credentials)
            
        else:
            print("Login failed. Please check credentials.")
            
    except KeyboardInterrupt:
        print("\nShutting down gracefully...")
    except Exception as e:
        print(f"Error in main: {e}")
        
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    main()