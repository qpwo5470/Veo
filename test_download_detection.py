#!/usr/bin/env python3
"""
Test script for download detection and Drive upload
"""
import os
import time
import requests
from pathlib import Path
from google_drive_service import get_drive_service

def check_downloads_folder():
    """Check what files are in Downloads folder"""
    downloads = Path.home() / "Downloads"
    print(f"\nChecking {downloads}")
    print("-" * 60)
    
    video_extensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.gif']
    video_files = []
    
    for file in downloads.iterdir():
        if file.suffix.lower() in video_extensions:
            mtime = file.stat().st_mtime
            age_seconds = time.time() - mtime
            size_mb = file.stat().st_size / (1024 * 1024)
            
            print(f"Video: {file.name}")
            print(f"  Size: {size_mb:.2f} MB")
            print(f"  Modified: {age_seconds:.0f} seconds ago")
            print(f"  Full path: {file}")
            
            if age_seconds < 300:  # Less than 5 minutes old
                video_files.append(file)
    
    return video_files

def test_drive_upload(file_path):
    """Test uploading a specific file to Drive"""
    print(f"\nTesting Drive upload for: {file_path}")
    print("-" * 60)
    
    try:
        service = get_drive_service()
        result = service.upload_file(str(file_path))
        
        if result['success']:
            print("✓ Upload successful!")
            print(f"  Download link: {result['download_link']}")
            print(f"  View link: {result['view_link']}")
        else:
            print("✗ Upload failed!")
            print(f"  Error: {result.get('error', 'Unknown error')}")
            
        return result
        
    except Exception as e:
        print(f"✗ Exception during upload: {e}")
        return None

def test_server_endpoints():
    """Test the Drive upload server endpoints"""
    print("\nTesting Drive upload server...")
    print("-" * 60)
    
    base_url = "http://localhost:5000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health check: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"✗ Server not running: {e}")
        print("  Run: python drive_upload_server_v2.py")
        return False
    
    # Test upload monitor
    try:
        response = requests.post(f"{base_url}/start-upload-monitor")
        print(f"\nStart monitor: {response.status_code}")
        data = response.json()
        print(f"Response: {data}")
        
        if data.get('success'):
            upload_id = data['upload_id']
            
            # Check status
            time.sleep(2)
            response = requests.get(f"{base_url}/check-upload-status/{upload_id}")
            print(f"\nCheck status: {response.status_code}")
            print(f"Response: {response.json()}")
            
    except Exception as e:
        print(f"✗ Error testing endpoints: {e}")
    
    return True

def create_test_video():
    """Create a small test video file in Downloads"""
    downloads = Path.home() / "Downloads"
    test_file = downloads / f"test_video_{int(time.time())}.mp4"
    
    # Create a minimal MP4 file (just headers, won't actually play)
    # This is the smallest valid MP4 structure
    mp4_header = bytes([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,  # ftyp box
        0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
        0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
        0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
    ])
    
    with open(test_file, 'wb') as f:
        f.write(mp4_header)
        # Add some dummy data to make it larger
        f.write(b'\x00' * 1024 * 100)  # 100KB
    
    print(f"\nCreated test video: {test_file}")
    return test_file

def monitor_downloads_realtime(duration=30):
    """Monitor Downloads folder in real-time"""
    print(f"\nMonitoring Downloads folder for {duration} seconds...")
    print("Create or download a video file to test detection")
    print("-" * 60)
    
    downloads = Path.home() / "Downloads"
    seen_files = set()
    
    # Get initial files
    for file in downloads.glob("*.mp4"):
        seen_files.add(file.name)
    for file in downloads.glob("*.mov"):
        seen_files.add(file.name)
    
    start_time = time.time()
    
    while time.time() - start_time < duration:
        for ext in ['*.mp4', '*.mov', '*.gif', '*.webm']:
            for file in downloads.glob(ext):
                if file.name not in seen_files:
                    print(f"\n🎬 NEW VIDEO DETECTED: {file.name}")
                    print(f"   Size: {file.stat().st_size / 1024:.1f} KB")
                    seen_files.add(file.name)
                    
                    # Test upload
                    print("   Testing automatic upload...")
                    result = test_drive_upload(file)
                    
        time.sleep(1)
        print(".", end="", flush=True)
    
    print("\nMonitoring complete")

def main():
    print("Download Detection and Drive Upload Test")
    print("=" * 60)
    
    while True:
        print("\nOptions:")
        print("1. Check Downloads folder")
        print("2. Test Drive upload server")
        print("3. Create test video and upload")
        print("4. Monitor Downloads folder (30s)")
        print("5. Test upload specific file")
        print("0. Exit")
        
        choice = input("\nSelect option: ").strip()
        
        if choice == '1':
            files = check_downloads_folder()
            if files:
                print(f"\nFound {len(files)} recent video(s)")
        
        elif choice == '2':
            test_server_endpoints()
        
        elif choice == '3':
            test_file = create_test_video()
            time.sleep(1)
            test_drive_upload(test_file)
        
        elif choice == '4':
            monitor_downloads_realtime()
        
        elif choice == '5':
            path = input("Enter full path to video file: ").strip()
            if os.path.exists(path):
                test_drive_upload(path)
            else:
                print("File not found")
        
        elif choice == '0':
            break
        
        else:
            print("Invalid option")

if __name__ == "__main__":
    main()