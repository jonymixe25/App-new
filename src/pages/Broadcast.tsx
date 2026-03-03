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
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | null>(null);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

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

  useEffect(() => {
    const updateDevices = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices(list);
        const video = list.find(d => d.kind === 'videoinput');
        const audio = list.find(d => d.kind === 'audioinput');
        if (!selectedVideoDeviceId && video) setSelectedVideoDeviceId(video.deviceId);
        if (!selectedAudioDeviceId && audio) setSelectedAudioDeviceId(audio.deviceId);
      } catch (e) {
        console.warn('No se pudieron enumerar los dispositivos', e);
      }
    };

    updateDevices();
    navigator.mediaDevices.addEventListener?.('devicechange', updateDevices);
    return () => navigator.mediaDevices.removeEventListener?.('devicechange', updateDevices);
  }, [isStreaming]);

  const startStream = async () => {
    try {
      const videoConstraints: any = {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };
      if (selectedVideoDeviceId) videoConstraints.deviceId = { exact: selectedVideoDeviceId };
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : true
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

  const startScreenShare = async () => {
    if (!socket) return;
    try {
      const displayStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return;
      screenTrackRef.current = screenTrack;
      setIsScreenSharing(true);

      // Replace local video element
      if (videoRef.current) {
        const current = stream ? new MediaStream([...stream.getTracks().filter(t => t.kind !== 'video'), screenTrack]) : new MediaStream([screenTrack]);
        videoRef.current.srcObject = current;
      }

      // Replace track in existing peer connections
      Object.values(peerConnections.current).forEach((pc: RTCPeerConnection) => {
        try {
          const senders = pc.getSenders();
          const sender = senders.find(s => s.track && s.track.kind === 'video');
          if (sender && 'replaceTrack' in sender) {
            // @ts-ignore
            sender.replaceTrack(screenTrack);
          }
        } catch (e) {
          console.warn('No se pudo reemplazar la pista en un peer', e);
        }
      });

      // When screen sharing stops, revert to camera
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (e) {
      console.error('Error al compartir pantalla', e);
    }
  };

  const stopScreenShare = () => {
    const screenTrack = screenTrackRef.current;
    if (screenTrack) {
      screenTrack.stop();
      screenTrackRef.current = null;
    }
    setIsScreenSharing(false);

    // If we have a camera stream, restore its video track to peers and local video
    if (stream) {
      const cameraTrack = stream.getVideoTracks()[0];
      if (videoRef.current) videoRef.current.srcObject = stream;
      if (cameraTrack) {
        Object.values(peerConnections.current).forEach((pc: RTCPeerConnection) => {
          try {
            const senders = pc.getSenders();
            const sender = senders.find(s => s.track && s.track.kind === 'video');
            if (sender && 'replaceTrack' in sender) {
              // @ts-ignore
              sender.replaceTrack(cameraTrack);
            }
          } catch (e) {
            console.warn('No se pudo restaurar la pista en un peer', e);
          }
        });
      }
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
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-6 flex flex-col overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3 mb-6 shrink-0">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Panel de estadísticas removido para UI simplificada */}

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
                <div className="flex gap-3 mb-6">
                  <div className="text-sm">
                    <label className="text-zinc-400 block mb-1">Cámara</label>
                    <select
                      value={selectedVideoDeviceId ?? ''}
                      onChange={(e) => setSelectedVideoDeviceId(e.target.value || null)}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-2 rounded-md"
                    >
                      {devices.filter(d => d.kind === 'videoinput').map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || 'Cámara ' + d.deviceId}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-sm">
                    <label className="text-zinc-400 block mb-1">Micrófono</label>
                    <select
                      value={selectedAudioDeviceId ?? ''}
                      onChange={(e) => setSelectedAudioDeviceId(e.target.value || null)}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-2 rounded-md"
                    >
                      {devices.filter(d => d.kind === 'audioinput').map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || 'Micrófono ' + d.deviceId}</option>
                      ))}
                    </select>
                  </div>
                </div>
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
                {!isScreenSharing ? (
                  <button
                    onClick={startScreenShare}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full transition-colors"
                  >
                    Compartir Pantalla
                  </button>
                ) : (
                  <button
                    onClick={stopScreenShare}
                    className="px-4 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-full transition-colors"
                  >
                    Detener Compartir
                  </button>
                )}
                <button
                  onClick={stopStream}
                  className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white font-medium rounded-full transition-colors ml-4"
                >
                  Detener Transmisión
                </button>
              </div>
            )}
          </div>
          {/* Floating chat: se posiciona sobre el video a la derecha */}
          <div className="fixed right-6 top-6 w-96 max-h-[70vh] z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <Chat socket={socket} isHost={true} />
          </div>
        </main>
      </div>
    </div>
  );
}
