const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const groq = new Groq({ 
    apiKey: process.env.GROQ_API_KEY
});

async function callGroq(prompt) {
    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content || "";
}

async function analyzeHardware(specs) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
  Context: You are a specialized PC Gaming Hardware Analyst and Benchmarking Expert.
  Goal: Evaluate if a specific game/app is "Playable" on the provided hardware, focusing on real-world performance benchmarks rather than just official minimum requirements.

  Target App/Game: ${specs.targetApp}
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
      "expectedFps": "Expected range (e.g., 30-40 FPS)"
    }
  }
`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Gemini API Error, trying Groq fallback:", error);
        try {
            const groqResponse = await callGroq(prompt);
            const cleanedGroqText = groqResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanedGroqText);
        } catch (groqError) {
            console.error("Groq Fallback Error:", groqError);
            return { 
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
        const response = await result.response;
        const text = await response.text();
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