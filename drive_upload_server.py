#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS
from google_drive_uploader import GoogleDriveUploader
import threading
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global uploader instance
uploader = None

def initialize_uploader(folder_id):
    global uploader
    try:
        uploader = GoogleDriveUploader(folder_id)
        print("Drive uploader initialized successfully")
        return True
    except Exception as e:
        print(f"Error initializing uploader: {e}")
        return False

@app.route('/check-and-upload', methods=['POST'])
def check_and_upload():
    """Check for new video files and upload to Drive"""
    try:
        data = request.json
        folder_id = data.get('folder_id')
        
        if not folder_id:
            return jsonify({'success': False, 'error': 'No folder_id provided'}), 400
        
        # Initialize uploader if needed
        if uploader is None:
            if not initialize_uploader(folder_id):
                return jsonify({'success': False, 'error': 'Failed to initialize Drive uploader'}), 500
        
        # Check for latest video
        latest_video = uploader.find_latest_video()
        
        if latest_video:
            print(f"Found new video: {latest_video}")
            result = uploader.upload_file(latest_video)
            
            if result:
                return jsonify({
                    'success': True,
                    'download_link': result['download_link'],
                    'view_link': result['view_link'],
                    'file_name': result['file_name']
                })
            else:
                return jsonify({'success': False, 'error': 'Failed to upload file'}), 500
        else:
            return jsonify({'success': False, 'message': 'No new video found'})
            
    except Exception as e:
        print(f"Error in check_and_upload: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/monitor-start', methods=['POST'])
def monitor_start():
    """Start monitoring for downloads in background"""
    try:
        data = request.json
        folder_id = data.get('folder_id')
        
        if not folder_id:
            return jsonify({'success': False, 'error': 'No folder_id provided'}), 400
        
        # Initialize uploader if needed
        if uploader is None:
            if not initialize_uploader(folder_id):
                return jsonify({'success': False, 'error': 'Failed to initialize Drive uploader'}), 500
        
        # Start monitoring in background thread
        def monitor():
            result = uploader.monitor_and_upload(timeout=60)
            if result:
                print(f"Upload complete: {result['download_link']}")
        
        thread = threading.Thread(target=monitor)
        thread.daemon = True
        thread.start()
        
        return jsonify({'success': True, 'message': 'Monitoring started'})
        
    except Exception as e:
        print(f"Error in monitor_start: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'uploader_ready': uploader is not None})

if __name__ == '__main__':
    print("Starting Drive Upload Server on http://localhost:5000")
    print("Make sure you have set up Google Drive API credentials first!")
    print("Run 'python setup_drive_api.py' if you haven't already.")
    app.run(port=5000, debug=False)