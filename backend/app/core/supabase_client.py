from typing import Optional, Dict, Any
import httpx
from app.core.config import settings

class SupabaseClient:
    """
    Client wrapper for Supabase Cloud Storage & REST endpoints.
    Provides medical document image uploads to the 'medical-documents' bucket.
    """
    def __init__(self):
        self.url = settings.SUPABASE_URL.rstrip("/")
        self.key = settings.SUPABASE_ANON_KEY
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}"
        }

    async def upload_document_file(self, file_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> Dict[str, Any]:
        """
        Uploads an image file to Supabase Storage bucket 'medical-documents'.
        Returns public or signed storage URL.
        """
        storage_url = f"{self.url}/storage/v1/object/medical-documents/{filename}"
        headers = {
            **self.headers,
            "Content-Type": content_type,
            "x-upsert": "true"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(storage_url, content=file_bytes, headers=headers)
                if resp.status_code in [200, 201]:
                    public_url = f"{self.url}/storage/v1/object/public/medical-documents/{filename}"
                    return {
                        "status": "SUCCESS",
                        "storage_path": f"medical-documents/{filename}",
                        "public_url": public_url
                    }
                else:
                    return {
                        "status": "FALLBACK_LOCAL",
                        "storage_path": f"local://uploads/{filename}",
                        "public_url": f"/uploads/{filename}",
                        "error": f"Supabase status: {resp.status_code}"
                    }
        except Exception as e:
            return {
                "status": "FALLBACK_LOCAL",
                "storage_path": f"local://uploads/{filename}",
                "public_url": f"/uploads/{filename}",
                "error": str(e)
            }

supabase_client = SupabaseClient()
