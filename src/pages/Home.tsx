import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { getSocketUrl } from "../utils/socket";
import LivePreview from "../components/LivePreview";
import { getRecordings, SavedRecording } from "../utils/videoStorage";
import { Video, MonitorPlay, Mountain, CloudFog, Users, MessageSquare, Newspaper, Music, MapPin, X, Play, Sparkles, ArrowRight, ChevronRight, Upload, Image as ImageIcon, ShieldAlert, Loader2 } from "lucide-react";
import { moderateContent } from "../services/moderationService";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  imageUrl?: string;
  videoUrl?: string;
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [randomVideo, setRandomVideo] = useState<SavedRecording | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isModerating, setIsModerating] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  // News form state
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newNews, setNewNews] = useState({ title: "", content: "", imageUrl: "", videoUrl: "", password: "" });

  const fetchNews = () => {
    // Basic session cache check
    const cachedNews = sessionStorage.getItem("vida_mixe_news");
    if (cachedNews && news.length === 0) {
      setNews(JSON.parse(cachedNews));
    }

    fetch("/api/news")
      .then(res => res.json())
      .then(data => {
        setNews(data);
        sessionStorage.setItem("vida_mixe_news", JSON.stringify(data));
      })
      .catch(err => console.error("Error fetching news:", err));
  };

  useEffect(() => {
    fetchNews();

    // Check if anyone is live
    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.on("connect", () => socket.emit("get_broadcasters"));
    socket.on("broadcaster_list", (list: any[]) => {
      setIsLive(list.length > 0);
    });

    // Load random recording
    const loadRandomRecording = async () => {
      try {
        const recordings = await getRecordings();
        if (recordings.length > 0) {
          const random = recordings[Math.floor(Math.random() * recordings.length)];
          setRandomVideo(random);
          setVideoUrl(URL.createObjectURL(random.blob));
          // Show popup after 3 seconds
          setTimeout(() => setShowPopup(true), 3000);
        }
      } catch (err) {
        console.error("Error loading recordings for popup:", err);
      }
    };
    loadRandomRecording();

    return () => { 
      socket.disconnect(); 
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, []);

  const handlePublishNews = async (e: FormEvent) => {
    e.preventDefault();
    setIsModerating(true);
    setModerationError(null);

    try {
      // Moderation check
      const moderation = await moderateContent(`${newNews.title} ${newNews.content}`, "news");
      
      if (!moderation.isAppropriate) {
        setModerationError(moderation.reason || "El contenido no cumple con las normas de la comunidad.");
        setIsModerating(false);
        return;
      }

      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNews)
      });
      if (res.ok) {
        setNewNews({ title: "", content: "", imageUrl: "", videoUrl: "", password: "" });
        setShowNewsForm(false);
        fetchNews();
      } else {
        const data = await res.json();
        alert(data.error || "Error al publicar");
      }
    } catch (err) {
      console.error("Error publishing news:", err);
    } finally {
      setIsModerating(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewNews({ ...newNews, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-neutral-50 flex flex-col font-sans selection:bg-brand-primary selection:text-white">
      <Helmet>
        <title>Vida Mixe TV | Inicio - La Región de los Jamás Conquistados</title>
        <meta name="description" content="Conectando a la comunidad Ayuuk con el mundo. Transmisiones en vivo desde el corazón de la sierra de Oaxaca." />
      </Helmet>

      {/* Atmospheric Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 pb-24">
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ duration: 2, ease: "easeOut" }}
            src="https://picsum.photos/seed/mixe-landscape/1280/720?brightness=50" 
            alt="Sierra Mixe Paisaje" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/20 via-brand-bg/60 to-brand-bg"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-bg/80 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-10 text-center lg:text-left"
          >
            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-brand-primary backdrop-blur-xl shadow-2xl"
              >
                <CloudFog className="w-4 h-4" />
                <span className="text-xs font-bold tracking-[0.2em] uppercase">La región de los jamás conquistados</span>
              </motion.div>
              
              <AnimatePresence>
                {isLive && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 backdrop-blur-xl shadow-2xl shadow-red-500/20"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-black tracking-widest uppercase">En Vivo</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="space-y-4">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-7xl md:text-9xl font-black tracking-tighter text-white leading-[0.85] uppercase"
              >
                Vida <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-emerald-400">Mixe</span> TV
              </motion.h1>
              
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-lg md:text-xl text-neutral-400 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
              >
                Un puente digital entre la herencia ancestral Ayuuk y el mundo moderno. Transmitiendo la esencia de la Sierra Norte.
              </motion.p>
            </div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-4"
            >
              <Link
                to="/view"
                className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-brand-primary text-white font-bold rounded-2xl transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.5)] hover:-translate-y-1 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <MonitorPlay className="w-6 h-6" />
                <span>Explorar Transmisiones</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/team"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all backdrop-blur-md active:scale-95"
              >
                <Users className="w-6 h-6" />
                <span>Nuestro Equipo</span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, rotateY: 20 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="relative perspective-1000"
          >
            <div className="absolute -inset-10 bg-brand-primary/20 blur-[100px] rounded-full"></div>
            <div className="relative bg-stone-900/50 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 shadow-2xl transform hover:rotate-y-12 transition-transform duration-700">
              <LivePreview />
              <div className="absolute -bottom-6 -right-6 bg-brand-surface border border-white/10 p-6 rounded-3xl shadow-2xl hidden md:block animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Estado Actual</p>
                    <p className="text-sm font-bold text-white">{isLive ? 'Transmisión Activa' : 'Próximamente'}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tlahuitoltepec Section - Editorial Style */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 aspect-[4/3] md:aspect-video"
            >
              <img 
                src="https://picsum.photos/seed/tlahuitoltepec-culture/800/600" 
                alt="Santa María Tlahuitoltepec" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl">
                  <p className="text-xs font-bold tracking-widest uppercase text-brand-primary">Ubicación</p>
                  <p className="text-xl font-black text-white">Sierra Norte, Oaxaca</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand-secondary font-bold uppercase tracking-[0.3em] text-xs">
                <div className="w-8 h-[1px] bg-brand-secondary"></div>
                <span>Cuna de Músicos</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-tight">
                Santa María <br />
                <span className="italic font-light text-neutral-300">Tlahuitoltepec</span>
              </h2>
            </div>
            
            <p className="text-lg text-neutral-400 leading-relaxed font-medium">
              El corazón palpitante de la cultura Ayuuk. Aquí, la música no es solo arte, es el lenguaje de la resistencia y la identidad. Hogar del **CECAM**, donde cada nota cuenta la historia de un pueblo que nunca fue conquistado.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-6">
              <div className="space-y-3">
                <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center">
                  <Music className="w-7 h-7" />
                </div>
                <h4 className="text-white font-bold">Sinfonía Mixe</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">Bandas de viento que resuenan en las nubes.</p>
              </div>
              <div className="space-y-3">
                <div className="w-14 h-14 bg-brand-secondary/10 text-brand-secondary rounded-2xl flex items-center justify-center">
                  <Mountain className="w-7 h-7" />
                </div>
                <h4 className="text-white font-bold">Altitud Sagrada</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">Tradiciones preservadas en la cima de la sierra.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News Section - Grid Layout */}
      <section className="py-32 px-6 bg-stone-950/50 border-y border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand-accent font-bold uppercase tracking-[0.3em] text-xs">
                <div className="w-8 h-[1px] bg-brand-accent"></div>
                <span>Actualidad Ayuuk</span>
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter">Noticias de la Sierra</h2>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowNewsForm(!showNewsForm)}
                className="group flex items-center gap-2 px-6 py-3 bg-brand-primary/20 text-brand-primary border border-brand-primary/30 rounded-xl font-bold text-sm transition-all hover:bg-brand-primary hover:text-white"
              >
                <Newspaper className="w-4 h-4" />
                <span>{showNewsForm ? "Cerrar Formulario" : "Publicar Noticia"}</span>
              </button>
              <Link to="/admin-news" className="group flex items-center gap-2 text-neutral-500 hover:text-white font-bold text-sm transition-all">
                <span>Panel Admin</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <AnimatePresence>
            {showNewsForm && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-16 overflow-hidden"
              >
                <form onSubmit={handlePublishNews} className="bg-brand-surface border border-white/10 rounded-3xl p-8 space-y-6 max-w-2xl mx-auto shadow-2xl">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Nueva Publicación</h3>
                  <div className="grid gap-4">
                    <input 
                      type="text" 
                      placeholder="Título de la noticia" 
                      required
                      value={newNews.title}
                      onChange={e => setNewNews({...newNews, title: e.target.value})}
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors"
                    />
                    <textarea 
                      placeholder="Contenido de la noticia..." 
                      required
                      value={newNews.content}
                      onChange={e => setNewNews({...newNews, content: e.target.value})}
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors min-h-[120px]"
                    />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Imagen (Archivo o URL)</label>
                        <div className="flex gap-2">
                          <label className="flex-1 flex items-center justify-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer hover:border-brand-primary transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm truncate">{newNews.imageUrl && newNews.imageUrl.startsWith('data:') ? 'Imagen seleccionada' : 'Subir archivo'}</span>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                          </label>
                          <input 
                            type="url" 
                            placeholder="O pega URL" 
                            value={newNews.imageUrl && !newNews.imageUrl.startsWith('data:') ? newNews.imageUrl : ''}
                            onChange={e => setNewNews({...newNews, imageUrl: e.target.value})}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Video (URL)</label>
                        <input 
                          type="url" 
                          placeholder="URL de Video" 
                          value={newNews.videoUrl}
                          onChange={e => setNewNews({...newNews, videoUrl: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors text-sm"
                        />
                      </div>
                    </div>

                    {newNews.imageUrl && (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                        <img src={newNews.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setNewNews({...newNews, imageUrl: ""})}
                          className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <input 
                      type="password" 
                      placeholder="Contraseña de administrador (mixe2024)" 
                      required
                      value={newNews.password}
                      onChange={e => setNewNews({...newNews, password: e.target.value})}
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors"
                    />
                  </div>

                  {moderationError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm"
                    >
                      <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                      <p>{moderationError}</p>
                    </motion.div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isModerating}
                    className="w-full py-4 bg-brand-primary text-white font-black rounded-xl hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isModerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Moderando contenido...</span>
                      </>
                    ) : (
                      "Publicar Ahora"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {news.length > 0 ? (
              news.map((item, idx) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-brand-surface/40 backdrop-blur-md border border-white/5 rounded-[2rem] overflow-hidden hover:border-brand-primary/30 transition-all hover:-translate-y-2 flex flex-col"
                >
                  {(item.imageUrl || item.videoUrl) && (
                    <div className="relative aspect-video overflow-hidden">
                      {item.videoUrl ? (
                        <video src={item.videoUrl} className="w-full h-full object-cover" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                      ) : (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          referrerPolicy="no-referrer" 
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent opacity-60"></div>
                    </div>
                  )}
                  <div className="p-10 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Por {item.author}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-6 group-hover:text-brand-primary transition-colors leading-tight">{item.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed line-clamp-4 font-medium mb-8">
                      {item.content}
                    </p>
                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-2 text-brand-primary font-bold text-xs group-hover:gap-4 transition-all">
                      <span>Leer más</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <CloudFog className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">No hay noticias en el horizonte</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Facebook Feed Section */}
      <section className="py-32 px-6 bg-brand-bg relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#1877F2] font-bold uppercase tracking-[0.3em] text-xs">
                <div className="w-8 h-[1px] bg-[#1877F2]"></div>
                <span>Redes Sociales</span>
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter">Facebook Feed</h2>
            </div>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="group flex items-center gap-2 text-neutral-500 hover:text-white font-bold text-sm transition-all">
              <span>Seguir en Facebook</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Mock Facebook Posts */}
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl overflow-hidden shadow-xl text-black"
              >
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-black">V</div>
                  <div>
                    <h4 className="text-sm font-bold">Vida Mixe TV</h4>
                    <p className="text-[10px] text-neutral-500 font-medium">Hace {i * 2} horas • <Users className="inline w-2 h-2" /></p>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <p className="text-sm leading-relaxed mb-4">
                    {i === 1 ? "¡Increíble tarde en Tlahuitoltepec! La banda municipal ensayando para la fiesta patronal. #CulturaMixe #Ayuuk" : 
                     i === 2 ? "No te pierdas nuestra transmisión especial mañana a las 10 AM desde el CECAM. Estaremos platicando con los nuevos talentos." : 
                     "Gracias a todos los que se conectaron ayer. Somos una comunidad que crece cada día más allá de las fronteras."}
                  </p>
                </div>
                <div className="aspect-square bg-neutral-100">
                  <img 
                    src={`https://picsum.photos/seed/fb-post-${i}/400/400`} 
                    alt="Facebook Post" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                    loading="lazy"
                  />
                </div>
                <div className="p-4 border-t border-neutral-100 flex items-center justify-between text-neutral-500">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold hover:text-[#1877F2] cursor-pointer">Me gusta</span>
                    <span className="text-xs font-bold hover:text-[#1877F2] cursor-pointer">Comentar</span>
                  </div>
                  <span className="text-xs font-bold hover:text-[#1877F2] cursor-pointer">Compartir</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Minimalist */}
      <footer className="py-20 px-6 border-t border-white/5 bg-brand-bg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Vida Mixe TV</h3>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">La voz de las nubes</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <Link to="/" className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-primary transition-colors">Inicio</Link>
            <Link to="/view" className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-primary transition-colors">Transmisiones</Link>
            <Link to="/recordings" className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-primary transition-colors">Archivo</Link>
            <Link to="/team" className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-primary transition-colors">Equipo</Link>
          </div>

          <div className="text-center md:text-right space-y-2">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} Vida Mixe TV
            </p>
            <p className="text-[10px] text-neutral-600 font-medium">
              Hecho con ❤️ en la Sierra Norte de Oaxaca
            </p>
          </div>
        </div>
      </footer>

      {/* Random Video Popup */}
      <AnimatePresence>
        {showPopup && randomVideo && videoUrl && (
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[100] w-80 md:w-[26rem] perspective-1000"
          >
            <div className="bg-brand-surface/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden group">
              <div className="relative aspect-video bg-black">
                <video 
                  src={videoUrl} 
                  autoPlay 
                  muted 
                  loop 
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent pointer-events-none"></div>
                
                <button 
                  onClick={() => setShowPopup(false)}
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all z-10 border border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-primary">
                      <Sparkles className="w-4 h-4 fill-brand-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Recuerdo Mixe</span>
                    </div>
                    <h4 className="text-lg font-black text-white line-clamp-1 uppercase tracking-tight">{randomVideo.name}</h4>
                  </div>
                  <Link 
                    to="/recordings"
                    className="w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-brand-primary/30"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </Link>
                </div>
              </div>
              <div className="p-5 flex items-center justify-between border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-secondary rounded-full"></div>
                  <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                    {new Date(randomVideo.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <Link to="/recordings" className="text-[10px] text-brand-primary font-black uppercase tracking-widest hover:underline">
                  Explorar Archivo
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
