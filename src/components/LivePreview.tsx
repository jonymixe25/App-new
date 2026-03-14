import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { MonitorPlay, VideoOff, Loader2, Volume2, VolumeX } from "lucide-react";
import { getSocketUrl } from "../utils/socket";

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

interface Broadcaster {
  id: string;
  name: string;
  viewers: number;
}

export default function LivePreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentStreamName, setCurrentStreamName] = useState("");

  useEffect(() => {
    const socketUrl = getSocketUrl();
    const s = io(socketUrl, {
      transports: ["websocket", "polling"],
      timeout: 10000,
    });
    setSocket(s);

    s.on("connect", () => {
      s.emit("get_broadcasters");
      setLoading(false);
    });

    s.on("broadcaster_list", (list: Broadcaster[]) => {
      if (list.length > 0 && !isBroadcasting) {
        const first = list[0];
        setCurrentStreamName(first.name);
        s.emit("watcher", first.id);
      } else if (list.length === 0) {
        setIsBroadcasting(false);
        if (videoRef.current) videoRef.current.srcObject = null;
      }
    });

    s.on("broadcaster", () => {
      s.emit("get_broadcasters");
    });

    s.on("offer", async (id, description) => {
      peerConnection.current = new RTCPeerConnection(config);
      
      peerConnection.current.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
        setIsBroadcasting(true);
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          s.emit("candidate", id, event.candidate);
        }
      };

      try {
        await peerConnection.current.setRemoteDescription(description);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        s.emit("answer", id, peerConnection.current.localDescription);
      } catch (err) {
        console.error("Error handling offer in preview:", err);
      }
    });

    s.on("candidate", (id, candidate) => {
      peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    });

    s.on("disconnectPeer", (id: string) => {
      peerConnection.current?.close();
      setIsBroadcasting(false);
      if (videoRef.current) videoRef.current.srcObject = null;
      s.emit("get_broadcasters");
    });

    return () => {
      s.disconnect();
      peerConnection.current?.close();
    };
  }, []);

  return (
    <div className="relative w-full aspect-video bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 shadow-2xl group">
      {isBroadcasting ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-red-500/20 backdrop-blur-md px-2 py-0.5 rounded border border-red-500/30">
              En Vivo: {currentStreamName}
            </span>
          </div>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
          {loading ? (
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          ) : (
            <>
              <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center text-stone-700">
                <VideoOff className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-stone-200 font-medium">Sin señal en vivo</h4>
                <p className="text-stone-500 text-xs mt-1">Vuelve más tarde para ver la transmisión</p>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Overlay link to full view */}
      {isBroadcasting && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors cursor-pointer flex items-center justify-center group/btn">
           <div className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-bold opacity-0 group-hover/btn:opacity-100 transition-all transform translate-y-2 group-hover/btn:translate-y-0 shadow-xl">
             Abrir Pantalla Completa
           </div>
        </div>
      )}
    </div>
  );
}
