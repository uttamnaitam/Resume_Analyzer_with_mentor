# OpenRouter API Integration Setup Guide

This guide will walk you through the steps to set up OpenRouter API integration for your Resume Analyzer project.

## 1. API Key Setup

Your OpenRouter API key is:

```
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
```

### Steps to store your API key:

1. Create a file named `.env.local` in the root of your project
2. Add the following line to the file:
   ```
   OPENROUTER_API_KEY=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
   ```
3. Save the file
4. Restart your development server if it's running

⚠️ **Important**: Never commit your `.env.local` file to version control! It should be listed in your `.gitignore` file.

## 2. Integration Overview

The integration is set up as follows:

1. **API Key**: Stored in `.env.local`
2. **API Client**: Uses axios to make requests to OpenRouter
3. **Model**: Uses `mistralai/mistral-7b-instruct:free` (free tier)
4. **Implementation**:
   - `app/ai/flows/resume-analyzer.ts` - Main API integration
   - `app/api/analyze/route.ts` - Modified to include AI analysis
   - `app/analysis/results/page.tsx` - Updated to display AI results

## 3. Testing the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Upload a resume for analysis at http://localhost:3000/analyze

3. After analysis, you should see an "AI Resume Analysis" section with detailed feedback from Mistral AI

## 4. Troubleshooting

- **Check API Key**: Ensure your API key is correctly set in `.env.local`
- **Restart Server**: Changes to `.env.local` require a server restart
- **Check Console**: Look for errors in the browser console or server logs
- **Rate Limits**: Be aware of OpenRouter's rate limits for the free tier
- **Model Availability**: If the model is unavailable, the app will fall back to basic analysis

## 5. Further Customization

You can modify the system prompt in `app/ai/flows/resume-analyzer.ts` to customize the AI analysis:

```javascript
{
  role: 'system',
  content: 'You are an expert resume analyzer. Give detailed feedback on resumes, including strengths, weaknesses, and improvements.',
}
```

Adjust this prompt to focus on specific aspects of resume analysis or to change the tone and style of feedback.

## 6. Credits

- OpenRouter: https://openrouter.ai/
- Mistral AI: https://mistral.ai/
