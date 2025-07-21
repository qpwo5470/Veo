import os
import time
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import pickle
import glob
from pathlib import Path

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/drive.file']

class GoogleDriveUploader:
    def __init__(self, folder_id):
        self.folder_id = folder_id
        self.service = self._authenticate()
        
    def _authenticate(self):
        """Authenticate and return Google Drive service instance"""
        creds = None
        token_path = 'token.pickle'
        
        # Token file stores the user's access and refresh tokens
        if os.path.exists(token_path):
            with open(token_path, 'rb') as token:
                creds = pickle.load(token)
        
        # If there are no (valid) credentials available, let the user log in
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    'drive_credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            with open(token_path, 'wb') as token:
                pickle.dump(creds, token)
        
        return build('drive', 'v3', credentials=creds)
    
    def find_latest_video(self, download_dir="~/Downloads"):
        """Find the most recently downloaded video file"""
        download_path = os.path.expanduser(download_dir)
        video_extensions = ['*.mp4', '*.mov', '*.avi', '*.webm', '*.mkv', '*.gif']
        
        latest_file = None
        latest_time = 0
        
        for ext in video_extensions:
            for file_path in glob.glob(os.path.join(download_path, ext)):
                file_time = os.path.getmtime(file_path)
                if file_time > latest_time:
                    latest_time = file_time
                    latest_file = file_path
        
        # Check if file was created in last 60 seconds
        if latest_file and (time.time() - latest_time) < 60:
            return latest_file
        
        return None
    
    def upload_file(self, file_path):
        """Upload file to Google Drive and return shareable link"""
        try:
            file_name = os.path.basename(file_path)
            
            # File metadata
            file_metadata = {
                'name': file_name,
                'parents': [self.folder_id]
            }
            
            # Determine MIME type
            ext = file_name.split('.')[-1].lower()
            mime_types = {
                'mp4': 'video/mp4',
                'mov': 'video/quicktime',
                'avi': 'video/x-msvideo',
                'webm': 'video/webm',
                'mkv': 'video/x-matroska',
                'gif': 'image/gif'
            }
            mime_type = mime_types.get(ext, 'video/mp4')
            
            # Upload file
            media = MediaFileUpload(file_path, mimetype=mime_type, resumable=True)
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webViewLink, webContentLink'
            ).execute()
            
            file_id = file.get('id')
            print(f"File uploaded successfully. ID: {file_id}")
            
            # Make file publicly accessible
            self.service.permissions().create(
                fileId=file_id,
                body={
                    'type': 'anyone',
                    'role': 'reader'
                }
            ).execute()
            
            # Get the direct download link
            download_link = f"https://drive.google.com/uc?export=download&id={file_id}"
            view_link = file.get('webViewLink')
            
            print(f"File is now public")
            print(f"View link: {view_link}")
            print(f"Download link: {download_link}")
            
            # Delete the local file
            try:
                os.remove(file_path)
                print(f"Local file deleted: {file_path}")
            except Exception as e:
                print(f"Error deleting local file: {e}")
            
            return {
                'download_link': download_link,
                'view_link': view_link,
                'file_id': file_id,
                'file_name': file_name
            }
            
        except Exception as e:
            print(f"Error uploading file: {e}")
            return None
    
    def monitor_and_upload(self, check_interval=2, timeout=300):
        """Monitor downloads folder and upload new video files"""
        print("Monitoring downloads folder for new video files...")
        start_time = time.time()
        processed_files = set()
        
        while time.time() - start_time < timeout:
            latest_video = self.find_latest_video()
            
            if latest_video and latest_video not in processed_files:
                print(f"New video detected: {latest_video}")
                result = self.upload_file(latest_video)
                
                if result:
                    processed_files.add(latest_video)
                    return result
            
            time.sleep(check_interval)
        
        print("Timeout reached, no new videos detected")
        return None


# Standalone function for JavaScript to call
def upload_latest_video_to_drive(folder_id):
    """Find and upload the latest video from Downloads to Google Drive"""
    uploader = GoogleDriveUploader(folder_id)
    latest_video = uploader.find_latest_video()
    
    if latest_video:
        print(f"Found video: {latest_video}")
        return uploader.upload_file(latest_video)
    else:
        print("No recent video found in Downloads")
        return None


if __name__ == "__main__":
    # Test with your folder ID
    folder_id = "1PlkqWPD7nSxzRLKJpubFP1XiZLMvn35l"
    result = upload_latest_video_to_drive(folder_id)
    if result:
        print(f"\nSuccess! Share this link: {result['download_link']}")