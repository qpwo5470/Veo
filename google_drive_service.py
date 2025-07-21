import os
import time
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import glob
from pathlib import Path

class GoogleDriveService:
    def __init__(self, service_account_file, folder_id):
        self.folder_id = folder_id
        self.service = self._authenticate(service_account_file)
        
    def _authenticate(self, service_account_file):
        """Authenticate using service account"""
        SCOPES = ['https://www.googleapis.com/auth/drive.file']
        
        credentials = service_account.Credentials.from_service_account_file(
            service_account_file, scopes=SCOPES)
        
        return build('drive', 'v3', credentials=credentials)
    
    def find_latest_video(self, download_dir="~/Downloads", max_age_seconds=60):
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
        
        # Check if file was created recently
        if latest_file and (time.time() - latest_time) < max_age_seconds:
            # Wait a bit to ensure download is complete
            time.sleep(1)
            # Check if file size is stable
            size1 = os.path.getsize(latest_file)
            time.sleep(1)
            size2 = os.path.getsize(latest_file)
            
            if size1 == size2:  # File is not growing
                return latest_file
        
        return None
    
    def upload_file(self, file_path):
        """Upload file to Google Drive and return shareable link"""
        try:
            file_name = os.path.basename(file_path)
            
            # File metadata
            file_metadata = {
                'name': f'veo_{int(time.time())}_{file_name}',
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
            
            print(f"Uploading {file_name} to Google Drive...")
            
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
            print(f"Download link: {download_link}")
            
            # Delete the local file
            try:
                os.remove(file_path)
                print(f"Local file deleted: {file_path}")
            except Exception as e:
                print(f"Warning: Could not delete local file: {e}")
            
            return {
                'success': True,
                'download_link': download_link,
                'view_link': view_link,
                'file_id': file_id,
                'file_name': file_metadata['name']
            }
            
        except Exception as e:
            print(f"Error uploading file: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def monitor_and_upload(self, check_interval=2, timeout=60):
        """Monitor downloads folder and upload new video files"""
        print("Monitoring downloads folder for new video files...")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            latest_video = self.find_latest_video()
            
            if latest_video:
                print(f"New video detected: {latest_video}")
                return self.upload_file(latest_video)
            
            time.sleep(check_interval)
        
        print("Timeout: No new video detected")
        return {
            'success': False,
            'error': 'No new video file detected in Downloads folder'
        }


# Global instance
_drive_service = None

def get_drive_service():
    """Get or create the global drive service instance"""
    global _drive_service
    if _drive_service is None:
        service_account_file = os.path.join(
            os.path.dirname(__file__), 
            'res', 
            'drive_api_key.json'
        )
        folder_id = "1PlkqWPD7nSxzRLKJpubFP1XiZLMvn35l"
        _drive_service = GoogleDriveService(service_account_file, folder_id)
    return _drive_service


if __name__ == "__main__":
    # Test
    service = get_drive_service()
    result = service.monitor_and_upload(timeout=10)
    print(json.dumps(result, indent=2))