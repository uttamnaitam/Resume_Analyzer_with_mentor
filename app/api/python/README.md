# Resume Analysis Pipeline

A comprehensive resume analysis pipeline built with Python that:

1. Parses resumes (PDF or DOCX)
2. Extracts structured information
3. Analyzes skills, experience, and education
4. Calculates match scores against job requirements
5. Provides actionable recommendations

## Features

- **Resume Parsing**: Extract text from PDF and DOCX files
- **NLP Processing**: Process text with spaCy for entity recognition
- **Skill Extraction**: Identify skills using PhraseMatcher
- **Scoring System**: Calculate match scores for skills, experience, and education
- **Machine Learning**: Classify resumes using a TF-IDF + Logistic Regression model
- **Recommendations**: Generate actionable recommendations to improve resume

## Installation

To install the required dependencies:

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

## Components

1. **resume_parser.py**: Parses PDF and DOCX files
2. **resume_analyzer.py**: Contains the main ResumeAnalyzer class
3. **resume_classifier.py**: ML component for resume classification
4. **main.py**: Entry point with example usage
5. **analyze_file.py**: Script for analyzing resume files
6. **analyze_text.py**: Script for analyzing resume text

## API Usage

The API can analyze resumes from either files or text:

### From File

```python
from main import analyze_resume_from_file

result = analyze_resume_from_file(
    file_path="path/to/resume.pdf",
    job_description="Job description text...",
    required_skills=["Python", "SQL", "React"],
    required_experience=3,
    required_degree="Bachelor"
)
```

### From Text

```python
from main import analyze_resume_from_text

result = analyze_resume_from_text(
    resume_text="Resume text content...",
    job_description="Job description text...",
    required_skills=["Python", "SQL", "React"],
    required_experience=3,
    required_degree="Bachelor"
)
```

## Output

The API returns a JSON object with the following structure:

```json
{
  "overall_score": 85,
  "component_scores": {
    "skills_match": 90,
    "experience_match": 80,
    "education_match": 100,
    "relevance": 75
  },
  "extracted_info": {
    "skills": ["Python", "SQL", "JavaScript", "React"],
    "categorized_skills": {
      "programming_languages": ["Python", "JavaScript"],
      "databases": ["SQL"],
      "web_development": ["React"]
    },
    "experience_years": 4,
    "education": {
      "institutions": ["University of Technology"],
      "degrees": ["Bachelor of Science in Computer Science"],
      "highest_degree": "Bachelor",
      "highest_level": 3
    }
  },
  "missing_skills": ["Node.js", "AWS"],
  "recommendations": [
    "Add missing skills: Node.js, AWS",
    "Highlight relevant work experience more clearly"
  ],
  "classification": {
    "prediction": "good_fit",
    "confidence": 0.85,
    "probabilities": {
      "good_fit": 0.85,
      "bad_fit": 0.15
    }
  }
}
```

## Integration with Next.js

This API is designed to be called from a Next.js API route. The integration is implemented in:

- `/app/api/python-analyze/route.ts`
