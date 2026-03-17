import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Newspaper, Plus, Trash2, Lock, ArrowLeft, Image as ImageIcon, Send, AlertCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  imageUrl?: string;
}

export default function AdminNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchNews = async (pass: string) => {
    setLoading(true);
    try {
      // We use a simple check for the password by trying to fetch something or just trusting the client for now
      // since the API requires password for POST/DELETE anyway.
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Error al cargar noticias");
      const data = await res.json();
      setNews(data);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "mixe2024") {
      fetchNews(password);
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta noticia?")) return;
    
    try {
      const res = await fetch(`/api/news/${id}?password=${password}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setNews(news.filter(n => n.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, author, imageUrl, password }),
      });
      
      if (!res.ok) throw new Error("Error al publicar noticia");
      
      const newEntry = await res.json();
      setNews([newEntry, ...news]);
      setIsAdding(false);
      setTitle("");
      setContent("");
      setAuthor("");
      setImageUrl("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
        <Helmet>
          <title>Admin Noticias | Vida Mixe TV</title>
        </Helmet>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl"
        >
          <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Panel de Noticias</h1>
          <p className="text-stone-500 text-center mb-8">Ingresa la contraseña para gestionar el contenido</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Contraseña</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
            >
              {loading ? "Verificando..." : "Acceder al Panel"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-6 md:p-12">
      <Helmet>
        <title>Gestión de Noticias | Vida Mixe TV</title>
      </Helmet>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
            <h1 className="text-4xl font-bold text-white flex items-center gap-4">
              <Newspaper className="w-10 h-10 text-brand-primary" />
              Gestión de Noticias
            </h1>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-brand-primary hover:bg-brand-primary/80 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-primary/20"
          >
            {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isAdding ? "Cancelar" : "Nueva Noticia"}
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-primary" />
                  Publicar Nueva Noticia
                </h2>
                <form onSubmit={handleAddNews} className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Título de la Noticia</label>
                      <input 
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Gran inauguración del festival"
                        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Autor / Reportero</label>
                      <input 
                        type="text"
                        required
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Tu nombre o departamento"
                        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">URL de Imagen (Opcional)</label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-3.5 w-5 h-5 text-stone-600" />
                        <input 
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://ejemplo.com/imagen.jpg"
                          className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 flex flex-col">
                    <div className="space-y-2 flex-1 flex flex-col">
                      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Contenido de la Noticia</label>
                      <textarea 
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Escribe el cuerpo de la noticia aquí..."
                        className="w-full flex-1 bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all min-h-[150px] resize-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
                    >
                      {loading ? "Publicando..." : "Publicar Noticia"}
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-stone-800 bg-stone-900/50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Noticias Publicadas ({news.length})</h2>
              <p className="text-stone-500 text-sm">Historial de noticias en la plataforma</p>
            </div>
          </div>

          <div className="divide-y divide-stone-800">
            {news.length === 0 ? (
              <div className="p-12 text-center text-stone-500">No hay noticias publicadas.</div>
            ) : (
              news.map((item) => (
                <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/5 transition-colors group gap-6">
                  <div className="flex items-start gap-6 flex-1">
                    <div className="w-24 h-24 bg-stone-800 rounded-2xl overflow-hidden flex-shrink-0 border border-stone-700">
                      <img 
                        src={item.imageUrl || `https://picsum.photos/seed/${item.id}/200/200`} 
                        alt="" 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{item.author}</span>
                      </div>
                      <h3 className="text-white font-bold text-lg group-hover:text-brand-primary transition-colors">{item.title}</h3>
                      <p className="text-stone-500 text-sm line-clamp-2 max-w-2xl">{item.content}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 text-stone-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all self-end md:self-center"
                    title="Eliminar Noticia"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
