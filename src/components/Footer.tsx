import { Mountain, Mail, MapPin, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-950 border-t border-white/5 py-16 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
        <div className="space-y-6 col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Vida Mixe Logo" className="w-full h-full object-contain" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('bg-brand-primary');
                e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mountain"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>');
              }} />
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
