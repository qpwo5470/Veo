#!/usr/bin/env python3
"""Move unused files to archive folder"""

import os
import shutil
from datetime import datetime

# Files to archive based on the analysis
UNUSED_FILES = [
    # Test/Debug JavaScript files
    'test_interceptor.js',
    
    # Superseded JavaScript files
    'enhanced_interceptor.js',
    'api_interceptor.js',
    'proper_download_interceptor.js',
    'download_interceptor.js',
    'download_interceptor_canvas.js',
    'download_interceptor_dropdown.js',
    'download_interceptor_embedded.js',
    'drive_download_handler.js',  # Superseded by v2
    'flow_mode_selector.js',  # Superseded by v2
    
    # Commented out JavaScript files
    'simple_download_info.js',
    'direct_drive_handler.js',
    
    # Temporary file
    'auto_upload_handler.js.tmp',
    
    # Other unused JavaScript files
    'browser_download_monitor.js',
    'storage_url_monitor.js',
    'export_workflow_monitor.js',
    'flow_api_monitor.js',
    'network_monitor.js',
    'button_replacer.js',
    'back_navigation_blocker.js',
    'dynamic_upload_handler.js',
    'auto_upload_handler.js',
    'auto_drive_uploader.js',
    
    # Test Python files
    'test_server.py',
    'test_download_detection.py',
    'test_upload_server.py',
    'test_qr_dialog.py',
    'simple_oauth_test.py',
    
    # Old Python versions
    'drive_upload_server.py',  # Superseded by v2
    
    # Debug Python version
    'start_with_drive_debug.py',
    
    # Unused Python files
    'auto_upload_monitor.py',
    'manual_upload_helper.py',
    'complete_oauth.py',
    'google_drive_uploader.py',
    'google_drive_service.py',
]

# Files to keep but are conditional (don't archive these)
CONDITIONAL_FILES = [
    'debug_download_monitor.js',  # Used with --debug-downloads
    'debug_chat_deleter.js',  # Used with --debug-chat
    'download_cleanup.py',  # Used for cleanup
    'oauth_drive_service.py',  # Used by the system
]

def archive_files():
    """Move unused files to archive folder"""
    # Create archive folder with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    archive_dir = f'archive_{timestamp}'
    
    if not os.path.exists(archive_dir):
        os.makedirs(archive_dir)
        print(f"Created archive directory: {archive_dir}")
    
    moved_count = 0
    for filename in UNUSED_FILES:
        if os.path.exists(filename):
            try:
                shutil.move(filename, os.path.join(archive_dir, filename))
                print(f"Moved: {filename}")
                moved_count += 1
            except Exception as e:
                print(f"Error moving {filename}: {e}")
        else:
            print(f"Not found: {filename}")
    
    print(f"\nArchived {moved_count} files to {archive_dir}")
    
    # Create a manifest file
    manifest_path = os.path.join(archive_dir, 'MANIFEST.txt')
    with open(manifest_path, 'w') as f:
        f.write(f"Archive created on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total files: {moved_count}\n\n")
        f.write("Files archived:\n")
        for filename in os.listdir(archive_dir):
            if filename != 'MANIFEST.txt':
                f.write(f"- {filename}\n")
    
    print(f"Created manifest: {manifest_path}")
    
    # List files that are kept
    print("\n--- Files kept (used conditionally) ---")
    for filename in CONDITIONAL_FILES:
        if os.path.exists(filename):
            print(f"Kept: {filename}")

if __name__ == "__main__":
    print("=== Cleaning up unused files ===")
    print("This will move unused files to an archive folder")
    response = input("Continue? (y/n): ")
    
    if response.lower() == 'y':
        archive_files()
    else:
        print("Cancelled")