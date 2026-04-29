const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

// ─────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn("⚠️  Warning: GEMINI_API_KEY not set. Gemini analysis will fail.");
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.warn("⚠️  Warning: GROQ_API_KEY not set. Groq fallback will fail.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
const groq = new Groq({ apiKey: GROQ_API_KEY || "" });

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const GEMINI_MODEL   = "gemini-2.0-flash";   // ← اسم النموذج الصحيح
const GROQ_MODEL     = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 20000;            // 20 ثانية كحد أقصى

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * يستخرج أول كتلة JSON صالحة من النص
 * أكثر موثوقية من replace() البسيطة
 */
function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No valid JSON block found in API response.");
  return JSON.parse(match[0]);
}

/**
 * يضيف timeout لأي Promise لتجنب التعليق اللانهائي
 */
function withTimeout(promise, ms = REQUEST_TIMEOUT_MS) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * يتحقق من أن الـ specs تحتوي على الحقول الأساسية
 */
function validateSpecs(specs, requiredFields) {
  const missing = requiredFields.filter((f) => !specs[f] || String(specs[f]).trim() === "");
  if (missing.length > 0) {
    throw new Error(`Missing required specs fields: ${missing.join(", ")}`);
  }
}

/**
 * يستدعي Groq كـ fallback
 */
async function callGroq(prompt) {
  const completion = await withTimeout(
    groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODEL,
    })
  );
  const text = completion.choices[0]?.message?.content || "";
  if (!text) throw new Error("Groq returned an empty response.");
  return text;
}

/**
 * يستدعي Gemini مع fallback تلقائي لـ Groq
 */
async function callWithFallback(prompt) {
  try {
    const model  = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await withTimeout(model.generateContent(prompt));
    return result.response.text();
  } catch (geminiError) {
    console.error("❌ Gemini failed, switching to Groq fallback:", geminiError.message);
    return await callGroq(prompt);
  }
}

// ─────────────────────────────────────────────
// analyzeHardware
// ─────────────────────────────────────────────
async function analyzeHardware(specs) {
  // التحقق من الحقول المطلوبة
  validateSpecs(specs, ["targetApp", "deviceType", "cpu", "gpu", "ram"]);

  // ── 1. كشف نوع البرنامج (لعبة أم تطبيق) ──
  const detectionPrompt = `
Determine if "${specs.targetApp}" is primarily a VIDEO GAME or a SOFTWARE APPLICATION.
Respond with ONLY a valid JSON object, no markdown, no extra text:
{
  "type": "game",
  "confidence": "high"
}

Rules:
- "game": Any interactive entertainment game (e.g. Cyberpunk 2077, The Sims 4, Minecraft)
- "app":  Any productivity/creative/utility software (e.g. Adobe Premiere Pro, Microsoft Word, Unity)
`;

  let appType = null;

  try {
    const detectionText = await callWithFallback(detectionPrompt);
    const detection = extractJSON(detectionText);
    if (detection.type === "game" || detection.type === "app") {
      appType = detection.type;
    } else {
      throw new Error("Invalid type value returned.");
    }
  } catch (e) {
    console.warn("⚠️  App type detection failed:", e.message);
    // نستنتج من اسم البرنامج بدلاً من الـ default العشوائي
    const appNameLower = specs.targetApp.toLowerCase();
    const appKeywords  = ["adobe", "word", "excel", "office", "photoshop", "premiere", "unity", "blender", "vs code", "chrome"];
    appType = appKeywords.some((k) => appNameLower.includes(k)) ? "app" : "game";
    console.warn(`↩️  Falling back to inferred type: "${appType}"`);
  }

  // ── 2. بناء الـ prompt المناسب ──
  const specsSummary = `
- Device Type: ${specs.deviceType}${specs.laptopModel ? ` (${specs.laptopModel})` : ""}
- CPU: ${specs.cpu}
- GPU: ${specs.gpu}
- RAM: ${specs.ram}
- Disk Type: ${specs.diskType || "Unknown"}
- Windows Version: ${specs.windowVersion || "Unknown"}
`.trim();

  const gamePrompt = `
Context: You are a specialized PC Gaming Hardware Analyst and Benchmarking Expert.
Goal: Evaluate if the game "${specs.targetApp}" is playable on the hardware below.

${specsSummary}

Rules:
1. "Playable" = 25+ FPS at 720p Lowest settings → decision: "YES"
2. Be realistic with integrated GPUs (Intel HD/UHD can often run games at low res).
3. Use community benchmarks (LowSpecExperience, Digital Foundry) as reference.

Respond ONLY with a valid JSON object, no markdown, no extra text:
{
  "appType": "game",
  "decision": "YES",
  "percentage": 75,
  "explanation": "...",
  "bottleneck": "GPU",
  "bestSettings": {
    "resolution": "1280x720",
    "graphicsQuality": {
      "Textures": "Low",
      "Shadows": "Off",
      "AntiAliasing": "Off",
      "Effects": "Low"
    },
    "expectedFps": "25-35 FPS"
  }
}
`;

  const appPrompt = `
Context: You are a Software Compatibility and Performance Analyst.
Goal: Evaluate if "${specs.targetApp}" will run efficiently on the hardware below.

${specsSummary}

Focus on:
1. RAM sufficiency for common tasks.
2. CPU performance for the app's workload.
3. Overall performance tier: Smooth / Acceptable / Sluggish / Unusable.

Respond ONLY with a valid JSON object, no markdown, no extra text:
{
  "appType": "app",
  "decision": "YES",
  "percentage": 80,
  "explanation": "...",
  "performanceTier": "Acceptable",
  "requirements": {
    "minRAM": "8 GB",
    "recommendedRAM": "16 GB",
    "cpuTier": "Mid",
    "storageSpace": "10 GB"
  },
  "useCases": {
    "lightTasks": "Yes",
    "moderateTasks": "Yes",
    "heavyTasks": "No"
  },
  "bottleneck": "RAM",
  "bestSettings": {
    "ramUtilization": "~6 GB during typical use",
    "cpuUtilization": "40-60%",
    "recommendations": "Close background apps. Use SSD for faster load times."
  }
}
`;

  const analysisPrompt = appType === "game" ? gamePrompt : appPrompt;

  // ── 3. تنفيذ التحليل ──
  try {
    const responseText  = await callWithFallback(analysisPrompt);
    const parsedResult  = extractJSON(responseText);

    // ضمان صحة الحقول الأساسية
    parsedResult.appType    = appType;
    parsedResult.percentage = Number(parsedResult.percentage) || 0;  // تحويل لرقم دائماً
    parsedResult.decision   = ["YES", "NO", "MARGINAL"].includes(parsedResult.decision)
      ? parsedResult.decision
      : "MARGINAL";

    return parsedResult;
  } catch (error) {
    console.error("❌ analyzeHardware failed completely:", error.message);
    throw new Error("Analysis services are unavailable. Please try again later.");
  }
}

