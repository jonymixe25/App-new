import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { MonitorPlay, AlertCircle, Loader2, MessageSquare, VideoOff, Phone, X, Check, RefreshCw, Facebook, Share2, Users } from "lucide-react";
import Chat from "../components/Chat";
import { getSocketUrl } from "../utils/socket";

interface Broadcaster {
  id: string;
  name: string;
  viewers: number;
}

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

export default function View() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  
  // Private Call State
  const [incomingCall, setIncomingCall] = useState(false);
  const [isPrivateCallActive, setIsPrivateCallActive] = useState(false);
  const privatePeerConnection = useRef<RTCPeerConnection | null>(null);
  const [privateStream, setPrivateStream] = useState<MediaStream | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [streamEnded, setStreamEnded] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [broadcasters, setBroadcasters] = useState<Broadcaster[]>([]);
  const [selectedBroadcasterId, setSelectedBroadcasterId] = useState<string | null>(null);

  // Sound ref
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    notificationSound.current.volume = 0.5;
  }, []);

  const playNotification = () => {
    if (notificationSound.current) {
      notificationSound.current.currentTime = 0;
      notificationSound.current.play().catch(e => console.log("Audio play failed", e));
    }
  };

  // Handle Private Call
  const acceptPrivateCall = async () => {
    if (!socket) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPrivateStream(stream);
      
      const pc = new RTCPeerConnection(config);
      privatePeerConnection.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Send candidate back to broadcaster (who initiated the call)
          // We need to know broadcaster ID, but for now we assume the offer came from broadcaster
          // The server handles routing based on socket ID
          // Wait, we need the caller ID. Let's store it in state when offer arrives.
        }
      };

      // We need to handle the offer that was stored or passed
      // This logic needs to be inside the socket event listener or state
      
      setIncomingCall(false);
      setIsPrivateCallActive(true);
      
    } catch (err) {
      console.error("Error accessing media for private call:", err);
      alert("No se pudo acceder a la cámara/micrófono");
      setIncomingCall(false);
    }
  };

  const rejectPrivateCall = () => {
    setIncomingCall(false);
    // Optionally emit rejection event
  };

  const endPrivateCall = () => {
    if (privateStream) {
      privateStream.getTracks().forEach(track => track.stop());
      setPrivateStream(null);
    }
    if (privatePeerConnection.current) {
      privatePeerConnection.current.close();
      privatePeerConnection.current = null;
    }
    setIsPrivateCallActive(false);
  };

  const shareToFacebook = () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const selectBroadcaster = (id: string) => {
    if (selectedBroadcasterId === id) return;
    
    // Limpiar conexión previa si existe
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    setSelectedBroadcasterId(id);
    setIsBroadcasting(false);
    setStreamEnded(false);
    
    if (socket) {
      socket.emit("watcher", id);
    }
  };

  useEffect(() => {
    const socketUrl = getSocketUrl();

    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    setSocket(s);

    s.on("connect", () => {
      setIsConnected(true);
      setSocketError(null);
      s.emit("get_broadcasters");
    });

    s.on("broadcaster_list", (list: Broadcaster[]) => {
      setBroadcasters(list);
      // Si no hay nada seleccionado y hay broadcasters, seleccionar el primero
      if (list.length > 0 && !selectedBroadcasterId) {
        // No seleccionamos automáticamente para dejar que el usuario elija
      }
    });

    s.on("connect_error", (err) => {
      setIsConnected(false);
      setSocketError(`Error al conectar con ${socketUrl}: ${err.message}`);
      console.error("Socket connection error:", err);
    });

    s.on("broadcaster", () => {
      s.emit("get_broadcasters");
    });

    s.on("chat_message", (message: any) => {
      if (!showChat) {
        setUnreadMessages(prev => prev + 1);
        playNotification();
      }
    });

    // Private Call Logic
    s.on("private_offer", async (callerId: string, description: RTCSessionDescriptionInit) => {
      setIncomingCall(true);
      
      // We need to define the accept function here to close over callerId and description
      // Or store them in refs/state to be used by the UI handler
      // For simplicity, let's auto-accept or handle via state if we want a UI prompt
      // But the UI handler 'acceptPrivateCall' needs access to these.
      
      // Let's modify the strategy:
      // 1. Store pending offer in ref
      // 2. Show UI
      // 3. On Accept, process the ref
      
      // Storing in a way accessible to the component scope
      (window as any).pendingPrivateOffer = { callerId, description };
    });

    s.on("private_candidate", (callerId: string, candidate: RTCIceCandidateInit) => {
      if (privatePeerConnection.current) {
        privatePeerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      }
    });

    s.on("offer", async (id: string, description: RTCSessionDescriptionInit) => {
      peerConnection.current = new RTCPeerConnection(config);
      setStreamEnded(false);
      
      peerConnection.current.ontrack = event => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setIsBroadcasting(true);
          setStreamEnded(false);
        }
      };

      peerConnection.current.onicecandidate = event => {
        if (event.candidate) {
          s.emit("candidate", id, event.candidate);
        }
      };

      try {
        await peerConnection.current.setRemoteDescription(description);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        s.emit("answer", id, peerConnection.current.localDescription);

        // Process any candidates that arrived before remote description was set
        while (pendingCandidates.current.length > 0) {
          const candidate = pendingCandidates.current.shift();
          if (candidate) {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
          }
        }
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    s.on("candidate", (id: string, candidate: RTCIceCandidateInit) => {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    s.on("disconnectPeer", (id: string) => {
      if (id === selectedBroadcasterId) {
        peerConnection.current?.close();
        setIsBroadcasting(false);
        setStreamEnded(true);
        setSelectedBroadcasterId(null);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        endPrivateCall();
      }
      s.emit("get_broadcasters");
    });

    s.on("disconnect", () => {
      setIsConnected(false);
      setIsBroadcasting(false);
      peerConnection.current?.close();
      endPrivateCall();
    });

    return () => {
      s.disconnect();
      peerConnection.current?.close();
      endPrivateCall();
    };
  }, []);

  // Real implementation of acceptPrivateCall that uses the stored offer
  const handleAcceptCall = async () => {
    const pending = (window as any).pendingPrivateOffer;
    if (!pending || !socket) return;
    
    const { callerId, description } = pending;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPrivateStream(stream);
      
      const pc = new RTCPeerConnection(config);
      privatePeerConnection.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("private_candidate", callerId, event.candidate);
        }
      };

      await pc.setRemoteDescription(description);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit("private_answer", callerId, pc.localDescription);
      
      setIncomingCall(false);
      setIsPrivateCallActive(true);
    } catch (err) {
      console.error("Error accepting call:", err);
      alert("Error al iniciar la llamada privada.");
      setIncomingCall(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-black text-zinc-50 overflow-hidden">
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          controls
          className="w-full h-full object-contain"
        />
        
        {/* Incoming Call Modal */}
        {incomingCall && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-2xl max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Invitación a Video</h3>
              <p className="text-zinc-400 mb-6">
                El anfitrión te está invitando a unirte a una videollamada privada.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={rejectPrivateCall}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                >
                  Rechazar
                </button>
                <button 
                  onClick={handleAcceptCall}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Aceptar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Private Call Active Indicator */}
        {isPrivateCallActive && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-emerald-600/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
            <Phone className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">En llamada privada con el anfitrión</span>
            <button 
              onClick={endPrivateCall}
              className="ml-2 p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Stream Selector Overlay */}
        {!isBroadcasting && isConnected && broadcasters.length > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-6 z-40">
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">Transmisiones Disponibles</h2>
                <p className="text-zinc-400">Selecciona una transmisión para comenzar a ver</p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {broadcasters.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => selectBroadcaster(b.id)}
                    className="flex flex-col items-start p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-emerald-500/50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MonitorPlay className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        EN VIVO
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{b.name}</h3>
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{b.viewers} espectadores</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Facebook Share Button */}
        {isBroadcasting && (
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button 
              onClick={shareToFacebook}
              className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-sm font-bold rounded-full shadow-lg transition-all hover:scale-105"
            >
              <Facebook className="w-4 h-4" />
              Compartir en Facebook
            </button>
          </div>
        )}

        {!isBroadcasting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-6 text-center z-10">
            {isConnected ? (
              <>
                {streamEnded ? (
                  <>
                    <div className="w-20 h-20 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mb-6">
                      <VideoOff className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Transmisión finalizada</h2>
                    <p className="text-zinc-400 mb-8 max-w-md">
                      El transmisor ha finalizado el video en vivo o se ha perdido la conexión.
                    </p>
                    <div className="flex items-center gap-3 text-zinc-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Esperando que se reanude...</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mb-6">
                      <MonitorPlay className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Esperando transmisión</h2>
                    <p className="text-zinc-400 mb-8 max-w-md">
                      El transmisor aún no ha iniciado el video en vivo. La reproducción comenzará automáticamente.
                    </p>
                    <div className="flex items-center gap-3 text-indigo-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Conectado al servidor</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Conectando...</h2>
                <div className="text-zinc-400 mb-8 max-w-md text-center space-y-4">
                  <p>{socketError || "Estableciendo conexión con el servidor de transmisión."}</p>
                  {socketError && (
                    <button 
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4" /> Reintentar Conexión
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {isBroadcasting && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-medium tracking-wider text-white uppercase">En Vivo</span>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setShowChat(!showChat);
          if (!showChat) setUnreadMessages(0);
        }}
        className="absolute top-4 right-4 z-50 p-3 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full border border-white/10 text-white transition-all shadow-lg relative"
      >
        <MessageSquare className="w-6 h-6" />
        {!showChat && unreadMessages > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
            {unreadMessages > 9 ? '9+' : unreadMessages}
          </span>
        )}
      </button>

      <div 
        className={`absolute top-0 right-0 h-full w-full md:w-80 lg:w-96 transition-transform duration-300 ease-in-out z-40 ${
          showChat ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <Chat socket={socket} isHost={false} transparent={true} />
      </div>
    </div>
  );
}
