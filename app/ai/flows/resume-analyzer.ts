import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function analyzeResume(resumeText: string) {
  try {
    console.log("Making request to OpenRouter API...");
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume analyzer. Provide detailed and structured feedback on the resume in the following format:\n\n1. OVERALL IMPRESSION: Brief overview of the resume.\n\n2. STRENGTHS: List 3-5 key strengths of the resume.\n\n3. AREAS FOR IMPROVEMENT: List 3-5 specific areas that need improvement.\n\n4. SECTION-BY-SECTION FEEDBACK:\n   - Header/Contact: Feedback on contact information and professional presence\n   - Professional Summary: Is it compelling? Does it highlight key qualifications?\n   - Work Experience: Analysis of job descriptions, achievements, metrics\n   - Skills: Are they relevant, comprehensive, and well-organized?\n   - Education: Is it properly formatted and relevant?\n   - Additional Sections: Comments on any other sections\n\n5. ATS COMPATIBILITY: Will this resume pass Applicant Tracking Systems?\n\n6. SPECIFIC RECOMMENDATIONS: Provide 3-5 actionable suggestions for improvement with examples.',
          },
          {
            role: 'user',
            content: `Analyze this resume:\n\n${resumeText}`,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
          'X-Title': 'Resume Analyzer' // Required by OpenRouter
        },
      }
    );
    
    console.log("OpenRouter API response received");
    
    // Debug response structure
    if (!response.data) {
      console.error("No data in API response");
      return "Unable to analyze resume. The AI service did not return any data.";
    }
    
    if (!response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
      console.error("No choices in API response", response.data);
      return "Unable to analyze resume. The AI service returned an unexpected response format.";
    }
    
    const firstChoice = response.data.choices[0];
    if (!firstChoice || !firstChoice.message || !firstChoice.message.content) {
      console.error("Invalid choice structure in API response", firstChoice);
      return "Unable to analyze resume. The AI analysis was incomplete.";
    }

    // Return the AI's analysis
    return firstChoice.message.content;
  } catch (error: any) {
    console.error('Error during resume analysis:', error.message);
    if (error.response) {
      console.error('API response error:', error.response.data);
      console.error('API response status:', error.response.status);
    }
    
    // Return a user-friendly error message instead of throwing
    return "We encountered an issue with the AI analysis. Here are some general resume improvement tips:\n\n" +
           "1. Quantify your achievements with specific metrics\n" +
           "2. Use strong action verbs to begin bullet points\n" +
           "3. Tailor your resume to match the job description\n" +
           "4. Ensure consistent formatting throughout\n" +
           "5. Proofread carefully for grammar and spelling errors";
  }
} 