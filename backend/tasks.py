from celery import Celery

celery_app = Celery("sdp", broker="redis://localhost:6379/0", backend="redis://localhost:6379/1")

@celery_app.task
def process_document_async(file_bytes: bytes, filename: str, mode: str, question: str = None):
    from ingestion import extract_text
    from nlp_processor import extract_entities, summarize_text
    text = extract_text(file_bytes, filename)
    if mode == "summary":
        return {"summary": summarize_text(text)}
    elif mode == "entities":
        return {"entities": extract_entities(text)}