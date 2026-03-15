import { Link, useLocation } from "react-router-dom";
import { Mountain, MonitorPlay, Video, Library, Home, Languages, Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const navLinks = [
    { path: "/", label: t("nav_home"), icon: Home },
    { path: "/view", label: t("nav_view"), icon: MonitorPlay },
    { path: "/traductor", label: t("nav_translator"), icon: Languages },
    { path: "/recordings", label: t("nav_recordings"), icon: Library },
  ];

  const toggleLanguage = () => {
    setLanguage(language === "es" ? "ayuujk" : "es");
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-brand-bg/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center group-hover:bg-brand-primary/80 transition-colors">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Vida <span className="text-brand-primary">Mixe</span> TV
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-white/5 text-brand-secondary border border-brand-secondary/30 hover:bg-brand-secondary/10 transition-all"
            >
              <Globe className="w-4 h-4" />
              {t("lang_toggle")}
            </button>
          </div>

          {/* Mobile Navigation (Simple Icons) */}
          <div className="flex md:hidden items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`p-2 rounded-full transition-all ${
                    isActive
                      ? "bg-brand-primary text-white"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                  title={link.label}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-full bg-brand-secondary/20 text-brand-secondary"
              title={t("lang_toggle")}
            >
              <Globe className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
