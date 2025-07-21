#!/usr/bin/env python3
"""Test script for QR dialog appearance"""

import os
import webbrowser
import http.server
import socketserver
import threading
import time

def start_test_server():
    """Start a simple HTTP server to serve the test page"""
    PORT = 8080
    
    class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            # Suppress logging
            pass
    
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("localhost", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Test server running at http://localhost:{PORT}")
        print(f"Open http://localhost:{PORT}/test_qr_dialog.html in your browser")
        print("Press Ctrl+C to stop the server")
        
        # Open browser automatically
        webbrowser.open(f'http://localhost:{PORT}/test_qr_dialog.html')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down test server...")

if __name__ == "__main__":
    print("=== QR Dialog Test Server ===")
    print("This will start a local server and open the test page in your browser")
    print("")
    
    try:
        start_test_server()
    except Exception as e:
        print(f"Error: {e}")
        print("\nAlternatively, you can open test_qr_dialog.html directly in your browser")