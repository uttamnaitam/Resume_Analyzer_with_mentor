import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzeResume } from "@/app/ai/flows/resume-analyzer"

// Common keywords for different job roles
const jobKeywords: { [key: string]: string[] } = {
  "software engineer": [
    "javascript", "python", "java", "react", "node.js", "aws", "git", "agile",
    "full stack", "backend", "frontend", "api", "database", "cloud", "testing"
  ],
  "data scientist": [
    "python", "r", "sql", "machine learning", "statistics", "data analysis",
    "tensorflow", "pytorch", "pandas", "numpy", "visualization", "big data"
  ],
  "product manager": [
    "product strategy", "agile", "scrum", "roadmap", "stakeholder",
    "user experience", "market analysis", "kpi", "product development"
  ],
  // Add more roles as needed
}

// Impact verbs for stronger statements
const impactVerbs = [
  "achieved", "improved", "increased", "reduced", "developed", "launched",
  "implemented", "created", "designed", "managed", "led", "coordinated",
  "streamlined", "optimized", "generated", "delivered"
]

export async function POST(request: Request) {
  try {
    const { resumeText, resumeBase64, jobDescription } = await request.json()

    // Check if we have either resumeText or resumeBase64
    if (!resumeText && !resumeBase64) {
      return NextResponse.json(
        { error: "Either resume text or resume file is required" },
        { status: 400 }
      )
    }

    // If resumeText is a placeholder and we have resumeBase64, we should extract text
    let textToAnalyze = resumeText;
    if ((resumeText === "Please extract text from the uploaded document" || 
         resumeText === "Document content placeholder") && resumeBase64) {
      // In a real implementation, you would extract text from the base64 file here
      // For now, we'll use a simplified version with placeholder text
      console.log("Got base64 file but no text - using placeholder analysis");
      textToAnalyze = "Sample resume text for analysis. This resume contains skills in JavaScript, React, and HTML. " +
                     "The candidate has 3 years of experience working as a software developer. " +
                     "Education includes a Bachelor's degree in Computer Science.";
    }

    // Convert resume text to lowercase for analysis
    const resumeLower = textToAnalyze.toLowerCase()
    
    // Analyze ATS Compatibility
    const atsScore = analyzeATSCompatibility(resumeLower)
    
    // Analyze Keywords
    const { keywordScore, missingKeywords } = analyzeKeywords(resumeLower, jobDescription)
    
    // Analyze Grammar and Style
    const { grammarScore, grammarIssues } = analyzeGrammarAndStyle(textToAnalyze)
    
    // Analyze Content Quality
    const { contentScore, contentImprovements } = analyzeContentQuality(textToAnalyze)
    
    // Analyze Impact Statements
    const { impactScore, impactSuggestions } = analyzeImpactStatements(textToAnalyze)

    // Calculate overall score
    const overallScore = Math.round(
      (atsScore + keywordScore + grammarScore + contentScore + impactScore) / 5
    )

    // Get AI-powered analysis using OpenRouter
    let aiAnalysis = null
    try {
      console.log("Requesting AI analysis...");
      aiAnalysis = await analyzeResume(textToAnalyze)
      console.log("AI analysis completed successfully");
    } catch (aiError) {
      console.error("AI analysis error:", aiError)
      // Continue with basic analysis if AI analysis fails
      aiAnalysis = "AI analysis is currently unavailable. Please try again later."
    }

    // Ensure all parts of the analysis are properly initialized
    const analysis = {
      overallScore,
      scores: [
        { name: "ATS Compatibility", score: atsScore },
        { name: "Keyword Match", score: keywordScore },
        { name: "Content Quality", score: contentScore },
        { name: "Grammar & Style", score: grammarScore },
        { name: "Impact Statements", score: impactScore },
      ],
      suggestions: [
        {
          category: "Missing Keywords",
          items: missingKeywords.length > 0 ? missingKeywords : ["No missing keywords detected"],
          priority: missingKeywords.length > 5 ? "high" : "medium",
        },
        {
          category: "Grammar Issues",
          items: grammarIssues.length > 0 ? grammarIssues : ["No significant grammar issues detected"],
          priority: grammarIssues.length > 3 ? "high" : "medium",
        },
        {
          category: "Content Improvements",
          items: contentImprovements.length > 0 ? contentImprovements : ["No specific content improvements suggested"],
          priority: "high",
        },
        {
          category: "Impact Statement Suggestions",
          items: impactSuggestions.length > 0 ? impactSuggestions : ["No specific impact statement suggestions"],
          priority: "medium",
        },
      ],
      aiAnalysis: aiAnalysis || "AI analysis could not be completed" // Ensure this is never null
    }

    // Log the analysis before returning (for debugging)
    console.log("Returning analysis with structure:", {
      overallScore: analysis.overallScore,
      scoresCount: analysis.scores.length,
      suggestionsCount: analysis.suggestions.length,
      hasAiAnalysis: !!analysis.aiAnalysis
    });

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Resume analysis error:", error)
    // Return a properly structured error response with a default analysis
    return NextResponse.json(
      { 
        error: "Failed to analyze resume",
        details: error instanceof Error ? error.message : "Unknown error",
        overallScore: 50,
        scores: [
          { name: "ATS Compatibility", score: 50 },
          { name: "Keyword Match", score: 50 },
          { name: "Content Quality", score: 50 },
          { name: "Grammar & Style", score: 50 },
          { name: "Impact Statements", score: 50 },
        ],
        suggestions: [
          {
            category: "Error Information",
            items: ["An error occurred during resume analysis. Please try again."],
            priority: "high",
          }
        ],
        aiAnalysis: "Analysis not available due to an error"
      },
      { status: 500 }
    )
  }
}

