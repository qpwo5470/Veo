#!/bin/bash

echo "=========================================="
echo "Veo Quick Start - Automatic Setup"
echo "=========================================="

# Install dependencies
echo "Installing dependencies..."
pip install google-auth google-api-python-client google-auth-oauthlib google-auth-httplib2 flask flask-cors requests selenium webdriver-manager

# Check installation
echo ""
echo "Checking installation..."
python -c "
import sys
try:
    import google.auth
    from googleapiclient.discovery import build
    print('✅ Google Drive API ready')
except:
    print('❌ Google Drive API not ready')
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    echo "Installation failed. Please check the errors above."
    exit 1
fi

# Run the application
echo ""
echo "=========================================="
echo "Starting Veo Application..."
echo "=========================================="
echo ""

python main.py "$@"