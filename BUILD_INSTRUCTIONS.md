# Build Instructions for Veo

## Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Windows OS (for Windows build)

## Windows Build

### Quick Build
1. Run the build script:
   ```cmd
   build_windows.bat
   ```

2. The executable will be created in `dist\Veo\Veo.exe`

### Manual Build
1. Create virtual environment:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```

2. Install dependencies:
   ```cmd
   pip install -r requirements.txt
   ```

3. Build with PyInstaller:
   ```cmd
   pyinstaller veo_windows.spec --clean
   ```

## Required Files
Before running the executable, ensure these files exist:

### Configuration Files
- `credentials.json` - Google account credentials
  ```json
  {
    "google": {
      "email": "your_email@gmail.com",
      "password": "your_password"
    },
    "flow_project_url": "https://labs.google/fx/ko/tools/flow/project/YOUR_PROJECT_ID"
  }
  ```

### Google API Keys (in `res/` folder)
- `res/drive_api_key.json` - Service account key for Google Drive
- `res/drive_oauth.json` - OAuth 2.0 client credentials

## Distribution Structure
```
dist/Veo/
├── Veo.exe                 # Main executable
├── credentials.json        # User credentials (add after build)
├── token.json             # OAuth token (generated automatically)
├── pg1.html               # Page 1 UI
├── pg2.html               # Page 2 UI
├── *.js                   # All JavaScript files
├── qrcode.min.js          # QR code library
└── res/                   # Resources folder
    ├── drive_api_key.json # Google Drive API key (add after build)
    ├── drive_oauth.json   # OAuth credentials (add after build)
    └── pg2/               # Page 2 images
        ├── p2_bg.png
        ├── home_btn.png
        ├── image_btn.png
        ├── sketch_btn.png
        └── text_btn.png
```

## Important Notes
1. **Security**: Never commit real credentials to version control
2. **Chrome**: The app will download ChromeDriver automatically on first run
3. **Firewall**: Allow the app through Windows Firewall for OAuth callback
4. **Ports**: The app uses port 8890 for OAuth callback server

## Troubleshooting
- If build fails, check Python and pip versions
- Ensure all required files exist before building
- Run as administrator if permission errors occur
- Check antivirus doesn't block PyInstaller