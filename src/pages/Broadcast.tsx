import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Video, Mic, MicOff, VideoOff, Settings, Users, MessageSquare, Send, Power, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";

const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
};

export default function Broadcast() {
  const [user, setUser] = useState<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLive, setIsLive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("broadcaster_user");
    if (!storedUser) {
      navigate("/auth");
      return;
    }
    setUser(JSON.parse(storedUser));

    // Initialize Socket.IO
    socketRef.current = io();

    socketRef.current.on("watcher", (id: string) => {
      const peerConnection = new RTCPeerConnection(config);
      peerConnections.current[id] = peerConnection;

      if (stream) {
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
      }

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit("candidate", id, event.candidate);
        }
      };

      peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
          socketRef.current?.emit("offer", id, peerConnection.localDescription);
        });
    });

    socketRef.current.on("answer", (id: string, description: RTCSessionDescriptionInit) => {
      peerConnections.current[id].setRemoteDescription(description);
    });

    socketRef.current.on("candidate", (id: string, candidate: RTCIceCandidateInit) => {
      peerConnections.current[id].addIceCandidate(new RTCIceCandidate(candidate));
    });

    socketRef.current.on("disconnectPeer", (id: string) => {
      if (peerConnections.current[id]) {
        peerConnections.current[id].close();
        delete peerConnections.current[id];
      }
    });

    socketRef.current.on("chat_message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on("viewers_count", (count: number) => {
      setViewers(count);
    });

    return () => {
      socketRef.current?.disconnect();
      stream?.getTracks().forEach(track => track.stop());
      Object.values(peerConnections.current).forEach(pc => pc.close());
    };
  }, [navigate]);

  const startBroadcast = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      socketRef.current?.emit("broadcaster", user?.name || "Vida Mixe Stream");
      setIsLive(true);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("No se pudo acceder a la cámara o micrófono.");
    }
  };

  const stopBroadcast = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsLive(false);
    socketRef.current?.disconnect();
    socketRef.current = io(); // Reconnect for chat/status
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
      setIsVideoOff(!isVideoOff);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: Date.now().toString(),
      user: user?.name || "Admin",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAdmin: true
    };

    socketRef.current?.emit("chat_message", msg);
    setNewMessage("");
  };

  return (
    <div className="min-h-screen bg-brand-bg text-neutral-50 flex flex-col">
      <Helmet>
        <title>Panel de Transmisión | Vida Mixe TV</title>
      </Helmet>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
          />
          
          {isVideoOff && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900">
              <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                <VideoOff className="w-12 h-12 text-brand-primary" />
              </div>
              <p className="text-neutral-500 font-medium">Cámara desactivada</p>
            </div>
          )}

          {/* Overlay Controls */}
          <div className="absolute top-6 left-6 flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${isLive ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/10 border-white/10 text-neutral-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-neutral-500'}`} />
              <span className="text-xs font-bold uppercase tracking-widest">{isLive ? 'En Vivo' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold">{viewers}</span>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
            <button 
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button 
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
            <div className="w-px h-8 bg-white/10 mx-2" />
            {!isLive ? (
              <button 
                onClick={startBroadcast}
                className="px-8 py-4 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold rounded-full transition-all flex items-center gap-2"
              >
                <Power className="w-5 h-5" />
                Iniciar Transmisión
              </button>
            ) : (
              <button 
                onClick={stopBroadcast}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full transition-all flex items-center gap-2"
              >
                <Power className="w-5 h-5" />
                Detener
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-brand-surface border-l border-white/5 flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/20 text-brand-primary rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-white">Panel Admin</h2>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{user?.name}</p>
              </div>
            </div>
            <button className="p-2 text-neutral-500 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 bg-white/5 flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest">
              <MessageSquare className="w-4 h-4" />
              Chat en Vivo
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${msg.isAdmin ? 'text-brand-primary' : 'text-neutral-400'}`}>
                      {msg.user}
                    </span>
                    <span className="text-[10px] text-neutral-600">{msg.time}</span>
                  </div>
                  <p className="text-sm text-neutral-300 bg-white/5 p-3 rounded-2xl rounded-tl-none">
                    {msg.text}
                  </p>
                </div>
              ))}
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
    </div>
  );
}
