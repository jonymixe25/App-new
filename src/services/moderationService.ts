import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ModerationResult {
  isAppropriate: boolean;
  reason?: string;
}

export async function moderateContent(text: string, context: "news" | "chat"): Promise<ModerationResult> {
  try {
    const prompt = `
      Eres un moderador de contenido para "Vida Mixe TV", una plataforma comunitaria para el pueblo Ayuuk (Mixe) en la Sierra Norte de Oaxaca.
      Tu tarea es evaluar si el siguiente texto es respetuoso y relevante para la comunidad.
      
      Criterios de rechazo:
      1. Lenguaje de odio, insultos o discriminación.
      2. Contenido sexual explícito o violento.
      3. Spam o publicidad no relacionada.
      4. Ataques personales a miembros de la comunidad.
      5. Contenido que falte al respeto a las tradiciones o cultura Mixe.
      
      Contexto del mensaje: ${context === "news" ? "Una noticia para el portal" : "Un mensaje en el chat en vivo"}.
      
      Texto a evaluar: "${text}"
      
      Responde estrictamente en formato JSON con la siguiente estructura:
      {
        "isAppropriate": boolean,
        "reason": "Breve explicación en español si no es apropiado, de lo contrario omitir"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || '{"isAppropriate": true}');
    return result;
  } catch (error) {
    console.error("Error in moderation:", error);
    // Fallback to allow if AI fails, to not block users, but log it
    return { isAppropriate: true };
  }
}
