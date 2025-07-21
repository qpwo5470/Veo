#!/usr/bin/env python3
"""
Setup script for Google Drive API credentials

This script helps you set up the Google Drive API credentials needed for uploading files.
Follow these steps:

1. Go to https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create credentials (OAuth 2.0 Client ID)
5. Download the credentials JSON file
6. Run this script with the path to your credentials file
"""

import json
import sys
import os
import shutil

def setup_credentials():
    print("Google Drive API Setup")
    print("=" * 50)
    print("\nThis script will help you set up Google Drive API credentials.")
    print("\nFirst, you need to:")
    print("1. Go to https://console.cloud.google.com/")
    print("2. Create a new project or select an existing one")
    print("3. Search for 'Google Drive API' and enable it")
    print("4. Go to 'Credentials' → 'Create Credentials' → 'OAuth client ID'")
    print("5. Choose 'Desktop app' as the application type")
    print("6. Download the credentials JSON file")
    print("\n" + "=" * 50)
    
    # Check if credentials file was provided as argument
    if len(sys.argv) > 1:
        creds_path = sys.argv[1]
    else:
        creds_path = input("\nEnter the path to your downloaded credentials JSON file: ").strip()
    
    # Remove quotes if present
    creds_path = creds_path.strip('"').strip("'")
    
    if not os.path.exists(creds_path):
        print(f"Error: File not found: {creds_path}")
        return False
    
    # Verify it's a valid JSON file
    try:
        with open(creds_path, 'r') as f:
            data = json.load(f)
            if 'installed' not in data and 'web' not in data:
                print("Error: This doesn't appear to be a valid Google OAuth credentials file")
                return False
    except json.JSONDecodeError:
        print("Error: The file is not valid JSON")
        return False
    except Exception as e:
        print(f"Error reading file: {e}")
        return False
    
    # Copy to the project directory
    dest_path = os.path.join(os.path.dirname(__file__), 'drive_credentials.json')
    
    try:
        shutil.copy2(creds_path, dest_path)
        print(f"\nSuccess! Credentials saved to: {dest_path}")
        print("\nNow you need to install the required Python packages:")
        print("pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
        print("\nThen you can run the drive uploader!")
        return True
    except Exception as e:
        print(f"Error copying file: {e}")
        return False

if __name__ == "__main__":
    setup_credentials()