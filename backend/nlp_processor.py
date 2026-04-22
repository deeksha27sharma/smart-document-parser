import spacy
from transformers import pipeline

nlp = spacy.load("en_core_web_sm")

# Use correct task names for transformers 4.41
summarizer = pipeline("text2text-generation", model="facebook/bart-large-cnn")
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")


DOC_CATEGORIES = [
    "Invoice", "Contract", "Resume", "Academic Paper",
    "News Article", "Legal Document", "Medical Report",
    "Email", "Technical Manual", "Financial Report"
]

def extract_entities(text: str) -> list:
    doc = nlp(text)
    entities = []
    seen = set()
    for ent in doc.ents:
        key = (ent.label_, ent.text.strip())
        if key not in seen:
            seen.add(key)
            entities.append({"type": ent.label_, "value": ent.text.strip()})
    return entities

def summarize_text(text: str) -> str:
    truncated = text[:3000]
    result = summarizer(truncated, max_length=150, min_length=40)
    return result[0]["generated_text"]

def classify_document(text: str) -> dict:
    truncated = text[:1000]
    result = classifier(truncated, DOC_CATEGORIES)
    return {
        "category": result["labels"][0],
        "confidence": round(result["scores"][0], 3),
        "all_scores": dict(zip(result["labels"][:5], 
                               [round(s,3) for s in result["scores"][:5]]))
    }

def extract_key_values(text: str) -> list:
    doc = nlp(text)
    kv_pairs = []
    for ent in doc.ents:
        label_map = {
            "PERSON": "Person Name", "ORG": "Organization",
            "DATE": "Date", "MONEY": "Amount", "GPE": "Location",
            "FAC": "Facility", "PRODUCT": "Product", "EVENT": "Event"
        }
        if ent.label_ in label_map:
            kv_pairs.append({
                "key": label_map[ent.label_],
                "value": ent.text.strip()
            })
    return kv_pairs