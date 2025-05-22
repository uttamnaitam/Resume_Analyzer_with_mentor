import os
import io
import json
import sys  # Import sys for writing to stderr
from resume_parser import parse_resume
from resume_analyzer import ResumeAnalyzer
from resume_classifier import ResumeClassifier

# Initialize the analyzer and classifier
analyzer = ResumeAnalyzer()
classifier = ResumeClassifier()

# Train the classifier with dummy data initially
classifier_metrics = classifier.train_with_dummy_data()
# Print to stderr instead of stdout to avoid interfering with JSON output
sys.stderr.write(f"Classifier trained with dummy data. Accuracy: {classifier_metrics['test_accuracy']:.2f}\n")
sys.stderr.flush()  # Ensure it's written immediately

def analyze_resume_from_file(file_path_or_object, file_type=None, job_description=None, required_skills=None, required_experience=0, required_degree="None"):
    """
    Process a resume file and return analysis results
    
    Args:
        file_path_or_object: Path to file or file-like object
        file_type: 'pdf' or 'docx' (optional)
        job_description: Optional job description to match against
        required_skills: List of required skills for the job
        required_experience: Required years of experience
        required_degree: Required education level
        
    Returns:
        Dictionary with analysis results
    """
    try:
        # Parse the resume file to extract text
        resume_text = parse_resume(file_path_or_object, file_type)
        
        if not resume_text:
            return {
                "error": "Could not extract text from the resume file."
            }
        
        # Analyze the resume using the analyzer
        analysis_results = analyzer.analyze_resume(
            resume_text=resume_text,
            job_description=job_description,
            required_skills=required_skills,
            required_experience=required_experience,
            required_degree=required_degree
        )
        
        # Classify the resume
        classification_results = classifier.predict(resume_text)
        
        # Combine results
        combined_results = {
            **analysis_results,
            "classification": classification_results
        }
        
        return combined_results
        
    except Exception as e:
        print(f"Error analyzing resume: {e}")
        return {
            "error": f"An error occurred during analysis: {str(e)}"
        }

def analyze_resume_from_text(resume_text, job_description=None, required_skills=None, required_experience=0, required_degree="None"):
    """
    Process resume text directly and return analysis results
    
    Args:
        resume_text: Text of the resume
        job_description: Optional job description to match against
        required_skills: List of required skills for the job
        required_experience: Required years of experience
        required_degree: Required education level
        
    Returns:
        Dictionary with analysis results
    """
    try:
        if not resume_text:
            return {
                "error": "Resume text is empty."
            }
        
        # Analyze the resume using the analyzer
        analysis_results = analyzer.analyze_resume(
            resume_text=resume_text,
            job_description=job_description,
            required_skills=required_skills,
            required_experience=required_experience,
            required_degree=required_degree
        )
        
        # Classify the resume
        classification_results = classifier.predict(resume_text)
        
        # Combine results
        combined_results = {
            **analysis_results,
            "classification": classification_results
        }
        
        return combined_results
        
    except Exception as e:
        print(f"Error analyzing resume: {e}")
        return {
            "error": f"An error occurred during analysis: {str(e)}"
        }

# Example usage:
if __name__ == "__main__":
    # Example with a file path
    # result = analyze_resume_from_file(
    #     "path/to/resume.pdf",
    #     job_description="Looking for a Python developer with experience in web development...",
    #     required_skills=["Python", "Django", "React", "SQL"],
    #     required_experience=3,
    #     required_degree="Bachelor"
    # )
    
    # Example with text
    example_resume = """
    John Doe
    Software Engineer
    
    EXPERIENCE
    Senior Software Engineer, ABC Tech (2018 - Present)
    - Developed web applications using Python, Django, and React
    - Implemented CI/CD pipelines and containerized applications using Docker
    - Led a team of 5 developers on a major project
    
    Software Developer, XYZ Inc. (2015 - 2018)
    - Built RESTful APIs and backend services
    - Worked with SQL databases and ORM frameworks
    - Collaborated with frontend team on UI/UX improvements
    
    EDUCATION
    Bachelor of Science in Computer Science, University of Technology (2011 - 2015)
    
    SKILLS
    Programming: Python, JavaScript, Java, SQL
    Frameworks: Django, Flask, React, Node.js
    Tools: Git, Docker, Kubernetes, AWS
    """
    
    result = analyze_resume_from_text(
        example_resume,
        job_description="Looking for a Python developer with experience in web development...",
        required_skills=["Python", "Django", "React", "SQL"],
        required_experience=3,
        required_degree="Bachelor"
    )
    
    print(json.dumps(result, indent=2)) 