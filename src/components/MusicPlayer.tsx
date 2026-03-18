import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Maximize2, Minimize2, X } from 'lucide-react';

const TRACKS = [
  {
    id: 1,
    title: "Sones Mixes - Tradicional",
    artist: "Banda Filarmónica",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "Danza del Rey Condoy",
    artist: "Música Ayuuk",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "Sones de la Montaña",
    artist: "Ensamble Mixe",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Error playing audio:", e));
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleEnded = () => {
    handleNext();
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-brand-primary text-white rounded-full shadow-2xl hover:bg-brand-primary/80 transition-all"
        title="Abrir reproductor de música"
      >
        <Music className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isExpanded ? 'w-80' : 'w-auto'}`}>
      <div className="bg-brand-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header / Minimized View */}
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className={`w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary ${isPlaying ? 'animate-pulse' : ''}`}>
              <Music className="w-5 h-5" />
            </div>
            {isExpanded ? (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
                <p className="text-xs text-brand-secondary truncate">{currentTrack.artist}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 pr-2">
                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-2 text-white hover:text-brand-primary transition-colors">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsVisible(false); }} className="p-2 text-neutral-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {isExpanded && (
            <div className="flex items-center gap-1">
              <button onClick={() => setIsExpanded(false)} className="p-2 text-neutral-400 hover:text-white transition-colors">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsVisible(false)} className="p-2 text-neutral-400 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Expanded Controls */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-primary transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <button onClick={toggleMute} className="p-2 text-neutral-400 hover:text-white transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-4">
                <button onClick={handlePrev} className="p-2 text-white hover:text-brand-primary transition-colors">
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>
                <button 
                  onClick={togglePlay} 
                  className="w-12 h-12 flex items-center justify-center bg-brand-primary text-white rounded-full hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
                <button onClick={handleNext} className="p-2 text-white hover:text-brand-primary transition-colors">
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>
              </div>

              <div className="w-9"></div> {/* Spacer for balance */}
            </div>
          </div>
        )}

        <audio
          ref={audioRef}
          src={currentTrack.url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      </div>
    </div>
  );
}
