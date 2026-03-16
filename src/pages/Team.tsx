import { Helmet } from "react-helmet-async";
import { Users, Mail, Heart, Camera, Music, Code, Mic2, Plus, Pencil, Trash2, X, Save, Loader2, Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { auth, db, TeamMember, OperationType, handleFirestoreError } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useLanguage } from "../context/LanguageContext";

const ROLE_ICONS: Record<string, any> = {
  "Directora General": Heart,
  "Director de Producción": Camera,
  "Ingeniero de Sonido": Music,
  "Desarrolladora de Plataforma": Code,
  "Locutor y Traductor": Mic2,
  "Default": Users
};

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<TeamMember> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const isAdmin = user?.email === "mixecultura25@gmail.com";

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const q = query(collection(db, "members"), orderBy("createdAt", "asc"));
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeamMember[];
      setMembers(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "members");
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDocs();
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember?.name || !currentMember?.role || !currentMember?.email) return;

    setIsSubmitting(true);
    try {
      const memberData = {
        name: currentMember.name,
        role: currentMember.role,
        email: currentMember.email,
        bio: currentMember.bio || "",
        photoUrl: currentMember.photoUrl || "",
        uid: user?.uid || ""
      };

      if (currentMember.id) {
        await updateDoc(doc(db, "members", currentMember.id), memberData);
      } else {
        await addDoc(collection(db, "members"), {
          ...memberData,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      setCurrentMember(null);
    } catch (error) {
      handleFirestoreError(error, currentMember.id ? OperationType.UPDATE : OperationType.CREATE, "members");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('team_confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, "members", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "members");
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-brand-bg text-neutral-50 font-sans">
        <Helmet>
          <title>{t('team_title')} | Vida Mixe TV</title>
          <meta name="description" content={t('team_subtitle')} />
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
              <span className="text-sm font-medium tracking-wide uppercase">{t('team_peopleOfClouds')}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
              {t('team_title').split(' ')[0]} <span className="text-brand-primary">{t('team_title').split(' ')[1]}</span>
            </h1>
            <p className="text-xl text-neutral-400 font-light leading-relaxed">
              {t('team_subtitle')}
            </p>

            {isAdmin && (
              <button
                onClick={() => {
                  setCurrentMember({ name: "", role: "", email: "", bio: "", photoUrl: "" });
                  setIsEditing(true);
                }}
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-full font-bold hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20"
              >
                <Plus className="w-5 h-5" />
                {t('team_addMember')}
              </button>
            )}
          </div>
        </div>

        {/* Team Grid */}
        <div className="max-w-7xl mx-auto px-6 pb-24">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
              <p className="text-neutral-400">{t('team_loading')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {members.map((member) => {
                const Icon = ROLE_ICONS[member.role] || ROLE_ICONS["Default"];
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={member.id} 
                    className="bg-brand-surface border border-white/5 rounded-3xl overflow-hidden group hover:border-brand-primary/30 transition-all duration-500 relative"
                  >
                    {isAdmin && (
                      <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setCurrentMember(member);
                            setIsEditing(true);
                          }}
                          className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-brand-primary transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => member.id && handleDelete(member.id)}
                          className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="relative aspect-square overflow-hidden">
                      <img 
                        src={member.photoUrl || `https://picsum.photos/seed/${member.name}/400/400`} 
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
                      
                      <p className="text-neutral-400 text-sm leading-relaxed min-h-[3rem]">
                        {member.bio || t('team_defaultBio')}
                      </p>

                      <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                        <a href={`mailto:${member.email}`} className="text-neutral-500 hover:text-white transition-colors">
                          <Mail className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Vision Section */}
          <div className="mt-24 bg-brand-surface/50 border border-white/5 rounded-[3rem] p-12 md:p-20 text-center space-y-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-white">{t('team_missionTitle')}</h2>
              <p className="text-lg text-neutral-400 leading-relaxed italic">
                "{t('team_missionDesc')}"
              </p>
              <div className="w-20 h-1 bg-brand-primary mx-auto rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {isEditing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditing(false)}
                className="absolute inset-0 bg-brand-bg/90 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-brand-surface border border-white/10 rounded-[2rem] p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white">
                    {currentMember?.id ? t('team_editModalTitle') : t('team_newModalTitle')}
                  </h2>
                  <button onClick={() => setIsEditing(false)} className="text-neutral-500 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{t('team_fullName')}</label>
                    <input
                      required
                      type="text"
                      value={currentMember?.name || ""}
                      onChange={e => setCurrentMember(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-all"
                      placeholder={t('team_namePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{t('team_role')}</label>
                    <select
                      required
                      value={currentMember?.role || ""}
                      onChange={e => setCurrentMember(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-all"
                    >
                      <option value="" disabled className="bg-brand-surface">{t('team_selectRole')}</option>
                      {Object.keys(ROLE_ICONS).map(role => (
                        <option key={role} value={role} className="bg-brand-surface">{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{t('team_email')}</label>
                    <input
                      required
                      type="email"
                      value={currentMember?.email || ""}
                      onChange={e => setCurrentMember(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-all"
                      placeholder={t('team_emailPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{t('team_shortBio')}</label>
                    <textarea
                      value={currentMember?.bio || ""}
                      onChange={e => setCurrentMember(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-all resize-none h-24"
                      placeholder={t('team_bioPlaceholder')}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{t('team_profilePhoto')}</label>
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/10 group">
                        <img
                          src={currentMember?.photoUrl || `https://picsum.photos/seed/${currentMember?.name || 'preview'}/200/200`}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="w-6 h-6 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCurrentMember(prev => ({ ...prev, photoUrl: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="url"
                          value={currentMember?.photoUrl || ""}
                          onChange={e => setCurrentMember(prev => ({ ...prev, photoUrl: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-brand-primary outline-none transition-all"
                          placeholder={t('team_photoUrlPlaceholder')}
                        />
                        <p className="text-[10px] text-neutral-500">{t('team_photoDesc')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                    >
                      {t('team_cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {t('team_save')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
