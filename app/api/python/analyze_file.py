#!/usr/bin/env python3
import sys
import json
import os
import traceback

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the main analysis functions
from main import analyze_resume_from_file

def main():
    # Get the arguments file path from the command line
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Invalid arguments. Expected a path to JSON file."}))
        return
    
    try:
        # Read arguments from file
        args_file_path = sys.argv[1]
        
        # Normalize path to handle spaces and special characters
        args_file_path = os.path.normpath(args_file_path)
        
        print(f"Attempting to read arguments from: {args_file_path}", file=sys.stderr)
        
        # Check if file exists
        if not os.path.exists(args_file_path):
            print(json.dumps({
                "error": f"Arguments file not found: {args_file_path}",
                "cwd": os.getcwd()
            }))
            return
            
        # Read the file with proper encoding
        try:
            with open(args_file_path, 'r', encoding='utf-8') as f:
                args = json.load(f)
        except UnicodeDecodeError:
            # Try with different encoding if UTF-8 fails
            with open(args_file_path, 'r', encoding='latin-1') as f:
                args = json.load(f)
        
        # Extract the arguments
        file_path = args.get("file_path")
        file_type = args.get("file_type")
        job_description = args.get("job_description")
        required_skills = args.get("required_skills")
        required_experience = args.get("required_experience", 0)
        required_degree = args.get("required_degree", "None")
        
        # Check if file_path is provided
        if not file_path:
            print(json.dumps({"error": "File path is required."}))
            return
            
        # Normalize file path
        file_path = os.path.normpath(file_path)
        
        # Check if the file exists
        if not os.path.exists(file_path):
            print(json.dumps({
                "error": f"Resume file not found: {file_path}",
                "cwd": os.getcwd()
            }))
            return
        
        # Analyze the resume
        result = analyze_resume_from_file(
            file_path,
            file_type=file_type,
            job_description=job_description,
            required_skills=required_skills,
            required_experience=required_experience,
            required_degree=required_degree
        )
        
        # Print the result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "error": f"An error occurred: {str(e)}",
            "traceback": traceback.format_exc(),
            "cwd": os.getcwd(),
            "args_path": sys.argv[1] if len(sys.argv) > 1 else "No args path provided"
        }))

if __name__ == "__main__":
    main() 