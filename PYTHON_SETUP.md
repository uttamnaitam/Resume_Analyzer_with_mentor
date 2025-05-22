# Setting Up the Resume Analysis Python Pipeline

This guide will walk you through setting up the Python-based resume analysis pipeline for the Resume Analyzer project.

## Prerequisites

- Python 3.8+ installed on your system
- Node.js and npm (already set up for the main project)
- pip (Python package manager)

## Installation Steps

### 1. Install Python Dependencies

Navigate to the Python API folder and install the required packages:

```bash
cd app/api/python
pip install -r requirements.txt
```

### 2. Download spaCy Language Model

After installing the Python dependencies, download the spaCy language model:

```bash
python -m spacy download en_core_web_sm
```

### 3. Install Node.js Dependencies

The project uses the `python-shell` package to communicate with the Python scripts. This dependency should have been installed when you ran:

```bash
npm install --save python-shell uuid --legacy-peer-deps
```

### 4. Create Temporary Directory

Create a temporary directory for file uploads:

```bash
mkdir temp
```

## Testing the Installation

To verify that the Python pipeline is working correctly:

### 1. Test the Python Scripts Directly

```bash
cd app/api/python
python main.py
```

This will run the example code in the `main.py` file and should output a JSON analysis of an example resume.

### 2. Test the Integration

Start the Next.js development server:

```bash
npm run dev
```

Then visit http://localhost:3000/analyze in your browser. Upload a resume, check the "Use ML-Powered Analysis" option, and submit. The resume should be analyzed using the Python pipeline.

## Folder Structure

- `app/api/python/` - Python scripts for resume analysis

  - `resume_analyzer.py` - Main analyzer class
  - `resume_parser.py` - PDF and DOCX parsing utilities
  - `resume_classifier.py` - ML classification component
  - `main.py` - Main entry point with utility functions
  - `analyze_file.py` - Script for analyzing resume files
  - `analyze_text.py` - Script for analyzing resume text
  - `requirements.txt` - Python dependencies

- `app/api/python-analyze/` - Next.js API route for the Python pipeline
  - `route.ts` - API endpoint that calls the Python scripts

## Customizing the Pipeline

### Modifying Skill Matching

To add or modify the recognized skills, edit the `skills_dict` in `resume_analyzer.py`.

### Adjusting Scoring Weights

To change how different components are weighted in the overall score, modify the weights in the `analyze_resume` method in `resume_analyzer.py`.

### Training with Custom Data

To train the classifier with your own data, create a new method in `resume_classifier.py` similar to `train_with_dummy_data` but using your custom dataset.

## Troubleshooting

### Python Not Found

If you encounter a "Python not found" error, make sure that Python is in your system PATH or modify the `pythonPath` option in `app/api/python-analyze/route.ts` to point to your Python installation.

### Import Errors

If you see import errors when running the Python scripts, make sure you've installed all the dependencies and that you're running the scripts from the correct directory.

### File Permissions

If you encounter file permission errors when reading or writing files, make sure that the application has the necessary permissions to access the directories.

## Next Steps

- Add more job role templates
- Improve skill detection with context
- Implement caching for better performance
- Add support for more file formats
