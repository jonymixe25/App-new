import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { LogIn, ArrowLeft } from "lucide-react";
import { auth } from "../firebase";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";

export default function Auth() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Store user in localStorage for backwards compatibility with existing components
        localStorage.setItem("broadcaster_user", JSON.stringify({
          id: user.uid,
          username: user.email?.split('@')[0] || "User",
          name: user.displayName || "User"
        }));
        navigate("/admin");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Navigation is handled by onAuthStateChanged
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión con Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
      <Helmet>
        <title>Iniciar Sesión | Vida Mixe TV</title>
      </Helmet>

      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Bienvenido a Vida Mixe TV
          </h1>
          <p className="text-stone-500 text-center mb-8">
            Ingresa con tu cuenta de Google para transmitir
          </p>

          <div className="space-y-4">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Iniciar Sesión con Google"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
