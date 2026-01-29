
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Zap, MessageSquare } from 'lucide-react';

interface NexusMascotProps {
    isRunning?: boolean; 
    statusMessage?: string; 
    nodeCount?: number;
}

const NexusMascot: React.FC<NexusMascotProps> = ({ isRunning = false, statusMessage = "", nodeCount = 0 }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 150, y: window.innerHeight - 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  
  // States for Interaction
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState("");
  const [hue, setHue] = useState(0); // Auto RGB Color
  
  const dragOffset = useRef({ x: 0, y: 0 });
  const botRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);

  // --- 1. AUTO COLOR CYCLE (RGB) ---
  useEffect(() => {
      const cycleColor = () => {
          setHue(prev => (prev + 0.5) % 360); // Smooth color shift
          animationRef.current = requestAnimationFrame(cycleColor);
      };
      animationRef.current = requestAnimationFrame(cycleColor);
      return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // --- 2. AUDIO ENGINE (Peaceful "Disappear" Sound) ---
  const getAudioContext = () => {
      if (!audioCtxRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current?.state === 'suspended') {
          audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
  };

  const playPeacefulSound = () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Oscillator 1: Main Tone (Soft Sine)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now); // A4 note
      osc1.frequency.exponentialRampToValueAtTime(880, now + 1.5); // Slow rise (Ethereal)

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.1, now + 0.1); // Soft attack
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Long fade out (Disappear effect)

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.5);

      // Oscillator 2: Harmonics (Sparkle)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.linearRampToValueAtTime(1760, now + 2); // Higher pitch fade

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.05, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 1.0);
  };

  // --- 3. PHYSICS & TRACKING ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        });
      }

      if (botRef.current) {
        const rect = botRef.current.getBoundingClientRect();
        const botCenterX = rect.left + rect.width / 2;
        const botCenterY = rect.top + rect.height / 2;
        
        const angle = Math.atan2(e.clientY - botCenterY, e.clientX - botCenterX);
        const distance = Math.min(6, Math.hypot(e.clientX - botCenterX, e.clientY - botCenterY) / 12);
        
        setEyePosition({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsClicked(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsClicked(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleClick = () => {
      if (!isDragging) {
          playPeacefulSound();
          setIsClicked(true);
          setShowNotification(true);
          
          // Random Notification Message
          const msgs = [
              "System Operational 🟢",
              "New Message Received 📩",
              "Workflow Optimized ✨",
              "Memory Cleared 🧹",
              "Listening... 🎧"
          ];
          setNotificationText(msgs[Math.floor(Math.random() * msgs.length)]);

          // Hide after 2.5s
          setTimeout(() => {
              setShowNotification(false);
              setIsClicked(false);
          }, 2500);
      }
  };

  // --- VISUALS ---
  const primaryColor = `hsl(${hue}, 90%, 60%)`;
  const secondaryColor = `hsl(${(hue + 40) % 360}, 80%, 50%)`;

  return (
    <div
      ref={botRef}
      className={`fixed z-[9999] cursor-grab active:cursor-grabbing select-none transition-transform duration-300 ease-out 
        ${isClicked ? 'scale-90 opacity-80 blur-[1px]' : 'scale-100 opacity-100 blur-0'} 
        ${isHovered && !isDragging ? 'scale-110' : ''}`}
      style={{ 
        left: position.x, 
        top: position.y,
        filter: isHovered 
            ? `drop-shadow(0px 0px 25px ${primaryColor})` 
            : 'drop-shadow(0px 10px 15px rgba(0,0,0,0.6))'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* --- FLOATING WRAPPER --- */}
      <div className={`relative w-24 h-24 ${!isDragging ? 'animate-bounce' : ''}`}>
        
        {/* --- ANTENNA --- */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div 
                className="w-[2px] h-5 transition-colors duration-300"
                style={{ backgroundColor: primaryColor }}
            ></div>
            <div 
                className="w-3.5 h-3.5 rounded-full border-2 border-white/60 shadow-[0_0_10px_white] animate-pulse"
                style={{ backgroundColor: secondaryColor }}
            ></div>
        </div>

        {/* --- BODY --- */}
        <div 
            className="w-full h-full rounded-[2.5rem] border border-white/20 shadow-inner relative overflow-hidden ring-2 ring-white/10 transition-all duration-300"
            style={{ 
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
        >
            {/* Glass Glare */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[80%] h-[35%] bg-gradient-to-b from-white/40 to-transparent rounded-full blur-[2px]"></div>

            {/* --- FACE --- */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] h-[35%] bg-[#0a0510] rounded-xl shadow-[inset_0_0_15px_#000] flex items-center justify-center border border-white/10 overflow-hidden">
                <div className="flex gap-4 items-center z-10"
                     style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }}>
                    <div className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]"></div>
                    <div className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]"></div>
                </div>
            </div>

            {/* --- MOUTH (Smile) --- */}
            <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-white/60 rounded-full"></div>
        </div>

        {/* --- ARMS (Dynamic Color) --- */}
        <div 
            className="absolute top-[45%] -left-3 w-3.5 h-7 rounded-full shadow-lg"
            style={{ background: secondaryColor }}
        ></div>
        <div 
            className="absolute top-[45%] -right-3 w-3.5 h-7 rounded-full shadow-lg"
            style={{ background: secondaryColor }}
        ></div>

        {/* --- NOTIFICATION BUBBLE --- */}
        <div className={`absolute -top-16 -right-32 min-w-[140px] bg-white/95 text-black py-2 px-3 rounded-xl shadow-xl transition-all duration-500 transform origin-bottom-left border border-gray-200 z-50
            ${showNotification ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-4 pointer-events-none'}`}>
            
            <div className="flex items-center gap-2 mb-1 border-b border-gray-200 pb-1">
                <Bell size={10} className="text-nexus-accent animate-bounce" /> 
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Notification</span>
            </div>
            <div className="text-[10px] font-bold text-gray-800 leading-tight">
                {notificationText}
            </div>
            
            {/* Bubble Tail */}
            <div className="absolute bottom-[-4px] left-2 w-2 h-2 bg-white rotate-45 border-b border-r border-gray-200"></div>
        </div>

      </div>
    </div>
  );
};

export default NexusMascot;
