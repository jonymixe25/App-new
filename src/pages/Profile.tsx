import React from "react";
import { motion } from "motion/react";
import { useUser } from "../contexts/UserContext";
import { User, ShieldCheck, Mail, Calendar, LogOut, Video, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-white">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-surface border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-brand-primary/40 to-brand-secondary/40 relative">
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-full border-4 border-brand-surface overflow-hidden bg-brand-bg">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-primary bg-brand-primary/10">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-16 pb-8 px-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  {user.name}
                  {user.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
                      <ShieldCheck className="w-3 h-3" />
                      Administrador
                    </span>
                  )}
                </h1>
                <p className="text-neutral-400 mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>

            {user.role === 'admin' && (
              <div className="mt-8 p-6 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-primary" />
                  Panel de Control
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link 
                    to="/transmitir"
                    className="flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-brand-primary/20"
                  >
                    <Video className="w-5 h-5" />
                    Iniciar Transmisión
                  </Link>
                  <Link 
                    to="/admin-news"
                    className="flex items-center justify-center gap-2 bg-brand-surface hover:bg-white/10 border border-white/10 text-white font-semibold py-3 px-4 rounded-xl transition-all"
                  >
                    <Settings className="w-5 h-5" />
                    Gestionar Contenido
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Información de la Cuenta</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">ID de Usuario</p>
                    <p className="font-mono text-sm text-neutral-300 break-all">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Rol</p>
                    <p className="text-neutral-300 capitalize">{user.role || 'Usuario'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Acerca de Nosotros</h3>
                <p className="text-neutral-300 text-sm leading-relaxed">
                  Vida Mixe TV es un proyecto dedicado a la preservación y difusión de la cultura Ayuuk. 
                  <br /><br />
                  <strong>Jonatan García Díaz</strong> es parte fundamental de nuestro equipo, trabajando para llevar nuestra cultura a más personas.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
