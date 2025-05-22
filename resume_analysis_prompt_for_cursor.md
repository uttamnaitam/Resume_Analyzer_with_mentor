
# 📄 Cursor Prompt: Resume Analysis Pipeline (Full Implementation)

Use this prompt in Cursor to build a complete resume analysis algorithm based on the Resume Analysis Pipeline.

---

## ✅ Objective

**Build a complete resume analysis algorithm** to analyze a user's uploaded resume (PDF or DOCX), extract meaningful information, match it against a predefined job role, and return a score and insights.

---

## 🔧 Implementation Steps

### 🔹 1. Resume Parsing
- Accept and parse `.pdf` and `.docx` files.
- Use `pdfminer.six` for PDFs and `docx2txt` for Word files.
- Extract clean, structured raw text from the uploaded document.

### 🔹 2. NLP Processing
- Use **spaCy** for:
  - Tokenization
  - Named Entity Recognition (NER)
  - Noun chunk extraction
- Remove stopwords and punctuation.
- Return tokens, entities, and possible keywords.

### 🔹 3. Skill and Keyword Matching
- Define a sample job description with required skills (e.g., `["Python", "SQL", "Machine Learning", "React"]`).
- Match extracted resume keywords and phrases with the job's required skill list using spaCy’s `PhraseMatcher`.
- Calculate the **Jaccard similarity** between resume skills and job skills.

### 🔹 4. Scoring Mechanism
- Implement a scoring system:
  - **Skills Match** (60% weight)
  - **Years of Experience Match** (30% weight)
  - **Education Match** (10% weight)
- Use a function like:
  ```python
  def calculate_score(resume_skills, job_skills, resume_years, job_years, resume_degree, job_degree):
      ...
      return total_score
  ```

### 🔹 5. (Optional) ML Component
- Add a section to train a simple classification model (e.g., logistic regression) using sample labeled resumes.
- Use TF-IDF + `LogisticRegression` from scikit-learn to predict if a resume is a "good fit".

---

## 🛠️ Tech Stack
- Python
- Libraries: `pdfminer.six`, `docx2txt`, `spaCy`, `scikit-learn`, `pandas`, `TfidfVectorizer`, `PhraseMatcher`
- Modularize code for reusability: separate logic into functions or classes where appropriate.

---

## 📦 Output
- Return structured data:
  - Extracted skills
  - Named entities
  - Overall score (0–1)
  - Component-wise scores (skills, experience, education)
  - Feedback summary

---

**Implement this as a Python project/script, starting with parsing and ending with a complete scoring system. Make sure to include in-code comments and follow clean coding practices.**
