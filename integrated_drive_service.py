"""Integrated Google Drive service that runs within the main process"""

import os
import json
import threading
import time
from pathlib import Path
from datetime import datetime
import hashlib
import http.server
import socketserver

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False
    print("WARNING: Google API packages not installed. Run: pip install google-auth google-api-python-client")

class IntegratedDriveService:
    """Service that monitors downloads and uploads to Google Drive automatically"""
    
    def __init__(self):
        self.service = None
        self.folder_id = None  # Will create or find folder
        self.folder_name = 'Veo_Uploads'
        self.download_dir = os.path.expanduser('~/Downloads')
        self.service_account_path = os.path.join(os.path.dirname(__file__), 'res', 'drive_api_key.json')
        self.monitored_files = set()
        self.upload_queue = []
        self.running = False
        self.monitor_thread = None
        self.upload_thread = None
        self.uploaded_hashes = set()  # Track uploaded files by hash
        self.web_server = None
        self.web_thread = None
        self.latest_upload_data = None
        
    def initialize(self):
        """Initialize the Google Drive service"""
        if not GOOGLE_API_AVAILABLE:
            print("ERROR: Google API not available")
            return False
            
        if not os.path.exists(self.service_account_path):
            print(f"ERROR: Service account key not found at {self.service_account_path}")
            return False
            
        try:
            credentials = service_account.Credentials.from_service_account_file(
                self.service_account_path,
                scopes=['https://www.googleapis.com/auth/drive']
            )
            self.service = build('drive', 'v3', credentials=credentials)
            print("✅ Google Drive service initialized")
            
            # Create or find upload folder
            self.folder_id = self.get_or_create_folder()
            if self.folder_id:
                print(f"📁 Using folder '{self.folder_name}' (ID: {self.folder_id})")
                folder_link = f"https://drive.google.com/drive/folders/{self.folder_id}"
                print(f"📂 View all uploads: {folder_link}")
                return True
            else:
                print("ERROR: Could not create/find upload folder")
                return False
        except Exception as e:
            print(f"ERROR: Failed to initialize Drive service: {e}")
            return False
    
    def get_or_create_folder(self):
        """Get or create the upload folder"""
        try:
            # Search for existing folder
            results = self.service.files().list(
                q=f"name='{self.folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
                spaces='drive',
                fields='files(id, name)'
            ).execute()
            
            files = results.get('files', [])
            
            if files:
                # Folder exists
                return files[0]['id']
            else:
                # Create new folder
                file_metadata = {
                    'name': self.folder_name,
                    'mimeType': 'application/vnd.google-apps.folder'
                }
                
                folder = self.service.files().create(
                    body=file_metadata,
                    fields='id'
                ).execute()
                
                folder_id = folder.get('id')
                
                # Make folder publicly accessible
                self.service.permissions().create(
                    fileId=folder_id,
                    body={'type': 'anyone', 'role': 'reader'}
                ).execute()
                
                print(f"✨ Created new folder '{self.folder_name}'")
                return folder_id
                
        except Exception as e:
            print(f"Error with folder: {e}")
            return None
    
    def get_file_hash(self, filepath):
        """Get SHA256 hash of file to detect duplicates"""
        try:
            sha256_hash = hashlib.sha256()
            with open(filepath, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except:
            return None
    
    def is_video_file(self, filename):
        """Check if file is a video"""
        video_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.mpg', '.mpeg']
        return any(filename.lower().endswith(ext) for ext in video_extensions)
    
    def monitor_downloads(self):
        """Monitor downloads folder for new video files"""
        print(f"📁 Monitoring {self.download_dir} for new videos...")
        
        # Track existing files at startup
        try:
            existing_files = set(os.listdir(self.download_dir))
        except:
            existing_files = set()
        
        while self.running:
            try:
                current_files = set(os.listdir(self.download_dir))
                new_files = current_files - existing_files
                
                for filename in new_files:
                    if self.is_video_file(filename):
                        filepath = os.path.join(self.download_dir, filename)
                        
                        # Wait for file to be completely written
                        time.sleep(1)
                        
                        # Check if file is complete
                        try:
                            file_size = os.path.getsize(filepath)
                            time.sleep(0.5)
                            if os.path.getsize(filepath) == file_size:  # File size stable
                                file_hash = self.get_file_hash(filepath)
                                
                                if file_hash and file_hash not in self.uploaded_hashes:
                                    print(f"🎬 New video detected: {filename}")
                                    self.upload_queue.append((filepath, filename, file_hash))
                                    self.uploaded_hashes.add(file_hash)
                                else:
                                    print(f"⏭️  Skipping duplicate: {filename}")
                        except:
                            pass
                
                existing_files = current_files
                time.sleep(1)
                
            except Exception as e:
                print(f"Monitor error: {e}")
                time.sleep(2)
    
    def process_uploads(self):
        """Process upload queue"""
        while self.running:
            if self.upload_queue:
                filepath, filename, file_hash = self.upload_queue.pop(0)
                
                if os.path.exists(filepath):
                    print(f"⬆️  Uploading {filename} to Google Drive...")
                    download_link = self.upload_file(filepath, filename)
                    
                    if download_link:
                        print(f"✅ Upload complete!")
                        print(f"🔗 Download link: {download_link}")
                        
                        # Inject JavaScript to show QR code
                        self.show_qr_in_browser(download_link)
                        
                        # Optionally delete local file after successful upload
                        # os.remove(filepath)
                    else:
                        print(f"❌ Upload failed for {filename}")
                        # Remove from uploaded hashes to retry later
                        self.uploaded_hashes.discard(file_hash)
                
            time.sleep(0.5)
    
    def upload_file(self, filepath, filename):
        """Upload file to Google Drive"""
        if not self.service or not self.folder_id:
            print("ERROR: Service not initialized properly")
            return None
            
        try:
            # Prepare file metadata
            file_metadata = {
                'name': f'veo_{datetime.now().strftime("%Y%m%d_%H%M%S")}_{filename}',
                'parents': [self.folder_id]
            }
            
            # Upload file
            media = MediaFileUpload(filepath, resumable=True)
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            
            file_id = file.get('id')
            
            # Make file publicly accessible
            self.service.permissions().create(
                fileId=file_id,
                body={'type': 'anyone', 'role': 'reader'}
            ).execute()
            
            # Return direct download link with confirm parameter
            download_link = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
            return download_link
            
        except Exception as e:
            print(f"Upload error: {e}")
            # Even on error, if we have file_id, return direct download link
            if 'file_id' in locals() and file_id:
                return f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
            return None
    
    def show_qr_in_browser(self, download_link):
        """Update latest upload data for browser to read"""
        try:
            # Update in-memory data
            self.latest_upload_data = {
                'link': download_link,
                'timestamp': datetime.now().isoformat()
            }
            
            print(f"📱 QR code ready. Browser will display it automatically.")
            
        except Exception as e:
            print(f"Error updating QR data: {e}")
    
    def start_web_server(self):
        """Start a simple web server to serve upload data"""
        class UploadDataHandler(http.server.SimpleHTTPRequestHandler):
            service = self
            
            def do_GET(self):
                if self.path.startswith('/latest_upload.json'):
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    if self.service.latest_upload_data:
                        self.wfile.write(json.dumps(self.service.latest_upload_data).encode())
                    else:
                        self.wfile.write(b'{}')
                else:
                    self.send_response(404)
                    self.end_headers()
            
            def log_message(self, format, *args):
                # Suppress logging
                pass
        
        UploadDataHandler.service = self
        
        try:
            self.web_server = socketserver.TCPServer(('localhost', 8888), UploadDataHandler)
            print("📡 Web server started on http://localhost:8888")
            self.web_server.serve_forever()
        except Exception as e:
            print(f"Web server error: {e}")
    
    def start(self):
        """Start the monitoring and upload service"""
        if not self.initialize():
            return False
        
        self.running = True
        
        # Start web server thread
        self.web_thread = threading.Thread(target=self.start_web_server, daemon=True)
        self.web_thread.start()
        
        # Start monitor thread
        self.monitor_thread = threading.Thread(target=self.monitor_downloads, daemon=True)
        self.monitor_thread.start()
        
        # Start upload thread
        self.upload_thread = threading.Thread(target=self.process_uploads, daemon=True)
        self.upload_thread.start()
        
        print("🚀 Automatic upload service started")
        return True
    
    def stop(self):
        """Stop the service"""
        self.running = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2)
        if self.upload_thread:
            self.upload_thread.join(timeout=2)
        if self.web_server:
            self.web_server.shutdown()
        print("🛑 Automatic upload service stopped")

# Global service instance
_service_instance = None

def start_integrated_drive_service():
    """Start the integrated Drive service"""
    global _service_instance
    
    if _service_instance is None:
        _service_instance = IntegratedDriveService()
    
    if _service_instance.start():
        return True
    
    return False

def stop_integrated_drive_service():
    """Stop the integrated Drive service"""
    global _service_instance
    
    if _service_instance:
        _service_instance.stop()
        _service_instance = None

if __name__ == "__main__":
    # Test the service
    print("Testing integrated Drive service...")
    
    service = IntegratedDriveService()
    if service.initialize():
        print("✅ Service initialized successfully")
        
        # Test upload
        test_file = os.path.join(service.download_dir, "test_video.mp4")
        if os.path.exists(test_file):
            link = service.upload_file(test_file, "test_video.mp4")
            if link:
                print(f"✅ Test upload successful: {link}")
            else:
                print("❌ Test upload failed")
        else:
            print("ℹ️  No test file found")
    else:
        print("❌ Service initialization failed")