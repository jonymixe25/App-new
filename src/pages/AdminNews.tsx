import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Plus, Lock, Newspaper, User, FileText, Video, Image as ImageIcon, DollarSign, Link as LinkIcon, ShieldAlert, Loader2, Users, Linkedin, Twitter, Github, Mail } from "lucide-react";
import { moderateContent } from "../services/moderationService";
import { db, auth } from "../firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

interface CommunityVideo {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  price: string;
  video_url: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  icon: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  email?: string;
}

export default function AdminNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [videos, setVideos] = useState<CommunityVideo[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<"news" | "videos" | "team">("news");
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'mixecultura25@gmail.com') {
        setIsAuthorized(true);
        setUserEmail(user.email);
      } else {
        setIsAuthorized(false);
        setUserEmail(user?.email || null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      const unsubNews = onSnapshot(collection(db, "news"), (snapshot) => {
        const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NewsItem[];
        newsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNews(newsData);
      });
      const unsubVideos = onSnapshot(collection(db, "community_videos"), (snapshot) => {
        const videoData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CommunityVideo[];
        setVideos(videoData);
      });
      const unsubTeam = onSnapshot(collection(db, "team"), (snapshot) => {
        const teamData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeamMember[];
        setTeam(teamData);
      });
      return () => {
        unsubNews();
        unsubVideos();
        unsubTeam();
      };
    }
  }, [isAuthorized]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // News Form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  
  // Video Form
  const [vTitle, setVTitle] = useState("");
  const [vAuthor, setVAuthor] = useState("");
  const [vThumbnail, setVThumbnail] = useState("");
  const [vPrice, setVPrice] = useState("");
  const [vUrl, setVUrl] = useState("");

  // Team Form
  const [tName, setTName] = useState("");
  const [tRole, setTRole] = useState("");
  const [tBio, setTBio] = useState("");
  const [tImage, setTImage] = useState("");
  const [tIcon, setTIcon] = useState("Heart");
  const [tLinkedin, setTLinkedin] = useState("");
  const [tTwitter, setTTwitter] = useState("");
  const [tGithub, setTGithub] = useState("");
  const [tEmail, setTEmail] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setTImage(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setModerationError(null);

    try {
      // Moderation check
      const moderation = await moderateContent(`${title} ${content}`, "news");
      if (!moderation.isAppropriate) {
        setModerationError(moderation.reason || "El contenido de la noticia no cumple con las normas.");
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setModerationError(null);

    try {
      // Moderation check for video title
      const moderation = await moderateContent(vTitle, "news");
      if (!moderation.isAppropriate) {
        setModerationError(moderation.reason || "El título del video no cumple con las normas.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "community_videos"), {
        title: vTitle,
        author: vAuthor,
        thumbnail: vThumbnail,
        price: vPrice,
        video_url: vUrl
      });

      setVTitle("");
      setVAuthor("");
      setVThumbnail("");
      setVPrice("");
      setVUrl("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta noticia?")) return;

    try {
      await deleteDoc(doc(db, "news", id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVideoDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este video?")) return;

    try {
      await deleteDoc(doc(db, "community_videos", id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, "team"), {
        name: tName,
        role: tRole,
        bio: tBio,
        image: tImage,
        icon: tIcon,
        linkedin: tLinkedin || null,
        twitter: tTwitter || null,
        github: tGithub || null,
        email: tEmail || null
      });

      setTName("");
      setTRole("");
      setTBio("");
      setTImage("");
      setTIcon("Heart");
      setTLinkedin("");
      setTTwitter("");
      setTGithub("");
      setTEmail("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este miembro del equipo?")) return;

    try {
      await deleteDoc(doc(db, "team", id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <Helmet>
          <title>Admin Login | Vida Mixe TV</title>
        </Helmet>
        <div className="w-full max-w-md bg-brand-surface border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Administración</h1>
          <p className="text-neutral-500 text-center mb-8">Ingresa con tu cuenta de Google para gestionar contenido</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-brand-primary/20"
            >
              Iniciar Sesión con Google
            </button>
          </form>
          
          <Link to="/" className="block text-center mt-6 text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-neutral-50 font-sans">
      <Helmet>
        <title>Gestionar Noticias | Vida Mixe TV</title>
      </Helmet>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-brand-surface rounded-full transition-colors text-neutral-400">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/transmitir"
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/80 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-primary/20"
            >
              <Video className="w-4 h-4" />
              Transmitir
            </Link>
            {userEmail && <span className="text-sm text-neutral-400 hidden sm:inline">{userEmail}</span>}
            <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">Cerrar Sesión</button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-12">
          <div className="flex bg-brand-surface p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab("news")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "news" ? "bg-brand-primary text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              Noticias
            </button>
            <button 
              onClick={() => setActiveTab("videos")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "videos" ? "bg-brand-primary text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              Videos
            </button>
            <button 
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "team" ? "bg-brand-primary text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              Equipo
            </button>
          </div>
          <button 
            onClick={() => setIsAuthorized(false)}
            className="text-neutral-500 hover:text-white text-sm"
          >
            Cerrar Sesión
          </button>
        </div>

        {activeTab === "news" ? (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* News Form Column */}
            <div className="lg:col-span-1">
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

                  {error && <p className="text-red-500 text-sm">{error}</p>}

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
            </div>

            {/* News List Column */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-white mb-6">Noticias Publicadas</h2>
              {news.length > 0 ? (
                news.map((item) => (
                  <div key={item.id} className="bg-brand-surface border border-white/5 rounded-3xl p-6 flex justify-between items-start group">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{item.author}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors">{item.title}</h3>
                      <p className="text-neutral-400 text-sm line-clamp-2">{item.content}</p>
                    </div>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Eliminar noticia"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-brand-surface/50 border border-dashed border-white/5 rounded-3xl">
                  <Newspaper className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500">No hay noticias publicadas aún.</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "videos" ? (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Video Form Column */}
            <div className="lg:col-span-1">
              <div className="bg-brand-surface border border-white/5 rounded-3xl p-6 sticky top-12">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Video className="w-5 h-5 text-brand-secondary" />
                  Nuevo Video
                </h2>
                
                <form onSubmit={handleVideoSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Título</label>
                    <div className="relative">
                      <Video className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="text"
                        required
                        value={vTitle}
                        onChange={(e) => setVTitle(e.target.value)}
                        placeholder="Título del video"
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Autor</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="text"
                        required
                        value={vAuthor}
                        onChange={(e) => setVAuthor(e.target.value)}
                        placeholder="Nombre del autor"
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">URL Miniatura</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="url"
                        required
                        value={vThumbnail}
                        onChange={(e) => setVThumbnail(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Precio</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="text"
                        required
                        value={vPrice}
                        onChange={(e) => setVPrice(e.target.value)}
                        placeholder="$100 MXN"
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">URL Video (MP4)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="url"
                        required
                        value={vUrl}
                        onChange={(e) => setVUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
                      />
                    </div>
                  </div>

                  {moderationError && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                      <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                      <p>{moderationError}</p>
                    </div>
                  )}

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-secondary hover:bg-brand-secondary/80 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-brand-secondary/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Publicar Video
                  </button>
                </form>
              </div>
            </div>

            {/* Video List Column */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-white mb-6">Videos de la Comunidad</h2>
              {videos.length > 0 ? (
                videos.map((video) => (
                  <div key={video.id} className="bg-brand-surface border border-white/5 rounded-3xl p-4 flex gap-6 items-center group">
                    <div className="w-32 aspect-video rounded-xl overflow-hidden flex-shrink-0">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate group-hover:text-brand-secondary transition-colors">{video.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                        <span>{video.author}</span>
                        <span>•</span>
                        <span className="text-brand-secondary font-bold">{video.price}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleVideoDelete(video.id)}
                      className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Eliminar video"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-brand-surface/50 border border-dashed border-white/5 rounded-3xl">
                  <Video className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500">No hay videos publicados aún.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Team Form Column */}
            <div className="lg:col-span-1">
              <div className="bg-brand-surface border border-white/5 rounded-3xl p-6 sticky top-12">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-primary" />
                  Nuevo Miembro
                </h2>
                
                <form onSubmit={handleTeamSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Nombre</label>
                    <input 
                      type="text"
                      required
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Rol / Cargo</label>
                    <input 
                      type="text"
                      required
                      value={tRole}
                      onChange={(e) => setTRole(e.target.value)}
                      placeholder="Ej. Director de Producción"
                      className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Biografía Corta</label>
                    <textarea 
                      required
                      rows={3}
                      value={tBio}
                      onChange={(e) => setTBio(e.target.value)}
                      placeholder="Breve descripción..."
                      className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all resize-none"
                    ></textarea>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Foto de Perfil</label>
                    <div className="flex items-center gap-4">
                      {tImage && (
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-brand-bg border border-white/10">
                          <img src={tImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30 transition-all cursor-pointer"
                        />
                        <input 
                          type="text"
                          value={tImage}
                          onChange={(e) => setTImage(e.target.value)}
                          placeholder="O pega una URL de imagen..."
                          className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Icono</label>
                      <select 
                        value={tIcon}
                        onChange={(e) => setTIcon(e.target.value)}
                        className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                      >
                        <option value="Heart">Corazón</option>
                        <option value="Camera">Cámara</option>
                        <option value="Music">Música</option>
                        <option value="Code">Código</option>
                        <option value="Mic2">Micrófono</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Email</label>
                      <input 
                        type="email"
                        value={tEmail}
                        onChange={(e) => setTEmail(e.target.value)}
                        placeholder="email@vidamixe.tv"
                        className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">LinkedIn</label>
                      <input 
                        type="text"
                        value={tLinkedin}
                        onChange={(e) => setTLinkedin(e.target.value)}
                        placeholder="#"
                        className="w-full bg-brand-bg border border-white/5 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Twitter</label>
                      <input 
                        type="text"
                        value={tTwitter}
                        onChange={(e) => setTTwitter(e.target.value)}
                        placeholder="#"
                        className="w-full bg-brand-bg border border-white/5 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">GitHub</label>
                      <input 
                        type="text"
                        value={tGithub}
                        onChange={(e) => setTGithub(e.target.value)}
                        placeholder="#"
                        className="w-full bg-brand-bg border border-white/5 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-[10px]">{error}</p>}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar Miembro
                  </button>
                </form>
              </div>
            </div>

            {/* Team List Column */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-white mb-6">Nuestro Equipo</h2>
              {team.length > 0 ? (
                team.map((member) => (
                  <div key={member.id} className="bg-brand-surface border border-white/5 rounded-3xl p-4 flex gap-4 items-center group">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white truncate group-hover:text-brand-primary transition-colors">{member.name}</h3>
                      <p className="text-brand-secondary text-xs font-medium uppercase tracking-wider">{member.role}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {member.email && <Mail className="w-3 h-3 text-neutral-500" />}
                        {member.linkedin && <Linkedin className="w-3 h-3 text-neutral-500" />}
                        {member.twitter && <Twitter className="w-3 h-3 text-neutral-500" />}
                        {member.github && <Github className="w-3 h-3 text-neutral-500" />}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleTeamDelete(member.id)}
                      className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Eliminar miembro"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-brand-surface/50 border border-dashed border-white/5 rounded-3xl">
                  <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500">No hay miembros registrados.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
