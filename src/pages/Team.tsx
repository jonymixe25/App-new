import { Helmet } from "react-helmet-async";
import { Users, Mail, Linkedin, Twitter, Github, Heart, Camera, Music, Code, Mic2 } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  icon: any;
  socials: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    email?: string;
  };
}

const team: TeamMember[] = [
  {
    name: "Xunashi Martínez",
    role: "Directora General",
    bio: "Originaria de Tlahuitoltepec, Xunashi lidera la visión de Vida Mixe TV para llevar la cultura Ayuuk a audiencias globales.",
    image: "https://picsum.photos/seed/xunashi/400/400",
    icon: Heart,
    socials: {
      linkedin: "#",
      email: "xunashi@vidamixe.tv"
    }
  },
  {
    name: "Pável González",
    role: "Director de Producción",
    bio: "Especialista en medios audiovisuales con 10 años de experiencia documentando las fiestas y tradiciones de la Sierra Norte.",
    image: "https://picsum.photos/seed/pavel/400/400",
    icon: Camera,
    socials: {
      twitter: "#",
      email: "pavel@vidamixe.tv"
    }
  },
  {
    name: "Floriberto Díaz",
    role: "Ingeniero de Sonido",
    bio: "Músico del CECAM encargado de capturar la esencia de las bandas de viento con la más alta fidelidad.",
    image: "https://picsum.photos/seed/floriberto/400/400",
    icon: Music,
    socials: {
      email: "flor@vidamixe.tv"
    }
  },
  {
    name: "Citlali Rojas",
    role: "Desarrolladora de Plataforma",
    bio: "Encargada de la infraestructura digital que permite nuestras transmisiones en tiempo real desde la montaña.",
    image: "https://picsum.photos/seed/citlali/400/400",
    icon: Code,
    socials: {
      github: "#",
      linkedin: "#"
    }
  },
  {
    name: "Mateo Jiménez",
    role: "Locutor y Traductor",
    bio: "La voz de nuestras noticias en Ayuuk y Español, asegurando que nuestro mensaje llegue a todos los rincones.",
    image: "https://picsum.photos/seed/mateo/400/400",
    icon: Mic2,
    socials: {
      twitter: "#"
    }
  }
];

export default function Team() {
  return (
    <div className="min-h-screen bg-brand-bg text-neutral-50 font-sans">
      <Helmet>
        <title>Nuestro Equipo | Vida Mixe TV</title>
        <meta name="description" content="Conoce a las personas detrás de Vida Mixe TV, trabajando para difundir la cultura Ayuuk." />
      </Helmet>

      {/* Hero Section */}
      <div className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/team-bg/1920/600?blur=10" 
            alt="Fondo de equipo" 
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/50 via-brand-bg to-brand-bg"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-brand-primary backdrop-blur-sm">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide uppercase">Gente de las Nubes</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
            Nuestro <span className="text-brand-primary">Equipo</span>
          </h1>
          <p className="text-xl text-neutral-400 font-light leading-relaxed">
            Somos un grupo apasionado de profesionales, músicos y comunicadores dedicados a preservar y difundir la riqueza de la Sierra Mixe a través de la tecnología.
          </p>
        </div>
      </div>

      {/* Team Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => {
            const Icon = member.icon;
            return (
              <div 
                key={index} 
                className="bg-brand-surface border border-white/5 rounded-3xl overflow-hidden group hover:border-brand-primary/30 transition-all duration-500"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-4 left-4">
                    <div className="w-12 h-12 bg-brand-primary/90 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shadow-xl transform -rotate-6 group-hover:rotate-0 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-brand-primary transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-brand-secondary font-medium text-sm uppercase tracking-widest">
                      {member.role}
                    </p>
                  </div>
                  
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {member.bio}
                  </p>

                  <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    {member.socials.email && (
                      <a href={`mailto:${member.socials.email}`} className="text-neutral-500 hover:text-white transition-colors">
                        <Mail className="w-5 h-5" />
                      </a>
                    )}
                    {member.socials.linkedin && (
                      <a href={member.socials.linkedin} className="text-neutral-500 hover:text-white transition-colors">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {member.socials.twitter && (
                      <a href={member.socials.twitter} className="text-neutral-500 hover:text-white transition-colors">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {member.socials.github && (
                      <a href={member.socials.github} className="text-neutral-500 hover:text-white transition-colors">
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Vision Section */}
        <div className="mt-24 bg-brand-surface/50 border border-white/5 rounded-[3rem] p-12 md:p-20 text-center space-y-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold text-white">Nuestra Misión</h2>
            <p className="text-lg text-neutral-400 leading-relaxed italic">
              "Fortalecer la identidad Ayuuk mediante el uso de herramientas tecnológicas modernas, creando un puente entre nuestra herencia ancestral y las nuevas generaciones, sin importar en qué parte del mundo se encuentren."
            </p>
            <div className="w-20 h-1 bg-brand-primary mx-auto rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
