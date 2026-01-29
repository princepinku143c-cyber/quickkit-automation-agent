
import React, { useEffect, useRef } from 'react';
import { Play, Copy, Trash2, X, Link2, Terminal } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: 'RUN' | 'DUPLICATE' | 'DELETE' | 'COPY_ID') => void;
  nodeLabel: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onAction, nodeLabel }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Adjust position if close to screen edge
  const style = {
      top: y,
      left: x,
  };

  return (
    <div 
        ref={menuRef}
        style={style}
        className="fixed z-[9999] w-48 bg-nexus-900 border border-nexus-700 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
        <div className="px-3 py-2 bg-nexus-950 border-b border-nexus-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">
            {nodeLabel}
        </div>
        
        <button onClick={() => onAction('RUN')} className="flex items-center gap-2 px-3 py-2.5 text-xs text-white hover:bg-nexus-800 hover:text-nexus-accent transition-colors text-left group">
            <Play size={14} className="group-hover:fill-current"/> Test Node
        </button>
        
        <button onClick={() => onAction('DUPLICATE')} className="flex items-center gap-2 px-3 py-2.5 text-xs text-white hover:bg-nexus-800 transition-colors text-left">
            <Copy size={14}/> Duplicate
        </button>

        <button onClick={() => onAction('COPY_ID')} className="flex items-center gap-2 px-3 py-2.5 text-xs text-white hover:bg-nexus-800 transition-colors text-left">
            <Link2 size={14}/> Copy ID
        </button>

        <div className="h-px bg-nexus-800 my-1 mx-2"/>

        <button onClick={() => onAction('DELETE')} className="flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-900/20 transition-colors text-left">
            <Trash2 size={14}/> Delete
        </button>
    </div>
  );
};

export default ContextMenu;
