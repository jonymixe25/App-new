import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Video, VideoOff, Mic, MicOff, AlertCircle, Activity, Users, Clock } from "lucide-react";
import Chat from "../components/Chat";

const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
};

export default function Broadcast() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewers, setViewers] = useState(0);
  const [uptime, setUptime] = useState(0);

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

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
    const s = io(window.location.origin);
    setSocket(s);

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

    s.on("answer", (id: string, description: RTCSessionDescriptionInit) => {
      peerConnections.current[id]?.setRemoteDescription(description);
    });

    s.on("candidate", (id: string, candidate: RTCIceCandidateInit) => {
      peerConnections.current[id]?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    s.on("disconnectPeer", (id: string) => {
      if (peerConnections.current[id]) {
        peerConnections.current[id].close();
        delete peerConnections.current[id];
      }
    });

    return () => {
      s.disconnect();
      Object.values<RTCPeerConnection>(peerConnections.current).forEach(pc => pc.close());
    };
  }, [stream]);

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
      
      if (socket) {
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
    <div className="h-screen bg-zinc-950 text-zinc-50 flex flex-col overflow-hidden">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-semibold">Panel de Control del Anfitrión</h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isStreaming ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isStreaming ? 'bg-emerald-500' : 'bg-zinc-500'}`}></span>
            </span>
            {isStreaming ? 'Transmisión Activa' : 'Desconectado'}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-6 flex flex-col overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3 mb-6 shrink-0">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 shrink-0">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Espectadores</p>
                <p className="text-2xl font-semibold">{viewers}</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Tiempo en Vivo</p>
                <p className="text-2xl font-semibold">{formatUptime(uptime)}</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Estado de Conexión</p>
                <p className="text-2xl font-semibold text-emerald-400">Excelente</p>
              </div>
            </div>
          </div>

          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex-shrink-0">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            
            {!isStreaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-sm">
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
              </div>
            )}

            {isStreaming && (
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-4">
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
                  className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white font-medium rounded-full transition-colors ml-4"
                >
                  Detener Transmisión
                </button>
              </div>
            )}
          </div>
        </main>

        <aside className="w-96 flex-shrink-0">
          <Chat socket={socket} isHost={true} />
        </aside>
      </div>
    </div>
  );
}
