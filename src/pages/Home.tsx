import { Link } from "react-router-dom";
import { Video, MonitorPlay, Mountain, CloudFog, Users, MessageSquare, Newspaper, Music, MapPin, Languages, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import LivePreview from "../components/LivePreview";
import CulturalCalendar from "../components/CulturalCalendar";
import { useLanguage } from "../context/LanguageContext";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    fetch("/api/news")
      .then(res => res.json())
      .then(data => setNews(data))
      .catch(err => console.error("Error fetching news:", err));
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg text-neutral-50 flex flex-col font-sans">
      <Helmet>
        <title>Vida Mixe TV | {t("nav_home")}</title>
        <meta name="description" content={t("hero_description")} />
      </Helmet>
      {/* Hero Section */}
      <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/oaxaca-mountains/1920/1080?blur=2" 
            alt="Montañas de la Sierra Mixe" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/50 via-brand-bg/80 to-brand-bg"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-brand-primary backdrop-blur-sm">
              <CloudFog className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wide uppercase">{t("hero_subtitle")}</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white leading-none">
              Vida <span className="text-brand-primary">Mixe</span> TV
            </h1>
            
            <p className="text-xl md:text-2xl text-neutral-300 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
              {t("hero_description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link
                to="/view"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-primary hover:bg-brand-primary/80 text-white font-semibold rounded-full transition-all shadow-lg shadow-brand-primary/40 hover:scale-105"
              >
                <MonitorPlay className="w-5 h-5" />
                {t("hero_cta_view")}
              </Link>
              <Link
                to="/traductor"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-all backdrop-blur-md border border-white/10 hover:scale-105"
              >
                <Languages className="w-5 h-5" />
                {t("hero_cta_translator")}
              </Link>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <Link to="/view" className="relative block">
              <LivePreview />
            </Link>
          </div>
        </div>
      </div>

      {/* Tlahuitoltepec Section */}
      <div className="bg-stone-950 py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute -inset-4 bg-emerald-500/10 blur-2xl rounded-full"></div>
            <img 
              src="https://picsum.photos/seed/tlahuitoltepec/800/600" 
              alt="Santa María Tlahuitoltepec" 
              className="relative rounded-3xl shadow-2xl border border-stone-800"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <div className="flex items-center gap-2 text-brand-secondary font-semibold uppercase tracking-widest text-sm">
              <MapPin className="w-4 h-4" />
              <span>{t("section_featured_title")}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{t("section_tlahui_title")}</h2>
            <p className="text-lg text-neutral-400 leading-relaxed">
              {t("section_tlahui_desc")}
            </p>
            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-brand-primary/20 text-brand-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Tradición Musical</h4>
                  <p className="text-sm text-neutral-500">Hogar de las bandas de viento más emblemáticas.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-brand-secondary/20 text-brand-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mountain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Identidad Ayuuk</h4>
                  <p className="text-sm text-neutral-500">Preservando la lengua y el orgullo indígena.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* News Section */}
      <div className="bg-brand-bg py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-brand-accent font-semibold uppercase tracking-widest text-sm">
                <Newspaper className="w-4 h-4" />
                <span>{t("news_subtitle")}</span>
              </div>
              <h2 className="text-4xl font-bold text-white">{t("news_title")}</h2>
            </div>
            <Link to="/admin-news" className="text-neutral-500 hover:text-white text-sm transition-colors">
              Acceso Admin
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {news.length > 0 ? (
                  news.map((item) => (
                    <div key={item.id} className="bg-brand-surface border border-white/5 rounded-2xl p-8 hover:border-brand-primary/30 transition-all group">
                      <div className="text-xs text-neutral-500 mb-4 flex items-center gap-2">
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Por {item.author}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4 group-hover:text-brand-primary transition-colors">{item.title}</h3>
                      <p className="text-neutral-400 text-sm leading-relaxed line-clamp-3">
                        {item.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-neutral-500">
                    {t("news_empty")}
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <CulturalCalendar />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-brand-bg py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Card 1 */}
          <div className="bg-brand-surface border border-white/5 rounded-2xl p-8 hover:bg-brand-surface/80 transition-colors group">
            <div className="w-12 h-12 bg-brand-secondary/10 text-brand-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Mountain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{t("feature_culture_title")}</h3>
            <p className="text-neutral-400 leading-relaxed">
              {t("feature_culture_desc")}
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-brand-surface border border-white/5 rounded-2xl p-8 hover:bg-brand-surface/80 transition-colors group">
            <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{t("feature_community_title")}</h3>
            <p className="text-neutral-400 leading-relaxed">
              {t("feature_community_desc")}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-brand-surface border border-white/5 rounded-2xl p-8 hover:bg-brand-surface/80 transition-colors group">
            <div className="w-12 h-12 bg-brand-accent/10 text-brand-accent rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Languages className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{t("feature_translator_title")}</h3>
            <p className="text-neutral-400 leading-relaxed">
              {t("feature_translator_desc")}
            </p>
            <Link to="/traductor" className="inline-flex items-center gap-2 mt-4 text-brand-accent text-sm font-medium hover:underline">
              {t("nav_translator")} <Sparkles className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 4 */}
          <div className="bg-brand-surface border border-white/5 rounded-2xl p-8 hover:bg-brand-surface/80 transition-colors group">
            <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{t("feature_interaction_title")}</h3>
            <p className="text-neutral-400 leading-relaxed">
              {t("feature_interaction_desc")}
            </p>
          </div>
        </div>

        <div className="mt-20 text-center border-t border-white/5 pt-12">
          <p className="text-neutral-500 text-sm">
            © {new Date().getFullYear()} Vida Mixe TV. {t("footer_made_with")}
          </p>
        </div>
      </div>
    </div>
  );
}
