import { Link } from "react-router-dom";
import { Video, MonitorPlay, Mountain, CloudFog, Users, MessageSquare, Newspaper, Music, MapPin } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import LivePreview from "../components/LivePreview";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetch("/api/news")
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error ${res.status}: ${text.slice(0, 50)}`);
        }
        return res.json();
      })
      .then(data => setNews(data))
      .catch(err => {
        console.error("Error fetching news:", err);
        // Fallback or error state
      });
  }, []);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-50 flex flex-col font-sans">
      <Helmet>
        <title>Vida Mixe TV | Inicio - La Región de los Jamás Conquistados</title>
        <meta name="description" content="Conectando a la comunidad Ayuuk con el mundo. Transmisiones en vivo desde el corazón de la sierra de Oaxaca." />
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
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-stone-900/80 to-stone-900"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/40 border border-emerald-500/30 text-emerald-200 backdrop-blur-sm">
              <CloudFog className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wide uppercase">La región de los jamás conquistados</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white leading-none">
              Vida <span className="text-emerald-400">Mixe</span> TV
            </h1>
            
            <p className="text-xl md:text-2xl text-stone-300 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
              Conectando a la comunidad Ayuuk con el mundo. Transmisiones en vivo desde el corazón de la sierra de Oaxaca.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link
                to="/view"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-full transition-all shadow-lg shadow-emerald-900/40 hover:scale-105"
              >
                <MonitorPlay className="w-5 h-5" />
                Ver en Pantalla Completa
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
            <div className="flex items-center gap-2 text-emerald-400 font-semibold uppercase tracking-widest text-sm">
              <MapPin className="w-4 h-4" />
              <span>Destacado de la Sierra</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Santa María Tlahuitoltepec</h2>
            <p className="text-lg text-stone-400 leading-relaxed">
              Cuna de músicos y corazón de la cultura Ayuuk. Tlahuitoltepec es mundialmente reconocido por el **CECAM** (Centro de Capacitación Musical y Desarrollo de la Cultura Mixe), donde la música de banda se convierte en el alma del pueblo.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Tradición Musical</h4>
                  <p className="text-sm text-stone-500">Hogar de las bandas de viento más emblemáticas.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mountain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Identidad Ayuuk</h4>
                  <p className="text-sm text-stone-500">Preservando la lengua y el orgullo indígena.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* News Section */}
      <div className="bg-stone-900 py-24 px-6 border-t border-stone-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold uppercase tracking-widest text-sm">
                <Newspaper className="w-4 h-4" />
                <span>Actualidad</span>
              </div>
              <h2 className="text-4xl font-bold text-white">Noticias Comunitarias</h2>
            </div>
            <Link to="/admin-news" className="text-stone-500 hover:text-white text-sm transition-colors">
              Acceso Admin
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.length > 0 ? (
              news.map((item) => (
                <div key={item.id} className="bg-stone-800/40 border border-stone-700/50 rounded-2xl p-8 hover:border-emerald-500/30 transition-all group">
                  <div className="text-xs text-stone-500 mb-4 flex items-center gap-2">
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Por {item.author}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed line-clamp-3">
                    {item.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-stone-500">
                No hay noticias publicadas en este momento.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-stone-950 py-24 px-6 border-t border-stone-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-stone-800/50 border border-stone-700/50 rounded-2xl p-8 hover:bg-stone-800 transition-colors group">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Mountain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Cultura Viva</h3>
            <p className="text-stone-400 leading-relaxed">
              Difundiendo las tradiciones, música y lengua del pueblo Ayuuk. Un espacio para nuestras voces.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-stone-800/50 border border-stone-700/50 rounded-2xl p-8 hover:bg-stone-800 transition-colors group">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Comunidad Global</h3>
            <p className="text-stone-400 leading-relaxed">
              Acercando a los paisanos que están lejos. Mantente conectado con tu tierra y tu gente en tiempo real.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-stone-800/50 border border-stone-700/50 rounded-2xl p-8 hover:bg-stone-800 transition-colors group">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Interacción Directa</h3>
            <p className="text-stone-400 leading-relaxed">
              Participa en el chat en vivo y únete a las conversaciones. Tu opinión es parte de nuestra historia.
            </p>
          </div>
        </div>

        <div className="mt-20 text-center border-t border-stone-800 pt-12">
          <p className="text-stone-500 text-sm">
            © {new Date().getFullYear()} Vida Mixe TV. Hecho con ❤️ desde la Sierra Norte de Oaxaca.
          </p>
        </div>
      </div>
    </div>
  );
}
