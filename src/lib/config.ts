export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Configuration Error: GEMINI_API_KEY environment variable is missing. Please configure it in the platform settings to enable AI features.");
  }
  return key;
}

export function isGeminiApiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
