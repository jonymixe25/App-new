import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { MonitorPlay, AlertCircle, Loader2, MessageSquare, VideoOff } from "lucide-react";
import Chat from "../components/Chat";

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
  
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [streamEnded, setStreamEnded] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [socketError, setSocketError] = useState<string | null>(null);

  useEffect(() => {
    const s = io(window.location.origin, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    setSocket(s);

    s.on("connect", () => {
      setIsConnected(true);
      setSocketError(null);
      s.emit("watcher");
    });

    s.on("connect_error", (err) => {
      setIsConnected(false);
      setSocketError(`Error de conexión: ${err.message}`);
      console.error("Socket connection error:", err);
    });

    s.on("broadcaster", () => {
      setStreamEnded(false);
      s.emit("watcher");
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

    s.on("disconnectPeer", () => {
      peerConnection.current?.close();
      setIsBroadcasting(false);
      setStreamEnded(true);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    });

    s.on("disconnect", () => {
      setIsConnected(false);
      setIsBroadcasting(false);
      peerConnection.current?.close();
    });

    return () => {
      s.disconnect();
      peerConnection.current?.close();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black text-zinc-50 overflow-hidden">
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          controls
          className="w-full h-full object-contain"
        />
        
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
                <p className="text-zinc-400 mb-8 max-w-md">
                  {socketError || "Estableciendo conexión con el servidor de transmisión."}
                </p>
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
        onClick={() => setShowChat(!showChat)}
        className="absolute top-4 right-4 z-50 p-3 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full border border-white/10 text-white transition-all shadow-lg"
      >
        <MessageSquare className="w-6 h-6" />
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
