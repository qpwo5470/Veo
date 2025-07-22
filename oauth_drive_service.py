# -*- coding: utf-8 -*-
"""OAuth-based Google Drive service that uses user's account"""

import os
import json
import threading
import time
import webbrowser
from pathlib import Path
from datetime import datetime
import hashlib
import http.server
import socketserver
import urllib.parse
import platform
import sys

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False
    print("WARNING: Google API packages not installed. Run: pip install google-auth google-api-python-client google-auth-oauthlib")

class OAuthDriveService:
    """Service that monitors downloads and uploads to Google Drive using OAuth"""
    
    def __init__(self):
        self.service = None
        self.folder_id = None
        self.folder_name = 'Veo_Uploads'
        self.download_dir = os.path.expanduser('~/Downloads')
        self.monitored_files = set()
        self.upload_queue = []
        self.running = False
        self.monitor_thread = None
        self.upload_thread = None
        self.uploaded_hashes = set()
        self.web_server = None
        self.web_thread = None
        self.web_port = None
        self.latest_upload_data = None
        self.oauth_server = None
        self.credentials = None
        
        # OAuth configuration - load from res/drive_oauth.json
        oauth_file = os.path.join(os.path.dirname(__file__), 'res', 'drive_oauth.json')
        if os.path.exists(oauth_file):
            with open(oauth_file, 'r', encoding='utf-8') as f:
                self.client_config = json.load(f)
        else:
            print(f"ERROR: OAuth credentials not found at {oauth_file}")
            self.client_config = None
        
        self.token_file = os.path.join(os.path.dirname(__file__), 'token.json')
        self.scopes = ['https://www.googleapis.com/auth/drive.file']
        
    def initialize(self):
        """Initialize the Google Drive service with OAuth"""
        if not GOOGLE_API_AVAILABLE:
            print("ERROR: Google API not available")
            return False
        
        if not self.client_config:
            print("ERROR: OAuth configuration not loaded")
            return False
            
        try:
            # Load existing token
            if os.path.exists(self.token_file):
                self.credentials = Credentials.from_authorized_user_file(self.token_file, self.scopes)
            
            # If there are no (valid) credentials available, let the user log in
            if not self.credentials or not self.credentials.valid:
                if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                    print("Refreshing expired token...")
                    self.credentials.refresh(Request())
                else:
                    print("Need to authenticate with Google...")
                    if not self.authenticate():
                        return False
                
                # Save the credentials for next run
                with open(self.token_file, 'w', encoding='utf-8') as token:
                    token.write(self.credentials.to_json())
            
            # Build service
            self.service = build('drive', 'v3', credentials=self.credentials)
            print("✅ Google Drive service initialized with OAuth")
            
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
    
    def authenticate(self):
        """Authenticate user with OAuth"""
        try:
            # Create flow
            # Use the redirect URI from the config
            redirect_uri = self.client_config['installed']['redirect_uris'][0]
            
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.scopes,
                redirect_uri=redirect_uri
            )
            
            # Get authorization URL
            auth_url, _ = flow.authorization_url(prompt='consent')
            
            print("\n" + "="*60)
            print("🔐 Google Authentication Required")
            print("="*60)
            print("Opening browser for authentication...")
            print(f"If browser doesn't open, visit: {auth_url}")
            print("="*60 + "\n")
            
            # Open browser
            webbrowser.open(auth_url)
            
            # Start local server to receive callback
            auth_code = self.wait_for_auth_code()
            if not auth_code:
                print("ERROR: No authorization code received")
                return False
            
            # Exchange code for token
            flow.fetch_token(code=auth_code)
            self.credentials = flow.credentials
            
            print("✅ Authentication successful!")
            return True
            
        except Exception as e:
            print(f"Authentication error: {e}")
            return False
    
    def wait_for_auth_code(self):
        """Wait for OAuth callback with auth code"""
        auth_code = None
        
        class AuthHandler(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                nonlocal auth_code
                
                if self.path.startswith('/oauth2callback'):
                    # Parse query parameters
                    query = urllib.parse.urlparse(self.path).query
                    params = urllib.parse.parse_qs(query)
                    
                    if 'code' in params:
                        auth_code = params['code'][0]
                        
                        # Send success response
                        self.send_response(200)
                        self.send_header('Content-type', 'text/html')
                        self.end_headers()
                        
                        html = """
                        <html>
                        <head>
                            <title>Authentication Successful</title>
                            <style>
                                body { font-family: -apple-system, sans-serif; text-align: center; padding: 50px; }
                                .success { color: #4CAF50; font-size: 48px; }
                            </style>
                        </head>
                        <body>
                            <div class="success">✅</div>
                            <h1>Authentication Successful!</h1>
                            <p>You can close this window and return to the application.</p>
                        </body>
                        </html>
                        """
                        self.wfile.write(html.encode())
                    else:
                        # Error response
                        self.send_response(400)
                        self.end_headers()
                else:
                    self.send_response(404)
                    self.end_headers()
            
            def log_message(self, format, *args):
                pass  # Suppress logging
        
        # Parse port from redirect URI
        import urllib.parse
        parsed_uri = urllib.parse.urlparse(redirect_uri)
        port = parsed_uri.port or 80
        
        # Start temporary server on the correct port
        try:
            # Use Windows-safe server on Windows
            if platform.system() == 'Windows':
                class WindowsAuthServer(socketserver.TCPServer):
                    def handle_error(self, request, client_address):
                        exc_type = sys.exc_info()[0]
                        if exc_type in [ConnectionAbortedError, ConnectionResetError]:
                            return
                        super().handle_error(request, client_address)
                
                with WindowsAuthServer(('localhost', port), AuthHandler) as httpd:
                    print(f"Waiting for authentication on port {port}...")
                    httpd.handle_request()
            else:
                with socketserver.TCPServer(('localhost', port), AuthHandler) as httpd:
                    print(f"Waiting for authentication on port {port}...")
                    httpd.handle_request()
        except OSError as e:
            print(f"Error: Could not start server on port {port}")
            print("Make sure no other application is using this port")
            return None
            
        return auth_code
    
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
    
    def find_existing_file(self, filename, file_hash):
        """Find existing file in Drive folder by name pattern"""
        try:
            # Search for files with similar name in our folder
            query = f"name contains '{filename}' and '{self.folder_id}' in parents and trashed = false"
            results = self.service.files().list(
                q=query,
                fields="files(id, name)"
            ).execute()
            
            files = results.get('files', [])
            if files:
                # Return the first matching file
                file_id = files[0]['id']
                # Try to make it public (but don't fail if we can't)
                try:
                    self.service.permissions().create(
                        fileId=file_id,
                        body={'type': 'anyone', 'role': 'reader'}
                    ).execute()
                except:
                    pass
                
                # Always return direct download link format
                return f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
            
            return None
        except Exception as e:
            print(f"Error finding existing file: {e}")
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
                        
                        # Show spinner immediately when video file appears
                        print(f"🎬 Video detected: {filename}")
                        self.show_loading_spinner()
                        
                        # Wait for file to be completely written
                        time.sleep(0.5)
                        
                        # Check if file is complete
                        try:
                            file_size = os.path.getsize(filepath)
                            time.sleep(0.3)
                            if os.path.getsize(filepath) == file_size:  # File size stable
                                file_hash = self.get_file_hash(filepath)
                                
                                if file_hash:
                                    self.upload_queue.append((filepath, filename, file_hash))
                                    # Don't skip duplicates - we want to show the dialog
                        except:
                            pass
                
                existing_files = current_files
                time.sleep(0.5)  # Check more frequently for faster detection
                
            except Exception as e:
                print(f"Monitor error: {e}")
                time.sleep(2)
    
    def process_uploads(self):
        """Process upload queue"""
        while self.running:
            if self.upload_queue:
                filepath, filename, file_hash = self.upload_queue.pop(0)
                
                if os.path.exists(filepath):
                    # Check if we already uploaded this file
                    if file_hash in self.uploaded_hashes:
                        print(f"📋 File already uploaded: {filename}")
                        # Find the existing file in Drive
                        existing_link = self.find_existing_file(filename, file_hash)
                        if existing_link:
                            print(f"🔗 Using existing link: {existing_link}")
                            self.show_qr_in_browser(existing_link)
                        else:
                            # If can't find, upload again
                            print(f"⬆️  Re-uploading {filename} to Google Drive...")
                            download_link = self.upload_file(filepath, filename)
                            if download_link:
                                self.uploaded_hashes.add(file_hash)
                                self.show_qr_in_browser(download_link)
                    else:
                        print(f"⬆️  Uploading {filename} to Google Drive...")
                        download_link = self.upload_file(filepath, filename)
                        
                        if download_link:
                            print(f"✅ Upload complete!")
                            print(f"🔗 Download link: {download_link}")
                            self.uploaded_hashes.add(file_hash)
                            
                            # Update latest upload data
                            self.show_qr_in_browser(download_link)
                        else:
                            print(f"❌ Upload failed for {filename}")
                
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
            try:
                self.service.permissions().create(
                    fileId=file_id,
                    body={'type': 'anyone', 'role': 'reader'}
                ).execute()
            except Exception as e:
                print(f"Warning: Could not make file public: {e}")
            
            # Always return direct download link format
            # This format forces download even if permissions aren't perfect
            download_link = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
            
            return download_link
            
        except Exception as e:
            print(f"Upload error: {e}")
            return None
    
    def show_loading_spinner(self):
        """Show loading spinner in browser immediately"""
        try:
            # Update in-memory data with loading state
            self.latest_upload_data = {
                'loading': True,
                'timestamp': datetime.now().isoformat()
            }
            
            print(f"⏳ Showing loading spinner...")
            
        except Exception as e:
            print(f"Error showing loading spinner: {e}")
    
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
                pass  # Suppress logging
        
        UploadDataHandler.service = self
        
        try:
            # Use only port 8888
            port = 8888
            try:
                # Create custom server class for Windows error handling
                if platform.system() == 'Windows':
                    class WindowsTCPServer(socketserver.TCPServer):
                        def handle_error(self, request, client_address):
                            """Suppress Windows connection abort errors"""
                            exc_type, exc_value = sys.exc_info()[:2]
                            if exc_type == ConnectionAbortedError:
                                # Ignore - browser closed connection
                                return
                            if hasattr(exc_value, 'errno') and exc_value.errno in [10053, 10054]:
                                # Windows: connection abort/reset
                                return
                            super().handle_error(request, client_address)
                    
                    self.web_server = WindowsTCPServer(('localhost', port), UploadDataHandler)
                else:
                    self.web_server = socketserver.TCPServer(('localhost', port), UploadDataHandler)
                
                self.web_port = port
                print(f"📡 Web server started on http://localhost:{port}")
                
                # Store the port for JavaScript
                self.update_js_port(port)
                
                self.web_server.serve_forever()
            except OSError as e:
                print(f"Error: Could not start server on port {port} - {e}")
        except Exception as e:
            print(f"Web server error: {e}")
    
    def update_js_port(self, port):
        """Update JavaScript handler with correct port"""
        js_file = os.path.join(os.path.dirname(__file__), 'auto_upload_handler.js')
        if os.path.exists(js_file):
            with open(js_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Update port in URL
            content = content.replace('localhost:8888', f'localhost:{port}')
            
            # Write to temporary file
            temp_file = js_file + '.tmp'
            with open(temp_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Use in memory instead of modifying file
            self.js_content = content
    
    def start(self):
        """Start the monitoring and upload service"""
        if not self.initialize():
            return False
        
        self.running = True
        
        # Start web server thread
        self.web_thread = threading.Thread(target=self.start_web_server, daemon=True)
        self.web_thread.start()
        
        # Give web server time to start
        time.sleep(0.5)
        
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

def start_oauth_drive_service():
    """Start the OAuth Drive service"""
    global _service_instance
    
    if _service_instance is None:
        _service_instance = OAuthDriveService()
    
    if _service_instance.start():
        return _service_instance
    
    return None

def stop_oauth_drive_service():
    """Stop the OAuth Drive service"""
    global _service_instance
    
    if _service_instance:
        _service_instance.stop()
        _service_instance = None

if __name__ == "__main__":
    # Test the service
    print("Testing OAuth Drive service...")
    
    service = OAuthDriveService()
    if service.initialize():
        print("✅ Service initialized successfully")
    else:
        print("❌ Service initialization failed")