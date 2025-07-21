#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS
from google_drive_service import get_drive_service
import threading
import time
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes and origins

# Track active upload operations
active_uploads = {}

@app.route('/start-upload-monitor', methods=['POST'])
def start_upload_monitor():
    """Start monitoring for a new download and upload it"""
    try:
        upload_id = str(int(time.time() * 1000))
        
        # Start monitoring in background
        def monitor_task():
            service = get_drive_service()
            result = service.monitor_and_upload(timeout=60)
            active_uploads[upload_id] = result
        
        thread = threading.Thread(target=monitor_task)
        thread.daemon = True
        thread.start()
        
        active_uploads[upload_id] = {'status': 'monitoring'}
        
        return jsonify({
            'success': True,
            'upload_id': upload_id,
            'message': 'Monitoring started'
        })
        
    except Exception as e:
        print(f"Error starting monitor: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/check-upload-status/<upload_id>', methods=['GET'])
def check_upload_status(upload_id):
    """Check the status of an upload operation"""
    if upload_id not in active_uploads:
        return jsonify({'success': False, 'error': 'Invalid upload ID'}), 404
    
    result = active_uploads[upload_id]
    
    # If still monitoring
    if isinstance(result, dict) and result.get('status') == 'monitoring':
        return jsonify({
            'success': True,
            'status': 'monitoring',
            'message': 'Still waiting for download to complete'
        })
    
    # If completed, return the result and clean up
    if result.get('success'):
        del active_uploads[upload_id]
    
    return jsonify(result)

@app.route('/check-and-upload', methods=['POST'])
def check_and_upload():
    """Check for new video files and upload to Drive immediately"""
    try:
        service = get_drive_service()
        
        # Check for latest video with shorter max age (10 seconds)
        latest_video = service.find_latest_video(max_age_seconds=10)
        
        if latest_video:
            print(f"Found video: {latest_video}")
            result = service.upload_file(latest_video)
            return jsonify(result)
        else:
            return jsonify({
                'success': False,
                'message': 'No new video found'
            })
            
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        service = get_drive_service()
        return jsonify({
            'status': 'ok',
            'service_ready': service is not None
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("Google Drive Upload Server v2")
    print("Using Service Account Authentication")
    print("=" * 60)
    print(f"Server running on: http://localhost:5000")
    print("Endpoints:")
    print("  POST /start-upload-monitor - Start monitoring for downloads")
    print("  GET  /check-upload-status/<id> - Check upload status")
    print("  POST /check-and-upload - Check and upload immediately")
    print("=" * 60)
    
    app.run(port=5000, debug=False)