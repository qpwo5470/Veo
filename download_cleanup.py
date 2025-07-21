"""Clean up downloaded video files when home button is pressed"""

import os
import glob
import time
from datetime import datetime, timedelta

def cleanup_recent_downloads():
    """Delete video files downloaded in the last hour from the Downloads folder"""
    download_dir = os.path.expanduser('~/Downloads')
    
    # Video file extensions to clean up
    video_extensions = ['*.mp4', '*.mov', '*.avi', '*.webm', '*.mkv', '*.gif']
    
    # Get current time
    current_time = time.time()
    
    # Time window - delete files created in the last hour
    time_window = 3600  # 1 hour in seconds
    
    deleted_files = []
    
    for extension in video_extensions:
        pattern = os.path.join(download_dir, extension)
        files = glob.glob(pattern)
        
        for file_path in files:
            try:
                # Get file creation time
                file_stat = os.stat(file_path)
                file_age = current_time - file_stat.st_mtime
                
                # Check if file was created within the time window
                if file_age <= time_window:
                    # Check if file name contains Flow/Veo related keywords
                    filename = os.path.basename(file_path).lower()
                    if any(keyword in filename for keyword in ['flow', 'veo', 'untitled', 'download', 'video']):
                        os.remove(file_path)
                        deleted_files.append(file_path)
                        print(f"🗑️  Deleted: {os.path.basename(file_path)}")
                    
            except Exception as e:
                print(f"Error deleting {file_path}: {e}")
    
    if deleted_files:
        print(f"✅ Cleaned up {len(deleted_files)} downloaded video file(s)")
    else:
        print("ℹ️  No recent video downloads found to clean up")
    
    return deleted_files

if __name__ == "__main__":
    # Test the cleanup function
    cleanup_recent_downloads()