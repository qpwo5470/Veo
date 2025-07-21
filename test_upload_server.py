#!/usr/bin/env python3
"""Test if the upload server is accessible"""

import requests
import json
from datetime import datetime

# Try different ports
ports = [8889, 8890, 8891, 8892]

for port in ports:
    try:
        url = f'http://localhost:{port}/latest_upload.json'
        print(f"Testing {url}...")
        
        response = requests.get(url, timeout=2)
        
        if response.ok:
            print(f"✓ Server is running on port {port}")
            data = response.json()
            print(f"  Response: {json.dumps(data, indent=2)}")
            
            # Check if there's recent data
            if data.get('timestamp'):
                timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
                now = datetime.now(timestamp.tzinfo)
                diff = (now - timestamp).total_seconds()
                print(f"  Last update: {diff:.1f} seconds ago")
                
        else:
            print(f"✗ Server returned status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print(f"✗ No server on port {port}")
    except Exception as e:
        print(f"✗ Error on port {port}: {e}")

print("\nYou can test the dialog manually in the browser console:")
print("- testUploadQR() - Show test QR dialog")
print("- testUploadSpinner() - Show loading spinner")
print("- checkUploadNow() - Manually check for uploads")