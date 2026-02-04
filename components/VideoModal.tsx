
import React from 'react';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string; // Optional: Override default
}

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" }) => { // Default to a placeholder, replace with real demo
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header / Close Bar */}
        <div className="absolute top-4 right-4 z-10">
            <button 
                onClick={onClose} 
                className="p-3 bg-black/50 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10"
            >
                <X size={20} />
            </button>
        </div>

        {/* Video Frame */}
        <div className="flex-1 relative">
            <iframe 
                width="100%" 
                height="100%" 
                src={videoUrl} 
                title="Product Demo" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                className="absolute inset-0 w-full h-full"
            ></iframe>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
