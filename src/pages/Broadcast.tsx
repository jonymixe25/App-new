import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Video, VideoOff, Mic, MicOff, AlertCircle, Users, Clock, MessageSquare, Share2, Check, Loader2 } from "lucide-react";
import Chat from "../components/Chat";

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

export default function Broadcast() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const pendingCandidates = useRef<{ [id: string]: RTCIceCandidateInit[] }>({});
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewers, setViewers] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [showChat, setShowChat] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const handleShare = async () => {
    // Usamos el dominio personalizado configurado por el usuario
    const viewerUrl = "https://vidamixe.mx/view";
    
    try {
      await navigator.clipboard.writeText(viewerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming) {
      interval = setInterval(() => {
        setUptime(prev => prev + 1);
      }, 1000);
    } else {
      setUptime(0);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Forzamos el uso de polling primero y luego websocket para evitar problemas con proxies
    const s = io(window.location.origin, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    setSocket(s);

    s.on("connect", () => {
      setIsSocketConnected(true);
      setSocketError(null);
      if (isStreaming) {
        s.emit("broadcaster");
      }
    });

    s.on("connect_error", (err) => {
      setIsSocketConnected(false);
      setSocketError(`Error de conexión: ${err.message}`);
      console.error("Socket connection error:", err);
    });

    s.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    s.on("viewers_count", (count: number) => {
      setViewers(count);
    });

    s.on("watcher", (id: string) => {
      if (!stream) return;
      
      const peerConnection = new RTCPeerConnection(config);
      peerConnections.current[id] = peerConnection;

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          s.emit("candidate", id, event.candidate);
        }
      };

      peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
          s.emit("offer", id, peerConnection.localDescription);
        });
    });

    s.on("answer", async (id: string, description: RTCSessionDescriptionInit) => {
      const pc = peerConnections.current[id];
      if (pc) {
        try {
          await pc.setRemoteDescription(description);
          const candidates = pendingCandidates.current[id] || [];
          for (const candidate of candidates) {
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
          }
          pendingCandidates.current[id] = [];
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      }
    });

    s.on("candidate", (id: string, candidate: RTCIceCandidateInit) => {
      const pc = peerConnections.current[id];
      if (pc) {
        if (pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
        } else {
          if (!pendingCandidates.current[id]) pendingCandidates.current[id] = [];
          pendingCandidates.current[id].push(candidate);
        }
      }
    });

    s.on("disconnectPeer", (id: string) => {
      if (peerConnections.current[id]) {
        peerConnections.current[id].close();
        delete peerConnections.current[id];
      }
      if (pendingCandidates.current[id]) {
        delete pendingCandidates.current[id];
      }
    });

    return () => {
      s.disconnect();
      Object.values<RTCPeerConnection>(peerConnections.current).forEach(pc => pc.close());
    };
  }, [stream, isStreaming]);

  const startStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setIsStreaming(true);
      setError(null);
      
      if (socket && isSocketConnected) {
        socket.emit("broadcaster");
      }
    } catch (err) {
      console.error("Error accessing media devices.", err);
      setError("No se pudo acceder a la cámara o micrófono. Asegúrate de dar los permisos necesarios.");
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    
    // Close all connections
    Object.values<RTCPeerConnection>(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-zinc-50 overflow-hidden">
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
        />
        
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-6 text-center z-10">
            {!isSocketConnected ? (
              <>
                <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Conectando al servidor...</h2>
                <p className="text-zinc-400 mb-8 max-w-md text-center">
                  {socketError || "Estableciendo conexión en tiempo real. Por favor espera."}
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                  <Video className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Listo para transmitir</h2>
                <p className="text-zinc-400 mb-8 max-w-md text-center">
                  Asegúrate de estar en un lugar iluminado y con buena conexión a internet.
                </p>
                <button
                  onClick={startStream}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
                >
                  Iniciar Transmisión
                </button>
              </>
            )}
          </div>
        )}

        {isStreaming && (
          <>
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSocketConnected ? 'bg-red-400' : 'bg-amber-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isSocketConnected ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                </span>
                <span className="text-xs font-medium tracking-wider text-white uppercase">
                  {isSocketConnected ? 'En Vivo' : 'Reconectando...'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium text-white">
                <Users className="w-4 h-4 text-indigo-400" /> {viewers}
              </div>
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium text-white">
                <Clock className="w-4 h-4 text-emerald-400" /> {formatUptime(uptime)}
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 z-10">
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${videoEnabled ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              >
                {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-colors ${audioEnabled ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              >
                {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              <button
                onClick={stopStream}
                className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white font-medium rounded-full transition-colors ml-2"
              >
                Detener
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md text-white p-4 rounded-xl flex items-center gap-3 z-50 shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={handleShare}
          className="p-3 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full border border-white/10 text-white transition-all shadow-lg"
          title="Copiar enlace de espectador"
        >
          {copied ? <Check className="w-6 h-6 text-emerald-400" /> : <Share2 className="w-6 h-6" />}
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className="p-3 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full border border-white/10 text-white transition-all shadow-lg"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>

      <div 
        className={`absolute top-0 right-0 h-full w-full md:w-80 lg:w-96 transition-transform duration-300 ease-in-out z-40 ${
          showChat ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <Chat socket={socket} isHost={true} transparent={true} />
      </div>
    </div>
  );
}
