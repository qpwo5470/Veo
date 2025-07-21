@echo off
echo Building Veo for Windows...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo Installing requirements...
pip install -r requirements.txt

REM Install PyInstaller if not already installed
pip install pyinstaller

REM Clean previous builds
echo Cleaning previous builds...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

REM Create dummy credential files if they don't exist (for building)
if not exist credentials.json (
    echo Creating dummy credentials.json...
    echo {"google": {"email": "YOUR_EMAIL", "password": "YOUR_PASSWORD"}, "flow_project_url": "YOUR_PROJECT_URL"} > credentials.json
)

if not exist token.json (
    echo Creating dummy token.json...
    echo {} > token.json
)

REM Create res folder if it doesn't exist
if not exist res mkdir res

if not exist res\drive_api_key.json (
    echo Creating dummy drive_api_key.json...
    echo {"type": "service_account", "project_id": "YOUR_PROJECT"} > res\drive_api_key.json
)

if not exist res\drive_oauth.json (
    echo Creating dummy drive_oauth.json...
    echo {"installed": {"client_id": "YOUR_CLIENT_ID", "client_secret": "YOUR_SECRET"}} > res\drive_oauth.json
)

REM Build the executable
echo Building executable...
pyinstaller veo_windows.spec --clean

REM Check if build was successful
if exist dist\Veo\Veo.exe (
    echo.
    echo Build successful!
    echo Executable location: dist\Veo\Veo.exe
    echo.
    echo To run Veo, you need to:
    echo 1. Copy your actual credentials.json to dist\Veo\
    echo 2. Copy your actual res\drive_api_key.json to dist\Veo\res\
    echo 3. Copy your actual res\drive_oauth.json to dist\Veo\res\
    echo 4. Run Veo.exe
) else (
    echo.
    echo Build failed!
    echo Check the error messages above.
)

pause