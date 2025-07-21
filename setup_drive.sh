#!/bin/bash

echo "=========================================="
echo "Google Drive Integration Setup"
echo "=========================================="

# Check if in virtual environment
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  WARNING: Not in a virtual environment"
    echo "It's recommended to use a virtual environment"
    echo ""
fi

# Install dependencies
echo "Installing required packages..."
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client flask flask-cors requests

# Check if installation was successful
echo ""
echo "Checking installation..."
python -c "
try:
    import google.auth
    print('✅ google-auth installed')
except ImportError:
    print('❌ google-auth NOT installed')

try:
    import googleapiclient
    print('✅ google-api-python-client installed')
except ImportError:
    print('❌ google-api-python-client NOT installed')

try:
    import flask
    print('✅ flask installed')
except ImportError:
    print('❌ flask NOT installed')

try:
    import flask_cors
    print('✅ flask-cors installed')
except ImportError:
    print('❌ flask-cors NOT installed')

try:
    import requests
    print('✅ requests installed')
except ImportError:
    print('❌ requests NOT installed')
"

# Check for service account key
echo ""
echo "Checking for Google Drive API key..."
if [ -f "res/drive_api_key.json" ]; then
    echo "✅ Service account key found at res/drive_api_key.json"
else
    echo "❌ Service account key NOT found at res/drive_api_key.json"
fi

# Test Drive service
echo ""
echo "Testing Google Drive service..."
python -c "
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath('.')))
try:
    from google_drive_service import get_drive_service
    service = get_drive_service()
    print('✅ Google Drive service initialized successfully')
except Exception as e:
    print(f'❌ Google Drive service failed: {e}')
"

# Test server
echo ""
echo "Testing Drive upload server..."
python test_server.py

echo ""
echo "=========================================="
echo "Setup complete!"
echo ""
echo "To run the application:"
echo "  python main.py"
echo ""
echo "To monitor downloads manually:"
echo "  python auto_upload_monitor.py"
echo "=========================================="