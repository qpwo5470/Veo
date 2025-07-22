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
    
    # Force inject home button
    home_button_force_path = os.path.join(current_dir, 'home_button_force.js')
    if os.path.exists(home_button_force_path):
        with open(home_button_force_path, 'r', encoding='utf-8') as f:
            home_button_script = f.read()
        driver.execute_script(home_button_script)
        print("[PG1] 홈버튼 주입")

def show_pg2(driver):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    pg2_path = os.path.join(current_dir, 'pg2.html')
    driver.get(f"file:///{pg2_path}")
    # Re-inject console filter on navigation
    inject_console_filters(driver)
    
    # Force inject home button
    home_button_force_path = os.path.join(current_dir, 'home_button_force.js')
    if os.path.exists(home_button_force_path):
        with open(home_button_force_path, 'r', encoding='utf-8') as f:
            home_button_script = f.read()
        driver.execute_script(home_button_script)
        print("[PG2] 홈버튼 주입")

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
        
        # Add lightweight console filter
        lightweight_filter_path = os.path.join(current_dir, 'lightweight_console_filter.js')
        if os.path.exists(lightweight_filter_path):
            with open(lightweight_filter_path, 'r', encoding='utf-8') as f:
                filter_script = f.read()
            driver.execute_script(filter_script)
            print("Lightweight console filter configured")
        
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
        
        
        
        # Add multi-port upload monitor (provides startUploadMonitoring)
        multiport_monitor_path = os.path.join(current_dir, 'upload_monitor_multiport.js')
        if os.path.exists(multiport_monitor_path):
            with open(multiport_monitor_path, 'r', encoding='utf-8') as f:
                monitor_script = f.read()
            driver.execute_script(monitor_script)
            print("Multi-port upload monitor configured - Windows compatible")
        
        # Add upload QR dialog handler (depends on upload monitor)
        upload_qr_path = os.path.join(current_dir, 'upload_qr_dialog.js')
        if os.path.exists(upload_qr_path):
            with open(upload_qr_path, 'r', encoding='utf-8') as f:
                upload_qr_script = f.read()
            driver.execute_script(upload_qr_script)
            print("Upload QR dialog configured - will show QR code after Google Drive uploads")
        
        # Load fixed download monitor (which uses showUploadLoadingSpinner)
        download_monitor_path = os.path.join(current_dir, 'download_monitor_fixed.js')
        if os.path.exists(download_monitor_path):
            with open(download_monitor_path, 'r', encoding='utf-8') as f:
                download_monitor_script = f.read()
            driver.execute_script(download_monitor_script)
            print("Fixed download monitor loaded - will show spinner for all qualities")
        
        # Add efficient logo hider
        logo_hider_path = os.path.join(current_dir, 'logo_hider_efficient.js')
        if os.path.exists(logo_hider_path):
            with open(logo_hider_path, 'r', encoding='utf-8') as f:
                logo_hider_script = f.read()
            driver.execute_script(logo_hider_script)
            print("Efficient logo hider configured - CSS-only solution")
        
        # Add working fix for spinner and quality
        working_fix_path = os.path.join(current_dir, 'working_fix.js')
        if os.path.exists(working_fix_path):
            with open(working_fix_path, 'r', encoding='utf-8') as f:
                working_script = f.read()
            driver.execute_script(working_script)
            print("Working fix loaded - Non-invasive quality filter and spinner")
        
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
        
        # Add Windows-specific fixes
        if platform.system() == 'Windows':
            # QR debug
            debug_qr_path = os.path.join(current_dir, 'debug_qr_windows.js')
            if os.path.exists(debug_qr_path):
                with open(debug_qr_path, 'r', encoding='utf-8') as f:
                    debug_qr_script = f.read()
                driver.execute_script(debug_qr_script)
                print("Windows QR debug loaded - Press Alt+Q to debug")
            
            # Performance patches
            perf_patch_path = os.path.join(current_dir, 'windows_performance_patch.js')
            if os.path.exists(perf_patch_path):
                with open(perf_patch_path, 'r', encoding='utf-8') as f:
                    perf_patch_script = f.read()
                driver.execute_script(perf_patch_script)
                print("Windows performance patch loaded - Framework lag mitigation active")
            
            # Framework performance monitor
            framework_fix_path = os.path.join(current_dir, 'framework_performance_fix.js')
            if os.path.exists(framework_fix_path):
                with open(framework_fix_path, 'r', encoding='utf-8') as f:
                    framework_script = f.read()
                driver.execute_script(framework_script)
                print("Framework performance monitor loaded")
        
        # Add refresh blocker
        refresh_blocker_path = os.path.join(current_dir, 'refresh_blocker.js')
        if os.path.exists(refresh_blocker_path):
            with open(refresh_blocker_path, 'r', encoding='utf-8') as f:
                refresh_blocker_script = f.read()
            driver.execute_script(refresh_blocker_script)
            print("Refresh blocker configured - F5 and Ctrl/Cmd+R disabled")
        
        
        
        # Add performance debugging tools if requested
        if '--debug-performance' in sys.argv:
            perf_monitor_path = os.path.join(current_dir, 'performance_monitor.js')
            if os.path.exists(perf_monitor_path):
                with open(perf_monitor_path, 'r', encoding='utf-8') as f:
                    perf_script = f.read()
                driver.execute_script(perf_script)
                print("Performance monitor loaded - Reports every 10 seconds")
            
            script_profiler_path = os.path.join(current_dir, 'script_profiler.js')
            if os.path.exists(script_profiler_path):
                with open(script_profiler_path, 'r', encoding='utf-8') as f:
                    profiler_script = f.read()
                driver.execute_script(profiler_script)
                print("Script profiler loaded - Tracks execution times")
            
            cpu_detector_path = os.path.join(current_dir, 'cpu_detector.js')
            if os.path.exists(cpu_detector_path):
                with open(cpu_detector_path, 'r', encoding='utf-8') as f:
                    cpu_script = f.read()
                driver.execute_script(cpu_script)
                print("CPU detector loaded - Identifies performance bottlenecks")
        
        # Add comprehensive debug if requested
        if '--debug-issues' in sys.argv:
            debug_all_path = os.path.join(current_dir, 'debug_all_issues.js')
            if os.path.exists(debug_all_path):
                with open(debug_all_path, 'r', encoding='utf-8') as f:
                    debug_script = f.read()
                driver.execute_script(debug_script)
                print("Comprehensive debug loaded - Check console for detailed logs")
        
        print("Press Alt+D to test QR overlay")
        print("Developer tools: Run with --devtools flag to enable")
        print("Debug downloads: Run with --debug-downloads flag")
        print("Debug chat deletion: Run with --debug-chat flag")
        print("Debug video finder: Run with --debug-video flag")
        print("Debug performance: Run with --debug-performance flag")
        print("Debug issues: Run with --debug-issues flag")
        print("Kiosk mode: Run with --kiosk flag to test full kiosk mode")
        
    except Exception as e:
        print(f"Error setting up download monitor: {e}")

