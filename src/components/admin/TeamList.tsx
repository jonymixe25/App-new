import React from "react";
import { Trash2, Users } from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import toast from "react-hot-toast";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  icon: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  email?: string;
}

export default function TeamList({ team, searchQuery }: { team: TeamMember[], searchQuery: string }) {
  const handleTeamDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este miembro del equipo?")) return;

    try {
      await deleteDoc(doc(db, "team", id));
      toast.success("Miembro eliminado");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `team/${id}`);
      toast.error("Error al eliminar el miembro");
    }
  };

  const filteredTeam = team.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.role.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">Equipo</h2>
      {filteredTeam.length > 0 ? (
        filteredTeam.map((member) => (
          <div key={member.id} className="bg-brand-surface border border-white/5 rounded-3xl p-4 flex gap-4 items-center group">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-brand-bg border border-white/10">
              <img src={member.image} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate group-hover:text-brand-primary transition-colors">{member.name}</h3>
              <p className="text-sm text-neutral-500 truncate">{member.role}</p>
            </div>
            <button 
              onClick={() => handleTeamDelete(member.id)}
              className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              title="Eliminar miembro"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))
      ) : (
        <div className="text-center py-20 bg-brand-surface/50 border border-dashed border-white/5 rounded-3xl">
          <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500">No hay miembros en el equipo aún.</p>
        </div>
      )}
    </div>
  );
}
