import React, { useState } from "react";
import { Save, Users, User, ImageIcon, Linkedin, Twitter, Github, Mail, Loader2 } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { moderateContent } from "../../services/moderationService";
import { handleFirestoreError, OperationType } from "../../firebase";
import toast from "react-hot-toast";

export default function TeamForm() {
  const [tName, setTName] = useState("");
  const [tRole, setTRole] = useState("");
  const [tBio, setTBio] = useState("");
  const [tImage, setTImage] = useState("");
  const [tIcon, setTIcon] = useState("Heart");
  const [tLinkedin, setTLinkedin] = useState("");
  const [tTwitter, setTTwitter] = useState("");
  const [tGithub, setTGithub] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `team/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setTImage(downloadURL);
      toast.success("Imagen subida con éxito");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const moderation = await moderateContent(tBio, "chat");
    if (!moderation.isAppropriate) {
      toast.error(moderation.reason || "La biografía no cumple con las normas.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "team"), {
        name: tName,
        role: tRole,
        bio: tBio,
        image: tImage,
        icon: tIcon,
        linkedin: tLinkedin || null,
        twitter: tTwitter || null,
        github: tGithub || null,
        email: tEmail || null
      });

      setTName("");
      setTRole("");
      setTBio("");
      setTImage("");
      setTIcon("Heart");
      setTLinkedin("");
      setTTwitter("");
      setTGithub("");
      setTEmail("");
      toast.success("Miembro guardado con éxito");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "team");
      toast.error("Error al guardar el miembro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-surface border border-white/5 rounded-3xl p-6 sticky top-12">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Users className="w-5 h-5 text-brand-primary" />
        Nuevo Miembro
      </h2>
      
      <form onSubmit={handleTeamSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Nombre</label>
          <input 
            type="text"
            required
            value={tName}
            onChange={(e) => setTName(e.target.value)}
            placeholder="Nombre completo"
            className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Rol / Cargo</label>
          <input 
            type="text"
            required
            value={tRole}
            onChange={(e) => setTRole(e.target.value)}
            placeholder="Ej. Director de Producción"
            className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Biografía Corta</label>
          <textarea 
            required
            rows={3}
            value={tBio}
            onChange={(e) => setTBio(e.target.value)}
            placeholder="Breve descripción..."
            className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all resize-none"
          ></textarea>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Foto de Perfil</label>
          <div className="flex items-center gap-4">
            {tImage && (
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-brand-bg border border-white/10">
                <img src={tImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input 
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30 transition-all cursor-pointer"
              />
              {uploading && <p className="text-xs text-brand-primary">Subiendo imagen...</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Icono</label>
            <select 
              value={tIcon}
              onChange={(e) => setTIcon(e.target.value)}
              className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            >
              <option value="Heart">Corazón</option>
              <option value="Camera">Cámara</option>
              <option value="Music">Música</option>
              <option value="Code">Código</option>
              <option value="Mic2">Micrófono</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Email</label>
            <input 
              type="email"
              value={tEmail}
              onChange={(e) => setTEmail(e.target.value)}
              placeholder="email@vidamixe.tv"
              className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">LinkedIn</label>
            <input 
              type="text"
              value={tLinkedin}
              onChange={(e) => setTLinkedin(e.target.value)}
              placeholder="#"
              className="w-full bg-brand-bg border border-white/5 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Twitter</label>
            <input 
              type="text"
              value={tTwitter}
              onChange={(e) => setTTwitter(e.target.value)}
              placeholder="#"
              className="w-full bg-brand-bg border border-white/5 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">GitHub</label>
            <input 
              type="text"
              value={tGithub}
              onChange={(e) => setTGithub(e.target.value)}
              placeholder="#"
              className="w-full bg-brand-bg border border-white/5 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Miembro
        </button>
      </form>
    </div>
  );
}
