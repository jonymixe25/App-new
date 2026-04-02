import React from "react";
import { Trash2, Video, Save, ShieldAlert } from "lucide-react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import toast from "react-hot-toast";

interface CommunityVideo {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  price: string;
  video_url: string;
  published: boolean;
}

export default function VideoList({ videos, searchQuery }: { videos: CommunityVideo[], searchQuery: string }) {
  const handleVideoDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este video?")) return;

    try {
      await deleteDoc(doc(db, "community_videos", id));
      toast.success("Video eliminado");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `community_videos/${id}`);
      toast.error("Error al eliminar el video");
    }
  };

  const handleVideoTogglePublish = async (id: string, published: boolean) => {
    try {
      await updateDoc(doc(db, "community_videos", id), { published: !published });
      toast.success(`Video ${published ? 'despublicado' : 'publicado'}`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `community_videos/${id}`);
      toast.error("Error al actualizar el video");
    }
  };

  const filteredVideos = videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.author.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">Videos de la Comunidad</h2>
      {filteredVideos.length > 0 ? (
        filteredVideos.map((video) => (
          <div key={video.id} className="bg-brand-surface border border-white/5 rounded-3xl p-4 flex gap-6 items-center group">
            <div className="w-32 aspect-video rounded-xl overflow-hidden flex-shrink-0">
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate group-hover:text-brand-secondary transition-colors">{video.title}</h3>
              <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                <span>{video.author}</span>
                <span>•</span>
                <span className="text-brand-secondary font-bold">{video.price}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleVideoTogglePublish(video.id, video.published)}
                className={`p-2 rounded-lg transition-all ${video.published ? 'text-green-500 hover:bg-green-500/10' : 'text-neutral-600 hover:text-green-500 hover:bg-green-500/10'}`}
                title={video.published ? "Despublicar" : "Publicar"}
              >
                {video.published ? <ShieldAlert className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => handleVideoDelete(video.id)}
                className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                title="Eliminar video"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 bg-brand-surface/50 border border-dashed border-white/5 rounded-3xl">
          <Video className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500">No hay videos publicados aún.</p>
        </div>
      )}
    </div>
  );
}
