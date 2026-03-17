import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Users, Trash2, ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface User {
  id: string;
  username: string;
  name: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (pass: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/users?password=${pass}`);
      if (!res.ok) throw new Error("Contraseña incorrecta");
      const data = await res.json();
      setUsers(data);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    
    try {
      const res = await fetch(`/api/auth/users/${id}?password=${password}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar usuario");
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(password);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
        <Helmet>
          <title>Admin Usuarios | Vida Mixe TV</title>
        </Helmet>
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Acceso Administrativo</h1>
          <p className="text-stone-500 text-center mb-8">Ingresa la contraseña maestra para gestionar usuarios</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Contraseña Maestra</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              {loading ? "Cargando..." : "Acceder"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-6 md:p-12">
      <Helmet>
        <title>Gestión de Usuarios | Vida Mixe TV</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
            <h1 className="text-4xl font-bold text-white flex items-center gap-4">
              <Users className="w-10 h-10 text-emerald-500" />
              Gestión de Usuarios
            </h1>
          </div>
          <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full border border-emerald-500/20 flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="w-4 h-4" />
            Modo Administrador
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-stone-800 bg-stone-900/50">
            <h2 className="text-lg font-bold text-white">Usuarios Registrados ({users.length})</h2>
            <p className="text-stone-500 text-sm">Lista de locutores y colaboradores con acceso a la plataforma</p>
          </div>

          <div className="divide-y divide-stone-800">
            {users.length === 0 ? (
              <div className="p-12 text-center text-stone-500">No hay usuarios registrados.</div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center text-stone-400 font-bold text-xl group-hover:bg-emerald-500/20 group-hover:text-emerald-500 transition-all">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{user.name}</h3>
                      <p className="text-stone-500 text-sm">@{user.username}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-3 text-stone-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Eliminar Usuario"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
