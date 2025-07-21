"""Manual upload helper - monitors downloads and provides Drive upload links"""

import os
import time
import webbrowser
from datetime import datetime
from pathlib import Path

def monitor_downloads():
    """Monitor Downloads folder and provide manual upload instructions"""
    download_dir = os.path.expanduser('~/Downloads')
    print(f"📁 Monitoring {download_dir} for new videos...")
    print("=" * 60)
    
    # Track existing files
    existing_files = set(os.listdir(download_dir))
    
    # Google Drive upload URL
    drive_upload_url = "https://drive.google.com/drive/u/0/my-drive"
    
    while True:
        try:
            current_files = set(os.listdir(download_dir))
            new_files = current_files - existing_files
            
            for filename in new_files:
                # Check if it's a video file
                if any(filename.lower().endswith(ext) for ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm']):
                    filepath = os.path.join(download_dir, filename)
                    
                    # Wait for file to complete
                    time.sleep(1)
                    
                    try:
                        file_size = os.path.getsize(filepath)
                        time.sleep(0.5)
                        
                        if os.path.getsize(filepath) == file_size:  # File complete
                            print(f"\n🎬 New video detected: {filename}")
                            print(f"📍 Location: {filepath}")
                            print(f"📏 Size: {file_size / 1024 / 1024:.2f} MB")
                            print(f"🕐 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                            print("\n📤 To upload to Google Drive:")
                            print(f"   1. Open: {drive_upload_url}")
                            print(f"   2. Drag and drop: {filename}")
                            print(f"   3. Right-click → Get link → Anyone with link")
                            print("\n💡 Tip: Press Ctrl+C to open Drive in browser")
                            print("=" * 60)
                            
                    except Exception as e:
                        pass
            
            existing_files = current_files
            time.sleep(1)
            
        except KeyboardInterrupt:
            print("\n\nOpening Google Drive...")
            webbrowser.open(drive_upload_url)
            print("Drag your video files to upload!")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(2)

if __name__ == "__main__":
    print("=" * 60)
    print("Manual Upload Helper for Veo")
    print("=" * 60)
    print("This tool monitors your Downloads folder for new videos")
    print("and provides instructions for manual upload to Google Drive.")
    print("\nPress Ctrl+C at any time to open Google Drive")
    print("=" * 60)
    
    monitor_downloads()