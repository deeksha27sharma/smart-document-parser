# 📄 Resume Analyzer

An AI-powered resume screening tool that compares a resume against a job description using NLP techniques — TF-IDF cosine similarity, spaCy Named Entity Recognition, and heuristic skill gap analysis. Built with Streamlit, scikit-learn, spaCy, NLTK, and Plotly.

---

## Features

| Feature | Details |
|---|---|
| **Match Score** | TF-IDF cosine similarity between resume and JD |
| **Composite Rating** | Blends cosine score (40%) + skill match rate (60%) for a human-readable label |
| **Skill Gap Analysis** | Matches 102 skills (87 hard, 15 soft) across match / partial / gap tiers |
| **ATS Compatibility** | 9-check heuristic scorer, max 85/100 by design |
| **Named Entity Recognition** | spaCy NER extracts companies, locations, dates, salary mentions |
| **TF-IDF Keywords** | Top 16 weighted terms highlighted across both documents |
| **Course Recommendations** | 16 pre-linked courses for gap skills; search fallback for unmapped gaps |
| **File Support** | PDF (PyPDF2 → PyMuPDF fallback), DOCX, TXT |

---

## Quick Start

```bash
# 1. Clone / download the project
cd just_checking

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download the spaCy English model
python -m spacy download en_core_web_sm

# 4. Run
streamlit run app.py
```

The app opens at `http://localhost:8501` in your browser.

---

## Project Structure

```
just_checking/
│
├── app.py                  # Entry point — page config, sidebar, pipeline orchestration
│
├── core/                   # Pure Python logic — zero Streamlit imports
│   ├── extractor.py        # File → plain text  (PDF / DOCX / TXT)
│   ├── preprocessor.py     # NLP resource loader + text cleaning pipeline
│   └── analyzer.py         # All scoring: similarity, NER, skill gap, ATS, courses
│
├── ui/                     # Presentation layer — all st.* calls live here
│   ├── components.py       # One render function per UI section
│   ├── charts.py           # Plotly figure factories (donut, radar, bar)
│   └── styles.py           # Custom CSS injected once at startup
│
├── data/
│   └── constants.py        # SKILL_CORPUS, COURSE_DB, sample resume & JD fixtures
│
├── requirements.txt
└── README.md
```

---

## How It Works

### 1. Ingest & Parse
The uploaded file is read as raw bytes and routed by extension to the appropriate parser in `core/extractor.py`. PDFs are attempted with PyPDF2 first; if that yields no text, PyMuPDF is tried as a fallback. DOCX files are parsed with python-docx. All parsers catch exceptions individually so a failure in one doesn't crash the pipeline.

### 2. Preprocessing
`core/preprocessor.py` runs the text through a standard NLP cleaning pipeline: lowercase → strip non-alphanumeric characters → remove NLTK stopwords → lemmatise with WordNetLemmatizer. The result is a clean token string ready for vectorisation. NLP resources (spaCy model, NLTK corpora) are loaded once and cached by Streamlit's `@st.cache_resource`.

### 3. TF-IDF Cosine Similarity
Both the resume and JD are vectorised using scikit-learn's `TfidfVectorizer` with bigram range `(1, 2)` and 5,000 max features. Cosine similarity between the two document vectors produces the raw match score. If scikit-learn is unavailable, a Jaccard set-overlap score is used as a fallback.

### 4. Skill Gap Analysis
`extract_skills()` scans text for any of the 102 skills in `SKILL_CORPUS` using whole-word regex matching. `compute_skill_gap()` then classifies each JD-required skill as:
- **Match** — exact skill present in resume
- **Partial** — one is a substring of the other (e.g. `"nlp"` ↔ `"natural language processing"`)
- **Gap** — skill required by JD but absent from resume

### 5. Composite Score & Rating Label
Because TF-IDF cosine similarity on short documents is often misleadingly low, the human-readable label (Strong / Good / Needs Work) uses a composite score:

```
composite = cosine_similarity × 0.4 + skill_match_rate × 0.6
```

