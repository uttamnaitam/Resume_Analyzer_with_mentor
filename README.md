# Resume Analyzer

A modern web application that helps users analyze and improve their resumes using AI-powered insights and recommendations.

## Features

- **Resume Analysis**

  - ATS Compatibility Check
  - Keyword Match Analysis
  - Content Quality Assessment
  - Grammar & Style Review
  - Impact Statement Analysis
  - Word Count and Readability Metrics

- **Interactive Dashboard**

  - Overall Resume Score
  - Detailed Section Scores
  - Priority-based Improvement Suggestions
  - Visual Progress Indicators

- **Export Options**

  - PDF Report Generation
  - DOCX Export Support
  - Online Resume Sharing

- **AI-Powered Features**
  - Smart Content Recommendations
  - Industry-specific Keyword Suggestions
  - Writing Style Improvements
  - Chat with AI Mentor
  - Advanced AI Resume Analysis via OpenRouter API
  - ML-Powered Resume Analysis (Python Pipeline)

## Tech Stack

- **Frontend**

  - Next.js 14 (App Router)
  - React
  - TypeScript
  - Tailwind CSS
  - Shadcn UI Components
  - Lucide Icons

- **Backend**

  - Next.js API Routes
  - Prisma ORM
  - NextAuth.js
  - PDFKit
  - docx
  - OpenRouter API (Mistral AI model)

- **ML Pipeline (Python)**

  - spaCy for NLP processing
  - pdfminer.six & docx2txt for parsing
  - scikit-learn for ML components
  - TF-IDF vectorization
  - Logistic Regression classification
  - python-shell for Node.js integration

- **Authentication**
  - NextAuth.js with Credentials Provider
  - JWT Session Handling

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A local or remote database (PostgreSQL recommended)
- Python 3.8+ (for ML pipeline)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/resume-analyzer.git
cd resume-analyzer
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:

```env
DATABASE_URL="your-database-url"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
OPENROUTER_API_KEY="your-openrouter-api-key"
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. (Optional) Set up the Python ML pipeline:
   See the [Python Setup Guide](PYTHON_SETUP.md) for detailed instructions.

### Development

To run the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

1. Build the application:

```bash
npm run build
# or
yarn build
```

2. Start the production server:

```bash
npm run start
# or
yarn start
```

The production build will be available at the URL specified in your `NEXTAUTH_URL` environment variable.

## ML Pipeline (Python)

The application includes an advanced ML-powered resume analysis pipeline built with Python:

### Features

- PDF and DOCX parsing with pdfminer.six and docx2txt
- NLP processing with spaCy
- Skill and keyword extraction with PhraseMatcher
- Education and experience detection
- Multi-component scoring system
- Resume classification with ML

### Setup

See the [Python Setup Guide](PYTHON_SETUP.md) for complete installation instructions.

To enable the ML pipeline in the UI:

1. Complete the Python setup
2. In the resume upload page, check the "Use ML-Powered Analysis" option

### Architecture

The Python pipeline integrates with Next.js through a dedicated API route:

```
Client → /api/python-analyze → python-shell → Python ML Pipeline → Analysis Results
```

### Output

The pipeline provides comprehensive analysis including:

- Overall and component scores
- Extracted skills and education
- Missing skills and recommendations
- ML-based resume classification

## OpenRouter AI Integration

The application uses OpenRouter API with Mistral 7B for enhanced resume analysis. To set up:

1. Create an account at [OpenRouter](https://openrouter.ai/)
2. Generate an API key
3. Add the key to your `.env.local` file as `OPENROUTER_API_KEY`

This integration provides:

- More detailed resume feedback
- Natural language suggestions
- Industry-specific recommendations
- Customized improvement areas

Example usage:

```javascript
// This is automatically used in the resume analysis process
import { analyzeResume } from "@/app/ai/flows/resume-analyzer";

// Get AI-powered analysis
const analysis = await analyzeResume(resumeText);
```
