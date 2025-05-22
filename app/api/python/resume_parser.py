import os
import io
import re
import docx2txt
from pdfminer.high_level import extract_text
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfpage import PDFPage

def extract_text_from_pdf(pdf_path):
    """
    Extract text from PDF using pdfminer.six
    
    Args:
        pdf_path: Path to the PDF file or a file-like object
    
    Returns:
        Extracted text as string
    """
    try:
        # If pdf_path is a string (file path)
        if isinstance(pdf_path, str):
            return extract_text(pdf_path)
        
        # If pdf_path is a file-like object (e.g., BytesIO)
        else:
            resource_manager = PDFResourceManager()
            fake_file_handle = io.StringIO()
            converter = TextConverter(resource_manager, fake_file_handle, laparams=LAParams())
            page_interpreter = PDFPageInterpreter(resource_manager, converter)
            
            for page in PDFPage.get_pages(pdf_path, check_extractable=True):
                page_interpreter.process_page(page)
                
            text = fake_file_handle.getvalue()
            
            # Close resources
            converter.close()
            fake_file_handle.close()
            
            return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

def extract_text_from_docx(docx_path):
    """
    Extract text from DOCX file using docx2txt
    
    Args:
        docx_path: Path to the DOCX file or a file-like object
    
    Returns:
        Extracted text as string
    """
    try:
        # If docx_path is a string (file path)
        if isinstance(docx_path, str):
            return docx2txt.process(docx_path)
        
        # If docx_path is a file-like object
        else:
            temp_file = "temp_resume.docx"
            with open(temp_file, 'wb') as f:
                f.write(docx_path.read())
            
            text = docx2txt.process(temp_file)
            
            # Clean up
            if os.path.exists(temp_file):
                os.remove(temp_file)
                
            return text
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
        return ""

def clean_resume_text(text):
    """
    Clean and normalize the extracted resume text
    
    Args:
        text: Raw text extracted from resume
    
    Returns:
        Cleaned text
    """
    if not text:
        return ""
        
    # Replace multiple newlines with a single newline
    text = re.sub(r'\n+', '\n', text)
    
    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text)
    
    # Replace non-breaking spaces with regular spaces
    text = text.replace('\xa0', ' ')
    
    # Remove strange unicode characters
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    
    # Fix newlines around sections
    text = re.sub(r'([a-zA-Z])\n([a-zA-Z])', r'\1 \2', text)
    
    return text.strip()

def parse_resume(file_path_or_object, file_type=None):
    """
    Parse resume file (PDF or DOCX) and extract text
    
    Args:
        file_path_or_object: Path to file or file-like object
        file_type: 'pdf' or 'docx' (optional, detected from file_path if not provided)
    
    Returns:
        Extracted and cleaned text from resume
    """
    # Determine file type if not provided
    if not file_type and isinstance(file_path_or_object, str):
        file_path = file_path_or_object
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.pdf':
            file_type = 'pdf'
        elif file_extension in ['.docx', '.doc']:
            file_type = 'docx'
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
    
    # Extract text based on file type
    if file_type == 'pdf':
        raw_text = extract_text_from_pdf(file_path_or_object)
    elif file_type == 'docx':
        raw_text = extract_text_from_docx(file_path_or_object)
    else:
        raise ValueError("File type must be 'pdf' or 'docx'")
    
    # Clean and return the text
    return clean_resume_text(raw_text) 