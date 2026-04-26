const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.warn("Warning: GEMINI_API_KEY not set. Gemini analysis will fail.");
}
const genAI = new GoogleGenerativeAI(API_KEY || "");

const groq = new Groq({ 
    apiKey: process.env.GROQ_API_KEY || ""
});
if (!process.env.GROQ_API_KEY) {
    console.warn("Warning: GROQ_API_KEY not set. Groq fallback will fail.");
}

async function callGroq(prompt) {
    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content || "";
}

async function analyzeHardware(specs) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // First, detect if it's a game or application
    const detectionPrompt = `
Determine if "${specs.targetApp}" is primarily a VIDEO GAME or a SOFTWARE APPLICATION.
Respond with ONLY a JSON object, no markdown:
{
  "type": "game" or "app",
  "confidence": "high/medium/low"
}

Examples:
- "Cyberpunk 2077" → type: "game"
- "Adobe Premiere Pro" → type: "app"
- "Microsoft Word" → type: "app"
- "The Sims 4" → type: "game"
- "Unity" → type: "app"
`;

    let appType = "game"; // default

    try {
        const detectionResult = await model.generateContent(detectionPrompt);
        const detectionText = detectionResult.response.text();
        const cleanedDetection = detectionText.replace(/```json/g, "").replace(/```/g, "").trim();
        const detection = JSON.parse(cleanedDetection);
        appType = detection.type || "game";
    } catch (e) {
        console.warn("App type detection failed, defaulting to game");
    }

    // Now generate the appropriate analysis based on type
    let analysisPrompt;

    if (appType === "game") {
        analysisPrompt = `
  Context: You are a specialized PC Gaming Hardware Analyst and Benchmarking Expert.
  Goal: Evaluate if a specific game is "Playable" on the provided hardware, focusing on real-world performance benchmarks rather than just official minimum requirements.

  Target Game: ${specs.targetApp}
  Device Specs:
  - Type: ${specs.deviceType} (${specs.laptopModel || 'N/A'})
  - CPU: ${specs.cpu}
  - GPU: ${specs.gpu}
  - RAM: ${specs.ram}
  - disk type: ${specs.diskType}
  - Window Version: ${specs.windowVersion}

  Evaluation Rules:
  1. "Playable" Definition: If the game can reach 25+ FPS at 720p Lowest settings, the decision should be "YES".
  2. Integrated GPUs: Be realistic. Many older or integrated GPUs (like Intel HD Graphics) can run modern games at low resolutions even if not officially supported.
  3. Bottleneck Analysis: Identify if the CPU or GPU is the main limiting factor.
  4. Accuracy: Use knowledge of game optimization and community benchmarks (e.g., LowSpecExperience).

  Output Format (Strict JSON, no markdown):
  {
    "appType": "game",
    "decision": "YES/NO/MARGINAL",
    "percentage": "0-100%",
    "explanation": "A concise, human-friendly explanation. Mention if it's officially unsupported but practically playable.",
    "bottleneck": "CPU/GPU/RAM/None",
    "bestSettings": {
      "resolution": "e.g., 1280x720",
      "graphicsQuality": {
        "Textures": "Low/Med/High",
        "Shadows": "On/Off/Low",
        "AntiAliasing": "FXAA/Off",
        "Effects": "Low/Med"
      },
      "expectedFps": "e.g., 25-30 FPS"
    }
  }
`;
    } else {
        analysisPrompt = `
  Context: You are a Software Compatibility and Performance Analyst specializing in professional applications.
  Goal: Evaluate if a specific application can run efficiently on the provided hardware, considering CPU requirements, RAM needs, and disk space.

  Target Application: ${specs.targetApp}
  Device Specs:
  - Type: ${specs.deviceType} (${specs.laptopModel || 'N/A'})
  - CPU: ${specs.cpu}
  - GPU: ${specs.gpu}
  - RAM: ${specs.ram}
  - disk type: ${specs.diskType}
  - Window Version: ${specs.windowVersion}

  Evaluation Focus:
  1. Sufficient RAM: Minimum comfortable usage memory
  2. CPU Power: Processing capability for common tasks
  3. Storage: Space availability for installation and workspace
  4. Performance Tier: Smooth/Acceptable/Sluggish/Unusable

  Output Format (Strict JSON, no markdown):
  {
    "appType": "app",
    "decision": "YES/NO/MARGINAL",
    "percentage": "0-100%",
    "explanation": "Assessment of whether the application will run smoothly. Include notes on performance tier (e.g., 'Smooth for basic editing', 'May lag with large files').",
    "performanceTier": "Smooth/Acceptable/Sluggish/Unusable",
    "requirements": {
      "minRAM": "Minimum RAM needed (e.g., '8 GB')",
      "recommendedRAM": "Recommended RAM for smooth operation",
      "cpuTier": "CPU performance level needed (Entry/Mid/High)",
      "storageSpace": "Typical workspace size (e.g., '50 GB')"
    },
    "useCases": {
      "lightTasks": "Yes/No (e.g., document editing, web browsing)",
      "moderateTasks": "Yes/No (e.g., photo editing, coding)",
      "heavyTasks": "Yes/No (e.g., video editing, 3D rendering)"
    },
    "bottleneck": "CPU/GPU/RAM/Storage/None",
    "bestSettings": {
      "ramUtilization": "How much RAM is typically used",
      "cpuUtilization": "CPU load during typical operation",
      "recommendations": "Optimization tips (e.g., 'Close background apps', 'Use SSD for faster loading')"
    }
  }
`;
    }

    try {
        const result = await model.generateContent(analysisPrompt);
        const text = result.response.text();
        
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedResult = JSON.parse(cleanedText);
        
        // Ensure appType is set
        parsedResult.appType = appType;
        return parsedResult;
    } catch (error) {
        console.error("Gemini API Error, trying Groq fallback:", error);
        try {
            const groqResponse = await callGroq(analysisPrompt);
            const cleanedGroqText = groqResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsedResult = JSON.parse(cleanedGroqText);
            parsedResult.appType = appType;
            return parsedResult;
        } catch (groqError) {
            console.error("Groq Fallback Error:", groqError);
            return { 
                appType: appType,
                decision: "ERROR", 
                percentage: "0%",
                explanation: "Both AI services (Gemini & Groq) are currently unavailable. Please check your internet connection or API limits.",
                bottleneck: "Unknown",
                bestSettings: {
                    resolution: "N/A",
                    graphicsQuality: "N/A",
                    expectedFps: "N/A"
                }
            };
        }
    }
}
async function analyzePerformance(specs) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
  Context: You are a PC Hardware Historian and Performance Auditor.
  Task: Audit the provided specs to give a technical overview of the device's standing in 2026.

  Specs:
  - CPU: ${specs.cpu}
  - GPU: ${specs.gpu}
  - RAM: ${specs.ram}
  - Device: ${specs.deviceType}
  - window Version: ${specs.windowVersion}
  - disk Type: ${specs.diskType}

  Output Format (Strict JSON, no markdown):
  {
    "marketInfo": {
      "releaseYear": "string",
      "tier": "Entry/Mid/High",
      "status": "Legacy/Mainstream/Outdated"
    },
    "eraCapability": {
      "gamingEra": "Up to what year (e.g., 2015-2017)",
      "appCapability": "e.g., Light Web Apps / Heavy Professional Apps",
      "osSupport": "Latest Windows/Linux compatibility status"
    },
    "powerScores": {
      "gamingScore": "XX%",
      "productivityScore": "XX%",
      "overallPower": "XX%"
    },
    "gamingBenchmark": {
      "AAA_Games": "Low/None",
      "Indie_Games": "Excellent/Good",
      "Competitive_ESports": "Playable/Struggling"
    },
    "upgradePath": "string"
  }
`;
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Gemini Performance Analysis Error, trying Groq fallback:", error);
        try {
            const groqResponse = await callGroq(prompt);
            const cleanedGroqText = groqResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanedGroqText);
        } catch (groqError) {
            console.error("Groq Fallback Error (Performance):", groqError);
            return { decision: "ERROR", explanation: "Both analysis services are currently down." };
        }
    }
}

module.exports = { analyzeHardware,analyzePerformance };