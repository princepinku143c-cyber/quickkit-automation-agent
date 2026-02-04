
import React, { useState, useEffect } from 'react';
import { Gift, Copy, Check, Share2, Users, Trophy, X } from 'lucide-react';
import { getUserReferral } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { ReferralStats } from '../types';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [data, setData] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
      if (isOpen && user) {
          getUserReferral(user.uid, user.email || 'user').then(setData);
      }
  }, [isOpen, user]);

  const handleCopy = () => {
      if (!data) return;
      const link = `${window.location.origin}?ref=${data.code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in">
        <div className="bg-[#0f0f12] border border-nexus-800 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"><X size={20}/></button>
            
            {/* Hero */}
            <div className="pt-12 pb-8 px-8 text-center bg-gradient-to-b from-purple-900/20 to-transparent">
                <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(168,85,247,0.4)] rotate-3">
                    <Gift size={40} className="text-white"/>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Invite & Earn</h2>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">Share your link. You get <span className="text-white font-bold">+10 AI Credits</span> per sign up.</p>
            </div>

            {/* Code Section */}
            <div className="px-8 pb-8">
                <div className="bg-black/40 border border-white/10 rounded-2xl p-2 flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 font-mono text-lg text-nexus-accent tracking-widest text-center font-bold">
                        {data.code}
                    </div>
                    <button 
                        onClick={handleCopy}
                        className="px-6 py-3 bg-white text-black font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center gap-2"
                    >
                        {copied ? <Check size={16}/> : <Copy size={16}/>}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <div className="text-center mt-4 flex justify-center gap-4">
                    <button className="p-3 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-xl hover:bg-[#1DA1F2]/20 transition-all"><Share2 size={20}/></button>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-nexus-900/50 border-t border-nexus-800 p-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center">
                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Users size={12}/> Friends Invited</div>
                    <div className="text-2xl font-black text-white">{data.totalInvites}</div>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center">
                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Trophy size={12}/> Credits Earned</div>
                    <div className="text-2xl font-black text-nexus-accent">{data.earnedCredits}</div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ReferralModal;
