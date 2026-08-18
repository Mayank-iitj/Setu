import os
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from clerk_backend_api import Clerk
from dotenv import load_dotenv

load_dotenv()

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

# Initialize Clerk client if secret key is present
clerk = Clerk(bearer_auth=CLERK_SECRET_KEY) if CLERK_SECRET_KEY else None

security = HTTPBearer(auto_error=False)

def verify_session(request: Request, creds: HTTPAuthorizationCredentials = Security(security)):
    """
    Verifies the Clerk session token from the Authorization header.
    Gracefully degrades to "Open Mode" if CLERK_SECRET_KEY is missing.
    """
    if not clerk:
        return {"user_id": "open-mode-user"}

    # Use the official SDK to verify the request
    try:
        request_state = clerk.authenticate_request(request)
        if not request_state.is_signed_in:
            raise HTTPException(status_code=401, detail="Unauthenticated")
        
        # We can extract useful claims like user_id, org_id etc.
        # But for now, returning success state is enough
        return request_state
    except Exception as e:
        # Logging out the actual error could be helpful for debugging
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_ws_session(token: str = None):
    """
    Verifies a WebSocket connection via query token.
    """
    if not clerk:
        return {"user_id": "open-mode-user"}
    
    if not token:
        raise ValueError("Missing token")

    # The SDK provides verify_token for raw strings
    try:
        # verify_token returns the claims dict if successful
        claims = clerk.verify_token(token)
        return claims
    except Exception as e:
        print(f"WS Auth error: {e}")
        raise ValueError("Invalid token")
