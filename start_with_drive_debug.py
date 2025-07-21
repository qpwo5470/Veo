#!/usr/bin/env python3
"""
Debug version of startup script with enhanced logging
"""
import subprocess
import time
import sys
import os
import signal

# Track subprocesses
processes = []

def signal_handler(sig, frame):
    print('\nShutting down...')
    for p in processes:
        try:
            p.terminate()
        except:
            pass
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def main():
    print("Veo with Google Drive Integration - DEBUG MODE")
    print("=" * 60)
    
    # Check if service account key exists
    service_account_path = os.path.join('res', 'drive_api_key.json')
    if not os.path.exists(service_account_path):
        print("\nERROR: Google Drive service account key not found!")
        print(f"Expected at: {service_account_path}")
        return
    
    # Check if required packages are installed
    try:
        import google.auth
        import flask
    except ImportError:
        print("\nERROR: Required packages not installed!")
        print("Please run: pip install -r requirements_drive.txt")
        return
    
    print("\nStarting Drive upload server v2 with verbose logging...")
    # Start the Drive upload server with debug output
    server_process = subprocess.Popen(
        [sys.executable, 'drive_upload_server_v2.py'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    processes.append(server_process)
    
    # Wait for server to start
    print("Waiting for server to start...")
    time.sleep(3)
    
    # Check if server is running
    try:
        import requests
        response = requests.get('http://localhost:5000/health')
        if response.status_code == 200:
            print("✓ Drive upload server is running")
            print(f"  Response: {response.json()}")
        else:
            print("✗ Drive upload server failed to start")
            return
    except Exception as e:
        print("✗ Drive upload server is not responding")
        print(f"  Error: {e}")
        return
    
    print("\nStarting Veo application with debug flags...")
    # Start the main application with debug flags
    main_args = [sys.executable, 'main.py', '--debug-downloads']
    if '--devtools' in sys.argv:
        main_args.append('--devtools')
    
    main_process = subprocess.Popen(main_args)
    processes.append(main_process)
    
    print("\n" + "=" * 60)
    print("DEBUG MODE ACTIVE")
    print("=" * 60)
    print("In Chrome:")
    print("- Press Ctrl+D to show download debug panel")
    print("- Open DevTools Console (F12) to see all logs")
    print("- Run: window.debugDownloadStatus() for full debug info")
    print("- Run: window.testDriveUpload() to test upload")
    print("\nIn Terminal:")
    print("- Run: python test_download_detection.py")
    print("  to test download detection and uploads")
    print("\nServer logs will appear below:")
    print("=" * 60 + "\n")
    
    # Monitor server output with enhanced logging
    try:
        while True:
            output = server_process.stdout.readline()
            if output:
                # Add timestamp to server logs
                timestamp = time.strftime("%H:%M:%S")
                print(f"[{timestamp}] {output.strip()}")
            
            # Check if processes are still running
            if server_process.poll() is not None:
                print("\n[ERROR] Drive server stopped unexpectedly")
                # Get exit code
                exit_code = server_process.returncode
                print(f"[ERROR] Exit code: {exit_code}")
                break
                
            if main_process.poll() is not None:
                print("\n[INFO] Main application stopped")
                break
                
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        pass
    
    print("\nStopping all services...")

if __name__ == "__main__":
    main()