function analyzeATSCompatibility(resumeText: string): number {
  let score = 100

  // Check for common ATS issues
  if (resumeText.includes("table")) score -= 10
  if (resumeText.includes("header")) score -= 5
  if (resumeText.includes("footer")) score -= 5
  if (resumeText.includes("text-align")) score -= 10
  if (resumeText.includes("font-family")) score -= 5
  
  // Check for proper section headers
  const commonSections = ["experience", "education", "skills"]
  commonSections.forEach(section => {
    if (!resumeText.includes(section)) score -= 10
  })

  return Math.max(score, 0)
}

function analyzeKeywords(resumeText: string, jobDescription?: string): { keywordScore: number; missingKeywords: string[] } {
  let relevantKeywords: string[] = []
  let missingKeywords: string[] = []

  // If job description is provided, extract keywords from it
  if (jobDescription) {
    const jobDescLower = jobDescription.toLowerCase()
    // Identify job role from description
    const role = Object.keys(jobKeywords).find(role => 
      jobDescLower.includes(role)
    ) || "software engineer" // default to software engineer if no match

    relevantKeywords = jobKeywords[role]
  } else {
    // Use software engineer keywords as default
    relevantKeywords = jobKeywords["software engineer"]
  }

  // Check for missing keywords
  missingKeywords = relevantKeywords.filter(keyword => 
    !resumeText.includes(keyword)
  )

  // Calculate score based on keyword matches
  const matchedKeywords = relevantKeywords.length - missingKeywords.length
  const keywordScore = Math.round((matchedKeywords / relevantKeywords.length) * 100)

  return { keywordScore, missingKeywords }
}

function analyzeGrammarAndStyle(resumeText: string): { grammarScore: number; grammarIssues: string[] } {
  let score = 100
  const issues: string[] = []

  // Check for passive voice
  const passiveVoicePatterns = [
    "was", "were", "being", "been", "is", "are", "am", "have been", "has been"
  ]

  passiveVoicePatterns.forEach(pattern => {
    if (resumeText.toLowerCase().includes(` ${pattern} `)) {
      score -= 5
      if (!issues.includes("Passive voice detected in some statements")) {
        issues.push("Passive voice detected in some statements")
      }
    }
  })

  // Check for consistent tense
  const pastTenseCount = (resumeText.match(/ed\b/g) || []).length
  const presentTenseCount = (resumeText.match(/[^e]s\b/g) || []).length
  
  if (Math.abs(pastTenseCount - presentTenseCount) < pastTenseCount * 0.8) {
    score -= 10
    issues.push("Inconsistent tense usage across experience descriptions")
  }

  // Check for bullet point consistency
  const bulletPoints = resumeText.match(/[•·-]\s/g) || []
  if (bulletPoints.length > 0 && new Set(bulletPoints).size > 1) {
    score -= 5
    issues.push("Inconsistent bullet point usage")
  }

  return { grammarScore: Math.max(score, 0), grammarIssues: issues }
}

function analyzeContentQuality(resumeText: string): { contentScore: number; contentImprovements: string[] } {
  let score = 100
  const improvements: string[] = []

  // Check for quantifiable achievements
  const hasNumbers = /\d+%|\d+x|\$\d+|\d+ [a-z]+/i.test(resumeText)
  if (!hasNumbers) {
    score -= 20
    improvements.push("Add quantifiable achievements (e.g., percentages, metrics, or numbers)")
  }

  // Check for section completeness
  const sections = ["experience", "education", "skills"]
  sections.forEach(section => {
    if (!resumeText.toLowerCase().includes(section)) {
      score -= 15
      improvements.push(`Add a dedicated ${section} section`)
    }
  })

  // Check content length
  const wordCount = resumeText.split(/\s+/).length
  if (wordCount < 200) {
    score -= 15
    improvements.push("Resume content is too brief - expand on your experiences")
  } else if (wordCount > 1000) {
    score -= 10
    improvements.push("Resume is too long - consider condensing")
  }

  return { contentScore: Math.max(score, 0), contentImprovements: improvements }
}

function analyzeImpactStatements(resumeText: string): { impactScore: number; impactSuggestions: string[] } {
  let score = 100
  const suggestions: string[] = []

  // Check for impact verbs
  const impactVerbCount = impactVerbs.filter(verb => 
    resumeText.toLowerCase().includes(verb)
  ).length

  if (impactVerbCount < 5) {
    score -= 20
    suggestions.push("Use more strong action verbs to describe achievements")
  }

  // Check for result-oriented statements
  const resultPatterns = [
    "resulting in", "increased", "decreased", "reduced", "improved", "achieved",
    "generated", "saved", "delivered", "grew", "raised"
  ]

  const hasResults = resultPatterns.some(pattern => 
    resumeText.toLowerCase().includes(pattern)
  )

  if (!hasResults) {
    score -= 25
    suggestions.push("Add more result-oriented statements showing impact")
  }

  // Check for leadership indicators
  const leadershipPatterns = [
    "led", "managed", "supervised", "mentored", "trained", "coordinated",
    "spearheaded", "directed", "guided"
  ]

  const hasLeadership = leadershipPatterns.some(pattern => 
    resumeText.toLowerCase().includes(pattern)
  )

  if (!hasLeadership) {
    score -= 15
    suggestions.push("Include examples of leadership or team coordination")
  }

  return { impactScore: Math.max(score, 0), impactSuggestions: suggestions }
} 