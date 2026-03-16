import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { MonitorPlay, Users, MessageSquare, Send, Heart, Share2, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";

const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
};

export default function View() {
  const [broadcasters, setBroadcasters] = useState<any[]>([]);
  const [selectedBroadcaster, setSelectedBroadcaster] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewers, setViewers] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [username, setUsername] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    socketRef.current = io();

    socketRef.current.on("broadcaster_list", (list: any[]) => {
      setBroadcasters(list);
    });

    socketRef.current.emit("get_broadcasters");

    socketRef.current.on("offer", (id: string, description: RTCSessionDescriptionInit) => {
      peerConnection.current = new RTCPeerConnection(config);
      
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit("candidate", id, event.candidate);
        }
      };

      peerConnection.current.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.current
        .setRemoteDescription(description)
        .then(() => peerConnection.current?.createAnswer())
        .then(sdp => peerConnection.current?.setLocalDescription(sdp))
        .then(() => {
          socketRef.current?.emit("answer", id, peerConnection.current?.localDescription);
        });
    });

    socketRef.current.on("candidate", (id: string, candidate: RTCIceCandidateInit) => {
      peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socketRef.current.on("chat_message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on("disconnectPeer", () => {
      if (videoRef.current) videoRef.current.srcObject = null;
      peerConnection.current?.close();
    });

    return () => {
      socketRef.current?.disconnect();
      peerConnection.current?.close();
    };
  }, []);

  const joinStream = (broadcaster: any) => {
    setSelectedBroadcaster(broadcaster);
    setMessages([]);
    socketRef.current?.emit("watcher", broadcaster.id);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    socketRef.current?.emit("register_user", username);
    setIsRegistered(true);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isRegistered) return;

    const msg = {
      id: Date.now().toString(),
      user: username,
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAdmin: false
    };

    socketRef.current?.emit("chat_message", msg);
    setNewMessage("");
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-neutral-50 flex flex-col">
      <Helmet>
        <title>Ver en Vivo | Vida Mixe TV</title>
      </Helmet>

      {!isRegistered ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-brand-surface border border-white/10 rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8"
          >
            <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-3xl flex items-center justify-center mx-auto">
              <MonitorPlay className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">¡Bienvenido!</h1>
              <p className="text-neutral-400">Ingresa tu nombre para unirte a la transmisión y participar en el chat.</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu nombre o apodo"
                className="w-full bg-brand-bg border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand-primary/50 transition-all text-center text-lg"
              />
              <button 
                type="submit"
                className="w-full py-4 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-primary/20"
              >
                Unirse ahora
              </button>
            </form>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Video Player Area */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              {selectedBroadcaster ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Player Controls Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button onClick={toggleMute} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>
                        <div className="text-sm font-medium text-white">
                          {selectedBroadcaster.name}
                        </div>
                      </div>
                      <button className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                        <Maximize2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="absolute top-6 left-6 flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest text-white animate-pulse">
                      En Vivo
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-white">
                      <Users className="w-3 h-3" />
                      {viewers}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-6 p-12 text-center">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                    <MonitorPlay className="w-12 h-12 text-neutral-700" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">No hay transmisiones activas</h2>
                    <p className="text-neutral-500 max-w-xs">Selecciona un canal de la lista o espera a que alguien inicie una transmisión.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stream Info & Actions */}
            <div className="bg-brand-surface border-t border-white/5 p-6 md:p-8">
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-primary/20 text-brand-primary rounded-2xl flex items-center justify-center">
                    <MonitorPlay className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {selectedBroadcaster?.name || "Vida Mixe TV"}
                    </h1>
                    <p className="text-neutral-500 text-sm">Transmisión oficial de la Sierra Norte</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked ? 'Me gusta' : 'Apoyar'}
                  </button>
                  <button className="p-3 bg-white/5 text-neutral-400 hover:bg-white/10 rounded-full transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-96 bg-brand-surface border-l border-white/5 flex flex-col">
            {/* Channels List */}
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Canales Disponibles</h3>
              <div className="space-y-3">
                {broadcasters.length > 0 ? (
                  broadcasters.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => joinStream(b)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedBroadcaster?.id === b.id ? 'bg-brand-primary/10 border border-brand-primary/20' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}
                    >
                      <div className="w-10 h-10 bg-brand-primary/20 text-brand-primary rounded-xl flex items-center justify-center flex-shrink-0">
                        <MonitorPlay className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{b.name}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">En Vivo • {b.viewers} espectadores</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-neutral-600 italic">No hay otros canales...</p>
                )}
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 bg-white/5 flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                <MessageSquare className="w-4 h-4" />
                Chat Comunitario
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={msg.id} 
                      className="space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${msg.isAdmin ? 'text-brand-primary' : 'text-neutral-400'}`}>
                          {msg.user}
                        </span>
                        <span className="text-[10px] text-neutral-600">{msg.time}</span>
                      </div>
                      <p className="text-sm text-neutral-300 bg-white/5 p-3 rounded-2xl rounded-tl-none">
                        {msg.text}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <form onSubmit={sendMessage} className="p-6 border-t border-white/5">
                <div className="relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="w-full bg-brand-bg border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-sm text-white outline-none focus:border-brand-primary/50 transition-all"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-brand-primary hover:text-brand-primary/80 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
