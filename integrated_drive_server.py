"""
Integrated Drive server that runs in a thread instead of subprocess
"""
import threading
import time
import sys
import os

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_drive_server():
    """Run the Drive upload server in current process"""
    try:
        # Import and configure Flask app
        from drive_upload_server_v2 import app
        
        # Disable Flask startup messages
        import logging
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)
        
        # Run the server
        app.run(port=5000, debug=False, use_reloader=False, threaded=True)
        
    except Exception as e:
        print(f"[Drive Server Error] {e}")

def start_integrated_drive_server():
    """Start the Drive server in a background thread"""
    server_thread = threading.Thread(target=run_drive_server, daemon=True)
    server_thread.start()
    
    # Wait a bit for server to start
    time.sleep(2)
    
    # Check if it's running
    try:
        import requests
        response = requests.get('http://localhost:5000/health')
        if response.status_code == 200:
            print("✓ Integrated Drive server is running")
            return True
    except:
        pass
    
    print("✗ Integrated Drive server failed to start")
    return False