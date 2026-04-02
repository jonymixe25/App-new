import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { Languages, Send, Copy, Check, Info, ArrowRightLeft, Sparkles, Volume2, X } from "lucide-react";
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
    setTranslatedText("");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const selectedVariant = VARIANT_OPTIONS.find(v => v.id === variant);

      const prompt = `Traduce el siguiente texto del español a la lengua Ayuujk (Mixe).
      Variante solicitada: ${selectedVariant?.name} (${selectedVariant?.description})
      
      Texto a traducir: "${inputText}"
      
      Por favor, responde con este formato exacto:
      **Traducción:** [Texto traducido]
      
      **Pronunciación aproximada:** [Guía fonética básica]
      
      **Notas culturales/gramaticales:** [Breve explicación sobre la variante o el uso de la palabra]`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "Eres un lingüista experto en lenguas mixe-zoqueanas, específicamente en el Ayuujk de Oaxaca. Tu objetivo es preservar la riqueza lingüística y proporcionar traducciones precisas y respetuosas.",
          temperature: 0.3,
        },
      });

      if (response.text) {
        setTranslatedText(response.text);
      } else {
        throw new Error("No se recibió respuesta del traductor.");
      }
    } catch (err) {
      console.error("Translation error:", err);
      setError("Lo sentimos, hubo un problema con la conexión. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearText = () => {
    setInputText("");
    setTranslatedText("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-neutral-50 py-12 px-6">
      <Helmet>
        <title>Traductor Ayuujk | Vida Mixe TV</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>Inteligencia Artificial Ayuujk</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
            Traductor <span className="text-brand-primary">Ayuujk</span>
          </h1>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Preservando nuestra lengua a través de la tecnología. Selecciona tu variante y comienza a traducir.
          </p>
        </motion.div>

        <div className="grid gap-8">
          {/* Variant Selector */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {VARIANT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setVariant(opt.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  variant === opt.id 
                    ? "bg-brand-primary/10 border-brand-primary text-white shadow-lg shadow-brand-primary/10" 
                    : "bg-brand-surface border-white/5 text-neutral-500 hover:border-white/20"
                }`}
              >
                <div className="font-bold text-xs mb-1">{opt.name.split('(')[0]}</div>
                <div className="text-[10px] opacity-60 line-clamp-1">{opt.description}</div>
                {variant === opt.id && (
                  <motion.div 
                    layoutId="activeVariant"
                    className="absolute bottom-0 left-0 h-1 bg-brand-primary w-full" 
                  />
                )}
              </button>
            ))}
          </div>

          {/* Translation Area */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative group">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                <Languages className="w-3 h-3" />
                Español
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe lo que quieras traducir..."
                className="w-full h-80 bg-brand-surface border border-white/10 rounded-[2.5rem] p-8 pt-12 text-xl outline-none resize-none focus:border-brand-primary/50 transition-all placeholder:text-neutral-700"
              />
              {inputText && (
                <button 
                  onClick={clearText}
                  className="absolute bottom-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-neutral-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative h-80 bg-stone-950 border border-white/5 rounded-[2.5rem] p-8 pt-12 overflow-y-auto group">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                <Sparkles className="w-3 h-3" />
                Ayuujk
              </div>
              
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center space-y-4"
                  >
                    <div className="w-8 h-8 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                    <p className="text-xs text-neutral-500 font-medium animate-pulse">Consultando a los abuelos digitales...</p>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-3"
                  >
                    <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
                      <Info className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-red-400 max-w-[200px]">{error}</p>
                  </motion.div>
                ) : translatedText ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="markdown-body prose prose-invert prose-sm max-w-none"
                  >
                    <Markdown>{translatedText}</Markdown>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center text-neutral-700 text-center italic text-sm">
                    La traducción aparecerá aquí...
                  </div>
                )}
              </AnimatePresence>

              {translatedText && !isLoading && (
                <div className="absolute bottom-6 right-6 flex gap-2">
                  <button 
                    onClick={copyToClipboard}
                    className="p-3 bg-brand-primary text-white rounded-2xl shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all flex items-center gap-2 text-xs font-bold"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleTranslate}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-5 bg-brand-primary disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-3xl font-bold text-lg hover:bg-brand-primary/80 transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3 group"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Traducir a Ayuujk</span>
                <ArrowRightLeft className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              </>
            )}
          </button>
        </div>

        {/* Info Section */}
        <div className="bg-brand-surface/50 border border-white/5 rounded-[3rem] p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-16 h-16 bg-brand-secondary/10 text-brand-secondary rounded-2xl flex items-center justify-center flex-shrink-0">
              <Info className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Sobre las variantes</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                El Ayuujk es una lengua rica y diversa. Aunque nos entendemos entre todos, cada región tiene sus propios giros y sonidos. Este traductor utiliza modelos avanzados para aproximarse lo más posible a la variante que selecciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
