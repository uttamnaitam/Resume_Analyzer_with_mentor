import { NextResponse } from "next/server"
import axios from "axios"

export async function GET(request: Request) {
  try {
    // Check if the API key is set
    const apiKey = process.env.OPENROUTER_API_KEY
    const apiKeyStatus = apiKey ? "Present" : "Missing"
    const maskKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "Not set"

    // Check other environment variables
    const nodeEnv = process.env.NODE_ENV || "Not set"

    // Make a very simple request to OpenRouter
    let openRouterStatus = "Not tested"
    let openRouterModels = null

    if (apiKey) {
      try {
        const response = await axios.get("https://openrouter.ai/api/v1/models", {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Resume Analyzer Debug"
          }
        })
        openRouterStatus = "Connected"
        openRouterModels = response.data
      } catch (apiError: any) {
        openRouterStatus = `Error: ${apiError.message}`
        if (apiError.response) {
          openRouterStatus += ` (${apiError.response.status}: ${JSON.stringify(apiError.response.data)})`
        }
      }
    }

    return NextResponse.json({
      environment: {
        nodeEnv,
        apiKeyStatus,
        apiKeyMasked: maskKey
      },
      openRouter: {
        status: openRouterStatus,
        models: openRouterModels
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: `Debug error: ${error.message}` },
      { status: 500 }
    )
  }
} 