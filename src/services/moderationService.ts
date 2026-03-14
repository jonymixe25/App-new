import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ModerationResult {
  isAppropriate: boolean;
  reason?: string;
}

export async function moderateContent(content: string, context: "chat" | "news" | "comment" = "chat"): Promise<ModerationResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Act as a content moderator for a community television website (Vida Mixe TV). 
      Analyze the following ${context} content and determine if it is appropriate for all ages.
      It should not contain hate speech, explicit violence, sexual content, or severe harassment.
      
      Content to analyze: "${content}"
      
      Respond ONLY with a JSON object in this format:
      {
        "isAppropriate": boolean,
        "reason": "short explanation in Spanish if not appropriate, otherwise null"
      }`,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || '{"isAppropriate": true}');
    return result;
  } catch (error) {
    console.error("Moderation error:", error);
    // Default to allowing if moderation fails, to avoid blocking users due to API issues
    return { isAppropriate: true };
  }
}
