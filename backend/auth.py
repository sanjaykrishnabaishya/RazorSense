from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models

# Standard OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# For mock purposes, the "token" is just the user's phone number or ID in plain text for now.
# In production, this would decode a JWT signed by NextAuth/Auth0.

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Mock JWT decode: just find user by phone number (acting as token)
    user = db.query(models.User).filter(models.User.phone_number == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
