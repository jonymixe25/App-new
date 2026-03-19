import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Room, LocalVideoTrack, LocalAudioTrack } from "livekit-client";
import { Video, Mic, MicOff, VideoOff, Settings, Users, MessageSquare, Send, Power, ShieldCheck, LogOut, Circle, Square, Download, FlipHorizontal } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useUser } from "../contexts/UserContext";
import Chat from "../components/Chat";

export default function Broadcast() {
  const { user, loading: userLoading, logout } = useUser();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamName, setStreamName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [socketStatus, setSocketStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const roomRef = useRef<Room | null>(null);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!streamRef.current) {
      requestPermissions();
    }
  }, []);

  useEffect(() => {
    // Initialize Socket.IO once
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://app-new-production-1af2.up.railway.app";
    const socket = io(backendUrl);
    socketRef.current = socket;

    socket.on("connect", () => setSocketStatus("connected"));
    socket.on("disconnect", () => setSocketStatus("disconnected"));
    socket.on("connect_error", () => setSocketStatus("disconnected"));

    socket.on("viewers_count", (count: number) => {
      setViewers(count);
    });

    return () => {
      socket.disconnect();
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // Only run once on mount

  // Use a ref for the stream to access it inside socket listeners without re-binding
  const streamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isLive]);

  const startBroadcast = async () => {
    let currentStream = stream;
    if (!currentStream) {
      currentStream = await requestPermissions();
      if (!currentStream) return;
    }
    
    const finalStreamName = streamName || user?.name || "Vida Mixe Stream";

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://app-new-production-1af2.up.railway.app";
      const response = await fetch(`${backendUrl}/api/livekit/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: finalStreamName,
          participantName: user?.name || "Locutor",
          isBroadcaster: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status} ${response.statusText}`);
      }
      
      const { token } = await response.json();

      const room = new Room();
      roomRef.current = room;
      await room.connect('wss://new-app-6tu2ilh8.livekit.cloud', token);

      const videoTrack = currentStream.getVideoTracks()[0];
      const audioTrack = currentStream.getAudioTracks()[0];

      if (videoTrack) {
        const lvt = new LocalVideoTrack(videoTrack);
        localVideoTrackRef.current = lvt;
        await room.localParticipant.publishTrack(lvt);
      }
      if (audioTrack) {
        const lat = new LocalAudioTrack(audioTrack);
        localAudioTrackRef.current = lat;
        await room.localParticipant.publishTrack(lat);
      }

      socketRef.current?.emit("broadcaster", finalStreamName);
      setIsLive(true);
    } catch (error: any) {
      console.error("Error starting broadcast:", error);
      alert(`Error al conectar con el servidor de video: ${error.message || error}`);
    }
  };

  const requestPermissions = async (mode: "user" | "environment" = facingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      let mediaStream: MediaStream;
      try {
        // First attempt: Ideal constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: mode
          },
          audio: true
        });
      } catch (err: any) {
        console.warn("Failed with ideal constraints, trying basic video/audio", err);
        try {
          // Second attempt: Basic video and audio
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
        } catch (err2: any) {
          console.warn("Failed with basic video/audio, trying audio only", err2);
          try {
            // Third attempt: Audio only
            mediaStream = await navigator.mediaDevices.getUserMedia({
              audio: true
            });
          } catch (err3: any) {
            console.warn("Failed with audio only, trying video only", err3);
            // Fourth attempt: Video only
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true
            });
          }
        }
      }
      
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setHasPermissions(true);
      return mediaStream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setHasPermissions(false);
      return null;
    }
  };

  const flipCamera = async () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    
    const newStream = await requestPermissions(newMode);
    
    if (newStream && isLive && roomRef.current && localVideoTrackRef.current) {
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        await localVideoTrackRef.current.replaceTrack(videoTrack);
      }
    }
  };

  const stopBroadcast = () => {
    if (isRecording) stopRecording();
    
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop();
      localVideoTrackRef.current = null;
    }
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current = null;
    }

    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsLive(false);
    socketRef.current?.emit("stop_broadcasting");
    
    // Refresh permissions to get local stream back for preview
    requestPermissions();
  };

  const toggleMute = () => {
    if (localAudioTrackRef.current) {
      if (isMuted) {
        localAudioTrackRef.current.unmute();
      } else {
        localAudioTrackRef.current.mute();
      }
    } else if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      if (isVideoOff) {
        localVideoTrackRef.current.unmute();
      } else {
        localVideoTrackRef.current.mute();
      }
    } else if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
    setIsVideoOff(!isVideoOff);
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

  const handleLogout = async () => {
    stopBroadcast();
    await logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-brand-bg text-neutral-50 flex flex-col">
      <Helmet>
        <title>Panel de Transmisión | Vida Mixe TV</title>
      </Helmet>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {!stream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900 z-10">
              <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                <Video className="w-12 h-12 text-brand-primary animate-pulse" />
              </div>
              <p className="text-neutral-400 font-medium mb-4">Solicitando acceso a cámara y micrófono...</p>
              <button 
                onClick={() => requestPermissions()}
                className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold rounded-xl transition-all"
              >
                Permitir Acceso
              </button>
            </div>
          )}
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
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex flex-col gap-3 z-10 max-w-[calc(100%-2rem)]">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-md border ${isLive ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/10 border-white/10 text-neutral-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-neutral-500'}`} />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">{isLive ? 'En Vivo' : 'Offline'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs font-bold">{viewers}</span>
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white" title="Estado del Servidor">
                <div className={`w-2 h-2 rounded-full ${socketStatus === 'connected' ? 'bg-emerald-500' : socketStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] sm:text-xs font-bold capitalize">{socketStatus === 'connected' ? 'Conectado' : socketStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}</span>
              </div>
              {isLive && (
                <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-emerald-400" title="Calidad de Transmisión">
                  <div className="flex items-end gap-0.5 h-2 sm:h-3">
                    <div className="w-0.5 sm:w-1 bg-emerald-400 h-1/3 rounded-sm"></div>
                    <div className="w-0.5 sm:w-1 bg-emerald-400 h-2/3 rounded-sm"></div>
                    <div className="w-0.5 sm:w-1 bg-emerald-400 h-full rounded-sm"></div>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold">Excelente</span>
                </div>
              )}
            </div>
            
            {isRecording && (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-red-600/20 border border-red-500 text-red-500 backdrop-blur-md w-fit">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Grabando: {formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 px-4 sm:px-8 py-2 sm:py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl z-10 w-[90%] sm:w-auto justify-center">
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={toggleMute}
                disabled={!stream}
                className={`p-3 sm:p-4 rounded-full transition-all disabled:opacity-50 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={isMuted ? "Activar Micrófono" : "Silenciar Micrófono"}
              >
                {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
              <button 
                onClick={toggleVideo}
                disabled={!stream}
                className={`p-3 sm:p-4 rounded-full transition-all disabled:opacity-50 ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={isVideoOff ? "Activar Cámara" : "Desactivar Cámara"}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
              <button 
                onClick={flipCamera}
                disabled={!stream}
                className="p-3 sm:p-4 rounded-full transition-all disabled:opacity-50 bg-white/10 text-white hover:bg-white/20"
                title="Voltear Cámara"
              >
                <FlipHorizontal className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="w-px h-6 sm:h-8 bg-white/10 mx-1 sm:mx-2" />

            <div className="flex items-center gap-1 sm:gap-2">
              {!isRecording ? (
                <button 
                  onClick={startRecording}
                  disabled={!stream}
                  className="p-3 sm:p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50"
                  title="Iniciar Grabación"
                >
                  <Circle className="w-5 h-5 sm:w-6 sm:h-6 fill-red-500 text-red-500" />
                </button>
              ) : (
                <button 
                  onClick={stopRecording}
                  className="p-3 sm:p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
                  title="Detener Grabación"
                >
                  <Square className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                </button>
              )}
            </div>

            <div className="w-px h-6 sm:h-8 bg-white/10 mx-1 sm:mx-2" />

            {!isLive ? (
              <button 
                onClick={startBroadcast}
                className="px-4 sm:px-8 py-3 sm:py-4 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold rounded-full transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/20 text-sm sm:text-base"
              >
                <Power className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Iniciar Transmisión</span>
                <span className="sm:hidden">Iniciar</span>
              </button>
            ) : (
              <button 
                onClick={stopBroadcast}
                className="px-4 sm:px-8 py-3 sm:py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 text-sm sm:text-base"
              >
                <Power className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Detener Transmisión</span>
                <span className="sm:hidden">Detener</span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-brand-surface border-l border-white/5 flex flex-col z-20">
          <div className="p-6 border-b border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/20 text-brand-primary rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Panel de Transmisión</h2>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{user?.name || "Locutor"}</p>
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
            
            {!isLive && (
              <div className="mt-2">
                <label className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-2 block">Nombre de la transmisión</label>
                <input
                  type="text"
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                  placeholder="Ej. Fiesta Patronal 2026"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-primary/50 transition-all"
                />
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Chat socket={socketRef.current} isHost={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
