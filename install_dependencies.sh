#!/bin/bash

echo "Installing Google Drive dependencies..."

# Install all required packages
pip install --upgrade pip
pip install google-auth==2.23.4
pip install google-auth-oauthlib==1.1.0
pip install google-auth-httplib2==0.1.1
pip install google-api-python-client==2.108.0
pip install flask==3.0.0
pip install flask-cors==4.0.0
pip install requests==2.31.0

echo ""
echo "Verifying installation..."

python -c "
import sys
print('Python:', sys.version)
print()

packages = [
    'google.auth',
    'google.oauth2',
    'googleapiclient',
    'flask',
    'flask_cors',
    'requests'
]

all_ok = True
for package in packages:
    try:
        if '.' in package:
            parts = package.split('.')
            exec(f'import {parts[0]}')
            exec(f'from {parts[0]} import {parts[1]}')
        else:
            exec(f'import {package}')
        print(f'✅ {package} installed')
    except ImportError as e:
        print(f'❌ {package} NOT installed: {e}')
        all_ok = False

print()
if all_ok:
    print('✅ All dependencies installed successfully!')
else:
    print('❌ Some dependencies are missing. Please check the errors above.')
"