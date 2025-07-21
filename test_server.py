#!/usr/bin/env python3
"""
Test if the Drive upload server can start
"""
import subprocess
import sys
import time
import requests
import os

def test_server():
    print("Testing Drive upload server...")
    
    # Check dependencies
    try:
        import flask
        import flask_cors
        import google.auth
        print("✓ All dependencies installed")
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        print("Run: pip install -r requirements_drive.txt")
        return
    
    # Check service account
    service_account = os.path.join(os.path.dirname(__file__), 'res', 'drive_api_key.json')
    if not os.path.exists(service_account):
        print(f"✗ Service account key not found: {service_account}")
        return
    print("✓ Service account key found")
    
    # Try to start server
    print("\nStarting server...")
    server_script = os.path.join(os.path.dirname(__file__), 'drive_upload_server_v2.py')
    
    process = subprocess.Popen(
        [sys.executable, server_script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True
    )
    
    # Wait a bit
    time.sleep(3)
    
    # Check if still running
    if process.poll() is not None:
        stdout, stderr = process.communicate()
        print("✗ Server died")
        print("STDOUT:", stdout)
        print("STDERR:", stderr)
        return
    
    print("✓ Server process is running")
    
    # Test health endpoint
    try:
        response = requests.get('http://localhost:5000/health')
        print(f"✓ Health check: {response.status_code}")
        print(f"  Response: {response.json()}")
    except Exception as e:
        print(f"✗ Health check failed: {e}")
    
    # Test CORS
    try:
        response = requests.options('http://localhost:5000/health', 
                                  headers={'Origin': 'https://labs.google'})
        print(f"✓ CORS test: {response.status_code}")
        print(f"  Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"✗ CORS test failed: {e}")
    
    # Cleanup
    print("\nStopping server...")
    process.terminate()
    process.wait()
    print("Done")

if __name__ == "__main__":
    test_server()