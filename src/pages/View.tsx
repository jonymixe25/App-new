import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { MonitorPlay, AlertCircle, Loader2, MessageSquare, VideoOff, Phone, X, Check, RefreshCw, Facebook, Share2, Users, Camera } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Chat from "../components/Chat";
import { getSocketUrl } from "../utils/socket";
import { useLanguage } from "../context/LanguageContext";

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
  const privateVideoRef = useRef<HTMLVideoElement>(null); // Video para la llamada privada
  const [socket, setSocket] = useState<Socket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const { t } = useLanguage();
  
  // Private Call State
  const [incomingCall, setIncomingCall] = useState(false);
  const [pendingOffer, setPendingOffer] = useState<{ callerId: string, description: RTCSessionDescriptionInit } | null>(null);
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
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

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
  const rejectPrivateCall = () => {
    setIncomingCall(false);
    setPendingOffer(null);
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

  const flipPrivateCamera = async () => {
    if (!privateStream || !isPrivateCallActive) return;
    
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    try {
      // Stop current video tracks
      privateStream.getVideoTracks().forEach(track => track.stop());
      
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode
        }
      });
      
      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      
      // Update local private stream
      const combinedStream = new MediaStream([newVideoTrack, ...privateStream.getAudioTracks()]);
      setPrivateStream(combinedStream);
      
      // Replace track in peer connection
      if (privatePeerConnection.current) {
        const sender = privatePeerConnection.current.getSenders().find(s => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }
    } catch (err) {
      console.error("Error flipping private camera:", err);
    }
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
    if (privateVideoRef.current && privateStream) {
      privateVideoRef.current.srcObject = privateStream;
    }
  }, [privateStream]);

  useEffect(() => {
    const socketUrl = getSocketUrl();

    const s = io(socketUrl, {
      transports: ['polling', 'websocket'],
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
    });

    s.on("connect_error", (err) => {
      setIsConnected(false);
      setSocketError(`${t.view.connectingDesc} ${socketUrl}: ${err.message}`);
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
      setPendingOffer({ callerId, description });
      setIncomingCall(true);
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
  }, [selectedBroadcasterId]);

  // Real implementation of acceptPrivateCall that uses the stored offer
  const handleAcceptCall = async () => {
    if (!pendingOffer || !socket) return;
    
    const { callerId, description } = pendingOffer;

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
    <div className="relative w-full h-[calc(100vh-64px)] bg-brand-bg text-neutral-50 overflow-hidden">
      <Helmet>
        <title>{t.view.title} | Vida Mixe TV</title>
        <meta name="description" content="Mira las transmisiones en vivo de la comunidad Mixe. Únete al chat y participa en la conversación." />
      </Helmet>
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
          <div className="absolute inset-0 flex items-center justify-center bg-brand-bg/80 z-50 backdrop-blur-sm">
            <div className="bg-brand-surface p-6 rounded-2xl border border-white/5 shadow-2xl max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-brand-primary/20 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t.view.videoInvitation}</h3>
              <p className="text-neutral-400 mb-6">
                {t.view.invitationDesc}
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={rejectPrivateCall}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                >
                  {t.view.reject}
                </button>
                <button 
                  onClick={handleAcceptCall}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> {t.view.accept}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Private Call Active Indicator */}
        {isPrivateCallActive && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-brand-primary/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
            <Phone className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">{t.view.privateCallActive}</span>
            <button 
              onClick={flipPrivateCamera}
              className="ml-2 p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              title={t.view.flipCamera}
            >
              <Camera className="w-3 h-3 text-white" />
            </button>
            <button 
              onClick={endPrivateCall}
              className="ml-1 p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}

        {/* Private Call Local Video Overlay */}
        {isPrivateCallActive && (
          <div className="absolute bottom-24 right-4 w-48 h-36 bg-brand-surface rounded-xl border border-white/10 shadow-2xl overflow-hidden z-30">
              <video
                ref={privateVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1">
                <Users className="w-3 h-3 text-brand-primary" />
                {t.view.you}
              </div>
          </div>
        )}

        {/* Stream Selector Overlay */}
        {!isBroadcasting && isConnected && broadcasters.length > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-bg/90 backdrop-blur-sm p-6 z-40">
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">{t.view.availableStreams}</h2>
                <p className="text-neutral-400">{t.view.selectToWatch}</p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {broadcasters.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => selectBroadcaster(b.id)}
                    className="flex flex-col items-start p-6 bg-brand-surface border border-white/5 rounded-2xl hover:bg-brand-surface/80 hover:border-brand-primary/50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MonitorPlay className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-brand-primary bg-brand-primary/10 px-2 py-1 rounded">
                        <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse"></span>
                        {t.view.live}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{b.name}</h3>
                    <div className="flex items-center gap-2 text-neutral-500 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{b.viewers} {t.view.viewers}</span>
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
              {t.view.shareFacebook}
            </button>
          </div>
        )}

        {!isBroadcasting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-bg/90 backdrop-blur-sm p-6 text-center z-10">
            {isConnected ? (
              <>
                {streamEnded ? (
                  <>
                    <div className="w-20 h-20 bg-white/5 text-neutral-400 rounded-full flex items-center justify-center mb-6">
                      <VideoOff className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">{t.view.streamEnded}</h2>
                    <p className="text-neutral-400 mb-8 max-w-md">
                      {t.view.streamEndedDesc}
                    </p>
                    <div className="flex items-center gap-3 text-neutral-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t.view.waitingResume}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mb-6">
                      <MonitorPlay className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">{t.view.waitingStream}</h2>
                    <p className="text-neutral-400 mb-8 max-w-md">
                      {t.view.waitingStartDesc}
                    </p>
                    <div className="flex items-center gap-3 text-brand-primary">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t.view.connectedToServer}</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-brand-secondary/10 text-brand-secondary rounded-full flex items-center justify-center mb-6">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">{t.view.connecting}</h2>
                <div className="text-neutral-400 mb-8 max-w-md text-center space-y-4">
                  <p>{socketError || t.view.connectingDesc}</p>
                  {socketError && (
                    <button 
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4" /> {t.view.retryConnection}
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
            <span className="text-xs font-medium tracking-wider text-white uppercase">{t.view.live}</span>
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
