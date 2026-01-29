
import React, { useState, useEffect, useRef } from 'react';
import { Search, Zap, Hexagon, Command, ArrowRight } from 'lucide-react';
import { NEXUS_DEFINITIONS } from '../constants';
import { NexusSubtype } from '../types';

interface SpotlightProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onSelect: (type: any, subtype: any) => void;
}

const Spotlight: React.FC<SpotlightProps> = ({ isOpen, position, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter logic
  const filteredNodes = NEXUS_DEFINITIONS.filter(def => 
    def.label.toLowerCase().includes(query.toLowerCase()) || 
    def.category.toLowerCase().includes(query.toLowerCase()) ||
    def.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
        setQuery('');
        setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredNodes.length - 1));
            // Auto-scroll
            const el = document.getElementById(`spotlight-item-${selectedIndex + 1}`);
            el?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
            const el = document.getElementById(`spotlight-item-${selectedIndex - 1}`);
            el?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredNodes[selectedIndex]) {
                onSelect(filteredNodes[selectedIndex].type, filteredNodes[selectedIndex].subtype);
                onClose();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredNodes, selectedIndex, onSelect, onClose]);

  if (!isOpen) return null;

  // Calculate position to keep it on screen
  const safeX = Math.min(Math.max(position.x, 20), window.innerWidth - 320);
  const safeY = Math.min(Math.max(position.y, 20), window.innerHeight - 400);

  return (
    <div 
        className="fixed z-[9999] w-[300px] flex flex-col bg-nexus-900 border border-nexus-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ left: safeX, top: safeY }}
    >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-nexus-800 bg-nexus-950/50">
            <Search size={16} className="text-gray-500" />
            <input 
                ref={inputRef}
                type="text" 
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                placeholder="Add next step..."
                className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-full font-medium"
            />
            <div className="flex items-center gap-1">
                <span className="text-[10px] bg-nexus-800 text-gray-500 px-1.5 py-0.5 rounded border border-nexus-700">ESC</span>
            </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 bg-[#050505]">
            {filteredNodes.map((def, index) => (
                <div 
                    key={def.subtype}
                    id={`spotlight-item-${index}`}
                    onClick={() => { onSelect(def.type, def.subtype); onClose(); }}
                    className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all group
                        ${index === selectedIndex ? 'bg-nexus-accent text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]' : 'text-gray-300 hover:bg-nexus-800'}
                    `}
                >
                    <div className={`p-1.5 rounded-md ${index === selectedIndex ? 'bg-black/20 text-black' : 'bg-nexus-800 text-nexus-accent border border-nexus-700'}`}>
                        <def.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold truncate ${index === selectedIndex ? 'text-black' : 'text-gray-200'}`}>
                            {def.label}
                        </div>
                        <div className={`text-[9px] truncate ${index === selectedIndex ? 'text-black/70' : 'text-gray-500'}`}>
                            {def.description}
                        </div>
                    </div>
                    {index === selectedIndex && <ArrowRight size={14} className="animate-pulse" />}
                </div>
            ))}

            {filteredNodes.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-600">
                    <p className="text-xs">No blocks found.</p>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-nexus-950 border-t border-nexus-800 text-[9px] text-gray-600 flex justify-between items-center">
            <span>{filteredNodes.length} Blocks Available</span>
            <div className="flex gap-2">
                <span className="flex items-center gap-1"><ArrowRight size={8}/> Select</span>
                <span className="flex items-center gap-1"><Hexagon size={8}/> Navigate</span>
            </div>
        </div>
    </div>
  );
};

export default Spotlight;