One hard rule overrides the composite: **if gap count = 0, the label is always "Strong match"** regardless of cosine score.

### 6. ATS Compatibility Score
Nine heuristic checks with a **maximum score of 85/100** by design — reflecting that a perfect ATS score is unrealistic in practice. Each check has three point tiers (full / partial / zero):

| Check | Max pts | What it measures |
|---|---|---|
| Contact information | 10 | Email and phone present |
| Section headers | 12 | Standard section keywords (Education, Experience, Skills…) |
| Keyword density | 18 | % of JD skills found in resume |
| Quantified results | 12 | Numeric metrics (%, $, K, M, ×) |
| Resume length | 10 | Ideal range 300–700 words |
| Action verbs | 8 | Built, led, reduced, launched… |
| No filler phrases | 5 | Absence of clichés (team player, guru, ninja…) |
| Date consistency | 5 | Year/month dates present for timeline clarity |
| No tables / graphics | 5 | Plain text layout, no column/table markers |

### 7. Course Recommendations
Gap skills are matched against 16 pre-linked courses in `COURSE_DB` using substring matching. Skills that have no COURSE_DB entry are shown as a fallback row with direct search links to Coursera and Udemy — gaps are never silently dropped.

---

## Architecture Principles

| Principle | How it's applied |
|---|---|
| **Separation of concerns** | `core/` (logic), `ui/` (presentation), `data/` (constants) never cross-import downward |
| **Type hints** | All public function signatures use PEP 484 annotations |
| **Structured logging** | `logging` module throughout — no bare `print()` calls |
| **Graceful degradation** | PyMuPDF, scikit-learn, spaCy are all optional; the pipeline degrades without crashing |
| **Testability** | Every function in `core/` is pure (no side-effects, no Streamlit) — unit-testable in isolation |
| **Single responsibility** | Each module has one clearly stated job declared in its docstring |
| **Honest scoring** | ATS ceiling is 85, not 100; composite score is used for labels, not raw cosine |

---

## Extending the Project

### Add a new skill
Open `data/constants.py` and add one line to `SKILL_CORPUS`:
```python
"dask": "hard",
```
No other file needs to change. The skill is automatically picked up by extraction, gap analysis, and the skill bar charts.

### Add a course
Open `data/constants.py` and add an entry to `COURSE_DB`:
```python
"dask": {
    "title": "Scalable Data Processing with Dask",
    "provider": "Udemy",
    "level": "Intermediate",
    "hours": 10,
    "url": "https://www.udemy.com",
},
```
The key should match the skill name in `SKILL_CORPUS`.

### Add an ATS check
Open `core/analyzer.py`. Add an entry to `_ATS_CHECKS` with full / partial / zero point values, then add the check logic inside `compute_ats_score()` using the `_add()` helper. The UI renders checks dynamically — nothing in `ui/` needs to change.

---

## Dependencies

| Package | Purpose |
|---|---|
| `streamlit` | Web UI framework |
| `spacy` + `en_core_web_sm` | Named Entity Recognition |
| `nltk` | Stopwords, lemmatisation |
| `scikit-learn` | TF-IDF vectorisation, cosine similarity |
| `plotly` | Interactive charts |
| `PyPDF2` | PDF text extraction (primary) |
| `PyMuPDF` | PDF text extraction (fallback) |
| `python-docx` | DOCX parsing |

---

## Known Limitations

- **Cosine similarity is sensitive to document length.** Short resumes and JDs produce lower scores because TF-IDF vectors are sparse. The composite score compensates for this but does not eliminate it.
- **Skill matching is keyword-based.** Synonyms not in `SKILL_CORPUS` are missed. For example, `"Postgres"` is not matched to `"postgresql"` unless both variants are added.
- **ATS scoring is heuristic.** Real ATS systems vary widely. The 9 checks here represent common best-practices, not the behaviour of any specific product.
- **PDF parsing quality depends on the PDF.** Scanned PDFs (images of text) will yield no text without an OCR layer, which is not included.
