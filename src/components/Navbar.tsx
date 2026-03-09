import { Link, useLocation } from "react-router-dom";
import { Mountain, MonitorPlay, Video, Library, Home, User, LogOut } from "lucide-react";
import { useUser } from "../contexts/UserContext";

interface NavbarProps {
  onOpenAuth?: () => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const location = useLocation();
  const { user, logout } = useUser();

  const navLinks = [
    { path: "/", label: "Inicio", icon: Home },
    { path: "/view", label: "Ver", icon: MonitorPlay },
    { path: "/recordings", label: "Grabaciones", icon: Library },
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
            
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            
            {user ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-white leading-none">{user.name}</span>
                  <span className="text-[10px] text-neutral-500 leading-none mt-1">{user.email}</span>
                </div>
                <button 
                  onClick={() => logout()}
                  className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-5 py-2 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white rounded-full text-sm font-bold transition-all ml-2"
              >
                <User className="w-4 h-4" />
                Entrar
              </button>
            )}
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
            
            {user ? (
              <button 
                onClick={() => logout()}
                className="p-2 text-neutral-400 hover:text-red-400"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="p-2 text-brand-primary"
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
