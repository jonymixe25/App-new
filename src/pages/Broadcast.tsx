import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Video, VideoOff, Mic, MicOff, AlertCircle, Users, Clock, MessageSquare, Share2, Check, Loader2, Phone, X, Circle, Square, Save, RefreshCw, Camera } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Chat from "../components/Chat";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { saveRecording } from "../utils/videoStorage";
import { getSocketUrl } from "../utils/socket";

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

interface User {
  id: string;
  username: string;
}

export default function Broadcast() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const privateVideoRef = useRef<HTMLVideoElement>(null); // Video para la llamada privada
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const pendingCandidates = useRef<{ [id: string]: RTCIceCandidateInit[] }>({});
  
  // Private Call Refs
  const privatePeerConnection = useRef<RTCPeerConnection | null>(null);
  const [privateCallUser, setPrivateCallUser] = useState<User | null>(null);
  const [isPrivateCallActive, setIsPrivateCallActive] = useState(false);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewers, setViewers] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [uptime, setUptime] = useState(0);
  const [showChat, setShowChat] = useState(true);
  const [showUserList, setShowUserList] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [streamName, setStreamName] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const { t } = useLanguage();

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

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const handleShare = async () => {
    const currentOrigin = window.location.origin;
    const sharedOrigin = currentOrigin.replace('ais-dev', 'ais-pre');
    const viewerUrl = `${sharedOrigin}/view`;
    
    try {
      await navigator.clipboard.writeText(viewerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  };

  // Private Call Functions
  const startPrivateCall = async (user: User) => {
    if (!stream || !socket) return;
    
    setPrivateCallUser(user);
    setIsPrivateCallActive(true);
    setShowUserList(false);

    const pc = new RTCPeerConnection(config);
    privatePeerConnection.current = pc;

    // Add local tracks to private connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      if (privateVideoRef.current) {
        privateVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("private_candidate", user.id, event.candidate);
      }
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("private_offer", user.id, pc.localDescription);
    } catch (err) {
      console.error("Error creating private offer:", err);
      endPrivateCall();
    }
  };

  const endPrivateCall = () => {
    if (privatePeerConnection.current) {
      privatePeerConnection.current.close();
      privatePeerConnection.current = null;
    }
    setPrivateCallUser(null);
    setIsPrivateCallActive(false);
    if (privateVideoRef.current) {
      privateVideoRef.current.srcObject = null;
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

  // Recording Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = () => {
    if (!stream) return;
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });
    
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      await saveRecording(blob, recordingTime);
      alert(t.broadcast.recordingSaved);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

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
      setIsSocketConnected(true);
      setSocketError(null);
      if (isStreaming) {
        s.emit("broadcaster", streamName || "Transmisión en vivo");
      }
    });

    s.on("connect_error", (err) => {
      setIsSocketConnected(false);
      setSocketError(`${t.broadcast.socketError} ${socketUrl}: ${err.message}`);
      console.error("Socket connection error:", err);
    });

    s.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    s.on("viewers_count", (count: number) => {
      setViewers(count);
    });

    s.on("user_list", (users: User[]) => {
      setConnectedUsers(users);
    });

    // Private Call Signaling
    s.on("private_answer", async (id: string, description: RTCSessionDescriptionInit) => {
      if (privatePeerConnection.current) {
        try {
          await privatePeerConnection.current.setRemoteDescription(description);
        } catch (err) {
          console.error("Error setting private remote description:", err);
        }
      }
    });

    s.on("private_candidate", (id: string, candidate: RTCIceCandidateInit) => {
      if (privatePeerConnection.current) {
        privatePeerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      }
    });

    s.on("chat_message", (message: any) => {
      if (!showChat) {
        setUnreadMessages(prev => prev + 1);
        playNotification();
      }
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
      // If the private call user disconnected
      if (privateCallUser && privateCallUser.id === id) {
        endPrivateCall();
      }
    });

    return () => {
      s.disconnect();
      Object.values<RTCPeerConnection>(peerConnections.current).forEach(pc => pc.close());
      if (privatePeerConnection.current) privatePeerConnection.current.close();
    };
  }, [stream, isStreaming, privateCallUser]);

  // ... (startStream, stopStream, toggleVideo, toggleAudio remain mostly the same)
  const startStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facingMode
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
        socket.emit("broadcaster", streamName || "Transmisión en vivo");
      }
    } catch (err) {
      console.error("Error accessing media devices.", err);
      setError(t.broadcast.cameraError);
    }
  };

  const stopStream = () => {
    if (isRecording) stopRecording();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    endPrivateCall();
    
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

  const flipCamera = async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    // If we have an active stream (either preview or live), we need to refresh it
    if (stream) {
      try {
        // Stop current video tracks
        stream.getVideoTracks().forEach(track => track.stop());
        
        const newVideoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: newFacingMode
          }
        });
        
        const newVideoTrack = newVideoStream.getVideoTracks()[0];
        
        // Update local video element
        if (videoRef.current) {
          videoRef.current.srcObject = new MediaStream([newVideoTrack, ...stream.getAudioTracks()]);
        }
        
        // If we are live, replace track in all peer connections
        if (isStreaming) {
          (Object.values(peerConnections.current) as RTCPeerConnection[]).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === "video");
            if (sender) {
              sender.replaceTrack(newVideoTrack);
            }
          });
          
          // Update private call if active
          if (privatePeerConnection.current) {
            const sender = privatePeerConnection.current.getSenders().find(s => s.track?.kind === "video");
            if (sender) {
              sender.replaceTrack(newVideoTrack);
            }
          }
        }
        
        // Update stream state
        const combinedStream = new MediaStream([
          newVideoTrack,
          ...stream.getAudioTracks()
        ]);
        setStream(combinedStream);
        
      } catch (err) {
        console.error("Error flipping camera:", err);
        setError(t.broadcast.cameraError);
      }
    }
  };

  // ... (Authentication render logic remains the same)
  
  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-brand-bg text-neutral-50 overflow-hidden">
      <Helmet>
        <title>{t.broadcast.title} | Vida Mixe TV</title>
        <meta name="description" content="Panel de control para transmisiones en vivo. Comparte tu cultura y tradiciones con el mundo." />
      </Helmet>
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
        />
        
        {/* Private Call Overlay */}
        {isPrivateCallActive && (
          <div className="absolute bottom-24 right-4 w-64 h-48 bg-brand-surface rounded-xl border border-white/5 shadow-2xl overflow-hidden z-30">
             <video
                ref={privateVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
             />
             <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
               <Phone className="w-3 h-3 text-brand-primary" />
               {privateCallUser?.username}
             </div>
             <button 
               onClick={endPrivateCall}
               className="absolute top-2 right-2 p-1 bg-brand-primary/80 hover:bg-brand-primary text-white rounded-full transition-colors"
             >
               <X className="w-4 h-4" />
             </button>
          </div>
        )}

        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-bg/90 backdrop-blur-sm p-6 text-center z-10">
            {!isSocketConnected ? (
              <>
                <div className="w-20 h-20 bg-brand-secondary/10 text-brand-secondary rounded-full flex items-center justify-center mb-6">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">{t.broadcast.socketError}...</h2>
                <div className="text-neutral-400 mb-8 max-w-md text-center space-y-4">
                  <p>{socketError || t.broadcast.socketError}</p>
                  {socketError && (
                    <button 
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4" /> Reintentar Conexión
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mb-6">
                  <Video className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">{t.broadcast.title}</h2>
                <div className="w-full max-w-md space-y-4 mb-8">
                  <div className="text-left">
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 ml-1">
                      {t.broadcast.streamName}
                    </label>
                    <input 
                      type="text"
                      value={streamName}
                      onChange={(e) => setStreamName(e.target.value)}
                      placeholder={t.broadcast.streamPlaceholder}
                      className="w-full bg-brand-surface border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                    />
                  </div>
                  <p className="text-neutral-400 text-sm text-center">
                    {t.broadcast.streamTip}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={startStream}
                    className="px-8 py-4 bg-brand-primary hover:bg-brand-primary/80 text-white font-medium rounded-xl transition-colors shadow-lg shadow-brand-primary/20"
                  >
                    {t.broadcast.startStream}
                  </button>
                  <button
                    onClick={flipCamera}
                    className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/5"
                    title={t.broadcast.flipCamera}
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {isStreaming && (
          <>
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSocketConnected ? 'bg-brand-primary/40' : 'bg-brand-secondary/40'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isSocketConnected ? 'bg-brand-primary' : 'bg-brand-secondary'}`}></span>
                </span>
                <span className="text-xs font-medium tracking-wider text-white uppercase">
                  {isSocketConnected ? t.broadcast.live : t.broadcast.socketError}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium text-white">
                <Users className="w-4 h-4 text-brand-accent" /> {viewers} {t.broadcast.viewers}
              </div>
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium text-white">
                <Clock className="w-4 h-4 text-brand-secondary" /> {t.broadcast.uptime}: {formatUptime(uptime)}
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 bg-brand-primary/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-brand-primary/50 text-xs font-medium text-brand-primary animate-pulse">
                  <Circle className="w-3 h-3 fill-brand-primary text-brand-primary" /> REC {formatUptime(recordingTime)}
                </div>
              )}
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 z-10">
              <button
                onClick={toggleRecording}
                className={`p-4 rounded-full transition-colors ${isRecording ? 'bg-brand-primary hover:bg-brand-primary/80 text-white' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                title={isRecording ? t.broadcast.stopRecording : t.broadcast.startRecording}
              >
                {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Circle className="w-6 h-6 fill-brand-primary text-brand-primary" />}
              </button>
              <div className="w-px h-8 bg-white/10 mx-2"></div>
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${videoEnabled ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-brand-primary hover:bg-brand-primary/80 text-white'}`}
              >
                {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-colors ${audioEnabled ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-brand-primary hover:bg-brand-primary/80 text-white'}`}
                title={audioEnabled ? t.broadcast.mute : t.broadcast.unmute}
              >
                {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              <button
                onClick={flipCamera}
                className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors"
                title={t.broadcast.flipCamera}
              >
                <Camera className="w-6 h-6" />
              </button>
              <button
                onClick={stopStream}
                className="px-6 py-4 bg-brand-primary hover:bg-brand-primary/80 text-white font-medium rounded-full transition-colors ml-2"
              >
                {t.broadcast.stopStream}
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
        <Link
          to="/recordings"
          className="p-3 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full border border-white/10 text-white transition-all shadow-lg"
          title={t.recordings.title}
        >
          <Save className="w-6 h-6" />
        </Link>
        <button
          onClick={() => setShowUserList(!showUserList)}
          className={`p-3 backdrop-blur-md rounded-full border border-white/10 text-white transition-all shadow-lg ${showUserList ? 'bg-brand-primary hover:bg-brand-primary/80' : 'bg-black/50 hover:bg-black/70'}`}
          title={t.broadcast.users}
        >
          <Users className="w-6 h-6" />
        </button>
        <button
          onClick={handleShare}
          className="p-3 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full border border-white/10 text-white transition-all shadow-lg"
          title={t.broadcast.share}
        >
          {copied ? <Check className="w-6 h-6 text-brand-primary" /> : <Share2 className="w-6 h-6" />}
        </button>
        <button
          onClick={() => {
            setShowChat(!showChat);
            if (!showChat) setUnreadMessages(0);
          }}
          className={`relative p-3 backdrop-blur-md rounded-full border border-white/10 text-white transition-all shadow-lg ${showChat ? 'bg-brand-accent hover:bg-brand-accent/80' : 'bg-black/50 hover:bg-black/70'}`}
        >
          <MessageSquare className="w-6 h-6" />
          {!showChat && unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>
      </div>

      {/* User List Panel */}
      <div 
        className={`absolute top-20 right-4 w-64 bg-brand-surface/90 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden transition-all duration-300 z-40 ${
          showUserList ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="p-3 border-b border-white/10 bg-black/20">
          <h3 className="font-semibold text-sm">{t.broadcast.users} ({connectedUsers.length})</h3>
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {connectedUsers.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-4">{t.broadcast.noUsers}</p>
          ) : (
            connectedUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
                <span className="text-sm truncate max-w-[120px]">{user.username}</span>
                {!isPrivateCallActive && (
                  <button 
                    onClick={() => startPrivateCall(user)}
                    className="p-1.5 bg-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title={t.broadcast.inviteToCall}
                  >
                    <Phone className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
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
