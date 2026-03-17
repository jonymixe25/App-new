export type Language = 'es' | 'mixe';

export interface Translations {
  nav: {
    home: string;
    team: string;
    contact: string;
    login: string;
    logout: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    cta: string;
  };
  team: {
    title: string;
    subtitle: string;
    addMember: string;
    editMember: string;
    deleteMember: string;
  };
}

export const translations: Record<Language, Translations> = {
  es: {
    nav: {
      home: 'Inicio',
      team: 'Equipo',
      contact: 'Contacto',
      login: 'Acceso',
      logout: 'Salir',
    },
    home: {
      heroTitle: 'La Voz de la Cultura Mixe',
      heroSubtitle: 'Transmitiendo la esencia de nuestras raíces, lengua y tradiciones para el mundo entero.',
      cta: 'Ver Programación',
    },
    team: {
      title: 'Nuestro Equipo',
      subtitle: 'Las personas que hacen posible Vida Mixe TV.',
      addMember: 'Agregar Miembro',
      editMember: 'Editar',
      deleteMember: 'Eliminar',
    },
  },
  mixe: {
    nav: {
      home: 'Jëën',
      team: 'Tu\'u',
      contact: 'Contacto',
      login: 'Acceso',
      logout: 'Salir',
    },
    home: {
      heroTitle: 'Ayuujk Jä’äy tyu’u',
      heroSubtitle: 'Nëjkx muku’uk ja ayuujk, ja jä’äy yë’ë tyu’u ja’ay.',
      cta: 'Ixy ja programa',
    },
    team: {
      title: 'Ja Tu\'u',
      subtitle: 'Ja jä\'äy yë\'ë Vida Mixe TV tyu\'u.',
      addMember: 'Mëjtë jä\'äy',
      editMember: 'Yë\'ëy',
      deleteMember: 'Pëjtst',
    },
  },
};
