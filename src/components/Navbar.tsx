import { Link, useLocation } from "react-router-dom";
import { Mountain, MonitorPlay, Library, Home, Users, LogIn, LogOut, User, Languages } from "lucide-react";
import { auth, loginWithGoogle, logout } from "../firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const location = useLocation();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const navLinks = [
    { path: "/", label: t.nav.home, icon: Home },
    { path: "/view", label: "Ver", icon: MonitorPlay },
    { path: "/recordings", label: "Grabaciones", icon: Library },
    { path: "/team", label: t.nav.team, icon: Users },
  ];

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
          <div className="hidden md:flex items-center gap-1">
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

            <div className="ml-4 pl-4 border-l border-white/10 flex items-center gap-3">
              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                    language === 'es' ? 'bg-brand-primary text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  ES
                </button>
                <button
                  onClick={() => setLanguage('mixe')}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                    language === 'mixe' ? 'bg-brand-primary text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  MIXE
                </button>
              </div>

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ""} className="w-5 h-5 rounded-full" />
                    ) : (
                      <User className="w-4 h-4 text-neutral-400" />
                    )}
                    <span className="text-xs text-neutral-300 font-medium max-w-[100px] truncate">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    title={t.nav.logout}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-brand-bg text-sm font-bold hover:bg-neutral-200 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  {t.nav.login}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation (Simple Icons) */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'es' ? 'mixe' : 'es')}
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5"
            >
              <Languages className="w-5 h-5" />
            </button>
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
          </div>
        </div>
      </div>
    </nav>
  );
}
