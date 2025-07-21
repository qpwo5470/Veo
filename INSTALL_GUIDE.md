# Veo Installation Guide

## Prerequisites

1. Python 3.7 or higher
2. pip (Python package manager)
3. Google Chrome browser

## Installation Steps

### 1. Install Python Dependencies

Run the setup script:
```bash
./setup_drive.sh
```

Or manually install:
```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client flask flask-cors requests selenium webdriver-manager
```

### 2. Verify Service Account Key

Make sure your Google Drive service account key is at:
```
res/drive_api_key.json
```

### 3. Run the Application

Basic mode:
```bash
python main.py
```

With debug mode:
```bash
python main.py --debug-downloads
```

## How It Works

1. **Main Application** (`python main.py`)
   - Opens Chrome in kiosk mode
   - Logs into Google automatically
   - Shows pg1 (video) → pg2 (buttons) → Google Flow
   - Monitors downloads and shows download information

2. **Auto Upload Monitor** (optional - run in separate terminal)
   ```bash
   python auto_upload_monitor.py
   ```
   - Watches ~/Downloads folder
   - Automatically uploads new videos to Google Drive
   - Shows shareable links

## Download Flow

1. Click download button in Google Flow
2. Select format (MP4, MOV, GIF)
3. File downloads to ~/Downloads
4. Popup shows download URL and instructions
5. Either:
   - Run `auto_upload_monitor.py` for automatic upload
   - Or use `test_download_detection.py` for manual upload

## Troubleshooting

1. **Dependencies not installed**
   ```bash
   pip install -r requirements_drive.txt
   ```

2. **Chrome driver issues**
   ```bash
   python install_chromedriver.py
   ```

3. **Test Google Drive connection**
   ```bash
   python test_server.py
   ```

4. **Manual upload test**
   ```bash
   python test_download_detection.py
   ```
   Select option 3 to test upload

## Files Overview

- `main.py` - Main application
- `auto_upload_monitor.py` - Automatic upload monitor
- `test_download_detection.py` - Manual testing tool
- `direct_drive_handler.js` - Shows download info in browser
- `res/drive_api_key.json` - Google service account key