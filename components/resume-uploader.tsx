"use client"

import { useState, useEffect } from "react"
import { UploadIcon, FileText, X, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function ResumeUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [useAdvancedAnalysis, setUseAdvancedAnalysis] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Convert file to base64 when file changes
  useEffect(() => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setFileBase64(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    } else {
      setFileBase64(null)
    }
  }, [file])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Please upload a valid file (PDF, DOC, DOCX, or TXT)");
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        toast.error("File size exceeds 5MB limit");
        return;
      }
      
      setFile(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setFileBase64(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file && !fileBase64) return

    try {
      setUploading(true)
      setUploadProgress(10)

      // Determine which API endpoint to use
      const apiEndpoint = useAdvancedAnalysis ? "/api/python-analyze" : "/api/analyze"

      // Prepare request payload based on file type
      const payload: any = {
        jobDescription: jobDescription,
        requiredSkills: ["JavaScript", "React", "Node.js", "HTML", "CSS"],
        requiredExperience: 2,
        requiredDegree: "Bachelor"
      };

      if (file.type === 'text/plain') {
        // For text files, send the text content
        const text = await readFileAsText(file);
        payload.resumeText = text;
      } else {
        // For binary files (PDF, DOC, DOCX), send as base64
        payload.resumeBase64 = fileBase64;
        
        // For non-ML analysis, we need to extract text for PDF too, or set a placeholder
        if (!useAdvancedAnalysis) {
          try {
            // For standard analysis, we need resumeText even for binary files
            // Since we can't extract text from PDF/DOC directly in the browser,
            // set a placeholder that will be replaced by actual text on the server
            payload.resumeText = "Please extract text from the uploaded document";
          } catch (error) {
            console.error("Error extracting text from file:", error);
            payload.resumeText = "Document content placeholder";
          }
        }
      }

      // Start the analysis
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout
      
      try {
        console.log("Sending request to", apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        // Get response content
        const responseText = await response.text();
        
        // Handle empty responses
        if (!responseText || responseText.trim() === '') {
          console.error("Server returned empty response");
          throw new Error("Server returned an empty response. Please try again.");
        }
        
        let jsonResponse;
        try {
          jsonResponse = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", responseText);
          throw new Error(`Server returned invalid JSON response: ${responseText.substring(0, 100)}...`);
        }

        // Check if response is ok
        if (!response.ok) {
          console.error("Server returned error response:", responseText);
          // Try to extract error from jsonResponse, fallback to status text
          const errorMessage = jsonResponse && (jsonResponse.error || jsonResponse.details) 
            ? (jsonResponse.error || jsonResponse.details) 
            : `Server error: ${response.status} ${response.statusText}`;
          throw new Error(errorMessage);
        }

        // Check if jsonResponse is empty or not an object
        if (!jsonResponse || typeof jsonResponse !== 'object') {
          console.error("Server returned invalid response format:", jsonResponse);
          throw new Error("Server returned an invalid response format. Please try again.");
        }

        // Process the response data
        if (jsonResponse.progress) {
          setUploadProgress(jsonResponse.progress);
        } else if (jsonResponse.error) {
          throw new Error(jsonResponse.error);
        } else {
          setUploadProgress(100);

      // Store analysis results in localStorage
          localStorage.setItem("resumeAnalysis", JSON.stringify(jsonResponse));
          localStorage.setItem("lastUploadedFile", file.name);
          localStorage.setItem("jobDescription", jobDescription);

      // Redirect to results page
          toast.success("Analysis complete!");
          router.push("/analysis/results");
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error("Analysis timed out after 3 minutes. Please try again with a smaller file or simpler resume.");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Analysis error:", error);
      
      // Determine a user-friendly error message
      let errorMessage = "Failed to analyze resume";
      
      if (error instanceof Error) {
        if (error.message.includes("No such file or directory")) {
          errorMessage = "Server file system error. Please try again or contact support.";
        } else if (error.message.includes("timed out")) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        description: "Please try again or upload a different file."
      });
      
      setUploading(false);
      setUploadProgress(0);
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  // Progress description based on percentage
  const getProgressDescription = (progress: number) => {
    if (progress < 20) return "Processing file...";
    if (progress < 40) return "Extracting skills...";
    if (progress < 60) return "Analyzing education...";
    if (progress < 80) return "Evaluating experience...";
    if (progress < 90) return "Generating recommendations...";
    return "Finalizing analysis...";
  }

  if (!mounted) {
    return null // Return null on server-side and first render
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-8">
        {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
          {!file ? (
            <label className="cursor-pointer block">
              <input
                type="file"
                accept=".txt,.doc,.docx,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload your resume</h3>
              <p className="text-sm text-gray-500">
                Drag and drop or click to upload (PDF, DOC, DOCX, TXT)
              </p>
            </label>
          ) : (
            <div>
              <div className="flex items-center justify-center space-x-3 mb-4">
                <FileText className="h-8 w-8 text-purple-600" />
                <span className="font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Job Description Input */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Paste Job Description (Optional)
          </label>
          <textarea
            className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Paste the job description here to get tailored recommendations..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
        
        {/* Advanced Analysis Toggle */}
        <div className="mt-6 flex items-center">
          <input
            type="checkbox"
            id="advanced-analysis"
            checked={useAdvancedAnalysis}
            onChange={(e) => setUseAdvancedAnalysis(e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="advanced-analysis" className="ml-2 block text-sm text-gray-700">
            Use ML-Powered Analysis (Experimental)
          </label>
        </div>
      </div>

      {uploading && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span>{getProgressDescription(uploadProgress)}</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-lg"
          disabled={!file || uploading}
        >
          {uploading ? "Analyzing..." : "Analyze Resume"}
        </Button>
      </div>
    </form>
  )
}

