import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, Newspaper, Video, Users } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { handleFirestoreError, OperationType } from "../firebase";
import NewsForm from "../components/admin/NewsForm";
import NewsList from "../components/admin/NewsList";
import VideoForm from "../components/admin/VideoForm";
import VideoList from "../components/admin/VideoList";
import TeamForm from "../components/admin/TeamForm";
import TeamList from "../components/admin/TeamList";

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
  published: boolean;
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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'mixecultura25@gmail.com') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
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
      }, (error) => handleFirestoreError(error, OperationType.GET, "news"));
      
      const unsubVideos = onSnapshot(collection(db, "community_videos"), (snapshot) => {
        const videoData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CommunityVideo[];
        setVideos(videoData);
      }, (error) => handleFirestoreError(error, OperationType.GET, "community_videos"));
      
      const unsubTeam = onSnapshot(collection(db, "team"), (snapshot) => {
        const teamData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeamMember[];
        setTeam(teamData);
      }, (error) => handleFirestoreError(error, OperationType.GET, "team"));
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
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
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
            <button 
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-brand-primary/20"
            >
              Iniciar Sesión con Google
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg p-6 lg:p-12">
      <Helmet>
        <title>Panel de Administración | Vida Mixe TV</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link to="/" className="text-neutral-500 hover:text-white flex items-center gap-2 mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver al sitio
            </Link>
            <h1 className="text-4xl font-bold text-white">Panel de Administración</h1>
          </div>
          <button onClick={handleLogout} className="text-neutral-500 hover:text-red-500 transition-colors">Cerrar Sesión</button>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab("news")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "news" ? "bg-brand-primary text-white" : "text-neutral-500 hover:text-neutral-300"}`}>Noticias</button>
          <button onClick={() => setActiveTab("videos")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "videos" ? "bg-brand-secondary text-white" : "text-neutral-500 hover:text-neutral-300"}`}>Videos</button>
          <button onClick={() => setActiveTab("team")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "team" ? "bg-brand-primary text-white" : "text-neutral-500 hover:text-neutral-300"}`}>Equipo</button>
        </div>

        <div className="mb-8">
          <input 
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md bg-brand-surface border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
          />
        </div>

        {activeTab === "news" ? (
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <NewsForm />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <NewsList news={news} searchQuery={searchQuery} />
            </div>
          </div>
        ) : activeTab === "videos" ? (
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <VideoForm />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <VideoList videos={videos} searchQuery={searchQuery} />
            </div>
          </div>
        ) : activeTab === "team" ? (
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <TeamForm />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <TeamList team={team} searchQuery={searchQuery} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
