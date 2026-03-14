import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ModerationResult {
  isAppropriate: boolean;
  reason?: string;
}

export async function moderateContent(content: string, context: "chat" | "news"): Promise<ModerationResult> {
  if (!content.trim()) return { isAppropriate: true };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Eres un moderador de contenido para "Vida Mixe TV", un sitio web dedicado a la cultura Mixe.
      Debes revisar si el siguiente contenido es apropiado para el contexto de ${context === "chat" ? "un chat en vivo" : "una publicación de noticias"}.
      
      Contenido: "${content}"
      
      Criterios de rechazo:
      - Lenguaje ofensivo, insultos o discurso de odio.
      - Contenido sexualmente explícito.
      - Violencia gráfica o amenazas.
      - Spam o estafas.
      - Ataques personales.
      
      Responde únicamente en formato JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isAppropriate: {
              type: Type.BOOLEAN,
              description: "True si el contenido es seguro y apropiado, false de lo contrario.",
            },
            reason: {
              type: Type.STRING,
              description: "Una breve explicación en español de por qué el contenido fue rechazado, si aplica.",
            },
          },
          required: ["isAppropriate"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error en la moderación de contenido:", error);
    // En caso de error técnico, permitimos el contenido para no romper la experiencia del usuario,
    // pero lo registramos.
    return { isAppropriate: true };
  }
}
