import os
import re
import spacy
import numpy as np
from spacy.matcher import PhraseMatcher
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import time
import json
import sys

# Load spaCy model with necessary components for our analysis
try:
    # We need the parser for noun_chunks, but can disable other components for performance
    nlp = spacy.load("en_core_web_sm", disable=["ner", "textcat"])
except:
    # If model not installed, download it
    import subprocess
    subprocess.call(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm", disable=["ner", "textcat"])

class ResumeAnalyzer:
    def __init__(self):
        self.nlp = nlp
        # Common skills dictionary organized by domain
        self.skills_dict = {
            "programming_languages": [
                "Python", "Java", "JavaScript", "C++", "C#", "Go", "Ruby", "PHP", 
                "Swift", "Kotlin", "TypeScript", "Scala", "R", "Rust", "MATLAB"
            ],
            "web_development": [
                "React", "Angular", "Vue.js", "Node.js", "Express", "Django", "Flask",
                "HTML", "CSS", "Next.js", "Redux", "jQuery", "Bootstrap", "Tailwind CSS",
                "REST API", "GraphQL", "WebSockets", "Webpack", "Babel"
            ],
            "databases": [
                "SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Oracle", "Redis",
                "DynamoDB", "Firebase", "Cassandra", "ElasticSearch", "Neo4j"
            ],
            "devops": [
                "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Jenkins",
                "Git", "GitHub", "Linux", "Bash", "Terraform", "Ansible", "Nginx"
            ],
            "data_science": [
                "Machine Learning", "Deep Learning", "Data Analysis", "Data Visualization",
                "Pandas", "NumPy", "SciPy", "Scikit-learn", "TensorFlow", "PyTorch",
                "Keras", "NLP", "Computer Vision", "Statistics", "A/B Testing"
            ],
            "soft_skills": [
                "Communication", "Teamwork", "Problem Solving", "Critical Thinking",
                "Project Management", "Leadership", "Time Management", "Adaptability"
            ]
        }
        
        # Flatten skills list for easier matching
        self.all_skills = []
        for skill_group in self.skills_dict.values():
            self.all_skills.extend(skill_group)
        
        # Initialize PhraseMatcher
        self.skill_matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
        # Add skills patterns to matcher
        skill_patterns = [nlp.make_doc(skill.lower()) for skill in self.all_skills]
        self.skill_matcher.add("SKILLS", None, *skill_patterns)
    
    def parse_resume_text(self, text):
        """
        Process raw resume text into a structured format
        """
        # Set a maximum text length to process (50,000 characters should be enough for most resumes)
        MAX_TEXT_LENGTH = 50000
        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH]
        
        # Clean the text
        text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with single space
        text = text.strip()
        
        # Process with spaCy
        doc = nlp(text)
        
        # Extract sections (basic approach - can be enhanced)
        sections = {}
        current_section = "header"
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check for common section headers
            line_lower = line.lower()
            if re.match(r'^(education|experience|work|skills|projects|publications|certifications|references|summary|objective)', line_lower):
                current_section = line_lower.split()[0]
                sections[current_section] = []
            else:
                if current_section not in sections:
                    sections[current_section] = []
                sections[current_section].append(line)
        
        return {
            "full_text": text,
            "sections": sections,
            "doc": doc
        }
    
    def extract_skills(self, doc):
        """
        Extract skills from resume text using spaCy PhraseMatcher
        """
        # Add a timeout mechanism
        start_time = time.time()
        MAX_PROCESSING_TIME = 10  # 10 seconds max
        
        skills_found = set()
        matches = self.skill_matcher(doc)
        
        for match_id, start, end in matches:
            skill = doc[start:end].text
            # Map back to canonical form (proper casing)
            skill_lower = skill.lower()
            for original_skill in self.all_skills:
                if original_skill.lower() == skill_lower:
                    skills_found.add(original_skill)
                    break
            
            # Check for timeout
            if time.time() - start_time > MAX_PROCESSING_TIME:
                break
        
        # Safely extract skill mentions from noun chunks with timeout
        try:
            if time.time() - start_time <= MAX_PROCESSING_TIME:
                skill_lower_set = {s.lower() for s in self.all_skills}
                for chunk in doc.noun_chunks:
                    chunk_text = chunk.text.lower()
                    # Direct match only for better performance
                    for skill in self.all_skills:
                        if skill.lower() == chunk_text and len(skill) > 2:
                            skills_found.add(skill)
                            
                    # Check for timeout
                    if time.time() - start_time > MAX_PROCESSING_TIME:
                        break
        except Exception as e:
            print(f"Warning: Error processing noun chunks: {e}", file=sys.stderr)
            # If noun_chunks fails, try a simpler word-based approach
            if time.time() - start_time <= MAX_PROCESSING_TIME:
                for token in doc:
                    token_text = token.text.lower()
                    if token_text in skill_lower_set and len(token_text) > 2:
                        for skill in self.all_skills:
                            if skill.lower() == token_text:
                                skills_found.add(skill)
                                break
                    
                    # Check for timeout
                    if time.time() - start_time > MAX_PROCESSING_TIME:
                        break
        
        return list(skills_found)
    
    def extract_education(self, doc):
        """
        Extract education details from resume
        """
        education = []
        degrees = ["Bachelor", "Master", "PhD", "Associate", "B.S.", "M.S.", "Ph.D.", "B.A.", "M.A.", "M.B.A.", "BSc", "MSc", "MBA", "B.Com", "M.Com", "B.Tech", "M.Tech", "B.E.", "M.E.", "B.C.A.", "M.C.A.", "B.Sc.", "M.Sc.", "B.A.L.L.B.", "M.A.L.L.B.", "B.A.L.L.M.", "M.A.L.L.M."]
        universities = []
        
        # Look for degrees and universities
        for ent in doc.ents:
            if ent.label_ == "ORG":
                universities.append(ent.text)
            elif ent.label_ == "PERSON":
                continue
            else:
                # Check if any degree is mentioned
                for degree in degrees:
                    if degree.lower() in ent.text.lower():
                        education.append(ent.text)
                        break
        
        # Look for education in noun chunks
        for chunk in doc.noun_chunks:
            for degree in degrees:
                if degree.lower() in chunk.text.lower():
                    education.append(chunk.text)
                    break
        
        # Get highest degree
        highest_degree = "None"
        degree_level = {"Associate": 1, "Bachelor": 2, "B.S.": 2, "B.A.": 2, "BSc": 2, 
                        "Master": 3, "M.S.": 3, "M.A.": 3, "MSc": 3, "MBA": 3, "M.B.A.": 3,
                        "PhD": 4, "Ph.D.": 4, "B.Com": 2, "M.Com": 3, "B.Tech": 2, "M.Tech": 3, "B.E.": 2, "M.E.": 3, "B.C.A.": 2, "M.C.A.": 3, "B.Sc.": 2, "M.Sc.": 3, "B.A.L.L.B.": 2, "M.A.L.L.B.": 3, "B.A.L.L.M.": 2, "M.A.L.L.M.": 3}
        
        highest_level = 0
        for edu in education:
            for degree, level in degree_level.items():
                if degree.lower() in edu.lower() and level > highest_level:
                    highest_degree = degree
                    highest_level = level
        
        return {
            "institutions": universities,
            "degrees": education,
            "highest_degree": highest_degree,
            "highest_level": highest_level
        }
    
    def extract_experience(self, doc, sections):
        """
        Extract years of experience from resume
        """
        experience_years = 0
        experience_text = ""
        
        # Look for experience section
        for section_name, content in sections.items():
            if "experience" in section_name or "work" in section_name:
                experience_text = " ".join(content)
        
        if not experience_text:
            experience_text = doc.text
        
        # Look for years or duration patterns
        year_patterns = [
            r'(\d+)[\+]?\s*years?',  # e.g., "5 years", "5+ years"
            r'(\d{4})\s*-\s*(\d{4}|\bpresent\b|\bcurrent\b)',  # e.g., "2018 - 2021", "2018 - present"
            r'(\d{4})\s*to\s*(\d{4}|\bpresent\b|\bcurrent\b)',  # e.g., "2018 to 2021"
        ]
        
        current_year = 2024  # Use current year for 'present' calculations
        
        for pattern in year_patterns:
            matches = re.finditer(pattern, experience_text, re.IGNORECASE)
            for match in matches:
                if match.group(1).isdigit() and len(match.groups()) == 1:
                    # Direct year mention, e.g., "5 years"
                    experience_years += int(match.group(1))
                elif len(match.groups()) >= 2:
                    # Date range, e.g., "2018 - 2021"
                    start_year = int(match.group(1))
                    if match.group(2).isdigit():
                        end_year = int(match.group(2))
                    else:
                        # "present" or "current"
                        end_year = current_year
                    
                    years = end_year - start_year
                    if years > 0:
                        experience_years += years
        
        # Cap at reasonable maximum
        experience_years = min(experience_years, 30)
        
        return experience_years
    
    def calculate_skills_match(self, resume_skills, job_skills):
        """
        Calculate match percentage for skills
        """
        if not job_skills:
            return {
                "percentage": 100,
                "matched_skills": resume_skills,
                "missing_skills": [],
                "is_match": True
            }
            
        matched_skills = [skill for skill in resume_skills if skill in job_skills]
        missing_skills = [skill for skill in job_skills if skill not in resume_skills]
        
        if len(job_skills) == 0:
            match_percentage = 100
        else:
            match_percentage = (len(matched_skills) / len(job_skills)) * 100
        
        return {
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "percentage": match_percentage,
            "is_match": len(missing_skills) == 0
        }
    
    def calculate_education_match(self, education, required_degree):
        """
        Calculate match percentage for education
        """
        # Define degree levels for comparison
        degree_level = {
            "None": 0,
            "High School": 1,
            "Associate": 2, 
            "Bachelor": 3, 
            "Master": 4, 
            "PhD": 5
        }
        
        # Get highest degree level from resume
        resume_degree_level = education.get("highest_level", 0)
        
        # Get required degree level
        required_degree_level = degree_level.get(required_degree, 0)
        
        if resume_degree_level >= required_degree_level:
            match_percentage = 100
        else:
            # Calculate percentage based on how close the resume is to required education
            match_percentage = (resume_degree_level / required_degree_level * 100) if required_degree_level > 0 else 100
        
        return {
            "resume_degree": education.get("highest_degree", "None"),
            "required_degree": required_degree,
            "percentage": match_percentage,
            "is_match": resume_degree_level >= required_degree_level
        }
    
    def calculate_experience_match(self, resume_years, required_years):
        """
        Calculate match percentage for experience
        """
        # Extract the years value from the experience dict if it's a dict
        if isinstance(resume_years, dict) and 'years' in resume_years:
            resume_years = resume_years['years']
            
        if resume_years >= required_years:
            match_percentage = 100
        else:
            # Calculate percentage based on how close the resume is to required experience
            match_percentage = min(100, (resume_years / required_years * 100)) if required_years > 0 else 100
        
        return {
            "resume_years": resume_years,
            "required_years": required_years,
            "percentage": match_percentage,
            "is_match": resume_years >= required_years
        }
    
    def calculate_relevance_score(self, resume_text, job_description):
        """
        Calculate relevance score between resume and job description using TF-IDF and cosine similarity
        """
        if not job_description:
            return {
                "percentage": 100,
                "relevance": "high"
            }
            
        # Set a timeout for this operation
        start_time = time.time()
        MAX_PROCESSING_TIME = 5  # 5 seconds timeout
        
        try:
            # Prepare texts
            resume_text = resume_text.lower()
            job_description = job_description.lower()
            
            # Create corpus
            corpus = [resume_text, job_description]
            
            # Create TF-IDF vectors (with limited features for speed)
            vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
            tfidf_matrix = vectorizer.fit_transform(corpus)
            
            # Check for timeout
            if time.time() - start_time > MAX_PROCESSING_TIME:
                return {
                    "percentage": 50,  # Default value
                    "relevance": "medium",
                    "error": "Processing timeout"
                }
            
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            # Convert to percentage
            percentage = similarity * 100
            
            # Determine relevance category
            if percentage >= 75:
                relevance = "high"
            elif percentage >= 50:
                relevance = "medium"
            else:
                relevance = "low"
                
            return {
                "percentage": percentage,
                "relevance": relevance
            }
        except Exception as e:
            return {
                "percentage": 50,  # Default value
                "relevance": "medium",
                "error": str(e)
            }
    
    def analyze_resume(self, resume_text, job_description=None, required_skills=None, required_experience=0, required_degree="None"):
        """
        Analyze a resume text and return detailed assessment
        
        Args:
            resume_text: Text of the resume
            job_description: Optional job description to match against
            required_skills: List of required skills for the job
            required_experience: Required years of experience
            required_degree: Required education level
            
        Returns:
            Dictionary with analysis results
        """
        # Set maximum processing time for the entire analysis
        MAX_TOTAL_TIME = 30  # 30 seconds max
        start_total_time = time.time()
        
        # Create basic result structure
        result = {
            "extracted_data": {},
            "match_details": {},
            "match_summary": {},
            "suggestions": []
        }
        
        # Step 1: Parse the resume (20% progress)
        try:
            print(json.dumps({"progress": 20}), flush=True)  # Report progress
            parsed_resume = self.parse_resume_text(resume_text)
        except Exception as e:
            return {"error": f"Error parsing resume: {str(e)}"}
        
        if time.time() - start_total_time > MAX_TOTAL_TIME:
            return {"error": "Analysis timeout: Resume parsing took too long"}
        
        # Step 2: Extract skills (40% progress)
        try:
            print(json.dumps({"progress": 40}), flush=True)  # Report progress
            skills = self.extract_skills(parsed_resume["doc"])
            result["extracted_data"]["skills"] = skills
        except Exception as e:
            return {"error": f"Error extracting skills: {str(e)}"}
        
        if time.time() - start_total_time > MAX_TOTAL_TIME:
            return {"error": "Analysis timeout: Skills extraction took too long"}
        
        # Step 3: Extract education (60% progress)
        try:
            print(json.dumps({"progress": 60}), flush=True)  # Report progress
            education = self.extract_education(parsed_resume["doc"])
            result["extracted_data"]["education"] = education
        except Exception as e:
            return {"error": f"Error extracting education: {str(e)}"}
        
        if time.time() - start_total_time > MAX_TOTAL_TIME:
            return {"error": "Analysis timeout: Education extraction took too long"}
        
        # Step 4: Extract experience (70% progress)
        try:
            print(json.dumps({"progress": 70}), flush=True)  # Report progress
            experience = self.extract_experience(parsed_resume["doc"], parsed_resume["sections"])
            result["extracted_data"]["experience"] = experience
        except Exception as e:
            return {"error": f"Error extracting experience: {str(e)}"}
        
        if time.time() - start_total_time > MAX_TOTAL_TIME:
            return {"error": "Analysis timeout: Experience extraction took too long"}
        
        # Step 5: Calculate match metrics if job requirements provided (80% progress)
        try:
            print(json.dumps({"progress": 80}), flush=True)  # Report progress
            if job_description or required_skills or required_experience > 0 or required_degree != "None":
                # Calculate skills match
                if required_skills:
                    skills_match = self.calculate_skills_match(skills, required_skills)
                    result["match_details"]["skills_match"] = skills_match
                
                # Calculate education match
                if required_degree != "None":
                    education_match = self.calculate_education_match(education, required_degree)
                    result["match_details"]["education_match"] = education_match
                
                # Calculate experience match
                if required_experience > 0:
                    experience_match = self.calculate_experience_match(experience, required_experience)
                    result["match_details"]["experience_match"] = experience_match
                
                # Calculate relevance score from job description
                if job_description:
                    relevance = self.calculate_relevance_score(resume_text, job_description)
                    result["match_details"]["relevance_score"] = relevance
        except Exception as e:
            return {"error": f"Error calculating matches: {str(e)}"}
        
        if time.time() - start_total_time > MAX_TOTAL_TIME:
            return {"error": "Analysis timeout: Match calculation took too long"}
        
        # Step 6: Generate match summary and suggestions (90% progress)
        try:
            print(json.dumps({"progress": 90}), flush=True)  # Report progress
            # Calculate overall match score
            match_scores = []
            if "skills_match" in result.get("match_details", {}):
                match_scores.append(result["match_details"]["skills_match"]["percentage"])
            if "education_match" in result.get("match_details", {}):
                match_scores.append(result["match_details"]["education_match"]["percentage"])
            if "experience_match" in result.get("match_details", {}):
                match_scores.append(result["match_details"]["experience_match"]["percentage"])
            if "relevance_score" in result.get("match_details", {}):
                match_scores.append(result["match_details"]["relevance_score"]["percentage"])
            
            if match_scores:
                overall_match = sum(match_scores) / len(match_scores)
            else:
                overall_match = 0
            
            result["match_summary"] = {
                "overall_percentage": overall_match,
                "rating": "Excellent" if overall_match >= 90 else
                         "Very Good" if overall_match >= 80 else
                         "Good" if overall_match >= 70 else
                         "Average" if overall_match >= 60 else
                         "Below Average" if overall_match >= 50 else
                         "Poor"
            }
            
            # Generate suggestions
            suggestions = []
            if "skills_match" in result.get("match_details", {}) and result["match_details"]["skills_match"]["percentage"] < 70:
                missing_skills = result["match_details"]["skills_match"].get("missing_skills", [])
                if missing_skills:
                    suggestions.append({
                        "category": "Resume Improvements",
                        "items": [f"Add these missing skills if you have them: {', '.join(missing_skills)}"],
                        "priority": "Low"
                    })
            
            if "education_match" in result.get("match_details", {}) and result["match_details"]["education_match"]["percentage"] < 70:
                suggestions.append({
                    "category": "Education Improvements",
                    "items": [f"The job requires {required_degree} degree. Consider highlighting your education more prominently."],
                    "priority": "Medium"
                })
            
            if "experience_match" in result.get("match_details", {}) and result["match_details"]["experience_match"]["percentage"] < 70:
                suggestions.append({
                    "category": "Experience Improvements",
                    "items": [f"The job requires {required_experience} years of experience. Emphasize your relevant work history."],
                    "priority": "High"
                })
            
            result["suggestions"] = suggestions
        except Exception as e:
            return {"error": f"Error generating summaries: {str(e)}"}
        
        # Final progress update (100%)
        print(json.dumps({"progress": 100}), flush=True)
        
        return result

# Example usage:
# analyzer = ResumeAnalyzer()
# result = analyzer.analyze_resume(
#     resume_text=resume_text,
#     job_description="Job requiring Python and SQL skills...",
#     required_skills=["Python", "SQL", "AWS"],
#     required_experience=3,
#     required_degree="Bachelor"
# )
# print(result) 