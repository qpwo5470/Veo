#!/usr/bin/env python3
import subprocess
import sys
import os
import platform

def install_chromedriver():
    print("Installing correct ChromeDriver for your Chrome version...")
    
    # First, ensure webdriver-manager is installed
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "webdriver-manager"])
    
    # Import after installation
    from webdriver_manager.chrome import ChromeDriverManager
    
    # Force download of the latest compatible version
    try:
        # Clear the cache first
        cache_dir = os.path.expanduser("~/.wdm")
        if os.path.exists(cache_dir):
            print(f"Clearing webdriver cache at {cache_dir}")
            import shutil
            shutil.rmtree(cache_dir)
        
        # Download the specific version needed
        print("Downloading ChromeDriver 138.0.7204.157...")
        driver_path = ChromeDriverManager(driver_version="138.0.7204.157").install()
        print(f"ChromeDriver installed at: {driver_path}")
        
        # Fix the path if needed
        if driver_path.endswith('THIRD_PARTY_NOTICES.chromedriver'):
            driver_path = driver_path.replace('THIRD_PARTY_NOTICES.chromedriver', 'chromedriver')
        
        # Make executable on Unix systems
        if platform.system() != 'Windows':
            subprocess.run(['chmod', '+x', driver_path], check=True)
            print(f"Made ChromeDriver executable: {driver_path}")
        
        print("\nChromeDriver installation complete!")
        print(f"ChromeDriver path: {driver_path}")
        
    except Exception as e:
        print(f"Error installing ChromeDriver: {e}")
        print("\nAlternative: Please install Chrome for Testing from:")
        print("https://googlechromelabs.github.io/chrome-for-testing/")

if __name__ == "__main__":
    install_chromedriver()