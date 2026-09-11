import hmac
import hashlib
import base64
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import phonenumbers
from cryptography.fernet import Fernet, InvalidToken
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import jwt
from jwt.exceptions import PyJWTError, ExpiredSignatureError
import pyotp

from app.core.config import settings

# Password & MPIN Hashing Context using Argon2id
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

# 1. Canonical Phone Normalization (E.164 Format)
def normalize_phone_number(raw_phone: str, default_region: str = "IN") -> str:
    """
    Normalizes any mobile number to canonical E.164 format (+91XXXXXXXXXX).
    Ensures deterministic blind index generation and prevents hash fragmentation.
    """
    try:
        parsed = phonenumbers.parse(raw_phone, default_region)
        if not phonenumbers.is_valid_number(parsed):
            raise ValueError(f"Invalid phone number format: {raw_phone}")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except Exception as e:
        raise ValueError(f"Phone normalization failed for '{raw_phone}': {str(e)}")

# 2. Envelope Encryption for Patient PII (AES-256 via Fernet)
def get_fernet_cipher() -> Fernet:
    key = settings.KMS_DATA_ENCRYPTION_KEY.encode('utf-8')
    return Fernet(key)

def encrypt_phone(raw_phone: str) -> str:
    """
    KMS Envelope Encryption for Patient Phone Number.
    Stored in `phone_encrypted` for authorized SMS notifications and physician emergency access.
    """
    normalized = normalize_phone_number(raw_phone)
    cipher = get_fernet_cipher()
    return cipher.encrypt(normalized.encode('utf-8')).decode('utf-8')

def decrypt_phone(encrypted_phone: str) -> str:
    """
    KMS Decryption for Patient Phone Number.
    Only called by authenticated authorized services (e.g. SMS gateway, doctor emergency lookup).
    """
    cipher = get_fernet_cipher()
    try:
        return cipher.decrypt(encrypted_phone.encode('utf-8')).decode('utf-8')
    except InvalidToken:
        raise ValueError("Failed to decrypt phone number: Invalid cryptographic key or corrupted payload")

# 3. Blind Search Index Generator (HMAC-SHA256 with Server Pepper)
def compute_search_hash(raw_phone: str) -> str:
    """
    Generates a deterministic blind search hash for O(1) patient lookup.
    Uses HMAC-SHA256 with a hospital-scoped secret pepper.
    Supports non-unique indexing for multi-generational shared family phones.
    """
    normalized = normalize_phone_number(raw_phone)
    pepper = settings.BLIND_INDEX_PEPPER.encode('utf-8')
    return hmac.new(pepper, normalized.encode('utf-8'), hashlib.sha256).hexdigest()

# 4. Anti-Tamper Signed QR Tokenizer (64-bit HMAC Signature with 24h Expiry)
def generate_signed_qr_token(session_id: str, patient_id: str, token_number: int) -> str:
    """
    Generates an encrypted, tamper-evident visit token encoded inside the patient's OPD slip QR code.
    Format: MK1.{timestamp}.{session_id}.{patient_id}.{token_num}.{hmac_signature_64bit}
    Zero plaintext health data inside the QR barcode.
    """
    ts = int(time.time())
    payload = f"MK1.{ts}.{session_id}.{patient_id}.{token_number}"
    sig = hmac.new(settings.QR_SIGNING_SECRET.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig[:8]).decode('utf-8').rstrip("=")
    return f"{payload}.{sig_b64}"

def verify_signed_qr_token(signed_token: str) -> Dict[str, Any]:
    """
    Validates QR signature and enforces 24-hour expiration window.
    Returns parsed dictionary if valid, raises ValueError otherwise.
    """
    parts = signed_token.strip().split(".")
    if len(parts) != 6 or parts[0] != "MK1":
        raise ValueError("Invalid QR token format")
    
    version, ts_str, session_id, patient_id, token_num_str, signature = parts
    payload = f"{version}.{ts_str}.{session_id}.{patient_id}.{token_num_str}"
    
    expected_sig = hmac.new(settings.QR_SIGNING_SECRET.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).digest()
    expected_b64 = base64.urlsafe_b64encode(expected_sig[:8]).decode('utf-8').rstrip("=")
    
    if not hmac.compare_digest(signature, expected_b64):
        raise ValueError("Cryptographic QR signature mismatch: Token has been tampered with")
        
    created_at = int(ts_str)
    if time.time() - created_at > 86400: # 24 Hours
        raise ValueError("OPD Visit QR token has expired (>24 hours)")
        
    return {
        "session_id": session_id,
        "patient_id": patient_id,
        "token_number": int(token_num_str),
        "created_at": created_at
    }

# 5. Password & MPIN Verification
def hash_password(plain: str) -> str:
    return ph.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return ph.verify(hashed, plain)
    except (VerifyMismatchError, Exception):
        return False

# 6. JWT Authentication Helper
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise ValueError("Session token has expired")
    except PyJWTError:
        raise ValueError("Invalid access token")

# 7. RFC 6238 TOTP MFA Verification (pyotp)
def verify_totp_mfa(secret: str, code: Optional[str]) -> bool:
    if not secret:
        return True # MFA not enrolled
    if not code:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)
