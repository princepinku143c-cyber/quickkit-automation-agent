
import React, { useState, useEffect } from 'react';
import { MarketplaceItem } from '../types';
import { X, Search, Download, Star, ShieldCheck, Zap, Server, Brain, Box, Check, Loader2, Package, History, Trash2 } from 'lucide-react';

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MARKETPLACE_ITEMS: MarketplaceItem[] = [
    { id: 'pkg_stripe_pro', name: 'Stripe Advanced', description: 'Complete Stripe suite including Subscriptions, Invoices, and Identity verification hooks.', author: 'Stripe Official', downloads: 15400, rating: 4.9, category: 'ENTERPRISE', isVerified: true, isPro: true, icon: Zap, tags: ['Finance', 'Payments'] },
    { id: 'pkg_aws_lambda', name: 'AWS Lambda Runner', description: 'Directly invoke Lambda functions with custom payloads and handle cold starts.', author: 'Nexus Community', downloads: 8200, rating: 4.7, category: 'UTILITY', isVerified: true, isPro: false, icon: Server, tags: ['DevOps', 'Serverless'] },
    { id: 'pkg_huggingface', name: 'HuggingFace Hub', description: 'Access thousands of open-source models for text, image, and audio generation.', author: 'AI Research Labs', downloads: 12000, rating: 4.8, category: 'AI_MODEL', isVerified: false, isPro: false, icon: Brain, tags: ['AI', 'ML'] }
];

const MarketplaceModal: React.FC<MarketplaceModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('nexus_installed_extensions');
    if (saved) setInstalledIds(new Set(JSON.parse(saved)));
  }, []);

  if (!isOpen) return null;

  const handleInstall = (id: string) => {
      setInstallingId(id);
      setTimeout(() => {
          const next = new Set(installedIds).add(id);
          setInstalledIds(next);
          localStorage.setItem('nexus_installed_extensions', JSON.stringify(Array.from(next)));
          setInstallingId(null);
      }, 1800);
  };

  const handleRemove = (id: string) => {
      const next = new Set(installedIds);
      next.delete(id);
      setInstalledIds(next);
      localStorage.setItem('nexus_installed_extensions', JSON.stringify(Array.from(next)));
  };

  const filteredItems = MARKETPLACE_ITEMS.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-[90vh] bg-[#0a0a0a] border border-nexus-800 rounded-[40px] shadow-3xl flex flex-col overflow-hidden">
        
        <div className="p-8 border-b border-white/5 bg-nexus-950 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-4">
                    <Package size={28} className="text-nexus-accent" /> Extension Hub
                </h2>
                <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-[0.3em]">Module Marketplace • Functional Extensions</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Hub..." className="bg-nexus-900 border border-nexus-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-nexus-accent outline-none w-64 transition-all focus:w-80" />
                </div>
                <button onClick={onClose} className="p-3 bg-nexus-900 hover:bg-nexus-800 rounded-2xl text-gray-500 hover:text-white transition-all"><X size={24} /></button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            <div className="w-64 bg-nexus-950 border-r border-nexus-800 p-6 space-y-2">
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Categories</div>
                {['ALL', 'ENTERPRISE', 'AI_MODEL', 'UTILITY'].map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-black' : 'text-gray-500 hover:bg-white/5'}`}>{cat}</button>
                ))}
                
                <div className="mt-12 pt-8 border-t border-white/5">
                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">My Stack</div>
                    <div className="flex items-center gap-3 px-5 py-4 bg-nexus-accent/5 border border-nexus-accent/20 rounded-2xl text-nexus-accent">
                        <History size={14}/>
                        <span className="text-[10px] font-black uppercase tracking-widest">{installedIds.size} Installed</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-black">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-nexus-900/20 border border-white/5 rounded-[32px] p-8 hover:border-nexus-accent/20 transition-all group flex flex-col h-full relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-nexus-900 rounded-[20px] border border-white/5 group-hover:text-nexus-accent transition-colors">
                                    <item.icon size={28} />
                                </div>
                                {item.isVerified && (
                                    <div className="flex items-center gap-1 text-[9px] font-black bg-blue-900/20 text-blue-400 px-3 py-1.5 rounded-full border border-blue-800 uppercase tracking-widest">
                                        <ShieldCheck size={12} /> Verified
                                    </div>
                                )}
                            </div>
                            
                            <h3 className="text-xl font-black text-white mb-3 group-hover:text-nexus-accent transition-colors">{item.name}</h3>
                            <p className="text-[11px] text-gray-400 leading-relaxed mb-8 flex-1 font-medium opacity-60">
                                {item.description}
                            </p>

                            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Download size={12}/> {item.downloads}</span>
                                    <span className="flex items-center gap-1 text-yellow-500"><Star size={12} fill="currentColor"/> {item.rating}</span>
                                </div>
                                
                                {installedIds.has(item.id) ? (
                                    <button onClick={() => handleRemove(item.id)} className="px-6 py-3 bg-red-950/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-900/20 hover:bg-red-500 hover:text-white transition-all">Remove</button>
                                ) : (
                                    <button 
                                        onClick={() => handleInstall(item.id)}
                                        disabled={!!installingId}
                                        className="px-8 py-3 bg-nexus-accent text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-20 shadow-xl"
                                    >
                                        {installingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                        {installingId === item.id ? 'Fetching...' : 'Install Extension'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceModal;
