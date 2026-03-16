import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Video, Mic, MicOff, VideoOff, Settings, Users, MessageSquare, Send, Power, ShieldCheck, LogOut, Circle, Square, Download } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useUser } from "../contexts/UserContext";

const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
};

export default function Broadcast() {
  const { user, loading: userLoading, logout } = useUser();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamName, setStreamName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [navigate, stream, user, userLoading]);

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
      
      socketRef.current?.emit("broadcaster", streamName || user?.name || "Vida Mixe Stream");
      setIsLive(true);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("No se pudo acceder a la cámara o micrófono.");
    }
  };

  const stopBroadcast = () => {
    if (isRecording) stopRecording();
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsLive(false);
    socketRef.current?.disconnect();
    socketRef.current = io(); // Reconnect for chat/status
  };

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const startRecording = () => {
    if (!stream) return;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9,opus"
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: "video/webm"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vida-mixe-broadcast-${new Date().toISOString()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).filter((v, i) => v !== "00" || i > 0).join(":");
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: Date.now().toString(),
      user: user?.name || streamName || "Locutor",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAdmin: true
    };

    socketRef.current?.emit("chat_message", msg);
    setNewMessage("");
  };

  const handleLogout = async () => {
    stopBroadcast();
    await logout();
    navigate("/auth");
  };

  if (!isLive && !stream) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <Helmet>
          <title>Iniciar Transmisión | Vida Mixe TV</title>
        </Helmet>
        <div className="w-full max-w-md bg-brand-surface border border-white/10 rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8">
          <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-3xl flex items-center justify-center mx-auto">
            <Video className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">¡Listo para transmitir!</h1>
            <p className="text-neutral-400">Ingresa el nombre de tu programa o canal para comenzar.</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              placeholder="Nombre de la transmisión"
              className="w-full bg-brand-bg border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand-primary/50 transition-all text-center text-lg"
            />
            <button 
              onClick={startBroadcast}
              className="w-full py-4 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-primary/20"
            >
              Comenzar ahora
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="absolute top-6 left-6 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${isLive ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/10 border-white/10 text-neutral-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-neutral-500'}`} />
                <span className="text-xs font-bold uppercase tracking-widest">{isLive ? 'En Vivo' : 'Offline'}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold">{viewers}</span>
              </div>
            </div>
            
            {isRecording && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 border border-red-500 text-red-500 backdrop-blur-md w-fit">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest">Grabando: {formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                disabled={!stream}
                className={`p-4 rounded-full transition-all disabled:opacity-50 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={isMuted ? "Activar Micrófono" : "Silenciar Micrófono"}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button 
                onClick={toggleVideo}
                disabled={!stream}
                className={`p-4 rounded-full transition-all disabled:opacity-50 ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={isVideoOff ? "Activar Cámara" : "Desactivar Cámara"}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            </div>

            <div className="w-px h-8 bg-white/10 mx-2" />

            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button 
                  onClick={startRecording}
                  disabled={!stream}
                  className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50"
                  title="Iniciar Grabación"
                >
                  <Circle className="w-6 h-6 fill-red-500 text-red-500" />
                </button>
              ) : (
                <button 
                  onClick={stopRecording}
                  className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
                  title="Detener Grabación"
                >
                  <Square className="w-6 h-6 fill-white" />
                </button>
              )}
            </div>

            <div className="w-px h-8 bg-white/10 mx-2" />

            {!isLive ? (
              <button 
                onClick={startBroadcast}
                className="px-8 py-4 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold rounded-full transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/20"
              >
                <Power className="w-5 h-5" />
                <span>Iniciar Transmisión</span>
              </button>
            ) : (
              <button 
                onClick={stopBroadcast}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
              >
                <Power className="w-5 h-5" />
                <span>Detener</span>
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
                <h2 className="font-bold text-white">Panel de Transmisión</h2>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{user?.name || streamName || "Invitado"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-neutral-500 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              {user ? (
                <button 
                  onClick={handleLogout}
                  className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={() => { stopBroadcast(); navigate("/"); }}
                  className="p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  title="Salir"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
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
