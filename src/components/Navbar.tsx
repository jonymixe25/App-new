import { Link, useLocation } from "react-router-dom";
import { Mountain, MonitorPlay, Video, Library, Home } from "lucide-react";

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Inicio", icon: Home },
    { path: "/view", label: "Ver", icon: MonitorPlay },
    { path: "/recordings", label: "Grabaciones", icon: Library },
    { path: "/admin", label: "Transmitir", icon: Video },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-stone-900/80 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Vida <span className="text-emerald-400">Mixe</span> TV
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
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                      : "text-stone-400 hover:text-white hover:bg-stone-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
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
                      ? "bg-emerald-600 text-white"
                      : "text-stone-400 hover:text-white hover:bg-stone-800"
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
