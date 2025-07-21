#!/usr/bin/env python3
"""Debug script to check current mode state in Flow"""

from selenium import webdriver
from selenium.webdriver.common.by import By
import time

def check_mode_state(driver):
    """Check and print current mode state"""
    print("\n" + "=" * 60)
    print("MODE STATE DEBUG")
    print("=" * 60)
    
    # Check URL
    print(f"Current URL: {driver.current_url}")
    
    # Check session storage
    try:
        flow_mode = driver.execute_script("return sessionStorage.getItem('veo_flow_mode');")
        direct_project = driver.execute_script("return sessionStorage.getItem('veo_direct_project');")
        print(f"SessionStorage - veo_flow_mode: '{flow_mode}'")
        print(f"SessionStorage - veo_direct_project: '{direct_project}'")
    except Exception as e:
        print(f"Error reading sessionStorage: {e}")
    
    # Find all combobox buttons
    try:
        buttons = driver.find_elements(By.CSS_SELECTOR, 'button[role="combobox"]')
        print(f"\nFound {len(buttons)} combobox buttons:")
        for i, button in enumerate(buttons):
            text = button.text
            expanded = button.get_attribute('aria-expanded')
            print(f"  Button {i+1}: '{text}' (expanded: {expanded})")
    except Exception as e:
        print(f"Error finding buttons: {e}")
    
    # Check if dropdown is open
    try:
        options = driver.find_elements(By.CSS_SELECTOR, '[role="option"]')
        if options:
            print(f"\nDropdown is OPEN with {len(options)} options:")
            for i, option in enumerate(options[:5]):  # Show first 5
                print(f"  Option {i+1}: '{option.text}'")
        else:
            print("\nDropdown is CLOSED")
    except Exception as e:
        print(f"Error checking dropdown: {e}")
    
    print("=" * 60 + "\n")

if __name__ == "__main__":
    # This can be called from the console when debugging
    print("Use this function in the Python console when driver is available:")
    print(">>> from debug_mode_state import check_mode_state")
    print(">>> check_mode_state(driver)")