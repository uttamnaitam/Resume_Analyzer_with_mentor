"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  BarChart4,
  Zap,
  Search,
  MessageSquare,
  X,
} from "lucide-react"
import Link from "next/link"
import { MentorSuggestions } from "@/components/mentor-suggestions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type Analysis = {
  overallScore: number
  scores: Array<{
    name: string
    score: number
  }>
  suggestions: Array<{
    category: string
    items: string[]
    priority: string
  }>
  resumeDetails?: {
    filename: string
    uploadDate: string
    jobMatch: string
    wordCount: number
  }
  aiAnalysis?: string
  // ML Analysis fields
  component_scores?: {
    skills_match: number
    experience_match: number
    education_match: number
    relevance: number
  }
  extracted_info?: {
    skills: string[]
    categorized_skills: {[category: string]: string[]}
    experience_years: number
    education: {
      institutions: string[]
      degrees: string[]
      highest_degree: string
      highest_level: number
    }
  }
  missing_skills?: string[]
  recommendations?: string[]
  classification?: {
    prediction: string
    confidence: number
    probabilities: {[key: string]: number}
  }
}

export default function AnalysisResultsPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [showMentorChat, setShowMentorChat] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get analysis results from localStorage
    const storedAnalysis = localStorage.getItem("resumeAnalysis")
    if (!storedAnalysis) {
      router.push("/analyze")
      return
    }

    try {
      const rawData = JSON.parse(storedAnalysis)
      console.log("Raw analysis data:", rawData);
      
      // Detailed debugging for key properties
      console.log("Analysis type detection:", {
        hasMatchSummary: !!rawData.match_summary,
        hasMatchDetails: !!rawData.match_details,
        hasExtractedData: !!rawData.extracted_data,
        hasClassification: !!rawData.classification,
        overallScore: rawData.match_summary?.overall_percentage || rawData.overallScore,
        suggestionsType: Array.isArray(rawData.suggestions) ? 'array' : typeof rawData.suggestions
      });

      // Determine if this is ML analysis or standard analysis
      const isMLAnalysis = !!rawData.extracted_data && !!rawData.match_details;
      console.log("Detected analysis type:", isMLAnalysis ? "ML-powered" : "Standard");
      
      // Log suggestions format
      console.log("Suggestions format:", rawData.suggestions ? 
        typeof rawData.suggestions === 'object' ? 
          Array.isArray(rawData.suggestions) ? 
            "Array with " + rawData.suggestions.length + " items" 
          : "Object (not array)" 
        : typeof rawData.suggestions 
      : "undefined");
      
      if (rawData.suggestions && Array.isArray(rawData.suggestions) && rawData.suggestions.length > 0) {
        console.log("First suggestion item type:", typeof rawData.suggestions[0]);
        console.log("First suggestion item:", rawData.suggestions[0]);
      }
      
      // Transform the API response into the format expected by the UI
      const transformedAnalysis: Analysis = {
        // Overall score from match_summary or default to 60
        overallScore: Math.round(rawData.match_summary?.overall_percentage) || Math.round(rawData.overallScore) || 60,
        
        // Create scores array from match_details or from standard scores
        scores: isMLAnalysis ? 
          [
            {
              name: "Skills Match",
              score: Math.round(rawData.match_details?.skills_match?.percentage) || 0
            },
            {
              name: "Experience Match",
              score: Math.round(rawData.match_details?.experience_match?.percentage) || 0
            },
            {
              name: "Education Match", 
              score: Math.round(rawData.match_details?.education_match?.percentage) || 0
            },
            {
              name: "Job Relevance",
              score: Math.round(rawData.match_details?.relevance_score?.percentage) || 0
            }
          ] :
          // Handle standard analysis scores
          rawData.scores || [
            { name: "ATS Compatibility", score: 0 },
            { name: "Keyword Match", score: 0 },
            { name: "Content Quality", score: 0 },
            { name: "Grammar & Style", score: 0 },
            { name: "Impact Statements", score: 0 }
          ],
        
        // Create suggestions array - properly handle all possible formats
        suggestions: (() => {
          // If suggestions is an array
          if (Array.isArray(rawData.suggestions)) {
            // If it's empty, provide a default
            if (rawData.suggestions.length === 0) {
              return [{
                category: "Resume Improvements",
                items: ["No specific suggestions available"],
                priority: "Low"
              }];
            }
            
            // Check the first item to determine format
            const firstItem = rawData.suggestions[0];
            
            // If first item is already a valid suggestion object with the right structure
            if (typeof firstItem === 'object' && firstItem !== null && 
                'category' in firstItem && 'items' in firstItem && 'priority' in firstItem &&
                Array.isArray(firstItem.items)) {
              return rawData.suggestions;
            }
            
            // If it's an object but doesn't have the right structure
            if (typeof firstItem === 'object' && firstItem !== null) {
              return [{
                category: "Resume Improvements",
                items: rawData.suggestions.map(item => typeof item === 'string' ? item : JSON.stringify(item)),
                priority: "Low"
              }];
            }
            
            // If items are strings (old format)
            return [{
              category: "Resume Improvements",
              items: rawData.suggestions,
              priority: rawData.match_summary?.rating === "Poor" || rawData.match_summary?.rating === "Below Average" 
                ? "High" 
                : rawData.match_summary?.rating === "Average" ? "Medium" : "Low"
            }];
          }
          
          // Not an array, use default
          return [{
            category: "Resume Improvements",
            items: ["No specific suggestions available"],
            priority: "Low"
          }];
        })(),
        
        // Create resumeDetails object
        resumeDetails: {
          filename: localStorage.getItem("lastUploadedFile") || "resume.pdf",
          uploadDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          jobMatch: localStorage.getItem("jobDescription") 
            ? "Custom Job Description" 
            : "Software Engineer",
          wordCount: countWords(localStorage.getItem("resumeText") || "")
        },
        
        // Add aiAnalysis if available
        aiAnalysis: rawData.classification?.prediction === "good_fit" 
          ? `Based on our analysis, your resume is a good match for this position with ${Math.round(rawData.classification.confidence * 100)}% confidence. Consider addressing the suggested improvements to further strengthen your application.` 
          : `Based on our analysis, your resume could use some improvements to better match this position. Make sure to address the suggested changes to strengthen your application.`,
        
        // Add ML analysis fields only if ML analysis was used
        component_scores: isMLAnalysis ? {
          skills_match: rawData.match_details?.skills_match?.percentage || 0,
          experience_match: rawData.match_details?.experience_match?.percentage || 0,
          education_match: rawData.match_details?.education_match?.percentage || 0,
          relevance: rawData.match_details?.relevance_score?.percentage || 0
        } : undefined,
        
        // Add extracted info only if ML analysis was used
        extracted_info: isMLAnalysis ? {
          skills: rawData.extracted_data?.skills || [],
          categorized_skills: { "detected_skills": rawData.extracted_data?.skills || [] },
          experience_years: rawData.extracted_data?.experience || 0,
          education: rawData.extracted_data?.education || {
            institutions: [],
            degrees: [],
            highest_degree: "None",
            highest_level: 0
          }
        } : undefined,
        
        // Add missing skills
        missing_skills: rawData.match_details?.skills_match?.missing_skills || [],
        
        // Add recommendations
        recommendations: Array.isArray(rawData.suggestions) ? 
          rawData.suggestions.map(suggestion => {
            // If suggestion is a string, return as is
            if (typeof suggestion === 'string') {
              return suggestion;
            }
            // If suggestion is an object with items array, return the first item
            else if (typeof suggestion === 'object' && suggestion && suggestion.items && Array.isArray(suggestion.items)) {
              return suggestion.items.join(', ');
            }
            // Fallback case
            else {
              return JSON.stringify(suggestion);
            }
          }) 
          : [],
        
        // Add classification
        classification: rawData.classification || {
          prediction: "unknown",
          confidence: 0.5,
          probabilities: { "good_fit": 0.5, "bad_fit": 0.5 }
        }
      };
      
      console.log("Transformed analysis:", {
        overallScore: transformedAnalysis.overallScore,
        scoresCount: transformedAnalysis.scores.length,
        suggestionsCount: transformedAnalysis.suggestions.length,
        hasComponentScores: !!transformedAnalysis.component_scores,
        hasExtractedInfo: !!transformedAnalysis.extracted_info,
        hasMissingSkills: transformedAnalysis.missing_skills?.length || 0,
        hasRecommendations: transformedAnalysis.recommendations?.length || 0,
        hasClassification: !!transformedAnalysis.classification
      });
      
      setAnalysis(transformedAnalysis);
    } catch (error) {
      console.error("Error parsing analysis:", error)
      router.push("/analyze")
    }
  }, [router])

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).length
  }

  const handleExportReport = async () => {
    try {
      const response = await fetch("/api/export-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analysis),
      })

      // Check if response is ok and is of type application/pdf
      const contentType = response.headers.get('content-type')
      if (!response.ok || !contentType?.includes('application/pdf')) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Export failed")
      }

      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.split('filename=')[1]?.replace(/["']/g, '') || 
                      `resume-analysis-${new Date().toISOString().split("T")[0]}.pdf`

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Report exported successfully!")
    } catch (error) {
      console.error("Export error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to export report. Please try again.")
    }
  }

  const handleChatWithMentor = () => {
    setShowMentorChat(true)
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading analysis...</h2>
          <p className="text-gray-600">Please wait while we load your results.</p>
        </div>
      </div>
    )
  }

  const getScoreIcon = (name: string) => {
    switch (name) {
      case "ATS Compatibility":
        return <FileText className="h-5 w-5" />
      case "Keyword Match":
        return <Search className="h-5 w-5" />
      case "Content Quality":
        return <BarChart4 className="h-5 w-5" />
      case "Grammar & Style":
        return <CheckCircle className="h-5 w-5" />
      case "Impact Statements":
        return <Zap className="h-5 w-5" />
      default:
        return <CheckCircle className="h-5 w-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200"
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-green-50 text-green-700 border-green-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/analyze" className="flex items-center text-gray-800 hover:text-purple-600">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to Upload</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={handleExportReport}
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-2"
              onClick={handleChatWithMentor}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat with Mentor</span>
              </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Score Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Resume Score</h2>

              <div className="relative flex items-center justify-center mb-6">
                <svg className="w-32 h-32" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="3"
                    strokeDasharray={`${analysis.overallScore}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold">{Math.round(analysis.overallScore)}%</span>
                  <span className="text-sm text-gray-500">Overall</span>
                </div>
              </div>

              <div className="space-y-4">
                {analysis.scores.map((score, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <div className="mr-2 text-purple-600">{getScoreIcon(score.name)}</div>
                        <span className="text-sm font-medium">{score.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{Math.round(score.score)}%</span>
                    </div>
                    <Progress value={score.score} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Resume Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Filename</p>
                  <p className="font-medium">{analysis?.resumeDetails?.filename}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Uploaded</p>
                  <p className="font-medium">{analysis?.resumeDetails?.uploadDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Job Match</p>
                  <p className="font-medium">{analysis?.resumeDetails?.jobMatch}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Word Count</p>
                  <p className="font-medium">{analysis?.resumeDetails?.wordCount} words</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Suggestions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Key Suggestions</h2>
              <div className="space-y-6">
                {analysis.suggestions.map((suggestion, index) => {
                  // Ensure suggestion is a valid object with required properties
                  if (typeof suggestion !== 'object' || !suggestion || !suggestion.category || !suggestion.items || !Array.isArray(suggestion.items)) {
                    return null;
                  }
                  
                  return (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{suggestion.category}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                            suggestion.priority || "Low"
                          )}`}
                        >
                          {suggestion.priority || "Low"} Priority
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {suggestion.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">AI-Powered Improvements</h2>
              <p className="text-gray-600 mb-6">
                Here are some AI-generated suggestions to improve specific sections of your resume.
              </p>

              {analysis.aiAnalysis ? (
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">AI Resume Analysis</h3>
                    <div>
                      <p className="bg-blue-50 p-4 rounded text-gray-700 border-l-4 border-blue-500 whitespace-pre-wrap">
                        {analysis.aiAnalysis}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Work Experience - Software Developer at XYZ Corp</h3>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Original</p>
                    <p className="bg-gray-50 p-3 rounded text-gray-700">
                      Developed web applications using React and Node.js. Worked with team members on various projects.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Suggested Improvement</p>
                    <p className="bg-green-50 p-3 rounded text-gray-700 border-l-4 border-green-500">
                      Engineered responsive web applications using React and Node.js, reducing load times by 40%. Collaborated with cross-functional teams to deliver 5 major projects with an average of 20% faster time-to-market than company benchmarks.
                    </p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Skills Section</h3>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Original</p>
                    <p className="bg-gray-50 p-3 rounded text-gray-700">JavaScript, React, CSS, HTML, Node.js</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Suggested Improvement</p>
                    <p className="bg-green-50 p-3 rounded text-gray-700 border-l-4 border-green-500">
                      <strong>Frontend:</strong> JavaScript (ES6+), React, Redux, TypeScript, HTML5, CSS3, Tailwind CSS
                      <br />
                      <strong>Backend:</strong> Node.js, Express, RESTful APIs, GraphQL
                      <br />
                      <strong>Tools & Methods:</strong> Git, CI/CD, Agile/Scrum, Jest, Webpack
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ML Analysis Results */}
            {analysis.component_scores && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">ML-Powered Analysis</h2>
                <p className="text-gray-600 mb-6">
                  Here is the machine learning based analysis of your resume with detailed insights.
                </p>

                {/* Component Scores */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Component Scores</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-purple-700 font-bold text-xl">{Math.round(analysis.component_scores?.skills_match || 0)}%</p>
                      <p className="text-sm text-gray-600">Skills Match</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-blue-700 font-bold text-xl">{Math.round(analysis.component_scores?.experience_match || 0)}%</p>
                      <p className="text-sm text-gray-600">Experience</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-green-700 font-bold text-xl">{Math.round(analysis.component_scores?.education_match || 0)}%</p>
                      <p className="text-sm text-gray-600">Education</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <p className="text-yellow-700 font-bold text-xl">{Math.round(analysis.component_scores?.relevance || 0)}%</p>
                      <p className="text-sm text-gray-600">Relevance</p>
                    </div>
                  </div>
                </div>

                {/* Extracted Skills */}
                {analysis.extracted_info?.skills && analysis.extracted_info?.skills.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Detected Skills</h3>
                    <div className="border border-gray-200 rounded-lg p-4">
                      {analysis.extracted_info?.categorized_skills && 
                       Object.keys(analysis.extracted_info.categorized_skills).length > 0 ? (
                        // Categorized skills display
                        Object.entries(analysis.extracted_info.categorized_skills).map(([category, skills], index) => (
                          <div key={index} className="mb-3 last:mb-0">
                            <p className="text-sm font-semibold text-gray-700 mb-1 capitalize">
                              {category.replace('_', ' ')}:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(skills) && skills.map((skill, skillIndex) => (
                                <span key={skillIndex} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        // Fallback to flat skills list
                        <div className="flex flex-wrap gap-2">
                          {analysis.extracted_info.skills.map((skill, index) => (
                            <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Education & Experience */}
                {analysis.extracted_info?.education && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Education & Experience</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Education:</p>
                        <p className="mb-1"><span className="font-medium">Highest Degree:</span> {analysis.extracted_info.education.highest_degree || 'Not specified'}</p>
                        {analysis.extracted_info.education.institutions && analysis.extracted_info.education.institutions.length > 0 ? (
                          <div className="mb-1">
                            <span className="font-medium">Institutions:</span> 
                            <ul className="list-disc pl-5 mt-1">
                              {analysis.extracted_info.education.institutions.map((inst, i) => (
                                <li key={i} className="text-sm">{inst}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="mb-1"><span className="font-medium">Institutions:</span> None detected</p>
                        )}
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Experience:</p>
                        <p><span className="font-medium">Years of Experience:</span> {analysis.extracted_info.experience_years ?? 0} years</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resume Classification */}
                {analysis.classification && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Job Match Classification</h3>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <div className={`text-lg font-bold ${analysis.classification.prediction === 'good_fit' ? 'text-green-600' : 'text-red-600'}`}>
                          {analysis.classification.prediction === 'good_fit' ? 'Good Match' : 'Needs Improvement'}
                        </div>
                        <div className="ml-3 px-3 py-1 rounded-full text-xs font-medium bg-gray-100">
                          {Math.round((analysis.classification.confidence || 0.5) * 100)}% confidence
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${analysis.classification.prediction === 'good_fit' ? 'bg-green-600' : 'bg-red-600'}`}
                          style={{ width: `${Math.round((analysis.classification.confidence || 0.5) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Improvement Recommendations</h3>
                    <ul className="space-y-2 border border-gray-200 rounded-lg p-4">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{typeof rec === 'string' ? rec : JSON.stringify(rec)}</span>
                        </li>
                      ))}
                      {analysis.missing_skills && analysis.missing_skills.length > 0 && (
                        <li className="flex items-start mt-4">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-gray-700 font-medium">Missing Skills: </span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {analysis.missing_skills.map((skill, skillIndex) => (
                                <span key={skillIndex} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                  {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <MentorSuggestions />
          </div>
        </div>
      </div>

      {/* Mentor Chat Modal */}
      {showMentorChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chat with AI Mentor</h2>
              <button
                onClick={() => setShowMentorChat(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <MentorSuggestions />
          </div>
        </div>
      )}
    </main>
  )
}

