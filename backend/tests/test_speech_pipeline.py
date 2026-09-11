import pytest
import base64
from app.engines.speech_pipeline import (
    filter_audio_noise_and_vad,
    transcribe_audio,
    synthesize_speech,
    SUPPORTED_INDIAN_LANGUAGES
)

def test_supported_languages_catalog():
    assert "hi" in SUPPORTED_INDIAN_LANGUAGES
    assert "pa" in SUPPORTED_INDIAN_LANGUAGES
    assert "en" in SUPPORTED_INDIAN_LANGUAGES
    assert "bn" in SUPPORTED_INDIAN_LANGUAGES
    assert "ta" in SUPPORTED_INDIAN_LANGUAGES

def test_vad_and_noise_filtering():
    # Empty audio
    res_empty = filter_audio_noise_and_vad(b"")
    assert res_empty["is_speech_present"] is False

    # Valid audio bytes
    sample_bytes = b"RIFF" + b"\x00" * 200
    res_valid = filter_audio_noise_and_vad(sample_bytes)
    assert res_valid["is_speech_present"] is True
    assert res_valid["estimated_snr_db"] > 60

@pytest.mark.asyncio
async def test_transcribe_audio_empty_payload():
    res = await transcribe_audio("", language_code="hi")
    assert res["status"] == "NO_SPEECH_DETECTED"
    assert res["fallback_mode"] == "TOUCH_SELECTION"

@pytest.mark.asyncio
async def test_transcribe_audio_multilingual_fallback():
    dummy_audio = base64.b64encode(b"RIFF" + b"\x00" * 300).decode("utf-8")

    # Hindi
    res_hi = await transcribe_audio(dummy_audio, language_code="hi")
    assert res_hi["status"] in ["SUCCESS", "FALLBACK"]
    assert len(res_hi["transcript"]) > 0

    # Punjabi
    res_pa = await transcribe_audio(dummy_audio, language_code="pa")
    assert res_pa["status"] in ["SUCCESS", "FALLBACK"]
    assert "ਦਰਦ" in res_pa["transcript"]

    # English
    res_en = await transcribe_audio(dummy_audio, language_code="en")
    assert "chest pain" in res_en["transcript"].lower()

@pytest.mark.asyncio
async def test_synthesize_speech():
    tts_res = await synthesize_speech("कृपया अपना टोकन नंबर देखें", language_code="hi")
    assert tts_res["status"] == "SUCCESS"
    assert "audio_base64" in tts_res
    assert tts_res["language"] == "hi"
