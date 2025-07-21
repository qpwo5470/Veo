#!/usr/bin/env python3
"""
Automatic upload monitor - watches Downloads folder and uploads videos to Google Drive
"""
import os
import time
import sys
from pathlib import Path
from google_drive_service import get_drive_service

def monitor_and_upload():
    """Monitor Downloads folder and automatically upload new videos"""
    print("=" * 60)
    print("Google Drive Auto Upload Monitor")
    print("=" * 60)
    print("Monitoring ~/Downloads for new video files...")
    print("Press Ctrl+C to stop")
    print("-" * 60)
    
    service = get_drive_service()
    seen_files = set()
    
    # Get initial files
    downloads = Path.home() / "Downloads"
    for ext in ['*.mp4', '*.mov', '*.gif', '*.webm', '*.avi']:
        for file in downloads.glob(ext):
            seen_files.add(file.name)
    
    while True:
        try:
            # Check for new files
            for ext in ['*.mp4', '*.mov', '*.gif', '*.webm', '*.avi']:
                for file in downloads.glob(ext):
                    if file.name not in seen_files:
                        # New file detected
                        print(f"\n🎬 New video detected: {file.name}")
                        print(f"   Size: {file.stat().st_size / (1024*1024):.1f} MB")
                        
                        # Wait a bit to ensure download is complete
                        print("   Waiting for download to complete...")
                        time.sleep(2)
                        
                        # Check if file size is stable
                        size1 = file.stat().st_size
                        time.sleep(1)
                        size2 = file.stat().st_size
                        
                        if size1 == size2:
                            print("   Uploading to Google Drive...")
                            result = service.upload_file(str(file))
                            
                            if result['success']:
                                print(f"   ✅ Upload successful!")
                                print(f"   📎 Share link: {result['download_link']}")
                                print(f"   🔗 View link: {result['view_link']}")
                                
                                # Show as notification if possible
                                try:
                                    os.system(f"""
                                        osascript -e 'display notification "Upload complete: {file.name}" with title "Google Drive Upload"'
                                    """)
                                except:
                                    pass
                                    
                            else:
                                print(f"   ❌ Upload failed: {result.get('error', 'Unknown error')}")
                        else:
                            print("   File still downloading, will retry...")
                            continue
                        
                        seen_files.add(file.name)
            
            time.sleep(2)  # Check every 2 seconds
            
        except KeyboardInterrupt:
            print("\n\nStopping monitor...")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    monitor_and_upload()