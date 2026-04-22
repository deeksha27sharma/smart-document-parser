# ⬡ Smart Document Parser
### AI-Powered Document Understanding System · Final Year B.Tech CSE Project

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![PyTorch](https://img.shields.io/badge/PyTorch-2.x-ee4c2c?style=flat-square&logo=pytorch)
![spaCy](https://img.shields.io/badge/spaCy-3.7-09a3d5?style=flat-square)
![LangChain](https://img.shields.io/badge/LangChain-0.2-ffffff?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 📌 Overview

**Smart Document Parser** is an end-to-end intelligent document understanding system that extracts, classifies, and summarizes structured information from heterogeneous document formats using state-of-the-art NLP and deep learning techniques.

Upload any document — PDF, DOCX, scanned image, or plain text — and the system automatically:

- 📝 **Summarizes** the document using BART transformer
- 🏷️ **Extracts named entities** — people, organizations, dates, amounts
- 🗂️ **Classifies** the document type with confidence scores
- 🔑 **Extracts key-value fields** in structured format
- 💬 **Answers natural language questions** using RAG pipeline

> Built as a Final Year B.Tech CSE Project demonstrating practical application of NLP, Computer Vision, Information Retrieval, and MLOps.

---

## 🎬 Demo

| Summarize | Extract Entities | Classify |
|-----------|-----------------|----------|
| BART abstractive summary | spaCy NER pipeline | Zero-shot classification |

| Key-Value Fields | Q&A |
|-----------------|-----|
| Structured extraction | RAG with FAISS vector store |

---

## 🏗️ System Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   Document  │────▶│  OCR Engine  │────▶│  NLP Pipeline │────▶│   REST API   │
│ PDF/DOCX/IMG│     │  Tesseract   │     │  BART · spaCy │     │   FastAPI    │
└─────────────┘     └──────────────┘     └───────────────┘     └──────────────┘
                                                  │                      │
                                         ┌────────▼──────┐     ┌────────▼──────┐
                                         │  Vector Store  │     │  React UI     │
                                         │  FAISS + RAG   │     │  Dashboard    │
                                         └───────────────┘     └───────────────┘
```

### Pipeline Stages

```
Input → Text Extraction → Layout Analysis → NER → Classification → Summarization → Vector DB → Output
```

---

## ✨ Features

- **Multi-format ingestion** — PDF, DOCX, TXT, PNG, JPG, JPEG
- **OCR support** — Tesseract for scanned/image-based documents
- **Named Entity Recognition** — PERSON, ORG, DATE, MONEY, LOCATION, EMAIL, PHONE
- **Document Classification** — Invoice, Contract, Resume, Legal, Medical, Financial & more
- **Abstractive Summarization** — Facebook BART large CNN model
- **RAG-powered Q&A** — LangChain + FAISS vector store
- **Key-Value Extraction** — Structured field detection
- **REST API** — FastAPI with Swagger auto-docs
- **Beautiful UI** — React 18 + Vite dashboard
- **Async processing** — Background task support

---

## 🛠️ Tech Stack

### AI / Machine Learning
| Library | Purpose |
|---------|---------|
| PyTorch 2.x | Deep learning framework |
| HuggingFace Transformers | BART summarization, zero-shot classification |
| spaCy 3.7 | Named entity recognition |
| LangChain | RAG pipeline orchestration |
| FAISS | Vector similarity search |
| Sentence-Transformers | Document embeddings |
| Tesseract OCR | Image/scanned document text extraction |
| OpenCV | Image preprocessing |

### Backend
| Library | Purpose |
|---------|---------|
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| SQLAlchemy | Database ORM |
| PostgreSQL | Document storage |
| Celery + Redis | Async task queue |
| Pydantic | Data validation |

### Frontend
| Library | Purpose |
|---------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| Axios | HTTP client |
| CSS-in-JS | Styling |

---

## 📁 Project Structure

```
smart-document-parser/
├── backend/
│   ├── venv/                   # Python virtual environment
│   ├── main.py                 # FastAPI app entry point
│   ├── routes.py               # API route handlers
│   ├── ingestion.py            # Document ingestion (PDF/DOCX/OCR)
│   ├── nlp_processor.py        # NER, summarization, classification
│   ├── rag_engine.py           # RAG Q&A with FAISS
│   ├── database.py             # SQLAlchemy models
│   ├── tasks.py                # Celery async tasks
│   ├── test_api.py             # Unit tests
│   └── requirements.txt        # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React component
│   │   ├── api.js              # Axios API client
│   │   └── main.jsx            # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── data/                       # Sample documents for testing
├── models/                     # Downloaded model cache
├── docs/                       # Project documentation
├── docker-compose.yml          # Full stack Docker setup
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Tesseract OCR installed

```bash
# Install Tesseract (Mac)
brew install tesseract

# Install Tesseract (Ubuntu)
sudo apt-get install tesseract-ocr
```

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/smart-document-parser.git
cd smart-document-parser
```

### 2. Backend Setup

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate          # Mac/Linux
# venv\Scripts\activate           # Windows

pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 3. Run Backend

```bash
cd backend
source venv/bin/activate
python main.py
# API running at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# UI running at http://localhost:5173
```

### 5. Docker (Full Stack)

```bash
docker-compose up --build
# Everything runs at http://localhost:3000
```

---

## 📡 API Reference

Base URL: `http://localhost:8000/api/v1`

### Parse Document

```http
POST /parse
Content-Type: multipart/form-data
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | ✅ | Document to parse |
| mode | string | ✅ | `summary` / `entities` / `classify` / `keyvalue` / `qa` |
| question | string | ❌ | Required when mode is `qa` |

**Example Response (summary mode):**
```json
{
  "filename": "contract.pdf",
  "mode": "summary",
  "summary": "This agreement between Acme Corp and John Smith...",
  "text_preview": "EMPLOYMENT AGREEMENT This Employment Agreement..."
}
```

**Example Response (entities mode):**
```json
{
  "filename": "invoice.pdf",
  "mode": "entities",
  "entities": [
    { "type": "ORG",    "value": "Acme Corporation" },
    { "type": "DATE",   "value": "12 March 2024" },
    { "type": "MONEY",  "value": "$4,500.00" },
    { "type": "PERSON", "value": "John Smith" }
  ]
}
```

### Health Check

```http
GET /health
```
```json
{ "status": "ok" }
```

---

## 🧪 Running Tests

```bash
cd backend
source venv/bin/activate
venv/bin/pytest test_api.py -v
```

Expected output:
```
test_api.py::test_health           PASSED
test_api.py::test_root             PASSED
test_api.py::test_parse_txt_summary   PASSED
test_api.py::test_parse_txt_entities  PASSED
test_api.py::test_parse_txt_classify  PASSED
5 passed in 37.77s
```

---

## 📊 Model Performance

| Task | Model | Metric | Score |
|------|-------|--------|-------|
| Summarization | BART-large-CNN | ROUGE-L | 0.41 |
| NER | spaCy en_core_web_sm | F1 | 0.85 |
| Classification | BART-large-MNLI | Accuracy | 0.87 |
| Embeddings | all-MiniLM-L6-v2 | Cosine Sim | 0.79 |

---

## 👥 Developer

| Name | GitHub |
|------|--------|
| Diksha Sharma | [@deeksha27sharma](https://github.com/deeksha27sharma) |

> Solo project — designed, built and deployed independently.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [HuggingFace](https://huggingface.co) for pre-trained transformer models
- [Facebook AI Research](https://ai.meta.com) for the BART model
- [Explosion AI](https://explosion.ai) for spaCy
- [LangChain](https://langchain.com) for RAG framework
- [FastAPI](https://fastapi.tiangolo.com) for the API framework

---

<div align="center">
  <strong>Built as a Final Year CSE Project</strong><br/>
  Star ⭐ this repo if you found it useful!
</div>
