import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Plus, Lock, Newspaper, User, FileText } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export default function AdminNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthorized) {
      fetchNews();
    }
  }, [isAuthorized]);

  const fetchNews = async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text.slice(0, 50)}`);
      }
      const data = await res.json();
      setNews(data);
    } catch (err: any) {
      console.error("Error fetching news:", err);
      setError(err.message);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "mixe2024") {
      setIsAuthorized(true);
      setError(null);
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, author, password })
      });

      if (!res.ok) throw new Error("Error al publicar noticia");

      setTitle("");
      setContent("");
      setAuthor("");
      fetchNews();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta noticia?")) return;

    try {
      const res = await fetch(`/api/news/${id}?password=${password}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Error al eliminar");
      fetchNews();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
        <Helmet>
          <title>Admin Login | Vida Mixe TV</title>
        </Helmet>
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Administración</h1>
          <p className="text-stone-500 text-center mb-8">Ingresa la contraseña para gestionar noticias</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20"
            >
              Entrar
            </button>
          </form>
          
          <Link to="/" className="block text-center mt-6 text-stone-500 hover:text-stone-300 text-sm transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-50 font-sans">
      <Helmet>
        <title>Gestionar Noticias | Vida Mixe TV</title>
      </Helmet>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-stone-900 rounded-full transition-colors text-stone-400">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-white">Panel de Noticias</h1>
          </div>
          <button 
            onClick={() => setIsAuthorized(false)}
            className="text-stone-500 hover:text-white text-sm"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Form Column */}
          <div className="lg:col-span-1">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sticky top-12">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Nueva Noticia
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Título</label>
                  <div className="relative">
                    <Newspaper className="absolute left-3 top-3 w-5 h-5 text-stone-600" />
                    <input 
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Título de la noticia"
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Autor</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-stone-600" />
                    <input 
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Nombre del autor"
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Contenido</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-stone-600" />
                    <textarea 
                      required
                      rows={5}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Escribe el contenido aquí..."
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                    ></textarea>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Plus className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Publicar Noticia
                </button>
              </form>
            </div>
          </div>

          {/* List Column */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">Noticias Publicadas</h2>
            {news.length > 0 ? (
              news.map((item) => (
                <div key={item.id} className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex justify-between items-start group">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{item.author}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                    <p className="text-stone-400 text-sm line-clamp-2">{item.content}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-stone-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Eliminar noticia"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-stone-900/50 border border-dashed border-stone-800 rounded-3xl">
                <Newspaper className="w-12 h-12 text-stone-700 mx-auto mb-4" />
                <p className="text-stone-500">No hay noticias publicadas aún.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
