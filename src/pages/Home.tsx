import { Link } from "react-router-dom";
import { Video, MonitorPlay, Code } from "lucide-react";

export default function Home() {
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Transmisión en Vivo
          </h1>
          <p className="text-xl text-zinc-400">
            Transmite tu cámara y micrófono directamente a tu página web.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Transmisor</h2>
              <p className="text-zinc-400 mb-6">
                Inicia la transmisión desde tu cámara y micrófono. Solo puede haber un transmisor a la vez.
              </p>
              <Link
                to="/broadcast"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
              >
                Iniciar Transmisión
              </Link>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
              <MonitorPlay className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Espectador</h2>
              <p className="text-zinc-400 mb-6">
                Mira la transmisión en vivo. Puedes compartir este enlace o incrustarlo en tu web.
              </p>
              <Link
                to="/view"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
              >
                Ver Transmisión
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-6 h-6 text-zinc-400" />
            <h2 className="text-xl font-semibold">Cómo implementar en tu dominio</h2>
          </div>
          <p className="text-zinc-400">
            Copia y pega el siguiente código HTML en tu página web para incrustar el reproductor en vivo:
          </p>
          <div className="bg-black rounded-xl p-4 overflow-x-auto border border-zinc-800">
            <code className="text-emerald-400 text-sm whitespace-pre">
              {`<iframe 
  src="${appUrl}/view" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allow="autoplay; fullscreen"
></iframe>`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
