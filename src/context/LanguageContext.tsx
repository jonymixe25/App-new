import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "es" | "ayuujk";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations: Record<Language, Record<string, string>> = {
  es: {
    nav_home: "Inicio",
    nav_view: "Ver",
    nav_translator: "Traductor",
    nav_recordings: "Grabaciones",
    hero_title: "La Voz de la Cultura Mixe",
    hero_subtitle: "La región de los jamás conquistados",
    hero_description: "Conectando a la comunidad Ayuuk con el mundo. Transmisiones en vivo desde el corazón de la sierra de Oaxaca.",
    hero_cta_view: "Ver en Pantalla Completa",
    hero_cta_translator: "Traductor Ayuujk",
    section_featured_title: "Destacado de la Sierra",
    section_tlahui_title: "Santa María Tlahuitoltepec",
    section_tlahui_desc: "Cuna de músicos y corazón de la cultura Ayuuk. Tlahuitoltepec es mundialmente reconocido por el CECAM, donde la música de banda se convierte en el alma del pueblo.",
    news_title: "Noticias Comunitarias",
    news_subtitle: "Actualidad",
    news_empty: "No hay noticias publicadas en este momento.",
    feature_culture_title: "Cultura Viva",
    feature_culture_desc: "Difundiendo las tradiciones, música y lengua del pueblo Ayuuk. Un espacio para nuestras voces.",
    feature_community_title: "Comunidad Global",
    feature_community_desc: "Acercando a los paisanos que están lejos. Mantente conectado con tu tierra y tu gente en tiempo real.",
    feature_translator_title: "Traductor Ayuujk",
    feature_translator_desc: "Herramienta inteligente para traducir entre español y las variantes de nuestra lengua.",
    feature_interaction_title: "Interacción Directa",
    feature_interaction_desc: "Participa en el chat en vivo y únete a las conversaciones. Tu opinión es parte de nuestra historia.",
    footer_made_with: "Hecho con ❤️ desde la Sierra Norte de Oaxaca.",
    lang_toggle: "Ayuujk",
    calendar_title: "Calendario Cultural",
    calendar_subtitle: "Próximos Eventos",
    event_fiesta: "Fiesta Patronal",
    event_concert: "Concierto de Banda",
    event_assembly: "Asamblea Comunitaria",
    team_title: "Nuestro Equipo",
    team_subtitle: "Las voces y manos detrás de Vida Mixe TV",
    team_peopleOfClouds: "Gente de las nubes",
    team_confirmDelete: "¿Estás seguro de que deseas eliminar a este miembro del equipo?",
    team_addMember: "Agregar Miembro",
    team_loading: "Cargando equipo...",
    team_defaultBio: "Miembro apasionado de la comunidad Vida Mixe.",
    team_missionTitle: "Nuestra Misión",
    team_missionDesc: "Fortalecer la identidad Ayuuk a través de la comunicación digital y la preservación de nuestra cultura viva.",
    team_editModalTitle: "Editar Miembro",
    team_newModalTitle: "Nuevo Miembro",
    team_fullName: "Nombre Completo",
    team_namePlaceholder: "Ej. Juan Pérez",
    team_role: "Puesto / Rol",
    team_selectRole: "Selecciona un rol",
    team_email: "Correo Electrónico",
    team_emailPlaceholder: "juan@vidamixe.mx",
    team_shortBio: "Breve Biografía",
    team_bioPlaceholder: "Cuéntanos un poco sobre ti...",
    team_profilePhoto: "Foto de Perfil",
    team_photoUrlPlaceholder: "URL de la imagen",
    team_photoDesc: "Puedes subir una imagen o pegar una URL",
    team_cancel: "Cancelar",
    team_save: "Guardar Cambios",
  },
  ayuujk: {
    nav_home: "Tsu'u",
    nav_view: "Kixy",
    nav_translator: "Ayuujk Traductor",
    nav_recordings: "Kä'px",
    hero_title: "Ayuujk Jä’äy tyu’u",
    hero_subtitle: "Mëj tunk naxwiny ja'ay",
    hero_description: "Ayuujk jää'y tunk naxwiny. Jää'y kä'px naxwiny oaxaca.",
    hero_cta_view: "Mëj kixy",
    hero_cta_translator: "Ayuujk Traductor",
    section_featured_title: "Mëj tunk naxwiny",
    section_tlahui_title: "Santa María Tlahuitoltepec",
    section_tlahui_desc: "Xëëw mpayo'p jää'y tunk. Tlahuitoltepec CECAM mëj tunk jää'y.",
    news_title: "Jää'y kä'px",
    news_subtitle: "Naxwiny",
    news_empty: "Ka'p kä'px.",
    feature_culture_title: "Ayuujk Jää'y",
    feature_culture_desc: "Ayuujk jää'y tunk naxwiny. Jää'y kä'px.",
    feature_community_title: "Mëj Jää'y",
    feature_community_desc: "Jää'y tunk naxwiny. Jää'y kä'px.",
    feature_translator_title: "Ayuujk Traductor",
    feature_translator_desc: "Ayuujk jää'y tunk naxwiny.",
    feature_interaction_title: "Kä'px Jää'y",
    feature_interaction_desc: "Jää'y kä'px naxwiny.",
    footer_made_with: "Ayuujk jää'y tunk ❤️ Oaxaca.",
    lang_toggle: "Español",
    calendar_title: "Ayuujk Xëëw",
    calendar_subtitle: "Mëj Tunk",
    event_fiesta: "Mëj Xëëw",
    event_concert: "Ayuujk Music",
    event_assembly: "Jää'y Tunk",
    team_title: "Ayuujk Jää'y",
    team_subtitle: "Vida Mixe TV jää'y tunk",
    team_peopleOfClouds: "Ayuujk jää'y",
    team_confirmDelete: "¿Mëj tunk jää'y?",
    team_addMember: "Jää'y tunk",
    team_loading: "Kä'px jää'y...",
    team_defaultBio: "Ayuujk jää'y Vida Mixe.",
    team_missionTitle: "Mëj Tunk",
    team_missionDesc: "Ayuujk jää'y tunk naxwiny.",
    team_editModalTitle: "Jää'y tunk",
    team_newModalTitle: "Jää'y tunk",
    team_fullName: "Xëëw",
    team_namePlaceholder: "Ej. Juan Pérez",
    team_role: "Tunk",
    team_selectRole: "Tunk",
    team_email: "Email",
    team_emailPlaceholder: "juan@vidamixe.mx",
    team_shortBio: "Kä'px",
    team_bioPlaceholder: "Kä'px...",
    team_profilePhoto: "Xëëw",
    team_photoUrlPlaceholder: "URL",
    team_photoDesc: "URL",
    team_cancel: "Ka'p",
    team_save: "Tunk",
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("es");

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
