#!/usr/bin/env python3
"""
Startup script that runs both the Drive upload server and the main Veo application
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
    print("Veo with Google Drive Integration")
    print("=" * 50)
    
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
    
    print("\nStarting Drive upload server v2...")
    # Start the Drive upload server v2
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
        else:
            print("✗ Drive upload server failed to start")
            return
    except:
        print("✗ Drive upload server is not responding")
        print("Check the server output for errors")
        return
    
    print("\nStarting Veo application...")
    # Start the main application
    main_args = [sys.executable, 'main.py']
    if '--devtools' in sys.argv:
        main_args.append('--devtools')
    
    main_process = subprocess.Popen(main_args)
    processes.append(main_process)
    
    print("\n" + "=" * 50)
    print("Both services are running!")
    print("Downloads will be automatically uploaded to Google Drive")
    print("Press Ctrl+C to stop both services")
    print("=" * 50 + "\n")
    
    # Monitor server output
    try:
        while True:
            output = server_process.stdout.readline()
            if output:
                print(f"[Drive Server] {output.strip()}")
            
            # Check if processes are still running
            if server_process.poll() is not None:
                print("Drive server stopped unexpectedly")
                break
            if main_process.poll() is not None:
                print("Main application stopped")
                break
                
            time.sleep(0.1)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()