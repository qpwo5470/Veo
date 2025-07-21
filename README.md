# Veo Application

A Chrome automation application with Google authentication, video generation workflows, and automatic Google Drive uploads.

## Features

- Google account login automation
- Video generation through Google Flow (Text-to-Video, Image-to-Video)
- Sketch-to-Video through Dream Studio
- Automatic Google Drive upload with QR code generation
- Home button navigation with chat history cleanup
- Refresh and back navigation blocking
- Kiosk mode support

## Requirements

- Python 3.7+
- Chrome browser
- ChromeDriver (auto-installed)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure credentials:
- Edit `credentials.json` with your Google account credentials
- Update `flow_project_url` with your Flow project URL

3. Set up Google Drive OAuth (optional):
- Place OAuth credentials in `res/drive_oauth.json`
- Run the app once to complete OAuth authentication

## Usage

Basic usage:
```bash
python main.py
```

### Command Line Options

- `--devtools` - Enable Chrome Developer Tools
- `--debug-downloads` - Enable download debugging
- `--debug-chat` - Enable chat deletion debugging
- `--kiosk` - Run in full kiosk mode

Example:
```bash
python main.py --devtools --debug-chat
```

## Key Files

### Core Application
- `main.py` - Main application entry point
- `pg1.html` - Landing page with looping video
- `pg2.html` - Menu page with navigation buttons
- `credentials.json` - Google account credentials

### JavaScript Modules
- `upload_qr_dialog.js` - QR code dialog for uploads
- `simple_download_monitor.js` - Download detection
- `home_button_injector.js` - Home button on external pages
- `chat_deleter.js` - Chat history cleanup
- `persistent_logo_hider.js` - Hide UI elements
- `refresh_blocker.js` - Block page refresh
- `flow_mode_selector_v2.js` - Auto-select Flow mode

### Services
- `oauth_drive_service.py` - Google Drive upload service
- `integrated_drive_server.py` - Web server for upload status
- `download_cleanup.py` - Clean downloaded files

## Keyboard Shortcuts

- `Alt+D` - Test QR dialog (debug)
- `Escape` - Close dialogs
- `1` - Navigate to Sketch (from pg2)
- `2` - Navigate to Text-to-Video (from pg2)
- `3` - Navigate to Image-to-Video (from pg2)

## Navigation Flow

1. **pg1.html** - Click anywhere to proceed
2. **pg2.html** - Select generation mode:
   - Sketch → Dream Studio
   - Text → Google Flow (Text mode)
   - Image → Google Flow (Asset mode)
3. **Generation Pages** - Create videos
4. **Home Button** - Return to pg1 (clears chat history on Flow pages)

## Troubleshooting

### Downloads not uploading
- Check if OAuth is configured in `res/drive_oauth.json`
- Ensure you've completed OAuth authentication
- Check console for upload errors

### Chat deletion not working
- Run with `--debug-chat` flag
- Use `window.debugDeleteChats()` in console
- Check if chat UI has changed

### Refresh still working
- Ensure `refresh_blocker.js` is loaded
- Check console for errors
- Try kiosk mode with `--kiosk` flag

## Development

### Adding new features
1. Create new JavaScript module in project root
2. Add script injection in `setup_download_qr_interceptor()` 
3. Test with appropriate debug flags

### Cleaning up
Run `python cleanup_unused_files.py` to archive unused files.

## License

Internal use only.