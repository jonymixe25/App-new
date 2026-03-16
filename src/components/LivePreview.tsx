import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { MonitorPlay, Users, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function LivePreview() {
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [streamName, setStreamName] = useState("");

  useEffect(() => {
    const socket = io();

    socket.on("broadcaster_list", (list: any[]) => {
      if (list.length > 0) {
        setIsLive(true);
        setStreamName(list[0].name);
        setViewers(list.reduce((acc, b) => acc + b.viewers, 0));
      } else {
        setIsLive(false);
      }
    });

    socket.emit("get_broadcasters");

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="relative aspect-video bg-stone-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group">
      <AnimatePresence mode="wait">
        {isLive ? (
          <motion.div 
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <img 
              src="https://picsum.photos/seed/live-stream/800/450" 
              alt="Live Stream Preview" 
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute top-6 left-6 flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest text-white animate-pulse">
                En Vivo
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-white">
                <Users className="w-3 h-3" />
                {viewers}
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <h4 className="text-white font-bold text-lg truncate mb-1">{streamName}</h4>
              <p className="text-neutral-400 text-xs uppercase tracking-widest font-medium">Sintonizando ahora</p>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-16 h-16 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-brand-primary/40 scale-90 group-hover:scale-100 transition-transform">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="offline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-8 text-center"
          >
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-neutral-700">
              <MonitorPlay className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-white font-bold">Sin transmisiones</h4>
              <p className="text-neutral-500 text-sm">Vuelve pronto para ver contenido en vivo de la comunidad.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
