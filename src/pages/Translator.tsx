import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { Languages, Send, Copy, Check, Info, ArrowRightLeft, Sparkles, Volume2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { Helmet } from "react-helmet-async";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

const VARIANT_OPTIONS = [
  { id: "highland", name: "Ayuujk del Norte (Tlahuitoltepec/Ayutla)", description: "Variante de las zonas altas." },
  { id: "midland", name: "Ayuujk del Centro (Zacatepec/Juquila)", description: "Variante de las zonas medias." },
  { id: "lowland", name: "Ayuujk del Sur (Guichicovi/Mazatlán)", description: "Variante de las zonas bajas." },
  { id: "general", name: "Ayuujk General", description: "Traducción estándar o multivariante." },
];

export default function Translator() {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [variant, setVariant] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const selectedVariant = VARIANT_OPTIONS.find(v => v.id === variant)?.name;

      const prompt = `Traduce el siguiente texto del español a la lengua Ayuujk (Mixe), específicamente a la variante: ${selectedVariant}.
      
      Texto a traducir: "${inputText}"
      
      Por favor, proporciona:
      1. La traducción principal en Ayuujk.
      2. Una breve explicación cultural o gramatical si es relevante (opcional).
      
      Formato de respuesta:
      **Traducción:** [Texto en Ayuujk]
      
      **Notas:** [Explicación]`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "Eres un experto lingüista y traductor especializado en las lenguas Ayuujk (Mixe) de Oaxaca.",
        },
      });

      setTranslatedText(response.text || "No se pudo generar la traducción.");
    } catch (err) {
      console.error("Translation error:", err);
      setError("Error al conectar con el servicio.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-neutral-50 py-12 px-6">
      <Helmet>
        <title>Traductor Ayuujk | Vida Mixe TV</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Traductor <span className="text-brand-primary">Ayuujk</span>
          </h1>
        </div>

        <div className="grid gap-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VARIANT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setVariant(opt.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  variant === opt.id ? "bg-brand-primary/10 border-brand-primary" : "bg-brand-surface border-white/5"
                }`}
              >
                <div className="font-semibold text-sm">{opt.name}</div>
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe en español..."
              className="w-full h-64 bg-brand-surface border border-white/10 rounded-3xl p-6 text-lg outline-none resize-none"
            />
            <div className="relative h-64 bg-stone-900 border border-white/5 rounded-3xl p-6 overflow-y-auto">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">Traduciendo...</div>
              ) : (
                <Markdown>{translatedText}</Markdown>
              )}
            </div>
          </div>
          
          <button
            onClick={handleTranslate}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-primary/80 transition-all"
          >
            Traducir
          </button>
        </div>
      </div>
    </div>
  );
}
