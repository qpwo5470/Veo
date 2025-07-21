"""Complete OAuth authentication with the code from the redirect"""

import json
import os
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request

# The authorization code from your URL
AUTH_CODE = "4/0AVMBsJgmAoIBwg_FGoNkiiB0fCRLqYSwi8npYLPsiFd8tuACTtMuM4hd3hGL53QXqN0ilA"

# Load OAuth config
oauth_file = os.path.join(os.path.dirname(__file__), 'res', 'drive_oauth.json')
with open(oauth_file, 'r') as f:
    client_config = json.load(f)

# Create flow
flow = Flow.from_client_config(
    client_config,
    scopes=['https://www.googleapis.com/auth/drive.file'],
    redirect_uri='http://localhost'
)

try:
    # Exchange code for token
    flow.fetch_token(code=AUTH_CODE)
    
    # Save credentials
    credentials = flow.credentials
    token_file = os.path.join(os.path.dirname(__file__), 'token.json')
    
    with open(token_file, 'w') as token:
        token.write(credentials.to_json())
    
    print("✅ Authentication successful!")
    print(f"Token saved to: {token_file}")
    print("\nYou can now run: python main.py")
    print("The OAuth authentication is complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nThe authorization code may have expired.")
    print("Please run 'python main.py' again to get a new code.")