// ─────────────────────────────────────────────
// analyzePerformance
// ─────────────────────────────────────────────
async function analyzePerformance(specs) {
  // التحقق من الحقول المطلوبة
  validateSpecs(specs, ["cpu", "gpu", "ram", "deviceType"]);

  const prompt = `
Context: You are a PC Hardware Historian and Performance Auditor.
Task: Audit the hardware specs below and give a technical overview of the device's standing in 2026.

Specs:
- CPU: ${specs.cpu}
- GPU: ${specs.gpu}
- RAM: ${specs.ram}
- Device Type: ${specs.deviceType}
- Windows Version: ${specs.windowVersion || "Unknown"}
- Disk Type: ${specs.diskType || "Unknown"}

Respond ONLY with a valid JSON object, no markdown, no extra text:
{
  "marketInfo": {
    "tier": "Mid"
  },
  "overallScore": 60,
  "gamingScore": 55,
  "productivityScore": 65,
  "eraCapability": {
    "modernEra": "Handles indie titles and light AAA games at low settings.",
    "legacySupport": "Runs all pre-2018 titles smoothly."
  },
  "gamingBenchmark": {
    "AAA_4K_Ultra": "None",
    "AAA_1080p_High": "Struggling",
    "Competitive_ESports": "Good"
  },
  "upgradePath": "Consider upgrading RAM to 16 GB and replacing HDD with SSD for noticeable gains."
}
`;

  try {
    const responseText = await callWithFallback(prompt);
    const result = extractJSON(responseText);
    
    result.overallScore      = Number(result.overallScore)      || 0;
    result.gamingScore       = Number(result.gamingScore)       || 0;
    result.productivityScore = Number(result.productivityScore) || 0;

    return result;
  } catch (error) {
    console.error("❌ analyzePerformance failed completely:", error.message);
    throw new Error("Performance analysis services are currently unavailable. Please try again later.");
  }
}

// ─────────────────────────────────────────────
// Exports — نفس الأسماء السابقة حتى يعمل مع المشروع بدون تغيير
// ─────────────────────────────────────────────
module.exports = { analyzeHardware, analyzePerformance };