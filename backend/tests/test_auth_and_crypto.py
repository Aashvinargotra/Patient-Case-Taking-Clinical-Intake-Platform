import pytest
import time
import base64
import hmac
import hashlib
from datetime import timedelta
import pyotp
from app.core.config import settings
from app.core.security import (
    normalize_phone_number,
    encrypt_phone,
    decrypt_phone,
    compute_search_hash,
    generate_signed_qr_token,
    verify_signed_qr_token,
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token,
    verify_totp_mfa
)

def test_phone_normalization_and_blind_index():
    raw_phone_1 = "9876543210"
    raw_phone_2 = "+91 98765 43210"
    raw_phone_3 = "09876543210"

    norm_1 = normalize_phone_number(raw_phone_1)
    norm_2 = normalize_phone_number(raw_phone_2)
    norm_3 = normalize_phone_number(raw_phone_3)

    assert norm_1 == "+919876543210"
    assert norm_2 == "+919876543210"
    assert norm_3 == "+919876543210"

    # Deterministic blind search hash
    hash_1 = compute_search_hash(raw_phone_1)
    hash_2 = compute_search_hash(raw_phone_2)
    hash_3 = compute_search_hash(raw_phone_3)

    assert hash_1 == hash_2 == hash_3
    assert len(hash_1) == 64

def test_phone_normalization_invalid_format():
    with pytest.raises(ValueError, match="Phone normalization failed"):
        normalize_phone_number("invalid_phone_123")
    with pytest.raises(ValueError, match="Phone normalization failed"):
        normalize_phone_number("12345")

def test_kms_envelope_encryption():
    raw_phone = "+919876543210"
    encrypted = encrypt_phone(raw_phone)
    assert encrypted != raw_phone
    assert len(encrypted) > 30

    decrypted = decrypt_phone(encrypted)
    assert decrypted == raw_phone

def test_decrypt_corrupted_phone():
    with pytest.raises(ValueError, match="Failed to decrypt phone number"):
        decrypt_phone("gAAAAABl_corrupted_ciphertext_payload==")

def test_signed_qr_generation_and_tamper_detection():
    session_id = "sess-abc-123"
    patient_id = "PAT-998877"
    token_num = 42

    signed_qr = generate_signed_qr_token(session_id, patient_id, token_num)
    assert signed_qr.startswith("MK1.")

    # Valid token verification
    verified = verify_signed_qr_token(signed_qr)
    assert verified["session_id"] == session_id
    assert verified["patient_id"] == patient_id
    assert verified["token_number"] == token_num

    # Tampered token verification (altered token number)
    tampered = signed_qr.replace(".42.", ".43.")
    with pytest.raises(ValueError, match="Cryptographic QR signature mismatch"):
        verify_signed_qr_token(tampered)

def test_signed_qr_expired_token():
    # Generate token with timestamp from 25 hours ago (>86400s)
    old_ts = int(time.time()) - 90000
    payload = f"MK1.{old_ts}.sess-old-123.PAT-998877.42"
    sig = hmac.new(settings.QR_SIGNING_SECRET.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig[:8]).decode('utf-8').rstrip("=")
    expired_token = f"{payload}.{sig_b64}"

    with pytest.raises(ValueError, match="OPD Visit QR token has expired"):
        verify_signed_qr_token(expired_token)

def test_signed_qr_malformed():
    with pytest.raises(ValueError, match="Invalid QR token format"):
        verify_signed_qr_token("INVALID_TOKEN_STRING")

def test_argon2id_password_hashing():
    pwd = "DoctorStrongPassword2026!"
    hashed = hash_password(pwd)
    assert hashed.startswith("$argon2")
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_totp_mfa_verification():
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    current_otp = totp.now()

    assert verify_totp_mfa(secret, current_otp) is True
    assert verify_totp_mfa(secret, "000000") is False

def test_jwt_access_token():
    payload = {"sub": "DOC-101", "role": "DOCTOR", "dept_id": "CARDIOLOGY"}
    token = create_access_token(payload)
    decoded = verify_access_token(token)

    assert decoded["sub"] == "DOC-101"
    assert decoded["role"] == "DOCTOR"
    assert decoded["dept_id"] == "CARDIOLOGY"

def test_jwt_expired_token():
    payload = {"sub": "DOC-101", "role": "DOCTOR"}
    token = create_access_token(payload, expires_delta=timedelta(seconds=-10))
    with pytest.raises(ValueError, match="Session token has expired"):
        verify_access_token(token)
