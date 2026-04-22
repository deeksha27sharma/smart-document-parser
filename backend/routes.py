from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ingestion import extract_text
from nlp_processor import extract_entities, summarize_text, classify_document, extract_key_values
from rag_engine import answer_question

router = APIRouter(prefix="/api/v1")

@router.post("/parse")
async def parse_document(
    file: UploadFile = File(...),
    mode: str = Form("summary"),
    question: str = Form(None)
):
    content = await file.read()
    
    try:
        text = extract_text(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Extraction failed: {str(e)}")
    
    result = {"filename": file.filename, "mode": mode, "text_preview": text[:300]}
    
    if mode == "summary":
        result["summary"] = summarize_text(text)
    elif mode == "entities":
        result["entities"] = extract_entities(text)
    elif mode == "classify":
        result["classification"] = classify_document(text)
    elif mode == "keyvalue":
        result["key_values"] = extract_key_values(text)
    elif mode == "qa":
        if not question:
            raise HTTPException(status_code=400, detail="Question required for Q&A mode")
        result["answer"] = answer_question(text, question)
    
    return result