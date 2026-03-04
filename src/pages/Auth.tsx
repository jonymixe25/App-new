import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { User, Lock, ArrowRight, Video, UserPlus, LogIn, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { username, password } : { username, password, name };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMessage = "Algo salió mal";
        try {
          const data = JSON.parse(text);
          errorMessage = data.error || errorMessage;
        } catch (e) {
          errorMessage = `Error del servidor (${res.status})`;
          console.error("Non-JSON response:", text);
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // Store user in localStorage
      localStorage.setItem("broadcaster_user", JSON.stringify(data.user));
      navigate("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
      <Helmet>
        <title>{isLogin ? "Iniciar Sesión" : "Registrarse"} | Vida Mixe TV</title>
      </Helmet>

      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            {isLogin ? <LogIn className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
          </h1>
          <p className="text-stone-500 text-center mb-8">
            {isLogin 
              ? "Ingresa tus credenciales para transmitir" 
              : "Regístrate para comenzar a compartir tu cultura"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-stone-600" />
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-stone-600" />
                <input 
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nombre_usuario"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-stone-600" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? "Entrar" : "Registrarse"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-800 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-stone-400 hover:text-emerald-400 text-sm transition-colors"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
