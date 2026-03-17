import { Mountain, Mail, MapPin, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-950 border-t border-white/5 py-16 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
        <div className="space-y-6 col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Vida <span className="text-brand-primary">Mixe</span> TV
            </span>
          </div>
          <p className="text-neutral-500 max-w-sm leading-relaxed">
            Conectando a la comunidad Ayuuk a través de la tecnología y la cultura. 
            Transmitiendo desde el corazón de la Sierra Mixe para todo el mundo.
          </p>
          <div className="flex items-center gap-2 text-brand-primary font-bold">
            <Globe className="w-4 h-4" />
            <span>vidamixe.mx</span>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs">Contacto</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-neutral-400">
              <MapPin className="w-5 h-5 text-brand-primary shrink-0" />
              <span>Santa María Tlahuitoltepec, Sierra Mixe, Oaxaca.</span>
            </li>
            <li className="flex items-center gap-3 text-neutral-400">
              <Mail className="w-5 h-5 text-brand-primary shrink-0" />
              <span>contacto@vidamixe.mx</span>
            </li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs">Legal</h4>
          <ul className="space-y-4 text-neutral-400">
            <li><button className="hover:text-white transition-colors">Términos de Uso</button></li>
            <li><button className="hover:text-white transition-colors">Privacidad</button></li>
            <li><button className="hover:text-white transition-colors">Cookies</button></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-600 text-xs">
        <p>© {new Date().getFullYear()} Vida Mixe TV. Todos los derechos reservados.</p>
        <p>Ayuuk Jääy - Tlahuitoltepec, Oaxaca</p>
      </div>
    </footer>
  );
}
