import React, { useState } from "react";
import { Save, Video, User, ImageIcon, DollarSign, LinkIcon, Loader2, ShieldAlert } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { moderateContent } from "../../services/moderationService";
import { handleFirestoreError, OperationType } from "../../firebase";
import toast from "react-hot-toast";

export default function VideoForm() {
  const [vTitle, setVTitle] = useState("");
  const [vAuthor, setVAuthor] = useState("");
  const [vThumbnail, setVThumbnail] = useState("");
  const [vPrice, setVPrice] = useState("");
  const [vUrl, setVUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    try {
      const storageRef = ref(storage, `thumbnails/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setVThumbnail(downloadURL);
      toast.success("Miniatura subida con éxito");
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast.error("Error al subir la miniatura");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setVUrl(downloadURL);
      toast.success("Video subido con éxito");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Error al subir el video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const moderation = await moderateContent(vTitle, "news");
      if (!moderation.isAppropriate) {
        toast.error(moderation.reason || "El título del video no cumple con las normas.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "community_videos"), {
        title: vTitle,
        author: vAuthor,
        thumbnail: vThumbnail,
        price: vPrice,
        video_url: vUrl,
        published: true
      });

      setVTitle("");
      setVAuthor("");
      setVThumbnail("");
      setVPrice("");
      setVUrl("");
      toast.success("Video publicado con éxito");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "community_videos");
      toast.error("Error al publicar el video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-surface border border-white/5 rounded-3xl p-6 sticky top-12">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Video className="w-5 h-5 text-brand-secondary" />
        Nuevo Video
      </h2>
      
      <form onSubmit={handleVideoSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Título</label>
          <div className="relative">
            <Video className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
            <input 
              type="text"
              required
              value={vTitle}
              onChange={(e) => setVTitle(e.target.value)}
              placeholder="Título del video"
              className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Autor</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
            <input 
              type="text"
              required
              value={vAuthor}
              onChange={(e) => setVAuthor(e.target.value)}
              placeholder="Nombre del autor"
              className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Miniatura</label>
          <div className="relative">
            <input 
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              disabled={uploadingThumbnail}
              className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-secondary/20 file:text-brand-secondary hover:file:bg-brand-secondary/30 transition-all cursor-pointer"
            />
            {uploadingThumbnail && <p className="text-xs text-brand-secondary">Subiendo miniatura...</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Precio</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
            <input 
              type="text"
              required
              value={vPrice}
              onChange={(e) => setVPrice(e.target.value)}
              placeholder="$100 MXN"
              className="w-full bg-brand-bg border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Archivo de Video (MP4)</label>
          <div className="relative">
            <input 
              type="file"
              accept="video/mp4"
              onChange={handleVideoUpload}
              disabled={uploadingVideo}
              className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-secondary/20 file:text-brand-secondary hover:file:bg-brand-secondary/30 transition-all cursor-pointer"
            />
            {uploadingVideo && <p className="text-xs text-brand-secondary">Subiendo video...</p>}
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading || uploadingThumbnail || uploadingVideo}
          className="w-full bg-brand-secondary hover:bg-brand-secondary/80 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-brand-secondary/20 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Publicar Video
        </button>
      </form>
    </div>
  );
}
