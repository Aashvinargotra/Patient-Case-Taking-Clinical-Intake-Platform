import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    APP_NAME: str = "MediKiosk"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # Cryptographic Secrets
    SECRET_KEY: str = Field(default="dev-insecure-jwt-signing-secret-change-in-production-min32chars")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720  # 12 Hours
    
    # KMS Fernet 32-byte key for patient phone reversible envelope encryption
    KMS_DATA_ENCRYPTION_KEY: str = Field(default="MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=")
    
    # Blind Search Index HMAC Secret Pepper (Must remain secret per hospital node)
    BLIND_INDEX_PEPPER: str = Field(default="hospital_scoped_dev_hmac_secret_pepper_2026_salt_xyz")
    
    # Signed QR Anti-Tamper Secret
    QR_SIGNING_SECRET: str = Field(default="qr_tamper_evident_signing_secret_key_2026_xyz")
    
    # Database Settings
    POSTGRES_USER: str = "medikiosk_admin"
    POSTGRES_PASSWORD: str = "medikiosk_secure_dev_password_2026"
    POSTGRES_DB: str = "medikiosk_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "postgresql+asyncpg://medikiosk_admin:medikiosk_secure_dev_password_2026@localhost:5432/medikiosk_db"
    
    # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = "medikiosk_redis_secure_pass_2026"
    REDIS_URL: str = "redis://:medikiosk_redis_secure_pass_2026@localhost:6379/0"
    
    # Google Gemini API
    GEMINI_API_KEY: Optional[str] = None
    
    # AI4Bharat & Bhashini Speech Pipeline Settings
    AI4BHARAT_API_KEY: Optional[str] = None
    AI4BHARAT_ASR_URL: str = "https://models.ai4bharat.org/inference/asr"
    AI4BHARAT_TTS_URL: str = "https://models.ai4bharat.org/inference/tts"
    BHASHINI_USER_ID: str = "demo_bhashini_user"
    BHASHINI_API_KEY: str = "demo_bhashini_api_key_2026"
    BHASHINI_PIPELINE_ID: str = "demo_pipeline_id"
    
    # HAPI FHIR R4 Public Server
    HAPI_FHIR_BASE_URL: str = "https://hapi.fhir.org/baseR4"
    
    # Supabase Cloud Storage & Realtime Sync
    SUPABASE_URL: str = "https://rwdumbxllzsarmfstwtp.supabase.co"
    SUPABASE_ANON_KEY: str = "sb_publishable_uhYrnBIFxCHKxnPE8cWc-A_56OJ9KB3"
    
    # Allowed CORS Origins
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "*"]

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
