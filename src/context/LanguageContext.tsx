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
  },
  ayuujk: {
    nav_home: "Tsu'u",
    nav_view: "Kixy",
    nav_translator: "Ayuujk Traductor",
    nav_recordings: "Kä'px",
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
