import React, { useState } from "react";
import { Save, Newspaper, User, FileText, Loader2, ShieldAlert, Plus } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { moderateContent } from "../../services/moderationService";
import { handleFirestoreError, OperationType } from "../../firebase";
import toast from "react-hot-toast";

export default function NewsForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setModerationError(null);

    try {
      const moderation = await moderateContent(`${title} ${content}`, "news");
      if (!moderation.isAppropriate) {
        setModerationError(moderation.reason || "El contenido de la noticia no cumple con las normas.");
        toast.error("Contenido inapropiado");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "news"), {
        title,
        content,
        author: author || "Admin",
        date: new Date().toISOString()
      });

      setTitle("");
      setContent("");
      setAuthor("");
      toast.success("Noticia publicada con éxito");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "news");
      toast.error("Error al publicar la noticia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-surface border border-white/5 rounded-3xl p-6 sticky top-12">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Plus className="w-5 h-5 text-brand-primary" />
        Nueva Noticia
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Título</label>
          <div className="relative">
            <Newspaper className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la noticia"
              className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Autor</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
            <input 
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nombre del autor"
              className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Contenido</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
            <textarea 
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el contenido aquí..."
              className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all resize-none"
            ></textarea>
          </div>
        </div>

        {moderationError && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p>{moderationError}</p>
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Publicar Noticia
        </button>
      </form>
    </div>
  );
}
