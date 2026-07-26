const fs = require("fs");
let code = fs.readFileSync("server.ts", "utf8");

const oldCode = `  // Call Gemini API using our dynamically composed, optimized enhanced prompt (Prompt Coach Stage)
  if (ai) {`;

const newCode = `  // If the API key is completely missing, explicitly throw a configuration error.
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ 
      error: "Configuration Error: GEMINI_API_KEY environment variable is missing. Please configure it in the platform settings to enable AI features." 
    });
  }

  // Call Gemini API using our dynamically composed, optimized enhanced prompt (Prompt Coach Stage)
  if (ai) {`;

code = code.replace(oldCode, newCode);
fs.writeFileSync("server.ts", code);
console.log("Patched server.ts config error successfully");
