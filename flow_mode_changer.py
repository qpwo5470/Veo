from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time

def change_to_asset_mode(driver):
    """Change Flow mode to '애셋으로 동영상 만들기' (Asset mode)"""
    try:
        print("\n" + "=" * 60)
        print("[MODE CHANGER] Starting mode change to asset mode...")
        print("[MODE CHANGER] Current URL:", driver.current_url)
        print("=" * 60)
        wait = WebDriverWait(driver, 10)
        
        # Step 1: Find and check the current mode button
        print("[MODE CHANGER] Step 1: Looking for mode dropdown button...")
        mode_button = None
        
        # Try to find the combobox button that contains mode text
        buttons = driver.find_elements(By.CSS_SELECTOR, 'button[role="combobox"]')
        print(f"[MODE CHANGER] Found {len(buttons)} combobox buttons")
        
        for i, button in enumerate(buttons):
            text = button.text
            print(f"[MODE CHANGER] Button {i+1}: '{text}'")
            if any(mode in text for mode in ['동영상', '애셋', '텍스트', '프레임']):
                mode_button = button
                print(f"[MODE CHANGER] ✓ Selected mode button: '{text}'")
                break
        
        if not mode_button:
            print("[MODE CHANGER] Mode button not found")
            return False
        
        # Check if already in asset mode
        if '애셋으로 동영상 만들기' in mode_button.text:
            print("[MODE CHANGER] ✓ Already in asset mode")
            print("=" * 60 + "\n")
            return True
        
        # Step 2: Click to open dropdown
        print("[MODE CHANGER] Step 2: Opening dropdown...")
        print(f"[MODE CHANGER] Mode button aria-expanded: {mode_button.get_attribute('aria-expanded')}")
        mode_button.click()
        
        # Wait a moment for dropdown to open
        time.sleep(0.5)
        print(f"[MODE CHANGER] After click - aria-expanded: {mode_button.get_attribute('aria-expanded')}")
        
        # Step 3: Find and click the asset option
        print("[MODE CHANGER] Step 3: Looking for asset option...")
        
        # Wait for dropdown options to appear
        try:
            options = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, '[role="option"]')))
            print(f"[MODE CHANGER] Found {len(options)} dropdown options")
        except TimeoutException:
            print("[MODE CHANGER] ✗ Timeout waiting for dropdown options")
            return False
        
        asset_option = None
        for i, option in enumerate(options):
            # Check both the option text and any span inside it
            try:
                option_text = option.text
                print(f"[MODE CHANGER] Option {i+1}: '{option_text}'")
                
                span_elements = option.find_elements(By.TAG_NAME, 'span')
                
                # Check main text
                if '애셋으로 동영상 만들기' in option_text:
                    asset_option = option
                    print(f"[MODE CHANGER] ✓ Found asset option (main text)")
                    break
                
                # Check span text
                for span in span_elements:
                    span_text = span.text
                    if span_text:
                        print(f"[MODE CHANGER]   Span text: '{span_text}'")
                    if '애셋으로 동영상 만들기' in span_text:
                        asset_option = option
                        print(f"[MODE CHANGER] ✓ Found asset option (span text)")
                        break
                
                if asset_option:
                    break
                    
            except Exception as e:
                print(f"[MODE CHANGER] Error reading option {i+1}: {e}")
                continue
        
        if not asset_option:
            print("[MODE CHANGER] ✗ Asset option not found in dropdown")
            print("[MODE CHANGER] Available options were:")
            for i, opt in enumerate(options[:10]):  # Show first 10 options
                try:
                    print(f"  {i+1}. '{opt.text}'")
                except:
                    pass
            # Try to close dropdown by clicking outside
            driver.find_element(By.TAG_NAME, 'body').click()
            print("=" * 60 + "\n")
            return False
        
        print("[MODE CHANGER] Found asset option, clicking...")
        print(f"[MODE CHANGER] Asset option HTML: {asset_option.get_attribute('outerHTML')[:200]}...")
        asset_option.click()
        
        # Wait for mode change to complete
        print("[MODE CHANGER] Waiting for mode change to complete...")
        time.sleep(1)
        
        # Verify the change
        print("[MODE CHANGER] Verifying mode change...")
        buttons = driver.find_elements(By.CSS_SELECTOR, 'button[role="combobox"]')
        for button in buttons:
            text = button.text
            if any(mode in text for mode in ['동영상', '애셋', '텍스트', '프레임']):
                print(f"[MODE CHANGER] Current mode button text: '{text}'")
                if '애셋으로 동영상 만들기' in text:
                    print("[MODE CHANGER] ✓ Success! Mode changed to asset mode")
                    print("=" * 60 + "\n")
                    return True
        
        print("[MODE CHANGER] ✗ Mode change verification failed")
        print("=" * 60 + "\n")
        return False
        
    except TimeoutException:
        print("[MODE CHANGER] ✗ Timeout waiting for elements")
        print("=" * 60 + "\n")
        return False
    except Exception as e:
        print(f"[MODE CHANGER] ✗ Error: {e}")
        import traceback
        print("[MODE CHANGER] Traceback:")
        traceback.print_exc()
        print("=" * 60 + "\n")
        return False


def wait_and_change_mode(driver, max_attempts=10):
    """Wait for page to load and change mode with retries"""
    print("\n" + "*" * 60)
    print("[MODE CHANGER] STARTING MODE CHANGE PROCESS")
    print("[MODE CHANGER] Waiting for page to load before changing mode...")
    print("*" * 60)
    
    for attempt in range(max_attempts):
        time.sleep(2)  # Wait between attempts
        
        print(f"\n[MODE CHANGER] >>> Attempt {attempt + 1}/{max_attempts}")
        
        # Check if we're on the right page
        current_url = driver.current_url
        if 'labs.google/fx/ko/tools/flow/project/' not in current_url:
            print(f"[MODE CHANGER] ✗ Not on Flow project page")
            print(f"[MODE CHANGER] Current URL: {current_url}")
            return False
        
        # Check page readiness
        ready_state = driver.execute_script("return document.readyState")
        print(f"[MODE CHANGER] Page ready state: {ready_state}")
        
        # Try to change mode
        if change_to_asset_mode(driver):
            return True
        
        # If failed, wait longer before next attempt
        if attempt < max_attempts - 1:
            wait_time = 3 + attempt
            print(f"[MODE CHANGER] ⏳ Waiting {wait_time} seconds before retry...")
            time.sleep(wait_time)
    
    print("\n" + "*" * 60)
    print("[MODE CHANGER] ✗ FAILED to change mode after all attempts")
    print("*" * 60 + "\n")
    return False