def hide_flow_ui_elements(driver):
    """Hide UI elements in Google Flow interface"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        ui_hider_path = os.path.join(current_dir, 'flow_ui_hider_minimal.js')
        
        if os.path.exists(ui_hider_path):
            with open(ui_hider_path, 'r', encoding='utf-8') as f:
                hide_script = f.read()
            driver.execute_script(hide_script)
            print("UI elements hidden (minimal CSS)")
        
    except Exception as e:
        print(f"Error hiding UI elements: {e}")


def monitor_navigation(driver, credentials):
    current_url = driver.current_url
    flow_clicked = False
    sketch_clicked = False
    
    print("Navigation monitoring active")
    
    while True:
        try:
            time.sleep(0.1)
            new_url = driver.current_url
            
            # Check if URL changed
            if new_url != current_url:
                # Force inject home button on any navigation
                current_dir = os.path.dirname(os.path.abspath(__file__))
                home_button_force_path = os.path.join(current_dir, 'home_button_force.js')
                if os.path.exists(home_button_force_path):
                    with open(home_button_force_path, 'r', encoding='utf-8') as f:
                        home_button_script = f.read()
                    driver.execute_script(home_button_script)
                    print(f"[NAVIGATION] 홈버튼 강제 주입: {new_url[:50]}...")
                
                # Re-inject working fix on Flow pages
                if "labs.google/fx/ko/tools/flow" in new_url:
                    working_fix_path = os.path.join(current_dir, 'working_fix.js')
                    if os.path.exists(working_fix_path):
                        with open(working_fix_path, 'r', encoding='utf-8') as f:
                            working_script = f.read()
                        driver.execute_script(working_script)
                        print("[NAVIGATION] Working fix 재주입")
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
                    
                    # Only inject scripts that haven't been injected globally
                    # Hide UI elements (this needs to run per page)
                    print("[NAVIGATION] Hiding UI elements...")
                    hide_flow_ui_elements(driver)
                    
                    print("#" * 60 + "\n")
                    flow_clicked = True
                    
                # Check if navigating to sketch page
                elif "gcdemos-25-int-dreamstudio" in new_url and not sketch_clicked:
                    print("Navigated to Sketch to Video page...")
                    time.sleep(2)
                    
                    # Inject efficient logo hider for sketch page
                    current_dir = os.path.dirname(os.path.abspath(__file__))
                    logo_hider_path = os.path.join(current_dir, 'logo_hider_efficient.js')
                    if os.path.exists(logo_hider_path):
                        with open(logo_hider_path, 'r', encoding='utf-8') as f:
                            logo_hider_script = f.read()
                        driver.execute_script(logo_hider_script)
                        print("Injected efficient logo hider for sketch page")
                    
                    
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
            
            # Console filter already injected in setup_download_qr_interceptor
            
            # Setup download QR interceptor globally
            setup_download_qr_interceptor(driver)
            
            # Inject force home button globally
            current_dir = os.path.dirname(os.path.abspath(__file__))
            home_button_force_path = os.path.join(current_dir, 'home_button_force.js')
            if os.path.exists(home_button_force_path):
                with open(home_button_force_path, 'r', encoding='utf-8') as f:
                    home_button_script = f.read()
                driver.execute_script(home_button_script)
                print("홈버튼 강제 주입 시스템 활성화")
            
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