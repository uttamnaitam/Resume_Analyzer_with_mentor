import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promises as fs } from "fs";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { PythonShell } from 'python-shell';

// Function to execute a Python script
async function runPythonScript(scriptPath: string, args: any): Promise<any> {
  // Create a temporary file for the arguments to avoid command line length issues
  const tempDirName = "temp_args";
  const tempDir = path.join(process.cwd(), tempDirName);
  const argsFileName = `args_${uuidv4()}.json`;
  const argsFilePath = path.join(tempDir, argsFileName);
  
  console.log(`Creating temp directory at: ${tempDir}`);
  console.log(`Args file will be at: ${argsFilePath}`);
  
  // Make sure temp directory exists (sync version to ensure it's created before continuing)
  if (!existsSync(tempDir)) {
    try {
      await fs.mkdir(tempDir, { recursive: true });
      console.log(`Successfully created temp directory: ${tempDir}`);
    } catch (err) {
      console.error(`Failed to create temp directory: ${err}`);
      throw new Error(`Failed to create temp directory: ${err}`);
    }
  }
  
  // Write arguments to a temporary JSON file
  try {
    await fs.writeFile(argsFilePath, JSON.stringify(args), 'utf8');
    console.log(`Successfully wrote args file: ${argsFilePath}`);
    
    // Verify file was created
    if (!existsSync(argsFilePath)) {
      throw new Error(`Args file was not created at: ${argsFilePath}`);
    }
    
    // Log the args for debugging
    console.log(`Arguments passed to Python:`, args);
    
    // Get the absolute path to the Python virtual environment
    const pythonPath = path.resolve(process.cwd(), '..', '..', 'resume-env', 'Scripts', 'python.exe');
    console.log(`Using Python executable: ${pythonPath}`);
    
    // Get absolute path to script directory
    const scriptDirectory = path.dirname(path.resolve(process.cwd(), scriptPath));
    console.log(`Script directory: ${scriptDirectory}`);
    
    const options = {
      mode: 'text' as 'text',
      pythonPath: pythonPath,
      pythonOptions: ['-u'], // unbuffered output
      scriptPath: scriptDirectory,
      args: [argsFilePath] // Pass the path to the arguments file
    };

    // Execute the Python script and wait for its completion
    const result = await new Promise((resolve, reject) => {
      let finalResult: any = null;
      let progressUpdates: any[] = [];
      let scriptErrors: string[] = [];
      
      const pyshell = new PythonShell(path.basename(scriptPath), options);
      
      pyshell.on('message', function (message) {
        console.log("Python message:", message);
        try {
          // Try to parse as JSON
          const data = JSON.parse(message);
          
          // Check if it's a progress update
          if (data.progress !== undefined) {
            progressUpdates.push(data);
          } else {
            // If not a progress update, assume it's the final result
            finalResult = data;
          }
        } catch (e) {
          console.error("Error parsing message from Python:", message);
        }
      });
      
      pyshell.on('stderr', function (stderr) {
        console.error("Python stderr:", stderr);
        scriptErrors.push(stderr);
      });
      
      pyshell.on('error', function (err) {
        console.error("Python error:", err);
        reject(err);
      });
      
      pyshell.on('close', function (exitCode) {
        console.log(`Python script exited with code: ${exitCode}`);
        
        // If we have a final result, return it
        if (finalResult) {
          resolve(finalResult);
        } 
        // If we only have progress updates, return the latest one
        else if (progressUpdates.length > 0) {
          resolve(progressUpdates[progressUpdates.length - 1]);
        } 
        // If no data but we have errors, return the errors
        else if (scriptErrors.length > 0) {
          reject(new Error(`Python script errors: ${scriptErrors.join('\n')}`));
        }
        // If no data at all, return an error
        else {
          reject(new Error(`No data received from Python script (exit code: ${exitCode})`));
        }
      });
    });
    
    // Clean up only after the Python script has finished
    try {
      if (existsSync(argsFilePath)) {
        await fs.unlink(argsFilePath);
        console.log(`Successfully deleted temp file: ${argsFilePath}`);
      }
    } catch (e) {
      console.error(`Error deleting temporary arguments file: ${e}`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`Error in runPythonScript: ${error}`);
    // Clean up if there was an error
    try {
      if (existsSync(argsFilePath)) {
        await fs.unlink(argsFilePath);
        console.log(`Deleted temp file after error: ${argsFilePath}`);
      }
    } catch (unlinkErr) {
      console.error(`Error deleting temporary file after error: ${unlinkErr}`);
    }
    throw error;
  }
}

// Function to save a base64 file
async function saveBase64File(base64Data: string, fileExt: string): Promise<string> {
  // Create a temporary directory if it doesn't exist
  const tempDirName = "temp_files";
  const tempDir = path.join(process.cwd(), tempDirName);
  
  // Make sure temp directory exists
  if (!existsSync(tempDir)) {
    try {
      await fs.mkdir(tempDir, { recursive: true });
      console.log(`Successfully created temp files directory: ${tempDir}`);
    } catch (err) {
      console.error(`Error creating temp files directory: ${err}`);
      throw new Error(`Failed to create temp files directory: ${err}`);
    }
  }

  // Generate a unique filename
  const fileName = `resume_${uuidv4()}.${fileExt}`;
  const filePath = path.join(tempDir, fileName);

  try {
    // Remove the base64 header and save the file
    const base64Content = base64Data.split(';base64,').pop() || "";
    await fs.writeFile(filePath, Buffer.from(base64Content, 'base64'));
    console.log(`Successfully wrote file: ${filePath}`);
    
    // Verify file was created
    if (!existsSync(filePath)) {
      throw new Error(`File was not created at: ${filePath}`);
    }
    
    return filePath;
  } catch (error) {
    console.error(`Error saving base64 file: ${error}`);
    throw error;
  }
}

// Main API route
export async function POST(request: Request) {
  console.log("POST /api/python-analyze: Request received");
  
  try {
    const body = await request.json();
    const { resumeBase64, resumeText, jobDescription, requiredSkills, requiredExperience, requiredDegree } = body;
    
    console.log("Request body received:", {
      hasResumeBase64: !!resumeBase64,
      hasResumeText: !!resumeText,
      hasJobDescription: !!jobDescription,
      requiredSkills,
      requiredExperience,
      requiredDegree
    });

    // Check if we received either resumeBase64 or resumeText
    if (!resumeBase64 && !resumeText) {
      console.error("Missing required input: Neither resumeBase64 nor resumeText provided");
      return NextResponse.json(
        { error: "Either resume file (base64) or resume text is required" },
        { status: 400 }
      );
    }

    let analysisResult;
    let filePath = null;

    // Process based on input type
    if (resumeBase64) {
      console.log("Processing resume from base64 data");
      
      // Extract file extension from the base64 data
      const fileExtMatch = resumeBase64.match(/^data:application\/([a-zA-Z0-9]+);base64,/);
      const fileExt = fileExtMatch && fileExtMatch[1] === "pdf" ? "pdf" : "docx";
      console.log(`Detected file extension: ${fileExt}`);
      
      // Save the base64 file
      filePath = await saveBase64File(resumeBase64, fileExt);
      console.log(`File saved to: ${filePath}`);
      
      try {
        // Call the Python script to analyze the file
        const scriptPath = path.join(process.cwd(), "app", "api", "python", "analyze_file.py");
        console.log(`Using script: ${scriptPath}`);
        
        const args = {
          file_path: filePath,
          file_type: fileExt,
          job_description: jobDescription || "",
          required_skills: requiredSkills || [],
          required_experience: requiredExperience || 0,
          required_degree: requiredDegree || "None"
        };
        
        console.log("Starting Python analysis for file");
        analysisResult = await runPythonScript(scriptPath, args);
        console.log("Python analysis completed for file");
      } finally {
        // Clean up the temporary file
        if (filePath) {
          try {
            if (existsSync(filePath)) {
              await fs.unlink(filePath);
              console.log(`Deleted temporary file: ${filePath}`);
            }
          } catch (unlinkErr) {
            console.error(`Error deleting temporary file: ${unlinkErr}`);
          }
        }
      }
    } else {
      console.log("Processing resume from text");
      // Process from text directly
      const scriptPath = path.join(process.cwd(), "app", "api", "python", "analyze_text.py");
      console.log(`Using script: ${scriptPath}`);
      
      const args = {
        resume_text: resumeText,
        job_description: jobDescription || "",
        required_skills: requiredSkills || [],
        required_experience: requiredExperience || 0,
        required_degree: requiredDegree || "None"
      };
      
      console.log("Starting Python analysis for text");
      analysisResult = await runPythonScript(scriptPath, args);
      console.log("Python analysis completed for text");
    }

    console.log("Analysis result:", analysisResult);
    
    // Return the analysis result
    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("Resume analysis error:", error);
    return NextResponse.json(
      { 
        error: "Failed to analyze resume", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 