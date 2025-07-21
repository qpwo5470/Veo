#!/usr/bin/env python3
"""Simple test to check OAuth setup"""

import os
import json

print("=" * 60)
print("OAuth Configuration Test")
print("=" * 60)

# Check for OAuth file
oauth_file = os.path.join(os.path.dirname(__file__), 'res', 'drive_oauth.json')

if os.path.exists(oauth_file):
    print(f"✅ OAuth file found: {oauth_file}")
    
    try:
        with open(oauth_file, 'r') as f:
            oauth_config = json.load(f)
        
        print("\nOAuth Configuration:")
        if 'installed' in oauth_config:
            config = oauth_config['installed']
            print(f"  Client ID: {config.get('client_id', 'NOT FOUND')[:50]}...")
            print(f"  Project ID: {config.get('project_id', 'NOT FOUND')}")
            print(f"  Auth URI: {config.get('auth_uri', 'NOT FOUND')}")
            print(f"  Token URI: {config.get('token_uri', 'NOT FOUND')}")
            
            # Check redirect URIs
            redirect_uris = config.get('redirect_uris', [])
            print(f"\n  Redirect URIs ({len(redirect_uris)}):")
            for uri in redirect_uris:
                print(f"    - {uri}")
                
            # Check if localhost:8888 is configured
            if any('localhost:8888' in uri for uri in redirect_uris):
                print("\n✅ localhost:8888 is configured as redirect URI")
            else:
                print("\n⚠️  localhost:8888 is NOT configured as redirect URI")
                print("   Please add http://localhost:8888/oauth2callback to your OAuth client")
                
        elif 'web' in oauth_config:
            print("⚠️  OAuth is configured for 'web' application, not 'installed'")
            print("   Please reconfigure as Desktop application")
        else:
            print("❌ Unknown OAuth configuration format")
            
    except Exception as e:
        print(f"❌ Error reading OAuth file: {e}")
        
else:
    print(f"❌ OAuth file not found: {oauth_file}")
    print("\nPlease create the file with your OAuth credentials")
    print("Format should be:")
    print(json.dumps({
        "installed": {
            "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
            "project_id": "YOUR_PROJECT_ID",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": "YOUR_CLIENT_SECRET",
            "redirect_uris": ["http://localhost:8888/oauth2callback"]
        }
    }, indent=2))

print("\n" + "=" * 60)

# Check for existing token
token_file = os.path.join(os.path.dirname(__file__), 'token.json')
if os.path.exists(token_file):
    print(f"ℹ️  Existing token found: {token_file}")
    print("   Delete this file to force re-authentication")
else:
    print("ℹ️  No existing token - will need to authenticate on first run")

print("=" * 60)