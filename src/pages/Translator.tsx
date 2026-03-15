import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { Languages, Send, Copy, Check, Info, ArrowRightLeft, Sparkles } from "lucide-react";
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
      3. Si hay variaciones importantes entre comunidades, menciónalas brevemente.
      
      Formato de respuesta:
      **Traducción:** [Texto en Ayuujk]
      
      **Notas:** [Explicación o contexto]`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "Eres un experto lingüista y traductor especializado en las lenguas Ayuujk (Mixe) de Oaxaca, México. Tu objetivo es proporcionar traducciones precisas y culturalmente respetuosas, reconociendo la diversidad de variantes (Alta, Media, Baja).",
        },
      });

      setTranslatedText(response.text || "No se pudo generar la traducción.");
    } catch (err) {
      console.error("Translation error:", err);
      setError("Hubo un error al conectar con el servicio de traducción. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-neutral-50 py-12 px-6">
      <Helmet>
        <title>Traductor Ayuujk | Vida Mixe TV</title>
        <meta name="description" content="Traduce textos del español a las variantes de la lengua Ayuujk (Mixe). Preservando nuestra lengua materna." />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-accent/20 border border-brand-accent/30 text-brand-accent"
          >
            <Languages className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Preservación Lingüística</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
            Traductor <span className="text-brand-primary">Ayuujk</span>
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Puente lingüístico para fortalecer nuestra identidad. Traduce del español a las variantes de la Sierra Norte.
          </p>
        </div>

        {/* Translator UI */}
        <div className="grid gap-6">
          {/* Variant Selector */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VARIANT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setVariant(opt.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  variant === opt.id
                    ? "bg-brand-primary/10 border-brand-primary text-white shadow-lg shadow-brand-primary/20"
                    : "bg-brand-surface border-white/5 text-neutral-400 hover:border-white/20"
                }`}
              >
                <div className="font-semibold text-sm mb-1">{opt.name}</div>
                <div className="text-xs opacity-60">{opt.description}</div>
              </button>
            ))}
          </div>

          {/* Input/Output Area */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 ml-2">Español</label>
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe algo en español..."
                  className="w-full h-64 bg-brand-surface border border-white/10 rounded-3xl p-6 text-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all resize-none"
                />
                <button
                  onClick={handleTranslate}
                  disabled={isLoading || !inputText.trim()}
                  className="absolute bottom-4 right-4 p-4 bg-brand-primary text-white rounded-2xl hover:bg-brand-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-brand-primary/20"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Sparkles className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Output */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 ml-2">Ayuujk</label>
              <div className="relative h-64 bg-stone-900 border border-white/5 rounded-3xl p-6 overflow-y-auto">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 text-neutral-500">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-2 h-2 bg-brand-primary rounded-full"
                        />
                      ))}
                    </div>
                    <p className="text-sm italic">Consultando con los sabios de la lengua...</p>
                  </div>
                ) : translatedText ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <Markdown>{translatedText}</Markdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
                    <ArrowRightLeft className="w-8 h-8 opacity-20" />
                    <p className="text-sm">La traducción aparecerá aquí</p>
                  </div>
                )}

                {translatedText && !isLoading && (
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copiar traducción"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="bg-brand-surface/50 border border-white/5 rounded-3xl p-8 flex gap-6 items-start"
        >
          <div className="p-3 bg-brand-accent/10 text-brand-accent rounded-2xl">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Sobre la lengua Ayuujk</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              El Ayuujk es una lengua mixe-zoqueana hablada principalmente en la Sierra Norte de Oaxaca. Es una lengua tonal y compleja con una rica historia oral. Este traductor utiliza inteligencia artificial para aproximar traducciones, pero siempre recomendamos consultar con hablantes nativos para contextos ceremoniales o formales.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
