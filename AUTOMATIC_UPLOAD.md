# Veo Automatic Upload - Zero User Intervention

## Overview

The Veo application now includes fully automatic upload functionality. When you download a video from Google Flow, it will:

1. **Automatically detect** the download
2. **Automatically upload** to Google Drive  
3. **Automatically show** a QR code with the shareable link
4. **No user action required** - everything happens automatically!

## Quick Start

Just run:
```bash
./quick_start.sh
```

Or manually:
```bash
python main.py
```

## How It Works

### 1. Integrated Service
- The `integrated_drive_service.py` runs automatically when main.py starts
- It monitors your ~/Downloads folder for new video files
- No separate terminal or manual commands needed

### 2. Automatic Detection
- JavaScript handlers detect when you trigger a download in Google Flow
- The download saves to ~/Downloads as normal
- The service detects the new file within seconds

### 3. Automatic Upload
- Files are uploaded to Google Drive using the service account
- Each file gets a unique name with timestamp
- Files are made publicly accessible automatically

### 4. Automatic QR Display
- When upload completes, a QR code appears in your browser
- The QR code contains the Google Drive download link
- Anyone can scan the QR to download the video

## Features

- **Zero Configuration**: Just run main.py
- **Automatic Dependencies**: Installs required packages on first run
- **Duplicate Detection**: Won't re-upload the same file twice
- **Background Operation**: All uploads happen in background threads
- **Real-time Notifications**: See upload progress in the console
- **Instant QR Codes**: QR appears as soon as upload completes

## Requirements

- Python 3.7+
- Google Chrome
- Service account key at `res/drive_api_key.json`
- Internet connection for uploads

## Troubleshooting

### Dependencies not installed
The application will automatically install them on first run.

### Upload not working
Check the console for error messages. Common issues:
- Service account key missing
- No internet connection
- Google Drive quota exceeded

### QR code not showing
- Make sure you're on the Google Flow page
- Check browser console for errors
- Try refreshing the page

## File Structure

```
Veo/
├── main.py                    # Main application
├── integrated_drive_service.py # Automatic upload service
├── auto_upload_handler.js     # Browser-side upload detector
├── res/
│   └── drive_api_key.json    # Google service account key
└── quick_start.sh            # One-click launcher
```

## Security Note

The service account key in `res/drive_api_key.json` provides access to upload files to Google Drive. Keep this file secure and don't share it publicly.