import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { MonitorPlay, AlertCircle, Loader2, MessageSquare } from "lucide-react";
import Chat from "../components/Chat";

const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
};

export default function View() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    const s = io(window.location.origin);
    setSocket(s);

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("watcher");
    });

    s.on("broadcaster", () => {
      s.emit("watcher");
    });

    s.on("offer", (id: string, description: RTCSessionDescriptionInit) => {
      peerConnection.current = new RTCPeerConnection(config);
      
      peerConnection.current
        .setRemoteDescription(description)
        .then(() => peerConnection.current?.createAnswer())
        .then(sdp => peerConnection.current?.setLocalDescription(sdp))
        .then(() => {
          s.emit("answer", id, peerConnection.current?.localDescription);
        });

      peerConnection.current.ontrack = event => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setIsBroadcasting(true);
        }
      };

      peerConnection.current.onicecandidate = event => {
        if (event.candidate) {
          s.emit("candidate", id, event.candidate);
        }
      };
    });

    s.on("candidate", (id: string, candidate: RTCIceCandidateInit) => {
      peerConnection.current
        ?.addIceCandidate(new RTCIceCandidate(candidate))
        .catch(e => console.error(e));
    });

    s.on("disconnectPeer", () => {
      peerConnection.current?.close();
      setIsBroadcasting(false);
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
    <div className="w-full h-screen bg-black text-zinc-50 flex flex-col md:flex-row overflow-hidden">
      <div className="flex-1 relative bg-zinc-950 flex flex-col">
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls
            className="w-full h-full object-contain"
          />
          
          {!isBroadcasting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-6 text-center">
              {isConnected ? (
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
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Desconectado</h2>
                  <p className="text-zinc-400 mb-8 max-w-md">
                    No se pudo conectar al servidor de transmisión. Reintentando...
                  </p>
                </>
              )}
            </div>
          )}

          {isBroadcasting && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
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
          className="md:hidden absolute top-4 right-4 z-50 p-2 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-white/10 text-white"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      <div className={`${showChat ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 h-[50vh] md:h-full flex-shrink-0 border-t md:border-t-0 md:border-l border-zinc-800`}>
        <Chat socket={socket} isHost={false} />
      </div>
    </div>
  );
}
