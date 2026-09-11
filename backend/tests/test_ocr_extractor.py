import pytest
import io
from PIL import Image
from app.engines.ocr_extractor import (
    preprocess_image_for_ocr,
    match_nlem_drug,
    parse_reference_range,
    extract_document_entities
)

@pytest.mark.asyncio
async def test_image_preprocessing():
    # Create a small dummy image in memory
    img = Image.new("RGB", (100, 100), color=(200, 100, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    raw_bytes = buf.getvalue()

    processed_img = preprocess_image_for_ocr(raw_bytes)
    assert processed_img is not None
    assert processed_img.mode == "L"  # Grayscale converted

def test_nlem_drug_fuzzy_matching():
    # Exact match
    match1 = match_nlem_drug("Tab Telmisartan 40mg OD")
    assert match1 is not None
    assert "Telmisartan" in match1["matched_drug"]
    assert match1["confidence"] >= 0.75

    # Noisy OCR snippet
    match2 = match_nlem_drug("Take Metformin 500 mg after dinner")
    assert match2 is not None
    assert "Metformin 500mg" in match2["matched_drug"]

    # Non-existent drug
    match3 = match_nlem_drug("RandomUnrelatedString 999mg", score_cutoff=85.0)
    assert match3 is None

def test_parse_reference_range_standard():
    # Normal Hemoglobin
    normal_hb = parse_reference_range("Hemoglobin", 14.5)
    assert normal_hb["is_abnormal"] is False
    assert normal_hb["reference_low"] == 12.0
    assert normal_hb["reference_high"] == 17.5

    # Low Hemoglobin
    low_hb = parse_reference_range("Hemoglobin", 8.2)
    assert low_hb["is_abnormal"] is True

    # High Fasting Blood Sugar
    high_fbs = parse_reference_range("Fasting Blood Sugar", 185.0)
    assert high_fbs["is_abnormal"] is True

def test_parse_reference_range_custom_printed():
    # Custom printed range on report
    parsed = parse_reference_range("Custom Lab Marker", 25.0, printed_range="10.0 - 20.0")
    assert parsed["is_abnormal"] is True
    assert parsed["reference_low"] == 10.0
    assert parsed["reference_high"] == 20.0

@pytest.mark.asyncio
async def test_extract_document_entities():
    # Test prescription extraction
    res_rx = await extract_document_entities(b"fake_bytes", "prescription_sample.jpg", doc_type="PRESCRIPTION")
    assert res_rx["status"] == "PROCESSED"
    assert len(res_rx["extracted_medications"]) >= 1
    assert "standardized_name" in res_rx["extracted_medications"][0]
    assert "bbox_coordinates" in res_rx["extracted_medications"][0]

    # Test lab report extraction
    res_lab = await extract_document_entities(b"fake_bytes", "lab_report.pdf", doc_type="LAB_REPORT")
    assert res_lab["status"] == "PROCESSED"
    assert len(res_lab["extracted_labs"]) >= 1
    assert res_lab["extracted_labs"][0]["is_abnormal"] is True
