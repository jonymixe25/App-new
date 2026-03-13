import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Plus, Lock, Newspaper, User, FileText, Video, Image as ImageIcon, DollarSign, Link as LinkIcon } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

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

export default function AdminNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [videos, setVideos] = useState<CommunityVideo[]>([]);
  const [activeTab, setActiveTab] = useState<"news" | "videos">("news");
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { t } = useLanguage();
  
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthorized) {
      fetchNews();
      fetchVideos();
    }
  }, [isAuthorized]);

  const fetchNews = async () => {
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      setNews(data);
    } catch (err) {
      console.error("Error fetching news:", err);
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/community-videos");
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      console.error("Error fetching videos:", err);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "mixe2024") {
      setIsAuthorized(true);
      setError(null);
    } else {
      setError(t.adminNews.wrongPassword);
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

      if (!res.ok) throw new Error(t.adminNews.errorPublishingNews);

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

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/community-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: vTitle, 
          author: vAuthor, 
          thumbnail: vThumbnail, 
          price: vPrice, 
          video_url: vUrl,
          password 
        })
      });

      if (!res.ok) throw new Error(t.adminNews.errorPublishingVideo);

      setVTitle("");
      setVAuthor("");
      setVThumbnail("");
      setVPrice("");
      setVUrl("");
      fetchVideos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.adminNews.confirmDeleteNews)) return;

    try {
      const res = await fetch(`/api/news/${id}?password=${password}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error(t.adminNews.errorDeleting);
      fetchNews();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVideoDelete = async (id: string) => {
    if (!confirm(t.adminNews.confirmDeleteVideo)) return;

    try {
      const res = await fetch(`/api/community-videos/${id}?password=${password}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error(t.adminNews.errorDeleting);
      fetchVideos();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <Helmet>
          <title>{t.adminNews.loginHelmet}</title>
        </Helmet>
        <div className="w-full max-w-md bg-brand-surface border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">{t.adminNews.loginTitle}</h1>
          <p className="text-neutral-500 text-center mb-8">{t.adminNews.loginSubtitle}</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.adminNews.passwordPlaceholder}
                className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-brand-primary/20"
            >
              {t.adminNews.enter}
            </button>
          </form>
          
          <Link to="/" className="block text-center mt-6 text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
            {t.adminNews.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-neutral-50 font-sans">
      <Helmet>
        <title>{t.adminNews.panelHelmet}</title>
      </Helmet>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-brand-surface rounded-full transition-colors text-neutral-400">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-white">{t.adminNews.panelTitle}</h1>
          </div>
          <div className="flex bg-brand-surface p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab("news")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "news" ? "bg-brand-primary text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              {t.adminNews.newsTab}
            </button>
            <button 
              onClick={() => setActiveTab("videos")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "videos" ? "bg-brand-primary text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              {t.adminNews.videosTab}
            </button>
          </div>
          <button 
            onClick={() => setIsAuthorized(false)}
            className="text-neutral-500 hover:text-white text-sm"
          >
            {t.adminNews.logout}
          </button>
        </div>

        {activeTab === "news" ? (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* News Form Column */}
            <div className="lg:col-span-1">
              <div className="bg-brand-surface border border-white/5 rounded-3xl p-6 sticky top-12">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-primary" />
                  {t.adminNews.newNews}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">{t.adminNews.newsTitle}</label>
                    <div className="relative">
                      <Newspaper className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t.adminNews.newsTitle}
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">{t.adminNews.newsAuthor}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder={t.adminNews.newsAuthor}
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">{t.adminNews.newsContent}</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <textarea 
                        required
                        rows={5}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={t.adminNews.newsContent}
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all resize-none"
                      ></textarea>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Plus className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {t.adminNews.publishNews}
                  </button>
                </form>
              </div>
            </div>

            {/* News List Column */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-white mb-6">{t.adminNews.publishedNews}</h2>
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
                      title={t.recordings.delete}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-brand-surface/50 border border-dashed border-white/5 rounded-3xl">
                  <Newspaper className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500">{t.adminNews.noNews}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Video Form Column */}
            <div className="lg:col-span-1">
              <div className="bg-brand-surface border border-white/5 rounded-3xl p-6 sticky top-12">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Video className="w-5 h-5 text-brand-secondary" />
                  {t.adminNews.newVideo}
                </h2>
                
                <form onSubmit={handleVideoSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">{t.adminNews.videoTitle}</label>
                    <div className="relative">
                      <Video className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="text"
                        required
                        value={vTitle}
                        onChange={(e) => setVTitle(e.target.value)}
                        placeholder={t.adminNews.videoTitle}
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">{t.adminNews.videoAuthor}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="text"
                        required
                        value={vAuthor}
                        onChange={(e) => setVAuthor(e.target.value)}
                        placeholder={t.adminNews.videoAuthor}
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">{t.adminNews.videoThumbnail}</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="url"
                        required
                        value={vThumbnail}
                        onChange={(e) => setVThumbnail(e.target.value)}
                        placeholder={t.adminNews.urlPlaceholder}
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">{t.adminNews.videoPrice}</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="text"
                        required
                        value={vPrice}
                        onChange={(e) => setVPrice(e.target.value)}
                        placeholder={t.adminNews.pricePlaceholder}
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">{t.adminNews.videoUrl}</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                      <input 
                        type="url"
                        required
                        value={vUrl}
                        onChange={(e) => setVUrl(e.target.value)}
                        placeholder={t.adminNews.urlPlaceholder}
                        className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-secondary hover:bg-brand-secondary/80 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-brand-secondary/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Plus className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {t.adminNews.publishVideo}
                  </button>
                </form>
              </div>
            </div>

            {/* Video List Column */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-white mb-6">{t.adminNews.communityVideos}</h2>
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
                      title={t.recordings.delete}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-brand-surface/50 border border-dashed border-white/5 rounded-3xl">
                  <Video className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500">{t.adminNews.noVideos}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
